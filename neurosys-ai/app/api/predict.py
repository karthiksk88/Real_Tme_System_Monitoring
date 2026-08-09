from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.prediction.forecaster import MetricForecaster
from app.prediction.crash_risk import CrashRiskPredictor

router = APIRouter()

class MetricPayload(BaseModel):
    cpuUsagePercent: float
    memoryUsagePercent: float
    diskUsagePercent: float
    cpuTemperature: Optional[float] = 45.0
    activeProcessCount: Optional[int] = 50

class PredictRequest(BaseModel):
    computerId: str
    currentMetrics: MetricPayload
    historicalMetrics: Optional[List[Dict[str, Any]]] = []

@router.post("/predict/metrics")
def predict_metrics(request: PredictRequest):
    forecasts = MetricForecaster.forecast_metrics(request.historicalMetrics)
    crash_analysis = CrashRiskPredictor.evaluate_crash_risk(request.currentMetrics.model_dump(), request.historicalMetrics)

    return {
        "computerId": request.computerId,
        "forecasts": forecasts,
        "crashAnalysis": crash_analysis
    }

@router.post("/predict/crash")
def predict_crash(request: PredictRequest):
    return CrashRiskPredictor.evaluate_crash_risk(request.currentMetrics.model_dump(), request.historicalMetrics)
