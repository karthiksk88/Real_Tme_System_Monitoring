import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import { metricsService } from '../services/metricsService';
import { Monitor, Activity, ShieldAlert, Bell, CheckCircle2 } from 'lucide-react';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [computers, setComputers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 2000); // 2-Second Live Stream
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Analytics Summary
      const summaryRes = await metricsService.getAnalyticsSummary();
      const sumData = summaryRes?.data || summaryRes;
      if (sumData) setSummary(sumData);

      // 2. Fetch Monitored Computers
      const computersRes = await metricsService.getAllComputers();
      const compList = computersRes?.data || (Array.isArray(computersRes) ? computersRes : []);
      if (Array.isArray(compList)) setComputers(compList);

      // 3. Fetch Active Alerts
      const alertsRes = await metricsService.getAllAlerts();
      const alertList = alertsRes?.data || (Array.isArray(alertsRes) ? alertsRes : []);
      if (Array.isArray(alertList)) {
        setAlerts(alertList.filter(a => a.status === 'OPEN' || a.status === 'ACKNOWLEDGED'));
      }
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  // Identify Systems Needing Attention (Offline, High CPU/RAM/Disk >= 90%, No Internet)
  const computersNeedingAttention = computers.filter((c) => {
    const isOffline = c.status === 'OFFLINE';
    const isHighCpu = (c.currentCpuUsage || 0) >= 90;
    const isHighRam = (c.currentRamUsage || 0) >= 90;
    const isHighDisk = (c.currentDiskUsage || 0) >= 90;
    const isNoInternet = !c.internetConnected && c.status !== 'OFFLINE';
    return isOffline || isHighCpu || isHighRam || isHighDisk || isNoInternet;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Good morning, Admin 👋
          </h2>
          <p className="text-xs text-slate-400 mt-1">Here's the current status of your computer labs.</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
            🟢 Live Telemetry Stream
          </span>
          <button
            onClick={fetchDashboardData}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* 2. Four Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Computers"
          value={summary ? summary.totalComputers : computers.length}
          subtitle="Monitored lab endpoints"
          icon={Monitor}
          color="cyan"
        />
        <StatCard
          title="Online"
          value={summary ? summary.onlineComputers : computers.filter((c) => c.status === 'ONLINE').length}
          subtitle="Active heartbeats"
          icon={Activity}
          color="emerald"
        />
        <StatCard
          title="Offline"
          value={summary ? summary.offlineComputers : computers.filter((c) => c.status === 'OFFLINE').length}
          subtitle="Requires physical check"
          icon={ShieldAlert}
          color="red"
        />
        <StatCard
          title="Critical Alerts"
          value={alerts.length}
          subtitle="Active open alerts"
          icon={Bell}
          color="red"
        />
      </div>

      {/* 3. Systems Needing Attention */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            Systems Needing Attention
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            {computersNeedingAttention.length} system{computersNeedingAttention.length !== 1 ? 's' : ''} require action
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs italic">
            Scanning monitored lab endpoints...
          </div>
        ) : computersNeedingAttention.length === 0 ? (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>✓ All monitored computers are operating normally.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {computersNeedingAttention.map((c) => {
              let issueBadge = "🔴 Needs Inspection";
              let issueDesc = "Hardware or connectivity requires attention";

              if (c.status === 'OFFLINE') {
                issueBadge = "⚫ Offline";
                issueDesc = "Missed heartbeat (>60s)";
              } else if (!c.internetConnected) {
                issueBadge = "🔴 No Internet";
                issueDesc = "Computer is online but internet is unavailable";
              } else if ((c.currentCpuUsage || 0) >= 90) {
                issueBadge = `🔴 CPU ${Math.round(c.currentCpuUsage)}%`;
                issueDesc = "CPU utilization critically high";
              } else if ((c.currentRamUsage || 0) >= 90) {
                issueBadge = `🔴 RAM ${Math.round(c.currentRamUsage)}%`;
                issueDesc = "Memory critically low";
              } else if ((c.currentDiskUsage || 0) >= 90) {
                issueBadge = `🔴 Disk ${Math.round(c.currentDiskUsage)}%`;
                issueDesc = "Disk space critically low";
              }

              return (
                <a
                  key={c.id}
                  href={`/computers/${c.id}`}
                  className="p-5 rounded-2xl glass-card border border-red-500/30 hover:border-red-500/50 transition-all space-y-3 block group shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-extrabold text-slate-100 group-hover:text-cyan-400 transition-colors">
                      {c.hostname}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                      {issueBadge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">{issueDesc}</p>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span>{c.labName}</span>
                    <span>CPU: {Math.round(c.currentCpuUsage || 0)}% | RAM: {Math.round(c.currentRamUsage || 0)}%</span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
