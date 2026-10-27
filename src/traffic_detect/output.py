"""Output: annotated frames with a metrics overlay, and video writing."""
import zlib
from pathlib import Path

import cv2


def _color(label: str):
    h = zlib.crc32(label.encode())
    return (h & 0xFF, (h >> 8) & 0xFF, (h >> 16) & 0xFF)


def annotate(frame, detections, counts, fps: float):
    out = frame.copy()
    for d in detections:
        x1, y1, x2, y2 = d.xyxy
        color = _color(d.label)
        cv2.rectangle(out, (x1, y1), (x2, y2), color, 2)
        tag = f"{d.label} {d.conf:.2f}" + (f" #{d.track_id}" if d.track_id is not None else "")
        (tw, th), base = cv2.getTextSize(tag, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        top = max(y1 - th - base - 2, 0)
        cv2.rectangle(out, (x1, top), (x1 + tw + 4, top + th + base + 2), color, -1)
        cv2.putText(out, tag, (x1 + 2, top + th + 1), cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                    (255, 255, 255), 1, cv2.LINE_AA)

    lines = [f"FPS: {fps:.1f}   Objects: {sum(counts.values())}"]
    lines += [f"{k}: {v}" for k, v in sorted(counts.items())]
    panel_h = 8 + 20 * len(lines)
    overlay = out.copy()
    cv2.rectangle(overlay, (0, 0), (230, panel_h), (0, 0, 0), -1)
    out = cv2.addWeighted(overlay, 0.55, out, 0.45, 0)
    for i, line in enumerate(lines):
        cv2.putText(out, line, (8, 20 + 20 * i), cv2.FONT_HERSHEY_SIMPLEX, 0.55,
                    (255, 255, 255), 1, cv2.LINE_AA)
    return out


class VideoSink:
    """Lazily opens a writer on the first frame so output size always matches."""

    def __init__(self, path, fps: float):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.fps = fps
        self._writer = None

    def write(self, frame):
        if self._writer is None:
            h, w = frame.shape[:2]
            self._writer = cv2.VideoWriter(str(self.path), cv2.VideoWriter_fourcc(*"mp4v"),
                                           self.fps, (w, h))
        self._writer.write(frame)

    def close(self):
        if self._writer is not None:
            self._writer.release()
