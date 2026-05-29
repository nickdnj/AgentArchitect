"""Virtual line crossing counter.

A counting line is the segment A->B in site coordinates with an `inbound_normal`
that defines which way is "into the store". For every confirmed track we watch
the signed distance to the line; when it flips sign *and* the interpolated
crossing point lies on the segment, we emit an in/out event. A short per-track
cooldown suppresses double counts from jitter right on the line.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

import numpy as np

from .config import LineConfig


@dataclass
class CountEvent:
    timestamp: float
    track_id: int
    direction: str          # "in" or "out"
    x: float
    y: float


class LineCounter:
    def __init__(self, line: LineConfig, segment_margin: float = 0.05,
                 cooldown_s: float = 1.0):
        self.A = np.array(line.point_a_m, dtype=float)
        B = np.array(line.point_b_m, dtype=float)
        self.d = B - self.A
        self.seg_len2 = float(self.d @ self.d) or 1.0
        n = np.array(line.inbound_normal, dtype=float)
        self.n = n / (np.linalg.norm(n) or 1.0)
        self.margin = segment_margin
        self.cooldown_s = cooldown_s

        self._last_side: Dict[int, float] = {}
        self._last_pos: Dict[int, np.ndarray] = {}
        self._last_count_t: Dict[int, float] = {}

        self.total_in = 0
        self.total_out = 0

    def _signed(self, p: np.ndarray) -> float:
        return float((p - self.A) @ self.n)

    def update(self, tracks, timestamp: float) -> List[CountEvent]:
        events: List[CountEvent] = []
        for t in tracks:
            p = np.array(t.position, dtype=float)
            s = self._signed(p)
            prev_s = self._last_side.get(t.id)
            prev_p = self._last_pos.get(t.id)
            self._last_side[t.id] = s
            self._last_pos[t.id] = p

            if prev_s is None or prev_p is None:
                continue
            if (prev_s <= 0) == (s <= 0):
                continue  # no sign change -> no crossing

            # Interpolate the crossing point and verify it is on the segment.
            denom = (prev_s - s) or 1e-9
            alpha = prev_s / denom
            cross = prev_p + alpha * (p - prev_p)
            seg_t = float((cross - self.A) @ self.d) / self.seg_len2
            if not (-self.margin <= seg_t <= 1.0 + self.margin):
                continue

            if timestamp - self._last_count_t.get(t.id, -1e9) < self.cooldown_s:
                continue
            self._last_count_t[t.id] = timestamp

            direction = "in" if s > 0 else "out"
            if direction == "in":
                self.total_in += 1
            else:
                self.total_out += 1
            events.append(CountEvent(timestamp, t.id, direction,
                                     float(cross[0]), float(cross[1])))
        return events

    @property
    def occupancy(self) -> int:
        return self.total_in - self.total_out
