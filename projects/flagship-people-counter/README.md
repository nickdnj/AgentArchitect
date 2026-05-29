# Flagship 3D People Counter

A 3D stereo-vision, overhead **people counter** for **wide, busy retail entrances**, designed for **≥95% counting accuracy**. This repo contains both the **engineering design** and a **working, tested reference implementation** of the counting pipeline.

> Counting accuracy at a wide door is won by defeating two problems — **occlusion** (solved with overhead *depth*) and **width** (solved with overlapping cameras + *fusion*). Everything here is organised around those two ideas.

---

## What's here

```
flagship-people-counter/
├── docs/
│   ├── 01-system-design.md            # requirements, architecture, coverage math, FMEA, test plan
│   ├── 02-hardware-reference-build.md  # sensor/compute selection, BOM, install + calibration
│   └── 03-build-vs-buy-roadmap.md      # cost model, phased roadmap, risks
├── counter/                            # working pipeline (pure-numpy core)
│   ├── config.py        # site / camera / line configuration
│   ├── depth_source.py  # DepthSource interface + MockWorld + ZED/OAK adapters
│   ├── detection.py     # overhead head detection on a depth map
│   ├── fusion.py        # multi-camera overlap dedup
│   ├── tracking.py      # constant-velocity Kalman + greedy association
│   ├── line_counter.py  # signed-distance line crossing (direction + segment + cooldown)
│   ├── analytics.py     # hourly buckets, occupancy, conversion rate
│   ├── pipeline.py      # wires the stages together
│   └── cli.py           # `--demo` and config-driven entry point
├── configs/flagship_entrance.yaml      # example 6 m, 2-camera site
├── tests/                              # unit + end-to-end tests
├── requirements.txt
└── pyproject.toml
```

## Pipeline

```
overhead depth (per cam) → HeadDetector → DetectionFuser → MultiObjectTracker
                         → LineCounter → TrafficAggregator (counts/occupancy/conversion)
```

The core algorithms are **pure numpy** and run against a `MockDepthSource`, so the counting logic is fully developed and tested **without any camera hardware**. Real sensors plug in by implementing the `DepthSource` interface (ZED / OAK adapters stubbed with integration notes).

## Quickstart

```bash
pip install -r requirements.txt        # numpy + pyyaml (+ pytest)

# Watch the full pipeline count a synthetic crowd end-to-end:
python -m counter.cli --demo

# Run the test suite:
python -m pytest -q
```

The demo simulates **6 inbound, 2 outbound**, including a **side-by-side pair walking through the camera overlap** (the canonical hard case — two people seen by both cameras). The pipeline counts it exactly: `inbound=6 outbound=2 occupancy=4`.

## Running on real hardware

1. Mount overhead depth cameras and fill in `configs/<site>.yaml` (mount height, positions, footprints, counting line). See `docs/02-hardware-reference-build.md`.
2. Implement the matching adapter in `counter/depth_source.py` (`OAKDepthSource` / `ZEDDepthSource`) to emit metric depth frames in the site orientation.
3. `python -m counter.cli --config configs/<site>.yaml --backend oak`
4. Route `TrafficAggregator` output to your backend + POS for conversion.

## Status

- **Phase 0 (algorithm proof): complete** — pipeline + tests green, hard case handled.
- Phase 1+ (real-sensor adapter, multi-camera pilot, hardening, rollout): see `docs/03-build-vs-buy-roadmap.md`.

## Scope notes

Built for **anonymous counting** — no identifiable imagery leaves the device. Demographics, in-aisle heatmaps/dwell, and loss-prevention are explicitly out of v1 scope.
