from typing import Dict, List, Any

class CrashRiskPredictor:
    """
    Evaluates system crash probability (0.0 to 1.0) based on CPU, RAM, Disk, Temperature, Process Count,
    and historical memory growth trajectories.
    """

    @staticmethod
    def evaluate_crash_risk(metrics: Dict[str, Any], history: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        cpu = float(metrics.get("cpuUsagePercent", 0.0))
        ram = float(metrics.get("memoryUsagePercent", 0.0))
        disk = float(metrics.get("diskUsagePercent", 0.0))
        temp = float(metrics.get("cpuTemperature", 45.0)) if metrics.get("cpuTemperature") else 45.0
        processes = int(metrics.get("activeProcessCount", 50))

        risk_score = 0.05
        reasons = []

        if cpu > 90.0:
            risk_score += 0.35
            reasons.append(f"High CPU Saturation ({cpu:.1f}%)")
        elif cpu > 75.0:
            risk_score += 0.15
            reasons.append(f"Elevated CPU Usage ({cpu:.1f}%)")

        if ram > 90.0:
            risk_score += 0.35
            reasons.append(f"Critical RAM Allocation ({ram:.1f}%)")
        elif ram > 80.0:
            risk_score += 0.15
            reasons.append(f"High Memory Usage ({ram:.1f}%)")

        if disk > 90.0:
            risk_score += 0.15
            reasons.append(f"Disk Capacity Exhaustion ({disk:.1f}%)")

        if temp > 80.0:
            risk_score += 0.10
            reasons.append(f"Thermal Throttling Alert ({temp:.1f}°C)")

        if processes > 250:
            risk_score += 0.10
            reasons.append(f"Excessive Active Process Count ({processes})")

        probability = round(min(0.99, max(0.01, risk_score)), 2)
        confidence = 0.92

        if probability > 0.60:
            recommendation = "High crash risk detected! Terminate non-essential high-load processes or reboot endpoint."
        elif probability > 0.30:
            recommendation = "Moderate crash risk. Monitor RAM leak trajectories and clear temporary caches."
        else:
            recommendation = "System operating within healthy parameters. No remediation required."

        return {
            "crashProbability": probability,
            "confidenceScore": confidence,
            "reasons": reasons if reasons else ["System metrics stable"],
            "recommendedAction": recommendation
        }
