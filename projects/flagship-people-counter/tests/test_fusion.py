from counter.detection import Detection
from counter.fusion import DetectionFuser


def _d(cam, x, y, conf=0.8):
    return Detection(cam, 0.0, x, y, 1.75, conf)


def test_merges_overlapping_detections_from_two_cameras():
    fuser = DetectionFuser(fusion_radius_m=0.45)
    dets = [_d("cam_left", 3.0, 0.1, 0.7), _d("cam_right", 3.1, 0.0, 0.8)]
    fused = fuser.fuse(dets)
    assert len(fused) == 1
    # Combined confidence exceeds either individual source.
    assert fused[0].confidence > 0.8
    assert "cam_left" in fused[0].camera_id and "cam_right" in fused[0].camera_id


def test_keeps_distinct_people_separate():
    fuser = DetectionFuser(fusion_radius_m=0.45)
    dets = [_d("cam_left", 1.0, 0.0), _d("cam_right", 5.0, 0.0)]
    assert len(fuser.fuse(dets)) == 2


def test_empty_input():
    assert DetectionFuser(0.45).fuse([]) == []
