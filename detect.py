#!/usr/bin/env python3
"""Run traffic object detection on an image, folder, video file or webcam.

Examples:
  python detect.py --source data/traffic.mp4
  python detect.py --source 0 --show                 # webcam
  python detect.py --source images/ --weights runs/detect/train/weights/best.pt
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))
from traffic_detect.config import load_config  # noqa: E402
from traffic_detect.pipeline import run_pipeline  # noqa: E402


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--source", required=True, help="image / folder / video path, or webcam index")
    ap.add_argument("--config", default=None)
    ap.add_argument("--weights")
    ap.add_argument("--conf", type=float)
    ap.add_argument("--iou", type=float)
    ap.add_argument("--imgsz", type=int)
    ap.add_argument("--device")
    ap.add_argument("--no-track", action="store_true")
    ap.add_argument("--low-light", action="store_true", help="enable CLAHE enhancement")
    ap.add_argument("--stride", type=int, help="process every Nth frame")
    ap.add_argument("--out", help="output directory")
    ap.add_argument("--show", action="store_true", help="live preview window")
    a = ap.parse_args()

    cfg = load_config(a.config)
    if a.weights: cfg["model"]["weights"] = a.weights
    if a.conf is not None: cfg["model"]["conf"] = a.conf
    if a.iou is not None: cfg["model"]["iou"] = a.iou
    if a.imgsz: cfg["model"]["imgsz"] = a.imgsz
    if a.device: cfg["model"]["device"] = a.device
    if a.no_track: cfg["tracking"]["enabled"] = False
    if a.low_light: cfg["preprocess"]["low_light_enhance"] = True
    if a.stride: cfg["preprocess"]["frame_stride"] = a.stride
    if a.out: cfg["output"]["out_dir"] = a.out
    if a.show: cfg["output"]["show_window"] = True

    summary = run_pipeline(a.source, cfg)
    print(json.dumps(summary, indent=2))
    print(f"\nResults saved to: {cfg['output']['out_dir']}/")


if __name__ == "__main__":
    main()
