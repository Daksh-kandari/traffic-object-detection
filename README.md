# Traffic Object Detection

B.Tech Final Year Project — YOLO-based detection, classification, localisation and
(optional) tracking of road users and traffic objects from images, video or webcam.

## Architecture (matches the System Design slide)

```
Input Module -> Preprocessing -> Detection (YOLO) -> Analytics -> Output
 image/video     resize, frame      Ultralytics        count,        annotated frame
 /folder/webcam  stride, CLAHE      + ByteTrack        classify,     + metrics JSON/CSV
                                                       track
```

| Module | File |
|---|---|
| Input | `src/traffic_detect/input_module.py` |
| Preprocessing | `src/traffic_detect/preprocess.py` |
| Detection / tracking | `src/traffic_detect/detector.py` |
| Analytics | `src/traffic_detect/analytics.py` |
| Output | `src/traffic_detect/output.py` |
| Workflow | `src/traffic_detect/pipeline.py` |

## Setup

```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Weights (`yolo11n.pt`) download automatically on first run. For GPU, install the
CUDA build of PyTorch first (https://pytorch.org).

## Run

```bash
python detect.py --source path/to/video.mp4          # video
python detect.py --source path/to/image.jpg          # single image
python detect.py --source path/to/images_folder/     # folder
python detect.py --source 0 --show                   # webcam, live preview
python detect.py --source video.mp4 --low-light --stride 2 --conf 0.4
```

Outputs go to `outputs/`: annotated video/images, `<name>_metrics.json`
(FPS, per-class counts, unique tracked objects) and `<name>_frames.csv` (per-frame log).

## Train on your own dataset

1. Put images/labels in YOLO format and edit `data/data.yaml`.
2. `python train.py --epochs 50 --batch 16`
3. Use `runs/detect/train/weights/best.pt` with `--weights`.

## Evaluate

```bash
python evaluate.py --weights runs/detect/train/weights/best.pt --split val
```

Prints mAP@50, mAP@50-95, precision, recall and per-class metrics; writes
`outputs/class_metrics.csv`; Ultralytics saves the confusion matrix and PR curves.

## Configuration

Everything in the appendix (model version, image size, epochs, batch size,
confidence and IoU thresholds) is in `config.yaml`; CLI flags override it.

## Tests

```bash
pytest -q
```

Tests use a stub detector, so they run without downloading a model.

## Notes

- The default COCO weights detect car, motorcycle, bus, truck, person, bicycle,
  traffic light and **stop sign**. Other traffic-sign types need a custom-trained model.
- Letterboxing and 0-1 normalisation are done inside Ultralytics; preprocessing
  here adds resize, frame stride and optional low-light enhancement.
- Dataset citation (References slide): add your verified dataset source.

## References

Redmon et al., YOLO (CVPR 2016) · Ren et al., Faster R-CNN (NeurIPS 2015) ·
Liu et al., SSD (ECCV 2016) · OpenCV · PyTorch · Ultralytics documentation.
