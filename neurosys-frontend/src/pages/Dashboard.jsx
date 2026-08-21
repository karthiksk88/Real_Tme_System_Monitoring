import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import { metricsService } from '../services/metricsService';
import { useWebSocket } from '../contexts/WebSocketContext';
import { Monitor, Activity, ShieldAlert, Bell, CheckCircle2, RefreshCw, HelpCircle, Sparkles, Clock, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [computers, setComputers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [aiSummary, setAiSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');
  const { updateLastSeen } = useWebSocket();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Monitored Computers
      const computersRes = await metricsService.getAllComputers();
      const compList = computersRes?.data || (Array.isArray(computersRes) ? computersRes : []);
      if (Array.isArray(compList)) {
        setComputers(compList);
      }

      // 2. Fetch Active Alerts
      const alertsRes = await metricsService.getAllAlerts();
      const alertList = alertsRes?.data || (Array.isArray(alertsRes) ? alertsRes : []);
      if (Array.isArray(alertList)) {
        setAlerts(alertList.filter((a) => a.status === 'OPEN' || a.status === 'ACKNOWLEDGED'));
      }

      // 3. Fetch AI Health Summary
      try {
        const summaryRes = await metricsService.getAISummary();
        if (summaryRes?.success) setAiSummary(summaryRes.data);
      } catch (sumErr) {
        console.error('Failed to load AI Summary', sumErr);
      }

      if (updateLastSeen) updateLastSeen();
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    setRefreshMessage('Refreshing...');
    await fetchDashboardData();
    setRefreshing(false);
    setRefreshMessage('Updated just now');
    setTimeout(() => setRefreshMessage(''), 3000);
  };

  // Compute strict logical status counts: Total = Online + Offline + Unknown
  const totalComputers = computers.length;
  const onlineCount = computers.filter(
    (c) => c.status === 'ONLINE' || c.status === 'WARNING' || c.status === 'CRITICAL'
  ).length;
  const offlineCount = computers.filter((c) => c.status === 'OFFLINE').length;
  const unknownCount = computers.filter((c) => c.status === 'UNKNOWN').length;

  // Identify Systems Needing Attention
  const computersNeedingAttention = computers.filter((c) => {
    const isOffline = c.status === 'OFFLINE';
    const isHighCpu = c.currentCpuUsage != null && c.currentCpuUsage >= 90;
    const isHighRam = c.currentRamUsage != null && c.currentRamUsage >= 90;
    const isHighDisk = c.currentDiskUsage != null && c.currentDiskUsage >= 90;
    const isNoInternet = !c.internetConnected && c.status !== 'OFFLINE';
    return isOffline || isHighCpu || isHighRam || isHighDisk || isNoInternet;
  });

  const formatLastSeen = (timestampStr) => {
    if (!timestampStr) return 'Never';
    try {
      const date = new Date(timestampStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return timestampStr;
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Predictive Command Dashboard 👋
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry, AI evidence diagnosis, and failure predictions across endpoints.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {refreshMessage && (
            <span className="text-xs font-semibold text-cyan-400 transition-all">
              {refreshMessage}
            </span>
          )}
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-cyan-500/40 transition-all flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* 2. Four Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Computers"
          value={totalComputers}
          subtitle={`Online (${onlineCount}) + Offline (${offlineCount}) + Unknown (${unknownCount})`}
          icon={Monitor}
          color="cyan"
        />
        <StatCard
          title="Online"
          value={onlineCount}
          subtitle="Active telemetry heartbeats"
          icon={Activity}
          color="emerald"
        />
        <StatCard
          title="Offline"
          value={offlineCount}
          subtitle="Missed heartbeat timeout"
          icon={ShieldAlert}
          color="red"
        />
        <StatCard
          title="Unknown / Alerts"
          value={unknownCount > 0 ? `${unknownCount} Unreported` : `${alerts.length} Active`}
          subtitle={unknownCount > 0 ? "Awaiting first telemetry payload" : "Open critical alerts"}
          icon={unknownCount > 0 ? HelpCircle : Bell}
          color={unknownCount > 0 ? "amber" : "red"}
        />
      </div>

      {/* 3. AI SYSTEM HEALTH SUMMARY CARD */}
      <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 bg-cyan-500/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-100">AI SYSTEM HEALTH SUMMARY</h3>
              <p className="text-xs text-slate-400">Overview of endpoint health, risk predictions, and active problems</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {totalComputers} Computers Monitored
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Healthy</span>
            <span className="text-lg font-extrabold text-emerald-400 mt-1 block">
              🟢 {aiSummary ? aiSummary.healthyCount : onlineCount}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Needs Attention</span>
            <span className="text-lg font-extrabold text-amber-400 mt-1 block">
              🟠 {aiSummary ? aiSummary.needsAttentionCount : computersNeedingAttention.length}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Critical</span>
            <span className="text-lg font-extrabold text-red-400 mt-1 block">
              🔴 {aiSummary ? aiSummary.criticalCount : 0}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Predicted Risks</span>
            <span className="text-lg font-extrabold text-blue-400 mt-1 block flex items-center justify-center gap-1">
              <Clock className="w-4 h-4 text-blue-400" />
              {aiSummary ? aiSummary.predictedRisksCount : 0}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Critical Problems</span>
            <span className="text-lg font-extrabold text-red-400 mt-1 block flex items-center justify-center gap-1">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              {aiSummary ? aiSummary.criticalProblemsCount : 0}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Systems Needing Attention */}
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
              const isOffline = c.status === 'OFFLINE';
              const isUnknown = c.status === 'UNKNOWN';

              let issueBadge = "🔴 Needs Inspection";
              let issueDesc = "Hardware or connectivity requires attention";

              if (isOffline) {
                issueBadge = "⚪ Offline";
                issueDesc = `Missed heartbeat (Last seen: ${formatLastSeen(c.lastSeenAt)})`;
              } else if (isUnknown) {
                issueBadge = "⚫ Unknown";
                issueDesc = "Awaiting initial telemetry report";
              } else if (!c.internetConnected) {
                issueBadge = "🔴 No Internet";
                issueDesc = "Computer is online but internet is unavailable";
              } else if (c.currentCpuUsage != null && c.currentCpuUsage >= 90) {
                issueBadge = `🔴 CPU ${Math.round(c.currentCpuUsage)}%`;
                issueDesc = "CPU utilization critically high";
              } else if (c.currentRamUsage != null && c.currentRamUsage >= 90) {
                issueBadge = `🔴 RAM ${Math.round(c.currentRamUsage)}%`;
                issueDesc = "Memory utilization critically high";
              } else if (c.currentDiskUsage != null && c.currentDiskUsage >= 90) {
                issueBadge = `🔴 Disk ${Math.round(c.currentDiskUsage)}%`;
                issueDesc = "Disk space utilization critically high";
              }

              return (
                <div
                  key={c.id}
                  onClick={() => navigate(`/computers/${c.id}`)}
                  className="p-5 rounded-2xl glass-card border border-red-500/30 hover:border-red-500/50 cursor-pointer transition-all space-y-3 block group shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                      {c.hostname}
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 font-mono">
                      {issueBadge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium">
                    {issueDesc}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
                    <span>IP: {c.ipAddress}</span>
                    <span>Lab: {c.labName}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
