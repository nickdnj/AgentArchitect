"""End-to-end counting pipeline.

Wires the stages together for one site:

    per-camera depth frames
        -> per-camera HeadDetector
        -> DetectionFuser (collapse overlaps across cameras)
        -> MultiObjectTracker (single shared tracker in site coordinates)
        -> LineCounter (in/out events)
        -> TrafficAggregator (KPIs)

Cameras are assumed frame-synchronised (a hardware-genlock or software-sync rig),
so frame index i across sources shares a timestamp. The per-frame work is driven
by `step()`, which makes the pipeline easy to unit test and to drive from either
the mock world or live sensors.
"""

from __future__ import annotations

from typing import Callable, Iterable, List, Optional

from .analytics import TrafficAggregator
from .config import SiteConfig
from .depth_source import DepthSource
from .detection import HeadDetector
from .fusion import DetectionFuser
from .line_counter import CountEvent, LineCounter
from .tracking import MultiObjectTracker


class CountingPipeline:
    def __init__(self, site: SiteConfig, sources: List[DepthSource],
                 bucket_seconds: float = 3600.0):
        self.site = site
        self.sources = sources
        cam_by_id = {c.camera_id: c for c in site.cameras}
        self.detectors = {
            s.camera.camera_id: HeadDetector(
                cam_by_id[s.camera.camera_id],
                site.min_head_height_m,
                site.max_head_height_m,
            )
            for s in sources
        }
        self.fuser = DetectionFuser(site.fusion_radius_m)
        dt = 1.0 / site.fps
        self.tracker = MultiObjectTracker(
            site.track_gate_m, site.track_min_hits, site.track_max_age, dt
        )
        self.line_counter = LineCounter(site.line)
        self.aggregator = TrafficAggregator(bucket_seconds=bucket_seconds)

    def step(self, frames) -> List[CountEvent]:
        """Process one synchronised set of frames (one per camera)."""
        timestamp = frames[0].timestamp
        detections = []
        for f in frames:
            detections.extend(self.detectors[f.camera_id].detect(f))
        fused = self.fuser.fuse(detections)
        tracks = self.tracker.update(fused)
        events = self.line_counter.update(tracks, timestamp)
        self.aggregator.add_many(events)
        return events

    def run(self, on_event: Optional[Callable[[CountEvent], None]] = None) -> dict:
        """Run all sources to completion. Returns a summary dict."""
        iters = [iter(s.frames()) for s in self.sources]
        for frames in zip(*iters):
            events = self.step(list(frames))
            if on_event:
                for e in events:
                    on_event(e)
        return self.summary()

    def summary(self) -> dict:
        return {
            "site": self.site.name,
            "inbound": self.line_counter.total_in,
            "outbound": self.line_counter.total_out,
            "occupancy": self.line_counter.occupancy,
            "buckets": self.aggregator.to_rows(),
        }
