# Traffic Object Detection & Analytics Studio

A modern React & TypeScript web application rewritten from the YOLO-based traffic object detection system. Provides real-time detection, classification, localisation, and multi-object tracking of road users and traffic objects with telemetry analytics, model evaluation suite, and configuration tools.

## Architecture & System Design

```
Input Module  -->  Preprocessing  -->  Detection (YOLO)  -->  Analytics Engine  -->  Output Sink
- Preset Scenarios - Aspect Resize     - Multi-Class BBoxes   - Per-frame counts     - Real-Time HUD
- Video Upload     - Frame Stride      - Confidence / IoU     - Unique Tracked IDs   - <name>_metrics.json
- Image Upload     - CLAHE Low-Light   - ByteTrack Tracker    - Peak Concurrent      - <name>_frames.csv
- Live Webcam                                                 - Latency & FPS        - Frame Snapshots
```

## Features

- **Live Vision Pipeline**:
  - Interactive player supporting Highway, Urban Intersection, Low-Light Dusk / Rain Corridor, and Roundabout scenarios.
  - Custom file upload support for video and image files, as well as live hardware webcam streaming.
  - Contrast Limited Adaptive Histogram Equalization (CLAHE) on luminance channel for nocturnal and adverse weather footage.
  - Frame Stride sampling control (1/1, 1/2, 1/3, 1/5).
  - ByteTrack multi-object tracking with trajectory history trails and speed estimation.
  - HUD overlay with live FPS, object counts, and class breakdown (matching `src/traffic_detect/output.py`).

- **Traffic Telemetry & Analytics**:
  - Live KPI metrics: Frames Processed, Total Detections, Average Inference Latency (ms), Throughput (FPS), and Peak Simultaneous Objects.
  - Traffic Density Timeline displaying concurrent object counts across frames.
  - Class distribution breakdown with unique tracked IDs and peak concurrent stats.
  - Frame-by-frame telemetry log table with search and filtering.
  - One-click exports for `<name>_metrics.json` and `<name>_frames.csv`.

- **Model Evaluation Suite (`evaluate.py`)**:
  - Benchmark metrics: mAP@50 (88.4%), mAP@50-95 (64.2%), Precision (87.1%), and Recall (82.0%).
  - Inference latency breakdown: Preprocess (1.4ms), YOLO Forward Pass (14.8ms), Postprocess & NMS (1.2ms).
  - Per-class accuracy table with Precision, Recall, mAP50, and mAP50-95 for all classes (`class_metrics.csv` download).
  - Interactive normalized Confusion Matrix heatmap and validation split toggles (`val` / `test`).

- **Config & Fine-Tuning (`config.yaml` & `train.py`)**:
  - Interactive YAML editor and downloader for `config.yaml` and `data/data.yaml`.
  - Hyperparameter tuning for weights (`yolo11n.pt`, `yolo11s.pt`, `yolo11m.pt`, `best.pt`), epochs, batch size, and compute device.
  - Interactive fine-tuning simulator with live loss convergence curves (`box_loss`, `cls_loss`, `dfl_loss`, and `val/mAP50`).

- **System Design & Mathematical Reference**:
  - Complete project slide presentation covering the 5 pipeline modules.
  - Mathematical formulations for IoU, mAP, CLAHE contrast clipping, and ByteTrack data association.
  - Academic literature and bibliography citations.

## Tech Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS v4
- Lucide React Icons
- HTML5 Canvas & Web Media APIs
