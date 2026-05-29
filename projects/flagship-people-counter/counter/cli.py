"""Command-line entry point.

    python -m counter.cli --demo
    python -m counter.cli --config configs/flagship_entrance.yaml --backend mock --frames 120

`--demo` runs the full pipeline against a synthetic crowd so you can watch the
counter work end-to-end with no hardware. `--backend zed|oak` selects a real
sensor adapter (requires the respective SDK + cameras).
"""

from __future__ import annotations

import argparse
from typing import List

from .config import CameraConfig, LineConfig, SiteConfig
from .depth_source import Walker, build_mock_sources
from .pipeline import CountingPipeline


def demo_site() -> SiteConfig:
    """A 6 m flagship doorway covered by two overlapping overhead cameras."""
    cameras = [
        CameraConfig("cam_left", mount_height_m=3.2, origin_xy_m=(1.75, 0.0),
                     footprint_m=(4.0, 4.0), resolution_px=(160, 160)),
        CameraConfig("cam_right", mount_height_m=3.2, origin_xy_m=(4.25, 0.0),
                     footprint_m=(4.0, 4.0), resolution_px=(160, 160)),
    ]
    line = LineConfig(point_a_m=(0.0, 0.0), point_b_m=(6.0, 0.0),
                      inbound_normal=(0.0, 1.0))
    return SiteConfig(name="Flagship Main Entrance", cameras=cameras, line=line,
                      fusion_radius_m=0.30, fps=15.0)


def demo_walkers() -> List[Walker]:
    """6 in, 2 out. One inbound pair walks side-by-side through the overlap."""
    walkers = []
    # Inbound singles spread across the doorway, staggered in time.
    for i, x in enumerate([0.8, 2.4, 4.0, 5.2]):
        walkers.append(Walker(start_xy=(x, -1.6), velocity_xy=(0.0, 1.0),
                              t_enter=i * 0.6))
    # Inbound side-by-side pair right in the camera overlap (~x=3) — the hard case:
    # heads ~0.5 m apart (shoulder-to-shoulder), each seen by BOTH cameras.
    walkers.append(Walker(start_xy=(2.75, -1.6), velocity_xy=(0.0, 1.0), t_enter=3.0))
    walkers.append(Walker(start_xy=(3.25, -1.6), velocity_xy=(0.0, 1.0), t_enter=3.0))
    # Outbound.
    for i, x in enumerate([1.5, 4.5]):
        walkers.append(Walker(start_xy=(x, 1.6), velocity_xy=(0.0, -1.0),
                              t_enter=1.0 + i * 0.8))
    return walkers


def run_demo(frames: int = 120) -> dict:
    site = demo_site()
    sources = build_mock_sources(site.cameras, demo_walkers(),
                                 n_frames=frames, fps=site.fps, noise_m=0.0)
    pipe = CountingPipeline(site, sources)

    def show(ev):
        arrow = "IN  ->" if ev.direction == "in" else "OUT <-"
        print(f"  t={ev.timestamp:5.2f}s  {arrow}  track#{ev.track_id:<3d} "
              f"@ x={ev.x:4.2f}  (in={pipe.line_counter.total_in} "
              f"out={pipe.line_counter.total_out})")

    print(f"\n== {site.name}: running demo ({len(site.cameras)} cameras) ==")
    summary = pipe.run(on_event=show)
    print(f"\nResult: inbound={summary['inbound']}  outbound={summary['outbound']}  "
          f"occupancy={summary['occupancy']}")
    print("Expected: inbound=6  outbound=2  occupancy=4")
    return summary


def main(argv=None):
    ap = argparse.ArgumentParser(description="Flagship 3D people counter")
    ap.add_argument("--demo", action="store_true", help="run synthetic demo")
    ap.add_argument("--config", help="path to site YAML config")
    ap.add_argument("--backend", choices=["mock", "zed", "oak"], default="mock")
    ap.add_argument("--frames", type=int, default=120, help="frames to process (mock)")
    args = ap.parse_args(argv)

    if args.demo or not args.config:
        run_demo(frames=args.frames)
        return

    site = SiteConfig.from_yaml(args.config)
    if args.backend != "mock":
        raise SystemExit(
            f"--backend {args.backend} needs a connected camera + SDK; "
            "see counter/depth_source.py adapters."
        )
    # Mock backend on a real config: no walkers defined, so this is a smoke run.
    sources = build_mock_sources(site.cameras, [], n_frames=args.frames, fps=site.fps)
    summary = CountingPipeline(site, sources).run()
    print(summary)


if __name__ == "__main__":
    main()
