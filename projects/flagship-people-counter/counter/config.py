"""Configuration models for a counting site.

A *site* is one entrance. It may be covered by one or several overhead cameras
(needed when the doorway is wider than a single sensor's footprint). Each camera
knows where it sits in a shared, metric *site coordinate frame* (origin on the
floor, X across the doorway, Y into the store, units = metres) so detections
from different cameras can be fused into one consistent picture.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Tuple

try:
    import yaml  # optional; only needed for from_yaml()
except Exception:  # pragma: no cover - yaml is optional at runtime
    yaml = None


@dataclass
class CameraConfig:
    """One overhead depth camera.

    Attributes
    ----------
    camera_id:        Stable identifier (used to tag detections + dedup).
    mount_height_m:   Height of the sensor above the floor (metres).
    origin_xy_m:      (x, y) position of the camera's optical axis in the shared
                      site frame. Detections measured relative to the camera are
                      offset by this to land in site coordinates.
    footprint_m:      (width, depth) of the floor area the camera sees, metres.
                      Used to map pixel coordinates to ground coordinates.
    resolution_px:    (width, height) of the depth image in pixels.
    """

    camera_id: str
    mount_height_m: float
    origin_xy_m: Tuple[float, float]
    footprint_m: Tuple[float, float]
    resolution_px: Tuple[int, int] = (320, 240)


@dataclass
class LineConfig:
    """The virtual counting line, expressed in site coordinates (metres).

    `inbound_normal` points in the direction that counts as *entering the store*.
    A track crossing the segment in that direction is an inbound (+1) event;
    the opposite direction is outbound.
    """

    point_a_m: Tuple[float, float]
    point_b_m: Tuple[float, float]
    inbound_normal: Tuple[float, float] = (0.0, 1.0)


@dataclass
class SiteConfig:
    """Full configuration for one entrance."""

    name: str
    cameras: List[CameraConfig]
    line: LineConfig

    # Detection band: ignore blobs whose height is outside [min, max] metres.
    # Filters out carts/bags (too short) and reflections/noise.
    min_head_height_m: float = 1.0
    max_head_height_m: float = 2.2

    # Multi-camera fusion: detections within this radius (metres) in the
    # overlap region are treated as the same physical person. Must be SMALLER
    # than the minimum head-to-head separation (~0.45 m shoulder-to-shoulder)
    # or two side-by-side people get merged into one. Sized to the cross-camera
    # calibration error budget instead.
    fusion_radius_m: float = 0.30

    # Tracker gating + lifecycle.
    track_gate_m: float = 0.6      # max association distance per frame
    track_min_hits: int = 3        # frames before a track is "confirmed"
    track_max_age: int = 8         # frames a track survives without updates

    fps: float = 15.0

    @classmethod
    def from_yaml(cls, path: str) -> "SiteConfig":
        if yaml is None:  # pragma: no cover
            raise RuntimeError("PyYAML is required to load YAML configs")
        with open(path, "r") as fh:
            data = yaml.safe_load(fh)
        return cls.from_dict(data)

    @classmethod
    def from_dict(cls, data: dict) -> "SiteConfig":
        cameras = [
            CameraConfig(
                camera_id=c["camera_id"],
                mount_height_m=float(c["mount_height_m"]),
                origin_xy_m=tuple(c["origin_xy_m"]),
                footprint_m=tuple(c["footprint_m"]),
                resolution_px=tuple(c.get("resolution_px", (320, 240))),
            )
            for c in data["cameras"]
        ]
        line = LineConfig(
            point_a_m=tuple(data["line"]["point_a_m"]),
            point_b_m=tuple(data["line"]["point_b_m"]),
            inbound_normal=tuple(data["line"].get("inbound_normal", (0.0, 1.0))),
        )
        kwargs = {
            k: data[k]
            for k in (
                "min_head_height_m",
                "max_head_height_m",
                "fusion_radius_m",
                "track_gate_m",
                "track_min_hits",
                "track_max_age",
                "fps",
            )
            if k in data
        }
        return cls(name=data["name"], cameras=cameras, line=line, **kwargs)
