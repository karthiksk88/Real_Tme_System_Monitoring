import React, { useState, useEffect } from 'react';
import { metricsService } from '../services/metricsService';
import { Sparkles, Monitor, AlertTriangle, ShieldCheck, Activity, TrendingUp, Info, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

const Analytics = () => {
  const [computers, setComputers] = useState([]);
  const [selectedCompId, setSelectedCompId] = useState('');
  const [selectedComputer, setSelectedComputer] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [trendChartData, setTrendChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedCompId) {
      loadComputerPrediction(selectedCompId);
    }
  }, [selectedCompId]);

  const fetchInitialData = async () => {
    try {
      const compRes = await metricsService.getAllComputers();
      const compList = compRes?.data || (Array.isArray(compRes) ? compRes : []);
      if (Array.isArray(compList) && compList.length > 0) {
        setComputers(compList);
        setSelectedCompId(compList[0].id);
        setSelectedComputer(compList[0]);
      }
    } catch (e) {
      console.error('Failed to load computers for prediction', e);
    } finally {
      setLoading(false);
    }
  };

  const loadComputerPrediction = async (compId) => {
    const comp = computers.find((c) => c.id === compId);
    if (comp) setSelectedComputer(comp);

    try {
      // Fetch Real AI Prediction calculated from database telemetry
      const predRes = await metricsService.getCrashPrediction(compId);
      const predData = predRes?.data || predRes;

      if (predData) {
        setPredictionData(predData);

        // Combine Actual Historical Points + Model Extrapolated Prediction Points
        const combined = [];
        const histData = predData.historicalData || [];
        const futData = predData.predictedData || [];

        // 1. Actual Historical telemetry (Solid line)
        if (Array.isArray(histData) && histData.length > 0) {
          histData.forEach((pt) => {
            combined.push({
              date: pt.date,
              actualScore: pt.actualScore != null ? pt.actualScore : pt.predictedScore,
              predictedScore: pt.predictedScore != null ? pt.predictedScore : null,
              isPrediction: false
            });
          });
        }

        // 2. Projected Future Trend points (Dashed line)
        if (Array.isArray(futData) && futData.length > 0) {
          futData.forEach((pt) => {
            combined.push({
              date: pt.date,
              actualScore: null,
              predictedScore: pt.predictedScore,
              isPrediction: true
            });
          });
        }

        setTrendChartData(combined);
      }
    } catch (e) {
      console.error('Failed to load computer prediction', e);
    }
  };

  const isSufficient = predictionData?.isDataSufficient ?? false;
  const riskLevel = predictionData?.riskLevel || 'UNKNOWN';
  const confidencePercent = predictionData?.confidencePercent ?? Math.round((predictionData?.confidenceScore || 0) * 100);
  const contributingFactors = predictionData?.contributingFactors || predictionData?.reasons || [];
  const modelVersion = predictionData?.modelVersion || 'NeuroSys Trend Model v1.0';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Computer Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-cyan-400" />
            AI Intelligence & System Predictions
          </h2>
          <p className="text-xs text-slate-400">
            Linear regression trend forecasting & degradation modeling powered by <code className="text-cyan-400 font-mono">{modelVersion}</code>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="text-xs text-slate-400 font-semibold">Select Computer:</label>
          <select
            value={selectedCompId}
            onChange={(e) => setSelectedCompId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500 shadow-sm"
          >
            {computers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.hostname} ({c.labName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* System-Level Prediction Card */}
      {selectedComputer && (
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider">
                  System Prediction — {selectedComputer.hostname}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                    !isSufficient
                      ? 'bg-slate-800 text-slate-400 border border-slate-700'
                      : riskLevel === 'HIGH'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : riskLevel === 'MEDIUM'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {!isSufficient ? 'PENDING DATA' : `${riskLevel} RISK`}
                </span>
              </div>

              <h3 className="text-3xl font-black text-slate-100">
                {predictionData?.predictedIssue || 'Evaluating Telemetry Trends...'}
              </h3>

              <p className="text-xs text-slate-400 max-w-xl">
                Estimated timeframe:{' '}
                <strong className="text-slate-200">{predictionData?.estimatedTimeframe || 'N/A'}</strong>
                {' • '}
                Confidence:{' '}
                <strong className="text-cyan-400">{isSufficient ? `${confidencePercent}%` : 'Not available'}</strong>
              </p>
            </div>

            {/* Statistical Confidence / Data Sufficiency Gauge */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1 min-w-[150px]">
              <span className="text-3xl font-black text-cyan-400">
                {!isSufficient ? '—' : `${confidencePercent}%`}
              </span>
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {!isSufficient ? 'Data Pending' : 'Model Confidence'}
              </span>
            </div>
          </div>

          {/* Dynamic Supporting Contributing Factors */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" /> Supporting Contributing Factors (Real Telemetry Trends)
            </h4>

            {!isSufficient ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  {predictionData?.insufficientDataReason ||
                    'Not enough historical telemetry for this computer. Minimum 10 historical samples required.'}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {contributingFactors.map((factor, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0 mt-1.5" />
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actionable Advice */}
          {predictionData?.recommendedAction && isSufficient && (
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-cyan-300 block">Recommended Action:</strong>
                <span>{predictionData.recommendedAction}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI PREDICTION GRAPH: HISTORICAL vs PREDICTED FUTURE TREND */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Real Telemetry History vs Linear Regression Predicted Trend
            </h3>
            <p className="text-xs text-slate-400">
              Solid line = Actual Telemetry History from PostgreSQL | Dashed line = Model Trend Extrapolation
            </p>
          </div>
        </div>

        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} unit="%" />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
              <Legend />
              <ReferenceLine x="Today" stroke="#06b6d4" strokeDasharray="3 3" label={{ value: 'Today', fill: '#06b6d4', fontSize: 11, position: 'top' }} />

              <Line
                type="monotone"
                dataKey="actualScore"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#06b6d4' }}
                name="Actual Historical Load %"
                connectNulls={false}
              />

              <Line
                type="monotone"
                dataKey="predictedScore"
                stroke="#a855f7"
                strokeWidth={2.5}
                strokeDasharray="6 6"
                dot={{ r: 3, fill: '#a855f7' }}
                name="Predicted Future Trend %"
                connectNulls={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
