"""Multi-object tracking with a constant-velocity Kalman filter.

Each detection per frame is associated to an existing track (greedy nearest
neighbour under a distance gate) or seeds a new one. Tracking is what lets us
(a) assign a stable identity so a person is counted once, (b) recover position
through a missed frame (occlusion / brief drop-out), and (c) know direction of
travel for the line counter.

Pure numpy; no scipy. Greedy association is sufficient at the low detection
counts at an entrance; swap in Hungarian assignment if densities rise.
"""

from __future__ import annotations

from typing import List, Optional

import numpy as np


class Track:
    _next_id = 1

    def __init__(self, xy, height: float, dt: float,
                 q: float = 0.05, r: float = 0.03):
        self.id = Track._next_id
        Track._next_id += 1

        self.dt = dt
        self.height = height
        self.hits = 1
        self.age = 1
        self.time_since_update = 0

        # State [x, y, vx, vy].
        self.mean = np.array([xy[0], xy[1], 0.0, 0.0], dtype=float)
        self.cov = np.diag([r, r, 1.0, 1.0]).astype(float)

        self._F = np.array([[1, 0, dt, 0],
                            [0, 1, 0, dt],
                            [0, 0, 1, 0],
                            [0, 0, 0, 1]], dtype=float)
        self._H = np.array([[1, 0, 0, 0],
                            [0, 1, 0, 0]], dtype=float)
        self._Q = np.diag([q, q, q * 4, q * 4]).astype(float)
        self._R = np.diag([r, r]).astype(float)

    @property
    def position(self):
        return float(self.mean[0]), float(self.mean[1])

    @property
    def velocity(self):
        return float(self.mean[2]), float(self.mean[3])

    def predict(self):
        self.mean = self._F @ self.mean
        self.cov = self._F @ self.cov @ self._F.T + self._Q
        self.age += 1
        self.time_since_update += 1

    def update(self, xy, height: float):
        z = np.array([xy[0], xy[1]], dtype=float)
        y_res = z - self._H @ self.mean
        S = self._H @ self.cov @ self._H.T + self._R
        K = self.cov @ self._H.T @ np.linalg.inv(S)
        self.mean = self.mean + K @ y_res
        self.cov = (np.eye(4) - K @ self._H) @ self.cov
        self.height = 0.7 * self.height + 0.3 * height
        self.hits += 1
        self.time_since_update = 0


class MultiObjectTracker:
    def __init__(self, gate_m: float, min_hits: int, max_age: int, dt: float):
        self.gate2 = gate_m ** 2
        self.min_hits = min_hits
        self.max_age = max_age
        self.dt = dt
        self.tracks: List[Track] = []

    def update(self, detections) -> List[Track]:
        """Advance one frame. `detections` is a list of objects with .x/.y/.height_m."""
        for t in self.tracks:
            t.predict()

        matches, unmatched_det = self._associate(detections)
        for ti, di in matches:
            d = detections[di]
            self.tracks[ti].update((d.x, d.y), d.height_m)
        for di in unmatched_det:
            d = detections[di]
            self.tracks.append(Track((d.x, d.y), d.height_m, self.dt))

        # Cull stale tracks.
        self.tracks = [t for t in self.tracks if t.time_since_update <= self.max_age]

        # Confirmed = enough hits, seen this frame.
        return [t for t in self.tracks
                if t.hits >= self.min_hits and t.time_since_update == 0]

    def _associate(self, detections):
        if not self.tracks or not detections:
            return [], list(range(len(detections)))

        pairs = []
        for ti, t in enumerate(self.tracks):
            tx, ty = t.position
            for di, d in enumerate(detections):
                dist2 = (tx - d.x) ** 2 + (ty - d.y) ** 2
                if dist2 <= self.gate2:
                    pairs.append((dist2, ti, di))
        pairs.sort()

        used_t, used_d = set(), set()
        matches = []
        for _, ti, di in pairs:
            if ti in used_t or di in used_d:
                continue
            used_t.add(ti)
            used_d.add(di)
            matches.append((ti, di))
        unmatched_det = [di for di in range(len(detections)) if di not in used_d]
        return matches, unmatched_det
