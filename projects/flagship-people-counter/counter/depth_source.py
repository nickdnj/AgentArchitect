"""Depth frame sources.

`DepthSource` is the hardware abstraction the whole pipeline depends on. Anything
that can yield overhead depth frames (distance-to-scene, in metres) can drive the
counter. We ship:

* `MockDepthSource`    -- synthesises overhead depth of walkers moving through the
                          site, so the counting logic is fully testable with no
                          hardware. A shared `MockWorld` renders consistently to
                          every camera, which is what exercises multi-camera fusion.
* `ZEDDepthSource`     -- adapter for Stereolabs ZED (passive stereo, long range).
* `OAKDepthSource`     -- adapter for Luxonis OAK-D (active IR stereo, on-cam AI).

The two real adapters are thin and import their SDK lazily, so importing this
module never requires the SDK to be installed.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterator, List, Optional

import numpy as np

from .config import CameraConfig


@dataclass
class DepthFrame:
    """One overhead depth image.

    `depth` is an (H, W) float array of distance from the sensor to the scene in
    metres. Floor pixels read ~= mount height; a person's head reads smaller
    (closer to the overhead sensor).
    """

    camera_id: str
    timestamp: float
    depth: np.ndarray


class DepthSource:
    """Interface: iterate depth frames for a single camera."""

    camera: CameraConfig

    def frames(self) -> Iterator[DepthFrame]:  # pragma: no cover - interface
        raise NotImplementedError


# --------------------------------------------------------------------------- #
# Mock source (used for tests + `--demo`)
# --------------------------------------------------------------------------- #

@dataclass
class Walker:
    """A simulated person moving in a straight line in site coordinates (m)."""

    start_xy: tuple
    velocity_xy: tuple          # metres / second
    height_m: float = 1.75
    head_radius_m: float = 0.12
    t_enter: float = 0.0
    t_exit: float = 1e9

    def position(self, t: float):
        return (
            self.start_xy[0] + self.velocity_xy[0] * (t - self.t_enter),
            self.start_xy[1] + self.velocity_xy[1] * (t - self.t_enter),
        )

    def active(self, t: float) -> bool:
        return self.t_enter <= t <= self.t_exit


class MockWorld:
    """Shared world clock + walker set, rendered from each camera's viewpoint."""

    def __init__(self, walkers: List[Walker], fps: float = 15.0,
                 noise_m: float = 0.0, seed: int = 0):
        self.walkers = walkers
        self.fps = fps
        self.noise_m = noise_m
        self.rng = np.random.default_rng(seed)

    def render(self, camera: CameraConfig, t: float) -> np.ndarray:
        w_px, h_px = camera.resolution_px
        fw, fd = camera.footprint_m
        ox, oy = camera.origin_xy_m
        # Floor everywhere.
        depth = np.full((h_px, w_px), camera.mount_height_m, dtype=np.float32)

        x0, y0 = ox - fw / 2.0, oy - fd / 2.0  # bottom-left of footprint in site m
        # Precompute per-pixel ground coordinates.
        xs = x0 + (np.arange(w_px) + 0.5) / w_px * fw
        ys = y0 + (np.arange(h_px) + 0.5) / h_px * fd
        gx, gy = np.meshgrid(xs, ys)

        for wlk in self.walkers:
            if not wlk.active(t):
                continue
            px, py = wlk.position(t)
            # Only paint if the head falls inside this camera's footprint.
            if not (x0 <= px <= x0 + fw and y0 <= py <= y0 + fd):
                continue
            dist2 = (gx - px) ** 2 + (gy - py) ** 2
            mask = dist2 <= wlk.head_radius_m ** 2
            head_depth = camera.mount_height_m - wlk.height_m
            depth[mask] = np.minimum(depth[mask], head_depth)

        if self.noise_m:
            depth = depth + self.rng.normal(0.0, self.noise_m, size=depth.shape).astype(np.float32)
        return depth


class MockDepthSource(DepthSource):
    """A DepthSource bound to one camera, drawing from a shared MockWorld."""

    def __init__(self, camera: CameraConfig, world: MockWorld, n_frames: int):
        self.camera = camera
        self.world = world
        self.n_frames = n_frames

    def frames(self) -> Iterator[DepthFrame]:
        dt = 1.0 / self.world.fps
        for i in range(self.n_frames):
            t = i * dt
            yield DepthFrame(self.camera.camera_id, t, self.world.render(self.camera, t))


def build_mock_sources(cameras: List[CameraConfig], walkers: List[Walker],
                       n_frames: int, fps: float = 15.0,
                       noise_m: float = 0.0, seed: int = 0) -> List[MockDepthSource]:
    """Create one mock source per camera, all sharing a single world."""
    world = MockWorld(walkers, fps=fps, noise_m=noise_m, seed=seed)
    return [MockDepthSource(cam, world, n_frames) for cam in cameras]


# --------------------------------------------------------------------------- #
# Real-sensor adapters (thin; SDKs imported lazily)
# --------------------------------------------------------------------------- #

class ZEDDepthSource(DepthSource):
    """Stereolabs ZED adapter.

    Implementation notes (left as the integration TODO):
      * `import pyzed.sl as sl`; open camera in DEPTH mode, NEURAL depth quality.
      * Retrieve the depth measure each grab as a float32 metres array.
      * Crop/rotate so +X is across the doorway and +Y into the store to match
        the site frame, then emit DepthFrame.
    """

    def __init__(self, camera: CameraConfig, serial: Optional[int] = None):
        self.camera = camera
        self.serial = serial

    def frames(self) -> Iterator[DepthFrame]:  # pragma: no cover - needs hardware
        raise NotImplementedError(
            "ZED adapter requires the `pyzed` SDK and a connected camera. "
            "See docstring for the integration steps."
        )


class OAKDepthSource(DepthSource):
    """Luxonis OAK-D adapter (DepthAI).

    Implementation notes:
      * Build a DepthAI pipeline with StereoDepth; optionally run head detection
        on-device (the OAK NN block) and emit detections directly.
      * Convert the disparity/depth output to metres and emit DepthFrame.
    """

    def __init__(self, camera: CameraConfig, mxid: Optional[str] = None):
        self.camera = camera
        self.mxid = mxid

    def frames(self) -> Iterator[DepthFrame]:  # pragma: no cover - needs hardware
        raise NotImplementedError(
            "OAK adapter requires the `depthai` SDK and a connected camera. "
            "See docstring for the integration steps."
        )
