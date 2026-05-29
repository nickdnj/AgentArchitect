"""Traffic aggregation + retail KPIs.

Consumes CountEvents and rolls them into time buckets (default: hourly), tracking
inbound, outbound, net, and running occupancy. The KPI the business actually
cares about is conversion: join inbound traffic against POS transaction counts
for the same window.
"""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from .line_counter import CountEvent


@dataclass
class Bucket:
    start: float
    inbound: int = 0
    outbound: int = 0

    @property
    def net(self) -> int:
        return self.inbound - self.outbound


class TrafficAggregator:
    def __init__(self, bucket_seconds: float = 3600.0):
        self.bucket_seconds = bucket_seconds
        self.buckets: Dict[float, Bucket] = {}
        self._running_occupancy = 0

    def _bucket_key(self, ts: float) -> float:
        return ts - (ts % self.bucket_seconds)

    def add(self, event: CountEvent) -> None:
        key = self._bucket_key(event.timestamp)
        b = self.buckets.setdefault(key, Bucket(start=key))
        if event.direction == "in":
            b.inbound += 1
            self._running_occupancy += 1
        else:
            b.outbound += 1
            self._running_occupancy = max(0, self._running_occupancy - 1)

    def add_many(self, events: List[CountEvent]) -> None:
        for e in events:
            self.add(e)

    @property
    def total_inbound(self) -> int:
        return sum(b.inbound for b in self.buckets.values())

    @property
    def total_outbound(self) -> int:
        return sum(b.outbound for b in self.buckets.values())

    @property
    def occupancy(self) -> int:
        return self._running_occupancy

    def conversion_rate(self, transactions: int) -> Optional[float]:
        """transactions / inbound visitors. None if no traffic yet."""
        visitors = self.total_inbound
        if visitors == 0:
            return None
        return transactions / visitors

    def to_rows(self) -> List[dict]:
        rows = []
        for key in sorted(self.buckets):
            b = self.buckets[key]
            rows.append({
                "bucket_start": b.start,
                "inbound": b.inbound,
                "outbound": b.outbound,
                "net": b.net,
            })
        return rows

    def to_csv(self) -> str:
        lines = ["bucket_start,inbound,outbound,net"]
        for r in self.to_rows():
            lines.append(f"{r['bucket_start']},{r['inbound']},{r['outbound']},{r['net']}")
        return "\n".join(lines)
