"""Preprocessing: resize and frame handling (+ optional low-light enhancement).

Letterboxing and 0-1 normalisation are applied internally by Ultralytics at
inference time, so they are intentionally not repeated here (doing it twice
would degrade accuracy)."""
import cv2
import numpy as np


class Preprocessor:
    def __init__(self, max_side: int = 1280, frame_stride: int = 1, low_light_enhance: bool = False):
        if frame_stride < 1:
            raise ValueError("frame_stride must be >= 1")
        self.max_side = max_side
        self.frame_stride = frame_stride
        self.low_light_enhance = low_light_enhance
        self._clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))

    def should_process(self, frame_idx: int) -> bool:
        """Frame handling: process every Nth frame."""
        return frame_idx % self.frame_stride == 0

    def resize(self, frame: np.ndarray) -> np.ndarray:
        h, w = frame.shape[:2]
        longest = max(h, w)
        if self.max_side and longest > self.max_side:
            scale = self.max_side / longest
            frame = cv2.resize(frame, (int(round(w * scale)), int(round(h * scale))),
                               interpolation=cv2.INTER_AREA)
        return frame

    def enhance(self, frame: np.ndarray) -> np.ndarray:
        """CLAHE on the L channel to improve contrast in low-light footage."""
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        lab = cv2.merge((self._clahe.apply(l), a, b))
        return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

    def __call__(self, frame: np.ndarray) -> np.ndarray:
        frame = self.resize(frame)
        if self.low_light_enhance:
            frame = self.enhance(frame)
        return frame
