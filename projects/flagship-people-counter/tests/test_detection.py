import numpy as np

from counter.config import CameraConfig
from counter.depth_source import DepthFrame, MockWorld, Walker
from counter.detection import HeadDetector


def test_detects_single_head_at_expected_position():
    cam = CameraConfig("c0", mount_height_m=3.0, origin_xy_m=(2.0, 0.0),
                       footprint_m=(4.0, 4.0), resolution_px=(160, 160))
    world = MockWorld([Walker(start_xy=(2.0, 0.5), velocity_xy=(0.0, 0.0),
                              height_m=1.75)], fps=15.0)
    frame = DepthFrame("c0", 0.0, world.render(cam, 0.0))

    det = HeadDetector(cam, min_head_height_m=1.0, max_head_height_m=2.2)
    results = det.detect(frame)

    assert len(results) == 1
    d = results[0]
    assert abs(d.x - 2.0) < 0.1
    assert abs(d.y - 0.5) < 0.1
    assert abs(d.height_m - 1.75) < 0.1
    assert d.confidence > 0.5


def test_ignores_short_blob_below_band():
    cam = CameraConfig("c0", mount_height_m=3.0, origin_xy_m=(2.0, 0.0),
                       footprint_m=(4.0, 4.0), resolution_px=(160, 160))
    # A 0.6 m cart is below the 1.0 m head band -> no detection.
    world = MockWorld([Walker(start_xy=(2.0, 0.0), velocity_xy=(0.0, 0.0),
                              height_m=0.6)], fps=15.0)
    frame = DepthFrame("c0", 0.0, world.render(cam, 0.0))
    det = HeadDetector(cam, min_head_height_m=1.0, max_head_height_m=2.2)
    assert det.detect(frame) == []


def test_two_adjacent_heads_stay_separate():
    cam = CameraConfig("c0", mount_height_m=3.0, origin_xy_m=(2.0, 0.0),
                       footprint_m=(4.0, 4.0), resolution_px=(200, 200))
    world = MockWorld([
        Walker(start_xy=(1.7, 0.0), velocity_xy=(0.0, 0.0), height_m=1.75),
        Walker(start_xy=(2.3, 0.0), velocity_xy=(0.0, 0.0), height_m=1.70),
    ], fps=15.0)
    frame = DepthFrame("c0", 0.0, world.render(cam, 0.0))
    det = HeadDetector(cam, min_head_height_m=1.0, max_head_height_m=2.2)
    assert len(det.detect(frame)) == 2
