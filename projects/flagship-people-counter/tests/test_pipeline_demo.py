"""End-to-end: the synthetic crowd (6 in, 2 out, incl. a side-by-side pair in
the camera overlap) must be counted exactly through the full pipeline."""

from counter.cli import run_demo


def test_demo_counts_match_ground_truth():
    summary = run_demo(frames=120)
    assert summary["inbound"] == 6, summary
    assert summary["outbound"] == 2, summary
    assert summary["occupancy"] == 4, summary
