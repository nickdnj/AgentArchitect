from counter.config import LineConfig
from counter.line_counter import LineCounter


class FakeTrack:
    def __init__(self, tid, pos):
        self.id = tid
        self.position = pos


def _line():
    return LineConfig(point_a_m=(0.0, 0.0), point_b_m=(6.0, 0.0),
                      inbound_normal=(0.0, 1.0))


def test_counts_inbound_crossing():
    lc = LineCounter(_line())
    lc.update([FakeTrack(1, (3.0, -0.5))], 0.0)
    events = lc.update([FakeTrack(1, (3.0, 0.5))], 0.1)
    assert lc.total_in == 1 and lc.total_out == 0
    assert events[0].direction == "in"


def test_counts_outbound_crossing():
    lc = LineCounter(_line())
    lc.update([FakeTrack(1, (3.0, 0.5))], 0.0)
    lc.update([FakeTrack(1, (3.0, -0.5))], 0.1)
    assert lc.total_out == 1 and lc.total_in == 0
    assert lc.occupancy == -1


def test_ignores_crossing_outside_segment():
    lc = LineCounter(_line())
    # x = 9.0 is well past the 6 m doorway segment.
    lc.update([FakeTrack(1, (9.0, -0.5))], 0.0)
    lc.update([FakeTrack(1, (9.0, 0.5))], 0.1)
    assert lc.total_in == 0


def test_cooldown_suppresses_jitter_double_count():
    lc = LineCounter(_line(), cooldown_s=1.0)
    lc.update([FakeTrack(1, (3.0, -0.1))], 0.0)
    lc.update([FakeTrack(1, (3.0, 0.1))], 0.1)   # count in
    lc.update([FakeTrack(1, (3.0, -0.1))], 0.2)  # within cooldown -> suppressed
    assert lc.total_in == 1
    assert lc.total_out == 0
