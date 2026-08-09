import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, RefreshCw, Layers, Monitor, Play } from 'lucide-react';
import api from '../services/api';

const LabReadiness = () => {
  const [labName, setLabName] = useState('General Lab');
  const [readinessData, setReadinessData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLabReadiness(labName);
  }, [labName]);

  const fetchLabReadiness = async (name) => {
    setLoading(true);
    try {
      const res = await api.get(`/software/lab-readiness?labName=${encodeURIComponent(name)}`);
      const data = res?.data || res;
      setReadinessData(data);
    } catch (e) {
      console.error('Failed to load lab readiness', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            Lab Readiness Checker
          </h2>
          <p className="text-xs text-slate-400">Audit whether lab computers are fully configured and ready for tomorrow's class</p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={labName}
            onChange={(e) => setLabName(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="General Lab">General Lab</option>
            <option value="Java Lab">Java Lab</option>
            <option value="AI Lab">AI Lab</option>
            <option value="ALL">All Labs</option>
          </select>
          <button
            onClick={() => fetchLabReadiness(labName)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-check Readiness
          </button>
        </div>
      </div>

      {/* Main Readiness Gauge Banner */}
      {readinessData && (
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider">
                {readinessData.labName} Audit Summary
              </span>
              <h3 className="text-3xl font-black text-slate-100">
                {readinessData.readyComputers} / {readinessData.totalComputers} Computers Ready
              </h3>
              <p className="text-xs text-slate-400 max-w-lg">
                Required stack: {readinessData.requiredSoftwareNames?.join(', ') || 'Java 21, MySQL, VS Code'}
              </p>
            </div>

            {/* Progress Percentage Gauge */}
            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="text-right">
                <span className="text-4xl font-black text-emerald-400">{readinessData.readinessPercentage}%</span>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lab Readiness</span>
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 flex items-center justify-center bg-emerald-500/10">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Endpoint PCs</span>
              <span className="text-lg font-black text-slate-200">{readinessData.totalComputers}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-[10px] font-bold text-emerald-400 uppercase block">Ready Endpoints</span>
              <span className="text-lg font-black text-emerald-400">{readinessData.readyComputers}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
              <span className="text-[10px] font-bold text-red-400 uppercase block">Need Attention</span>
              <span className="text-lg font-black text-red-400">{readinessData.unreadyComputers}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Required Packages</span>
              <span className="text-lg font-black text-cyan-400">{readinessData.requiredSoftwareNames?.length || 3}</span>
            </div>
          </div>
        </div>
      )}

      {/* Per-Computer Readiness Checklist */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">Evaluating lab computer software compliance...</div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 font-bold text-sm text-slate-200 flex items-center justify-between">
            <span>Detailed Computer Checklist</span>
            <span className="text-xs font-normal text-slate-400">Green = Ready for Class</span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {readinessData?.computers?.map((c) => (
              <div key={c.computerId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center space-x-3.5">
                  <div className={`p-2.5 rounded-xl border ${c.ready ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      {c.hostname}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.ready ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                        {c.ready ? 'READY' : 'NOT READY'}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">Status: {c.status}</p>
                  </div>
                </div>

                {/* Audit Issues or Success */}
                <div className="text-xs">
                  {c.ready ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> All required software installed & online
                    </span>
                  ) : (
                    <div className="space-y-1">
                      {c.issues?.map((issue, idx) => (
                        <span key={idx} className="text-red-400 font-semibold flex items-center gap-1.5 block">
                          <XCircle className="w-3.5 h-3.5" /> {issue}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LabReadiness;
