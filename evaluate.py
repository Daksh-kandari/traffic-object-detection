#!/usr/bin/env python3
"""Evaluate detection quality (mAP, precision, recall, per-class metrics, confusion
matrix) on the validation/test split, and report inference speed."""
import argparse
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))
from traffic_detect.config import load_config  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config")
    ap.add_argument("--weights")
    ap.add_argument("--data")
    ap.add_argument("--split", default="val", choices=["val", "test"])
    ap.add_argument("--out", default="outputs")
    a = ap.parse_args()

    from ultralytics import YOLO
    cfg = load_config(a.config)
    model = YOLO(a.weights or cfg["model"]["weights"])
    m = model.val(data=a.data or cfg["train"]["data"], split=a.split,
                  imgsz=cfg["model"]["imgsz"], conf=0.001, iou=cfg["model"]["iou"],
                  device=cfg["model"]["device"], plots=True)

    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    box = m.box
    print(f"\nmAP@50: {box.map50:.4f}   mAP@50-95: {box.map:.4f}   "
          f"P: {box.mp:.4f}   R: {box.mr:.4f}")
    print(f"Speed (ms/img): {m.speed}")
    with open(out / "class_metrics.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["class", "precision", "recall", "mAP50", "mAP50-95"])
        for i, ci in enumerate(box.ap_class_index):
            p, r, ap50, ap = box.class_result(i)
            w.writerow([m.names[int(ci)], f"{p:.4f}", f"{r:.4f}", f"{ap50:.4f}", f"{ap:.4f}"])
            print(f"  {m.names[int(ci)]:<14} P={p:.3f} R={r:.3f} mAP50={ap50:.3f} mAP50-95={ap:.3f}")
    print(f"\nPer-class metrics: {out/'class_metrics.csv'}")
    print(f"Confusion matrix & curves: {m.save_dir}")


if __name__ == "__main__":
    main()
