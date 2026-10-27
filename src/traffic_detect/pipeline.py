"""End-to-end workflow: Video/Image -> Preprocess -> YOLO -> Classify+Localise -> Analyse -> Display."""
import time
from pathlib import Path

import cv2

from .analytics import TrafficAnalytics
from .detector import YoloDetector
from .input_module import FrameSource
from .output import VideoSink, annotate
from .preprocess import Preprocessor


def run_pipeline(source, cfg: dict, detector=None):
    m, t, p, o = cfg["model"], cfg["tracking"], cfg["preprocess"], cfg["output"]
    src = FrameSource(source)
    pre = Preprocessor(p["max_side"], p["frame_stride"], p["low_light_enhance"])
    detector = detector or YoloDetector(
        m["weights"], m["imgsz"], m["conf"], m["iou"], m["device"], m.get("classes"),
        t["enabled"], t["tracker"])
    analytics = TrafficAnalytics()

    stem = "webcam" if isinstance(src.source, int) else Path(src.source).stem
    out_dir = Path(o["out_dir"])
    sink = None
    if o["save_video"]:
        is_video = src.is_video
        ext = ".mp4" if is_video else ".jpg"
        if is_video:
            sink = VideoSink(out_dir / f"{stem}_detected.mp4", src.fps / p["frame_stride"])
    out_dir.mkdir(parents=True, exist_ok=True)

    try:
        for idx, frame in src:
            if not pre.should_process(idx):
                continue
            frame = pre(frame)
            t0 = time.perf_counter()
            dets = detector.infer(frame)
            ms = (time.perf_counter() - t0) * 1000
            counts = analytics.update(idx, dets, ms)
            vis = annotate(frame, dets, counts, analytics.inference_fps)

            if sink:
                sink.write(vis)
            elif o["save_video"] and not src.is_video:
                cv2.imwrite(str(out_dir / f"{stem}_{idx:05d}_detected.jpg"), vis)
            if o["show_window"]:
                cv2.imshow("Traffic Object Detection (q to quit)", vis)
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break
    finally:
        if sink:
            sink.close()
        if o["show_window"]:
            cv2.destroyAllWindows()

    analytics.save(out_dir, stem)
    return analytics.summary()
