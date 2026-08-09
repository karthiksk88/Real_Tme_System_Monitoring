import React, { useState, useEffect } from 'react';
import { metricsService } from '../services/metricsService';
import { Monitor, CheckCircle, XCircle, Clock, ShieldAlert, Cpu, HardDrive, Wifi } from 'lucide-react';
import api from '../services/api';

const PendingComputers = () => {
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingComputers();
    const interval = setInterval(() => {
      fetchPendingComputers();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingComputers = async () => {
    try {
      const res = await api.get('/computers/pending');
      const dataList = res?.data || (Array.isArray(res) ? res : []);
      setPendingList(Array.isArray(dataList) ? dataList : []);
    } catch (e) {
      console.error('Failed to load pending computers', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (computerId) => {
    try {
      const res = await api.put(`/computers/${computerId}/approve`);
      if (res?.success || res?.data) {
        fetchPendingComputers();
      }
    } catch (e) {
      console.error('Failed to approve computer', e);
    }
  };

  const handleReject = async (computerId) => {
    try {
      const res = await api.put(`/computers/${computerId}/reject`);
      if (res?.success || res?.data) {
        fetchPendingComputers();
      }
    } catch (e) {
      console.error('Failed to reject computer', e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
            Pending Computer Approvals
            {pendingList.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {pendingList.length} Pending
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400">Review and authorize new agent onboarding discovery requests before monitoring begins</p>
        </div>

        <button onClick={fetchPendingComputers} className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white">
          Refresh Queue
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">Scanning onboarding queue...</div>
      ) : pendingList.length === 0 ? (
        <div className="p-12 glass-panel rounded-2xl border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-200">No Pending Approvals</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            All registered computer endpoints have been authorized. New devices running the Monitoring Agent setup will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingList.map((c) => (
            <div key={c.id} className="p-6 rounded-2xl glass-card border border-amber-500/30 bg-amber-500/5 space-y-4 relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-100">{c.hostname}</h4>
                    <p className="text-xs text-slate-400">{c.labName || 'General Lab'} • IP: {c.ipAddress}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" /> PENDING
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">OS System</span>
                  <span className="font-semibold text-slate-200">{c.osName || 'Windows'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">MAC Address</span>
                  <span className="font-mono text-slate-300">{c.macAddress}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">CPU Hardware</span>
                  <span className="truncate block text-slate-300" title={c.cpuModel}>{c.cpuModel || 'Detected Processor'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total RAM</span>
                  <span className="font-semibold text-slate-200">{(c.totalRamMb / 1024).toFixed(1)} GB</span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => handleReject(c.id)}
                  className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" /> Reject Device
                </button>
                <button
                  onClick={() => handleApprove(c.id)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" /> Approve Endpoint
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingComputers;
