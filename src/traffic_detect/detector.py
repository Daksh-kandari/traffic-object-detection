"""Detection: YOLO-based inference with optional multi-object tracking."""
from dataclasses import dataclass
from typing import List, Optional, Sequence, Tuple


@dataclass
class Detection:
    label: str
    conf: float
    xyxy: Tuple[int, int, int, int]
    track_id: Optional[int] = None


class YoloDetector:
    def __init__(self, weights: str = "yolo11n.pt", imgsz: int = 640, conf: float = 0.35,
                 iou: float = 0.45, device: Optional[str] = None,
                 classes: Optional[Sequence[str]] = None, track: bool = True,
                 tracker: str = "bytetrack.yaml"):
        from ultralytics import YOLO  # imported lazily so other modules/tests work without it

        self.model = YOLO(weights)
        self.imgsz, self.conf, self.iou = imgsz, conf, iou
        self.device = device
        self.track = track
        self.tracker = tracker
        self.names = self.model.names  # {id: name}
        self.class_ids = None
        if classes:
            wanted = {c.lower() for c in classes}
            self.class_ids = [i for i, n in self.names.items() if n.lower() in wanted]
            if not self.class_ids:
                raise ValueError(
                    f"None of the requested classes {sorted(wanted)} exist in this model. "
                    f"Available: {sorted(self.names.values())}")

    def infer(self, frame) -> List[Detection]:
        kwargs = dict(imgsz=self.imgsz, conf=self.conf, iou=self.iou, device=self.device,
                      classes=self.class_ids, verbose=False)
        if self.track:
            result = self.model.track(frame, persist=True, tracker=self.tracker, **kwargs)[0]
        else:
            result = self.model.predict(frame, **kwargs)[0]

        dets: List[Detection] = []
        boxes = result.boxes
        if boxes is None or len(boxes) == 0:
            return dets
        ids = boxes.id.int().tolist() if (self.track and boxes.id is not None) else [None] * len(boxes)
        for box, cls, conf, tid in zip(boxes.xyxy.tolist(), boxes.cls.int().tolist(),
                                       boxes.conf.tolist(), ids):
            dets.append(Detection(self.names[cls], float(conf), tuple(int(v) for v in box), tid))
        return dets
