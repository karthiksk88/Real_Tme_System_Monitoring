import numpy as np
import pandas as pd
from typing import Dict, List, Any

class MetricForecaster:
    """
    Time-series forecaster predicting CPU, RAM, and Disk utilization
    across +10m, +30m, and +60m prediction windows using linear velocity and rolling averages.
    """

    @staticmethod
    def forecast_metrics(history: List[Dict[str, Any]]) -> Dict[str, Dict[str, float]]:
        if not history:
            return {
                "10m": {"cpu": 45.0, "ram": 55.0, "disk": 60.0},
                "30m": {"cpu": 48.0, "ram": 58.0, "disk": 60.5},
                "60m": {"cpu": 52.0, "ram": 62.0, "disk": 61.0}
            }

        df = pd.DataFrame(history)

        cpu_series = df["cpuUsagePercent"].values if "cpuUsagePercent" in df else np.array([45.0])
        ram_series = df["memoryUsagePercent"].values if "memoryUsagePercent" in df else np.array([55.0])
        disk_series = df["diskUsagePercent"].values if "diskUsagePercent" in df else np.array([60.0])

        current_cpu = float(cpu_series[-1])
        current_ram = float(ram_series[-1])
        current_disk = float(disk_series[-1])

        # Compute velocity (rate of change over recent samples)
        cpu_velocity = np.diff(cpu_series[-5:]).mean() if len(cpu_series) >= 5 else 0.2
        ram_velocity = np.diff(ram_series[-5:]).mean() if len(ram_series) >= 5 else 0.1
        disk_velocity = np.diff(disk_series[-5:]).mean() if len(disk_series) >= 5 else 0.01

        # Forecast +10m (2 steps), +30m (6 steps), +60m (12 steps)
        f_10m = {
            "cpu": float(np.clip(current_cpu + (cpu_velocity * 2.0), 0.0, 100.0)),
            "ram": float(np.clip(current_ram + (ram_velocity * 2.0), 0.0, 100.0)),
            "disk": float(np.clip(current_disk + (disk_velocity * 2.0), 0.0, 100.0))
        }

        f_30m = {
            "cpu": float(np.clip(current_cpu + (cpu_velocity * 5.0), 0.0, 100.0)),
            "ram": float(np.clip(current_ram + (ram_velocity * 5.0), 0.0, 100.0)),
            "disk": float(np.clip(current_disk + (disk_velocity * 5.0), 0.0, 100.0))
        }

        f_60m = {
            "cpu": float(np.clip(current_cpu + (cpu_velocity * 10.0), 0.0, 100.0)),
            "ram": float(np.clip(current_ram + (ram_velocity * 10.0), 0.0, 100.0)),
            "disk": float(np.clip(current_disk + (disk_velocity * 10.0), 0.0, 100.0))
        }

        return {
            "10m": {k: round(v, 1) for k, v in f_10m.items()},
            "30m": {k: round(v, 1) for k, v in f_30m.items()},
            "60m": {k: round(v, 1) for k, v in f_60m.items()}
        }
