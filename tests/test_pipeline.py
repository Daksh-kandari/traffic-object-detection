"""Model-free tests: run the whole pipeline with a stub detector."""
import json

import cv2
import numpy as np
import pytest

from traffic_detect.analytics import TrafficAnalytics
from traffic_detect.config import load_config
from traffic_detect.detector import Detection
from traffic_detect.input_module import FrameSource
from traffic_detect.output import annotate
from traffic_detect.pipeline import run_pipeline
from traffic_detect.preprocess import Preprocessor


class StubDetector:
    def infer(self, frame):
        return [Detection("car", 0.9, (10, 10, 60, 50), 1),
                Detection("car", 0.8, (70, 10, 120, 50), 2),
                Detection("person", 0.7, (5, 60, 25, 110), 3)]


def test_preprocess_resize_keeps_aspect():
    out = Preprocessor(max_side=100)(np.zeros((400, 200, 3), np.uint8))
    assert out.shape[:2] == (100, 50)


def test_preprocess_no_upscale():
    out = Preprocessor(max_side=1000)(np.zeros((40, 20, 3), np.uint8))
    assert out.shape[:2] == (40, 20)


def test_frame_stride():
    p = Preprocessor(frame_stride=3)
    assert [i for i in range(7) if p.should_process(i)] == [0, 3, 6]
    with pytest.raises(ValueError):
        Preprocessor(frame_stride=0)


def test_low_light_enhance_shape():
    f = np.full((32, 32, 3), 20, np.uint8)
    assert Preprocessor(low_light_enhance=True)(f).shape == f.shape


def test_analytics_counts():
    a = TrafficAnalytics()
    d = StubDetector().infer(None)
    a.update(0, d, 10.0)
    a.update(1, d, 30.0)
    s = a.summary()
    assert s["frames_processed"] == 2
    assert s["detections_per_class"] == {"car": 4, "person": 2}
    assert s["unique_tracked_objects_per_class"] == {"car": 2, "person": 1}
    assert s["peak_simultaneous_per_class"]["car"] == 2
    assert s["avg_inference_ms"] == 20.0 and s["inference_fps"] == 50.0


def test_annotate_returns_same_shape():
    f = np.zeros((120, 160, 3), np.uint8)
    d = StubDetector().infer(f)
    out = annotate(f, d, {"car": 2, "person": 1}, 25.0)
    assert out.shape == f.shape and out.any()


def test_missing_source_raises(tmp_path):
    with pytest.raises(FileNotFoundError):
        FrameSource(str(tmp_path / "nope.mp4"))


def test_full_pipeline_on_video_and_images(tmp_path):
    # synthetic video
    vid = tmp_path / "clip.mp4"
    w = cv2.VideoWriter(str(vid), cv2.VideoWriter_fourcc(*"mp4v"), 10, (160, 120))
    for _ in range(6):
        w.write(np.random.randint(0, 255, (120, 160, 3), np.uint8))
    w.release()

    cfg = load_config()
    cfg["output"]["out_dir"] = str(tmp_path / "out")
    s = run_pipeline(str(vid), cfg, detector=StubDetector())
    assert s["frames_processed"] == 6
    assert (tmp_path / "out" / "clip_detected.mp4").exists()
    assert json.loads((tmp_path / "out" / "clip_metrics.json").read_text())["total_detections"] == 18
    assert (tmp_path / "out" / "clip_frames.csv").exists()

    # image folder
    imgs = tmp_path / "imgs"
    imgs.mkdir()
    for i in range(2):
        cv2.imwrite(str(imgs / f"{i}.jpg"), np.zeros((80, 80, 3), np.uint8))
    cfg["output"]["out_dir"] = str(tmp_path / "out2")
    s = run_pipeline(str(imgs), cfg, detector=StubDetector())
    assert s["frames_processed"] == 2
    assert len(list((tmp_path / "out2").glob("*_detected.jpg"))) == 2
