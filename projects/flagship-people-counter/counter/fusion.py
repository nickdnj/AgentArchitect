"""Multi-camera detection fusion.

A wide entrance needs several overlapping overhead cameras. In the overlap a
single person is seen by 2+ cameras and would be counted twice. The fuser runs
*before* tracking: it clusters detections (already in shared site coordinates)
that fall within `fusion_radius_m` of each other and collapses each cluster to a
single detection. Greedy, highest-confidence-first clustering — O(n^2) in the
handful of detections present per frame, which is plenty fast.
"""

from __future__ import annotations

from typing import List

from .detection import Detection


class DetectionFuser:
    def __init__(self, fusion_radius_m: float):
        self.radius2 = fusion_radius_m ** 2

    def fuse(self, detections: List[Detection]) -> List[Detection]:
        if not detections:
            return []
        # Highest confidence acts as each cluster's seed.
        order = sorted(range(len(detections)),
                       key=lambda i: detections[i].confidence, reverse=True)
        claimed = [False] * len(detections)
        fused: List[Detection] = []

        for i in order:
            if claimed[i]:
                continue
            seed = detections[i]
            claimed[i] = True
            members = [seed]
            for j in order:
                if claimed[j]:
                    continue
                d = detections[j]
                if (d.x - seed.x) ** 2 + (d.y - seed.y) ** 2 <= self.radius2:
                    claimed[j] = True
                    members.append(d)
            fused.append(self._merge(members))
        return fused

    @staticmethod
    def _merge(members: List[Detection]) -> Detection:
        if len(members) == 1:
            return members[0]
        wsum = sum(m.confidence for m in members) or 1.0
        x = sum(m.x * m.confidence for m in members) / wsum
        y = sum(m.y * m.confidence for m in members) / wsum
        height = max(m.height_m for m in members)
        # Independent-evidence combination: 1 - prod(1 - c).
        miss = 1.0
        for m in members:
            miss *= (1.0 - min(0.999, m.confidence))
        confidence = 1.0 - miss
        cam_ids = "+".join(sorted({m.camera_id for m in members}))
        return Detection(cam_ids, members[0].timestamp, x, y, height, confidence)
