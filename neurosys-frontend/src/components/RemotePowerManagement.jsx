import React, { useState, useEffect } from 'react';
import { Lock, RotateCcw, Power, ShieldAlert, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { metricsService } from '../services/metricsService';

const RemotePowerManagement = ({ computer, onStatusUpdate }) => {
  const [modalType, setModalType] = useState(null); // 'LOCK' | 'RESTART' | 'SHUTDOWN' | null
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '', statusText: '' }
  const [audits, setAudits] = useState([]);
  const [lastCommandStatus, setLastCommandStatus] = useState(null);

  // Accept ONLINE, CRITICAL, or WARNING as active online computer states
  const isOnline = computer && (
    computer.status === 'ONLINE' || 
    computer.status === 'CRITICAL' || 
    computer.status === 'WARNING'
  );

  useEffect(() => {
    if (computer?.id) {
      fetchAudits();
    }
  }, [computer?.id]);

  const fetchAudits = async () => {
    try {
      const res = await metricsService.getPowerAudits(computer.id);
      if (res?.success && Array.isArray(res.data)) {
        setAudits(res.data);
      }
    } catch (e) {
      console.error('Failed to load power audits', e);
    }
  };

  const handleConfirmAction = async () => {
    if (!modalType || !isOnline) return;
    const action = modalType;
    setModalType(null); // Close modal immediately upon confirmation
    setLoading(true);
    setFeedback(null);

    const clickIsoTime = new Date().toISOString();
    console.log(`[PERF LOG] [FRONTEND] User confirmed ${action} action at ${clickIsoTime}`);
    const startMs = performance.now();

    try {
      let res;
      if (action === 'LOCK') {
        res = await metricsService.lockComputer(computer.id);
      } else if (action === 'RESTART') {
        res = await metricsService.restartComputer(computer.id);
      } else if (action === 'SHUTDOWN') {
        res = await metricsService.shutdownComputer(computer.id);
      }

      const endMs = performance.now();
      const latencyMs = Math.round(endMs - startMs);
      console.log(`[PERF LOG] [FRONTEND] Backend acknowledged ${action} command in ${latencyMs}ms at ${new Date().toISOString()}`);

      if (res?.success) {
        const headlineText = action === 'LOCK'
          ? "Lock command sent."
          : action === 'RESTART'
          ? "Restart command sent."
          : "Shutdown command sent.";

        const detailText = action === 'LOCK'
          ? `${computer.hostname} workstation is locking...`
          : action === 'RESTART'
          ? `${computer.hostname} is restarting...`
          : `${computer.hostname} is shutting down...`;

        setFeedback({ 
          type: 'success', 
          message: headlineText,
          statusText: detailText,
          latency: latencyMs
        });
        
        setLastCommandStatus({ type: action, status: res.data?.status || 'ACKNOWLEDGED' });
        fetchAudits();
        if (onStatusUpdate) onStatusUpdate();
      } else {
        setFeedback({ 
          type: 'error', 
          message: `Unable to send ${action.toLowerCase()} command.`, 
          statusText: res?.message || 'Try again.' 
        });
      }
    } catch (err) {
      setFeedback({ 
        type: 'error', 
        message: `Unable to send ${action.toLowerCase()} command.`, 
        statusText: err.response?.data?.message || err.message 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            <Power className="w-5 h-5 text-cyan-400" />
            REMOTE POWER MANAGEMENT
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Authorized administrator remote controls for <strong className="text-slate-200">{computer?.hostname}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
            isOnline 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-slate-800/60 text-slate-400 border-slate-700'
          }`}>
            <span className={`w-2 h-2 rounded-full mr-1.5 ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            {isOnline ? (computer?.status || 'ONLINE') : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Action Buttons Container */}
      {!isOnline ? (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs flex items-center space-x-3">
          <ShieldAlert className="w-5 h-5 text-slate-500 flex-shrink-0" />
          <div>
            <strong className="text-slate-300 block font-semibold">{computer?.hostname} is currently OFFLINE</strong>
            Remote power actions unavailable. Connect computer to network to manage power state.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Lock Button */}
          <button
            onClick={() => setModalType('LOCK')}
            disabled={loading}
            className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 hover:bg-cyan-500/10 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Lock className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>🔒 Lock Workstation</span>
          </button>

          {/* Restart Button */}
          <button
            onClick={() => setModalType('RESTART')}
            disabled={loading}
            className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 hover:bg-amber-500/10 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4 text-amber-400 group-hover:rotate-180 transition-transform duration-500" />
            <span>🔄 Restart Computer</span>
          </button>

          {/* Shutdown Button */}
          <button
            onClick={() => setModalType('SHUTDOWN')}
            disabled={loading}
            className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-red-500/40 hover:bg-red-500/10 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Power className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
            <span>⏻ Shut Down</span>
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center gap-2 animate-pulse font-medium">
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing remote power request...
        </div>
      )}

      {/* Feedback Toast Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl border text-xs space-y-1 ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
              <strong className="text-sm font-extrabold">{feedback.message}</strong>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-200 text-xs ml-2">✕</button>
          </div>
          {feedback.statusText && (
            <p className="text-xs text-slate-300 font-medium pl-6">
              {feedback.statusText}
            </p>
          )}
          {feedback.latency && (
            <p className="text-[10px] text-emerald-400/80 font-mono pl-6 pt-0.5">
              ⚡ Delivered in {feedback.latency}ms
            </p>
          )}
        </div>
      )}

      {/* Last Command Status Display */}
      {lastCommandStatus && (
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Last Action: <strong className="text-slate-200">{lastCommandStatus.type}</strong></span>
          <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            {lastCommandStatus.status}
          </span>
        </div>
      )}

      {/* Recent Audit Log */}
      {audits.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800/60">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> Recent Power Action Audit Log
          </h4>
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {audits.slice(0, 5).map((audit) => (
              <div key={audit.id} className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/80 flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-200">{audit.userName || 'Admin'}</span>
                  <span className="text-slate-500">•</span>
                  <span className={`font-mono font-bold ${
                    audit.action === 'SHUTDOWN' ? 'text-red-400' : audit.action === 'RESTART' ? 'text-amber-400' : 'text-cyan-400'
                  }`}>{audit.action}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-slate-400 font-mono text-[10px]">
                    {new Date(audit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    audit.status === 'SUCCESS' || audit.status === 'ACKNOWLEDGED' || audit.status === 'SENT' || audit.status === 'QUEUED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {audit.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONFIRMATION MODALS */}

      {/* 🔒 Lock Confirmation Modal */}
      {modalType === 'LOCK' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-cyan-400">
              <Lock className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-100">Lock Computer?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to lock <strong className="text-slate-100">{computer?.hostname}</strong>. The active Windows user session will be locked instantly.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/20 transition-all"
              >
                Lock Computer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔄 Restart Confirmation Modal */}
      {modalType === 'RESTART' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-amber-400">
              <RotateCcw className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-100">Restart Computer?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-amber-400">{computer?.hostname}</strong> will be restarted. Any unsaved work on the target computer will be closed.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 transition-all"
              >
                Restart Computer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⏻ Shutdown Confirmation Modal */}
      {modalType === 'SHUTDOWN' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-red-400">
              <Power className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-100">Shut Down Computer?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-red-400">{computer?.hostname}</strong> will be powered off remotely. The machine will become OFFLINE.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/20 transition-all"
              >
                Shut Down Computer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemotePowerManagement;
