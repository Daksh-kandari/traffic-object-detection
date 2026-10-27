#!/usr/bin/env python3
"""Fine-tune YOLO on a custom traffic dataset (edit data/data.yaml first)."""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))
from traffic_detect.config import load_config  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config")
    ap.add_argument("--data")
    ap.add_argument("--epochs", type=int)
    ap.add_argument("--batch", type=int)
    ap.add_argument("--imgsz", type=int)
    ap.add_argument("--weights", help="starting weights (default from config)")
    ap.add_argument("--device")
    a = ap.parse_args()

    from ultralytics import YOLO
    cfg = load_config(a.config)
    tr = cfg["train"]
    model = YOLO(a.weights or cfg["model"]["weights"])
    model.train(data=a.data or tr["data"], epochs=a.epochs or tr["epochs"],
                batch=a.batch or tr["batch"], imgsz=a.imgsz or tr["imgsz"],
                device=a.device or cfg["model"]["device"], plots=True)


if __name__ == "__main__":
    main()
