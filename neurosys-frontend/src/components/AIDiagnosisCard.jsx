import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldAlert, CheckCircle2, HelpCircle, AlertTriangle, Lightbulb, Clock, Info } from 'lucide-react';
import { metricsService } from '../services/metricsService';

const AIDiagnosisCard = ({ computerId }) => {
  const [diagnosis, setDiagnosis] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (computerId) {
      fetchAIDiagnostics();
    }
  }, [computerId]);

  const fetchAIDiagnostics = async () => {
    try {
      const diagRes = await metricsService.getDiagnosis(computerId);
      if (diagRes?.success) setDiagnosis(diagRes.data);

      const predRes = await metricsService.getPrediction(computerId);
      if (predRes?.success) setPrediction(predRes.data);
    } catch (e) {
      console.error('Failed to load AI Diagnostics', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs italic">
        Evaluating AI Performance & Failure Diagnosis...
      </div>
    );
  }

  const isConfirmed = diagnosis?.confirmationStatus === 'CONFIRMED';
  const isLikely = diagnosis?.confirmationStatus === 'LIKELY';
  const isNotConfirmed = diagnosis?.confirmationStatus === 'NOT_CONFIRMED';
  const hasProblem = diagnosis?.isProblemActive;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. AI SYSTEM DIAGNOSIS CARD */}
      <div className={`glass-panel p-6 rounded-2xl border space-y-4 ${
        hasProblem 
          ? isConfirmed 
            ? 'border-emerald-500/40 bg-emerald-500/5' 
            : isLikely 
            ? 'border-amber-500/40 bg-amber-500/5' 
            : 'border-cyan-500/40 bg-cyan-500/5'
          : 'border-slate-800'
      }`}>
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            AI SYSTEM DIAGNOSIS
          </h3>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
            isConfirmed 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
              : isLikely 
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}>
            {isConfirmed && <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />}
            {isLikely && <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-400" />}
            {isNotConfirmed && <HelpCircle className="w-3.5 h-3.5 mr-1 text-slate-400" />}
            Status: {diagnosis?.confirmationStatus || 'CONFIRMED'}
          </span>
        </div>

        {/* Problem & Reason */}
        <div className="space-y-2">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">What happened?</span>
            <p className={`text-base font-extrabold mt-0.5 ${hasProblem ? 'text-slate-100' : 'text-emerald-400'}`}>
              {diagnosis?.problemDetected || 'No active problems detected'}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Exact reason:</span>
            <p className="text-xs text-slate-200 mt-0.5 font-medium leading-relaxed">
              {diagnosis?.exactReason || 'Computer operating normally within healthy parameters.'}
            </p>
          </div>
        </div>

        {/* Evidence list */}
        {diagnosis?.evidence && diagnosis.evidence.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-cyan-400" /> Evidence supporting this reason:
            </span>
            <ul className="space-y-1 text-xs text-slate-300">
              {diagnosis.evidence.map((ev, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>{ev}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Possible Causes for NOT_CONFIRMED */}
        {isNotConfirmed && diagnosis?.possibleCauses && diagnosis.possibleCauses.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800/60">
            <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
              Possible causes based on available evidence:
            </span>
            <div className="space-y-1">
              {diagnosis.possibleCauses.map((pc, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-300">{pc.cause}</span>
                  <span className="font-mono text-cyan-400 font-bold">{pc.probabilityPercent}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Solution */}
        {diagnosis?.solution && (
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200 block font-semibold mb-0.5">What should the admin do?</strong>
              <span className="text-slate-300">{diagnosis.solution}</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. AI PREDICTION CARD */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            AI FAILURE PREDICTION
          </h3>
          {prediction?.isDataSufficient ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Confidence: {prediction.confidencePercent}%
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
              Data Sufficiency: Pending
            </span>
          )}
        </div>

        {!prediction?.isDataSufficient ? (
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2 text-slate-400">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <ShieldAlert className="w-4 h-4" />
              <span>AI Prediction Unavailable</span>
            </div>
            <p className="text-slate-300">
              {prediction?.insufficientDataReason || 'Not enough historical telemetry data collected yet.'}
            </p>
            <p className="text-[11px] text-slate-400">
              Continue running the agent to collect telemetry trends for accurate forecasting.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Possible Future Problem:</span>
              <p className="text-sm font-extrabold text-slate-100 mt-0.5">
                {prediction.predictedIssue}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">EXPECTED TIMEFRAME</span>
                <span className="text-xs font-bold text-cyan-400 mt-0.5 block">{prediction.estimatedTimeframe}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">CATEGORY</span>
                <span className="text-xs font-bold text-blue-400 mt-0.5 block">{prediction.category}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Why is this predicted?</span>
              <p className="text-xs text-slate-300 mt-0.5 font-medium leading-relaxed">
                {prediction.reason}
              </p>
            </div>

            {prediction.recommendedAction && (
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                <span className="text-cyan-400 font-bold block">Recommended Action:</span>
                <span className="text-slate-300 block">{prediction.recommendedAction}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDiagnosisCard;
