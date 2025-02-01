from datetime import datetime
from typing import Dict, List, Optional
import time
import asyncio
from collections import defaultdict
import statistics
import logging

logger = logging.getLogger(__name__)

class PerformanceMetric:
    def __init__(self, name: str):
        self.name = name
        self.start_time: Optional[float] = None
        self.end_time: Optional[float] = None
        self.metadata: Dict = {}

    def start(self):
        self.start_time = time.time()
        return self

    def stop(self):
        self.end_time = time.time()
        return self

    @property
    def duration(self) -> Optional[float]:
        if self.start_time and self.end_time:
            return self.end_time - self.start_time
        return None

class PerformanceTracker:
    def __init__(self):
        self.metrics: Dict[str, List[PerformanceMetric]] = defaultdict(list)
        self._active_metrics: Dict[str, PerformanceMetric] = {}

    async def track(self, name: str, metadata: Optional[Dict] = None):
        """Context manager for tracking performance metrics"""
        metric = PerformanceMetric(name)
        if metadata:
            metric.metadata = metadata
        self._active_metrics[name] = metric
        metric.start()
        return metric

    async def stop_tracking(self, name: str):
        """Stop tracking a metric"""
        if name in self._active_metrics:
            metric = self._active_metrics[name]
            metric.stop()
            self.metrics[name].append(metric)
            del self._active_metrics[name]

    def get_statistics(self, name: str) -> Dict:
        """Get statistics for a specific metric"""
        if name not in self.metrics:
            return {}

        durations = [m.duration for m in self.metrics[name] if m.duration is not None]
        if not durations:
            return {}

        return {
            "count": len(durations),
            "mean": statistics.mean(durations),
            "median": statistics.median(durations),
            "min": min(durations),
            "max": max(durations),
            "stddev": statistics.stdev(durations) if len(durations) > 1 else 0
        }

    def get_all_statistics(self) -> Dict[str, Dict]:
        """Get statistics for all metrics"""
        return {
            name: self.get_statistics(name)
            for name in self.metrics.keys()
        }

    async def log_slow_operations(self, threshold: float = 1.0):
        """Log operations that took longer than the threshold (in seconds)"""
        for name, metrics in self.metrics.items():
            for metric in metrics:
                if metric.duration and metric.duration > threshold:
                    logger.warning(
                        f"Slow operation detected: {name} took {metric.duration:.2f}s. "
                        f"Metadata: {metric.metadata}"
                    )

    async def cleanup_old_metrics(self, max_age_hours: int = 24):
        """Remove metrics older than specified hours"""
        current_time = time.time()
        for name in list(self.metrics.keys()):
            self.metrics[name] = [
                m for m in self.metrics[name]
                if m.start_time and (current_time - m.start_time) < (max_age_hours * 3600)
            ]

# Create a global instance
performance_tracker = PerformanceTracker()

# Example usage in routes:
"""
@router.get("/some-endpoint")
async def some_endpoint():
    metric = await performance_tracker.track("endpoint_call", {"endpoint": "/some-endpoint"})
    try:
        # Your endpoint logic here
        result = await some_operation()
        return result
    finally:
        await performance_tracker.stop_tracking("endpoint_call")
"""
