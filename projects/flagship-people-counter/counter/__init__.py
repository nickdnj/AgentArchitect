"""Flagship 3D stereo-vision people counter.

A modular, hardware-agnostic pipeline for counting patrons entering/exiting a
wide retail entrance with 95%+ accuracy using overhead depth sensing.

Pipeline:  DepthSource -> HeadDetector -> DetectionFuser -> MultiObjectTracker
           -> LineCounter -> TrafficAggregator

The core algorithms (detection on a depth map, tracking, line-crossing,
multi-camera fusion, analytics) are pure-numpy and run against a MockDepthSource
so the counting logic can be developed and tested without any camera hardware.
Real sensors plug in by implementing the DepthSource interface.
"""

from .config import SiteConfig, CameraConfig, LineConfig
from .detection import Detection, HeadDetector
from .tracking import Track, MultiObjectTracker
from .line_counter import LineCounter, CountEvent
from .fusion import DetectionFuser
from .analytics import TrafficAggregator
from .pipeline import CountingPipeline

__all__ = [
    "SiteConfig",
    "CameraConfig",
    "LineConfig",
    "Detection",
    "HeadDetector",
    "Track",
    "MultiObjectTracker",
    "LineCounter",
    "CountEvent",
    "DetectionFuser",
    "TrafficAggregator",
    "CountingPipeline",
]

__version__ = "0.1.0"
