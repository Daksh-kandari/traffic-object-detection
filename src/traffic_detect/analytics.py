"""Analytics: per-frame counts, unique tracked objects, and performance metrics."""
import csv
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, List


class TrafficAnalytics:
    def __init__(self):
        self.frames_processed = 0
        self.total_inference_ms = 0.0
        self.total_detections = 0
        self.peak_counts: Counter = Counter()          # max simultaneous objects per class
        self.class_detections: Counter = Counter()     # raw detections per class (all frames)
        self._unique_ids: Dict[str, set] = defaultdict(set)  # tracked IDs per class
        self.rows: List[dict] = []                     # per-frame log
        self.last_frame_counts: Counter = Counter()

    def update(self, frame_idx: int, detections, inference_ms: float) -> Counter:
        counts = Counter(d.label for d in detections)
        self.frames_processed += 1
        self.total_inference_ms += inference_ms
        self.total_detections += len(detections)
        self.class_detections.update(counts)
        for label, n in counts.items():
            self.peak_counts[label] = max(self.peak_counts[label], n)
        for d in detections:
            if d.track_id is not None:
                self._unique_ids[d.label].add(d.track_id)
        self.last_frame_counts = counts
        self.rows.append({"frame": frame_idx, "total": len(detections),
                          "inference_ms": round(inference_ms, 2), **dict(counts)})
        return counts

    @property
    def unique_counts(self) -> Dict[str, int]:
        return {k: len(v) for k, v in self._unique_ids.items()}

    @property
    def avg_inference_ms(self) -> float:
        return self.total_inference_ms / self.frames_processed if self.frames_processed else 0.0

    @property
    def inference_fps(self) -> float:
        ms = self.avg_inference_ms
        return 1000.0 / ms if ms > 0 else 0.0

    def summary(self) -> dict:
        return {
            "frames_processed": self.frames_processed,
            "total_detections": self.total_detections,
            "avg_inference_ms": round(self.avg_inference_ms, 2),
            "inference_fps": round(self.inference_fps, 2),
            "detections_per_class": dict(self.class_detections),
            "peak_simultaneous_per_class": dict(self.peak_counts),
            "unique_tracked_objects_per_class": self.unique_counts,
        }

    def save(self, out_dir, stem: str = "run"):
        out = Path(out_dir)
        out.mkdir(parents=True, exist_ok=True)
        (out / f"{stem}_metrics.json").write_text(json.dumps(self.summary(), indent=2), encoding="utf-8")
        if self.rows:
            fields = ["frame", "total", "inference_ms"] + sorted(
                {k for r in self.rows for k in r} - {"frame", "total", "inference_ms"})
            with open(out / f"{stem}_frames.csv", "w", newline="", encoding="utf-8") as f:
                w = csv.DictWriter(f, fieldnames=fields, restval=0)
                w.writeheader()
                w.writerows(self.rows)
