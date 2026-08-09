import React, { useState, useEffect } from 'react';
import StatusBadge from '../components/StatusBadge';
import HealthGauge from '../components/HealthGauge';
import ProcessTable from '../components/ProcessTable';
import FileAnalyzerCard from '../components/FileAnalyzerCard';
import StatCard from '../components/StatCard';
import { metricsService } from '../services/metricsService';
import { Laptop, Cpu, HardDrive, Wifi, ShieldAlert, Sparkles, Activity, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const AdminLaptopPerformance = () => {
  const [laptop, setLaptop] = useState(null);
  const [history, setHistory] = useState([]);
  const [health, setHealth] = useState(null);
  const [crashRisk, setCrashRisk] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [fileReport, setFileReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLaptopData();
    const interval = setInterval(() => {
      fetchLaptopData();
    }, 2000); // 2-Second Live Auto-Refresh
    return () => clearInterval(interval);
  }, []);

  const fetchLaptopData = async () => {
    try {
      let targetComp = null;

      // First check approved computers
      const compRes = await metricsService.getAllComputers();
      if (compRes.success && compRes.data.length > 0) {
        targetComp = compRes.data[0];
      } else {
        // If not yet approved, check pending queue and auto-fetch
        const pendingRes = await api.get('/computers/pending');
        if (pendingRes.data && pendingRes.data.success && pendingRes.data.data.length > 0) {
          const pendingComp = pendingRes.data.data[0];
          // Auto approve local admin laptop for convenience
          await api.put(`/computers/${pendingComp.id}/approve`);
          targetComp = pendingComp;
        }
      }

      if (targetComp) {
        const fullCompRes = await metricsService.getComputerById(targetComp.id);
        if (fullCompRes.success) setLaptop(fullCompRes.data);

        const histRes = await metricsService.getMetricHistory(targetComp.id, 20);
        if (histRes.success) {
          const formatted = histRes.data.map((m) => ({
            time: new Date(m.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            cpu: m.cpuUsagePercent,
            ram: m.memoryUsagePercent,
            disk: m.diskUsagePercent,
          })).reverse();
          setHistory(formatted);
        }

        const healthRes = await metricsService.getHealthScore(targetComp.id);
        if (healthRes.success) setHealth(healthRes.data);

        const crashRes = await metricsService.getCrashPrediction(targetComp.id);
        if (crashRes.success) setCrashRisk(crashRes.data);

        const procRes = await metricsService.getProcesses(targetComp.id);
        if (procRes.success) setProcesses(procRes.data.processes);

        const fileRes = await metricsService.getFileAnalysis(targetComp.id);
        if (fileRes.success) setFileReport(fileRes.data);
      }
    } catch (e) {
      console.error('Failed to load admin laptop performance', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !laptop) {
    return (
      <div className="p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-300">Scanning & Connecting Admin Laptop Telemetry...</p>
      </div>
    );
  }

  if (!laptop) {
    return (
      <div className="p-12 glass-panel rounded-2xl border border-slate-800 text-center space-y-4">
        <Laptop className="w-12 h-12 text-cyan-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">No Admin Laptop Endpoint Connected</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Run the Monitoring Agent (<code className="text-cyan-300">java -jar NeuroSys-Agent.jar</code>) on your laptop to stream real-time hardware performance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 text-white">
            <Laptop className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-extrabold text-slate-100">{laptop.hostname}</h2>
              <StatusBadge status={laptop.status} />
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                LIVE 2s Stream
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              IP: {laptop.ipAddress} • MAC: {laptop.macAddress} • OS: {laptop.osName} ({laptop.osVersion})
            </p>
            <p className="text-[11px] text-cyan-400 font-medium mt-0.5">
              Processor: {laptop.cpuModel} • RAM: {(laptop.totalRamMb / 1024).toFixed(1)} GB Total
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <HealthGauge score={health?.overallScore || laptop.currentHealthScore || 95} />
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="CPU Utilization" value={`${laptop.currentCpuUsage}%`} subtitle="Live load" icon={Cpu} color="purple" />
        <StatCard title="RAM Allocation" value={`${laptop.currentRamUsage}%`} subtitle="Active memory" icon={HardDrive} color="cyan" />
        <StatCard title="Disk Usage" value={`${laptop.currentDiskUsage}%`} subtitle="Storage capacity" icon={HardDrive} color="emerald" />
        <StatCard title="Laptop Health" value={`${laptop.currentHealthScore || 95}/100`} subtitle="Overall score" icon={Activity} color="emerald" />
      </div>

      {/* Live Recharts Metric Stream Chart */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Admin Laptop Real-Time Performance Stream</h3>
            <p className="text-xs text-slate-400">Live CPU % and RAM % telemetry graph updating every 2 seconds</p>
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="laptopCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="laptopRam" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
              <Area type="monotone" dataKey="cpu" stroke="#06b6d4" fillOpacity={1} fill="url(#laptopCpu)" name="CPU %" />
              <Area type="monotone" dataKey="ram" stroke="#3b82f6" fillOpacity={1} fill="url(#laptopRam)" name="RAM %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Risk Prediction Card */}
      {crashRisk && (
        <div className={`p-5 rounded-2xl glass-panel border ${crashRisk.crashProbability > 0.5 ? 'border-red-500/50 bg-red-500/5' : 'border-slate-800'}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> AI Laptop Crash Risk Engine
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${crashRisk.crashProbability > 0.5 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              Crash Risk: {(crashRisk.crashProbability * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-2">
            <strong>Optimization Recommendation:</strong> {crashRisk.recommendedAction}
          </p>
        </div>
      )}

      {/* Top Running Processes Table & File Analyzer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-100">Top Laptop Active Processes</h3>
          <ProcessTable processes={processes} />
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-100">Disk Storage Breakdown</h3>
          <FileAnalyzerCard report={fileReport} />
        </div>
      </div>
    </div>
  );
};

export default AdminLaptopPerformance;
