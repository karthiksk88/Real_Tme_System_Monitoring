import React, { useState, useEffect } from 'react';
import { metricsService } from '../services/metricsService';
import { Bell, AlertTriangle, CheckCircle, Info, ShieldAlert } from 'lucide-react';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ACTIVE');

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await metricsService.getAllAlerts();
      const alertList = res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(alertList)) {
        setAlerts(alertList);
      }
    } catch (e) {
      console.error("Failed to fetch alerts", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterStatus === 'ACTIVE') return a.status === 'OPEN' || a.status === 'ACKNOWLEDGED';
    if (filterStatus === 'RESOLVED') return a.status === 'RESOLVED';
    return true;
  });

  const handleAcknowledge = async (alertId) => {
    try {
      await metricsService.acknowledgeAlert(alertId);
      fetchAlerts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await metricsService.resolveAlert(alertId);
      fetchAlerts();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            Alert Center
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
              State Engine
            </span>
          </h2>
          <p className="text-xs text-slate-400">Critical threshold alerts with duplicate prevention and automatic recovery hysteresis</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setFilterStatus('ACTIVE')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${filterStatus === 'ACTIVE' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Active ({alerts.filter(a => a.status === 'OPEN' || a.status === 'ACKNOWLEDGED').length})
            </button>
            <button
              onClick={() => setFilterStatus('RESOLVED')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${filterStatus === 'RESOLVED' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Resolved ({alerts.filter(a => a.status === 'RESOLVED').length})
            </button>
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${filterStatus === 'ALL' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              All
            </button>
          </div>
          <button onClick={fetchAlerts} className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white">
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">Loading live alerts...</div>
      ) : filteredAlerts.length === 0 ? (
        <div className="p-8 glass-panel rounded-2xl border border-slate-800 text-center text-slate-400 text-xs">
          🎉 No {filterStatus.toLowerCase()} hardware alerts detected! All endpoints operating within normal bounds.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((a) => (
            <div key={a.id} className="p-5 rounded-2xl glass-panel border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${a.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-3">
                    <h4 className="text-sm font-bold text-slate-100">{a.title}</h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${a.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {a.severity}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${a.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400' : a.status === 'ACKNOWLEDGED' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-red-500/10 text-red-400'}`}>
                      {a.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{a.hostname} • {a.message}</p>
                  <p className="text-[10px] font-mono text-slate-500 mt-1">{new Date(a.triggeredAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {a.status === 'OPEN' && (
                  <button onClick={() => handleAcknowledge(a.id)} className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white">
                    Acknowledge
                  </button>
                )}
                {a.status !== 'RESOLVED' && (
                  <button onClick={() => handleResolve(a.id)} className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/30">
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
