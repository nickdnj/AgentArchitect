"""Overhead head detection on a depth map.

From an overhead sensor, a person's head is the closest thing to the camera, so
in a *height map* (mount_height - depth) heads are local maxima. We threshold the
height map to a plausible head band, label connected blobs, and emit one
detection per blob at its peak, converted into metric site coordinates.

This depth-peak approach is cheap, lighting-independent, and robust to occlusion
(two adjacent heads stay as two peaks). In production it is typically *fused*
with a small neural detector that confirms "head vs cart/bag"; `nn_confirm` is
the hook for that — pass a callable and it filters/rescores blobs.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, List, Optional

import numpy as np

from .config import CameraConfig
from .depth_source import DepthFrame


@dataclass
class Detection:
    """A detected head, in metric site coordinates."""

    camera_id: str
    timestamp: float
    x: float            # site X (m), across the doorway
    y: float            # site Y (m), into the store
    height_m: float
    confidence: float


def _label_components(mask: np.ndarray) -> List[List[tuple]]:
    """4-connected connected-components via iterative flood fill.

    Returns a list of components, each a list of (row, col) pixel coordinates.
    Adequate for the modest frame sizes used here; swap for scipy.ndimage.label
    or a GPU op in production.
    """
    h, w = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    comps: List[List[tuple]] = []
    for r0 in range(h):
        for c0 in range(w):
            if not mask[r0, c0] or seen[r0, c0]:
                continue
            stack = [(r0, c0)]
            seen[r0, c0] = True
            comp = []
            while stack:
                r, c = stack.pop()
                comp.append((r, c))
                for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    rr, cc = r + dr, c + dc
                    if 0 <= rr < h and 0 <= cc < w and mask[rr, cc] and not seen[rr, cc]:
                        seen[rr, cc] = True
                        stack.append((rr, cc))
            comps.append(comp)
    return comps


class HeadDetector:
    """Detect heads in a single camera's depth frames."""

    def __init__(self, camera: CameraConfig, min_head_height_m: float,
                 max_head_height_m: float, min_blob_px: int = 6,
                 nn_confirm: Optional[Callable[[np.ndarray, tuple], float]] = None):
        self.camera = camera
        self.min_h = min_head_height_m
        self.max_h = max_head_height_m
        self.min_blob_px = min_blob_px
        self.nn_confirm = nn_confirm

    def _pixel_to_site(self, row: float, col: float):
        w_px, h_px = self.camera.resolution_px
        fw, fd = self.camera.footprint_m
        ox, oy = self.camera.origin_xy_m
        x0, y0 = ox - fw / 2.0, oy - fd / 2.0
        x = x0 + (col + 0.5) / w_px * fw
        y = y0 + (row + 0.5) / h_px * fd
        return x, y

    def detect(self, frame: DepthFrame) -> List[Detection]:
        height_map = self.camera.mount_height_m - frame.depth
        mask = (height_map >= self.min_h) & (height_map <= self.max_h)
        if not mask.any():
            return []

        detections: List[Detection] = []
        for comp in _label_components(mask):
            if len(comp) < self.min_blob_px:
                continue
            rows = np.array([p[0] for p in comp])
            cols = np.array([p[1] for p in comp])
            heights = height_map[rows, cols]
            # Centroid drives position (robust when the head crown is flat);
            # the peak height drives the reported head height.
            peak_h = float(heights.max())
            x, y = self._pixel_to_site(float(rows.mean()), float(cols.mean()))

            # Confidence: blob size sufficiency * head-band centeredness.
            size_score = min(1.0, len(comp) / (3.0 * self.min_blob_px))
            band_mid = 0.5 * (self.min_h + self.max_h)
            band_half = 0.5 * (self.max_h - self.min_h)
            band_score = max(0.0, 1.0 - abs(peak_h - band_mid) / band_half)
            confidence = float(0.5 * size_score + 0.5 * band_score)

            if self.nn_confirm is not None:
                centroid_px = (int(round(rows.mean())), int(round(cols.mean())))
                confidence *= float(self.nn_confirm(frame.depth, centroid_px))
                if confidence <= 0.0:
                    continue

            detections.append(
                Detection(frame.camera_id, frame.timestamp, x, y, peak_h, confidence)
            )
        return detections
