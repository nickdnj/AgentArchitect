from counter.detection import Detection
from counter.tracking import MultiObjectTracker


def _d(x, y):
    return Detection("c", 0.0, x, y, 1.75, 0.9)


def test_track_confirmed_after_min_hits_and_follows_motion():
    trk = MultiObjectTracker(gate_m=0.6, min_hits=3, max_age=5, dt=1 / 15.0)
    confirmed = []
    x = 0.0
    for _ in range(6):
        confirmed = trk.update([_d(x, 0.0)])
        x += 0.1
    assert len(confirmed) == 1
    px, _ = confirmed[0].position
    assert abs(px - x + 0.1) < 0.15  # tracks the latest measurement closely


def test_survives_one_missed_frame_then_reacquires():
    trk = MultiObjectTracker(gate_m=0.6, min_hits=2, max_age=5, dt=1 / 15.0)
    for x in (0.0, 0.1, 0.2):
        confirmed = trk.update([_d(x, 0.0)])
    original_id = confirmed[0].id
    trk.update([])               # dropped frame (occlusion)
    confirmed = trk.update([_d(0.4, 0.0)])
    assert len(confirmed) == 1            # same track reacquired, not a new one
    assert confirmed[0].id == original_id


def test_two_separate_people_get_two_ids():
    trk = MultiObjectTracker(gate_m=0.6, min_hits=2, max_age=5, dt=1 / 15.0)
    for _ in range(3):
        confirmed = trk.update([_d(1.0, 0.0), _d(4.0, 0.0)])
    ids = {t.id for t in confirmed}
    assert len(ids) == 2
