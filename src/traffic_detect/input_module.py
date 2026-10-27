"""Input module: video / image / folder / webcam capture."""
from pathlib import Path
from typing import Iterator, Tuple, Union

import cv2
import numpy as np

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
VIDEO_EXTS = {".mp4", ".avi", ".mov", ".mkv", ".webm"}


class FrameSource:
    """Yields (frame_index, BGR frame). Source may be an image, a folder of
    images, a video file, or an integer webcam index."""

    def __init__(self, source: Union[str, int]):
        self.source = int(source) if str(source).isdigit() else str(source)
        self.fps = 30.0
        self.size = None  # (w, h) of the first frame
        self.is_video = False
        self._images = []
        self._cap = None
        self._open()

    def _open(self):
        if isinstance(self.source, int):
            self._cap = cv2.VideoCapture(self.source)
            self.is_video = True
        else:
            p = Path(self.source)
            if p.is_dir():
                self._images = sorted(f for f in p.iterdir() if f.suffix.lower() in IMAGE_EXTS)
                if not self._images:
                    raise FileNotFoundError(f"No images found in folder: {p}")
            elif p.suffix.lower() in IMAGE_EXTS:
                if not p.exists():
                    raise FileNotFoundError(f"Image not found: {p}")
                self._images = [p]
            elif p.suffix.lower() in VIDEO_EXTS or p.exists():
                if not p.exists():
                    raise FileNotFoundError(f"Video not found: {p}")
                self._cap = cv2.VideoCapture(str(p))
                self.is_video = True
            else:
                raise FileNotFoundError(f"Source not found: {self.source}")
        if self._cap is not None:
            if not self._cap.isOpened():
                raise RuntimeError(f"Could not open video source: {self.source}")
            self.fps = self._cap.get(cv2.CAP_PROP_FPS) or 30.0
            w = int(self._cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            h = int(self._cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            self.size = (w, h)

    def __iter__(self) -> Iterator[Tuple[int, np.ndarray]]:
        if self._cap is not None:
            idx = 0
            while True:
                ok, frame = self._cap.read()
                if not ok:
                    break
                yield idx, frame
                idx += 1
            self._cap.release()
        else:
            for idx, path in enumerate(self._images):
                frame = cv2.imread(str(path))
                if frame is None:
                    continue  # unreadable file: skip rather than crash the run
                if self.size is None:
                    self.size = (frame.shape[1], frame.shape[0])
                yield idx, frame
