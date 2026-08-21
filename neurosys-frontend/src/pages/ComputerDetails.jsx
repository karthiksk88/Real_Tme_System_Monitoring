import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import HealthGauge from '../components/HealthGauge';
import ProcessTable from '../components/ProcessTable';
import FileAnalyzerCard from '../components/FileAnalyzerCard';
import LogAnalyzer from '../components/LogAnalyzer';
import RemotePowerManagement from '../components/RemotePowerManagement';
import AIDiagnosisCard from '../components/AIDiagnosisCard';
import { metricsService } from '../services/metricsService';
import { Monitor, Cpu, HardDrive, Wifi, Sparkles, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

const ComputerDetails = () => {
  const { id } = useParams();
  const [computer, setComputer] = useState(null);
  const [metricHistory, setMetricHistory] = useState([]);
  const [health, setHealth] = useState(null);
  const [crashRisk, setCrashRisk] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [fileReport, setFileReport] = useState(null);
  const [logs, setLogs] = useState([]);
  
  const [activeTab, setActiveTab] = useState('cpu');
  const [timeRange, setTimeRange] = useState('1h');

  useEffect(() => {
    fetchComputerData();
    const interval = setInterval(fetchComputerData, 2000); // Live 2s Telemetry Refresh
    return () => clearInterval(interval);
  }, [id, timeRange]);

  const getLimitForTimeRange = (range) => {
    switch (range) {
      case '1h': return 60;   // 60 samples
      case '6h': return 120;  // 120 samples
      case '24h': return 240; // 240 samples
      case '7d': return 360;  // 360 samples
      case '30d': return 500; // 500 samples
      default: return 60;
    }
  };

  const fetchComputerData = async () => {
    try {
      const compRes = await metricsService.getComputerById(id);
      if (compRes.success) setComputer(compRes.data);

      const limit = getLimitForTimeRange(timeRange);
      const histRes = await metricsService.getMetricHistory(id, limit);
      const rawList = histRes?.data || (Array.isArray(histRes) ? histRes : []);
      
      if (Array.isArray(rawList)) {
        const formatted = rawList.map((m) => {
          const dateObj = new Date(m.recordedAt);
          const rx = m.networkRxBytesSec || 0;
          const tx = m.networkTxBytesSec || 0;
          const rxMbps = Math.round((rx * 8.0 / 1_000_000.0) * 100) / 100;
          const txMbps = Math.round((tx * 8.0 / 1_000_000.0) * 100) / 100;
          const totalMbps = Math.round(((rx + tx) * 8.0 / 1_000_000.0) * 100) / 100;

          return {
            time: timeRange === '7d' || timeRange === '30d' 
              ? dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })
              : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            cpu: Math.round(m.cpuUsagePercent || 0),
            ram: Math.round(m.memoryUsagePercent || 0),
            memoryUsedMb: Math.round(m.memoryUsedMb || 0),
            memoryFreeMb: Math.round(m.memoryFreeMb || 0),
            disk: Math.round(m.diskUsagePercent || 0),
            diskUsedGb: Math.round(m.diskUsedGb || 0),
            diskFreeGb: Math.round(m.diskFreeGb || 0),
            rxMbps: rxMbps,
            txMbps: txMbps,
            totalMbps: totalMbps
          };
        }).reverse();
        setMetricHistory(formatted);
      }

      const healthRes = await metricsService.getHealthScore(id);
      if (healthRes.success) setHealth(healthRes.data);

      const crashRes = await metricsService.getCrashPrediction(id);
      if (crashRes.success) setCrashRisk(crashRes.data);

      const procRes = await metricsService.getProcesses(id);
      if (procRes.success) setProcesses(procRes.data.processes);

      try {
        const fileRes = await metricsService.getFileAnalysis(id);
        const fReport = fileRes?.data || fileRes;
        if (fReport) setFileReport(fReport.data || fReport);
      } catch (fErr) {
        console.error('Failed to fetch file analysis', fErr);
      }

      try {
        const logsRes = await metricsService.getLogs(id);
        const lData = logsRes?.data || logsRes;
        const logArr = lData?.content || (Array.isArray(lData) ? lData : []);
        setLogs(logArr);
      } catch (lErr) {
        console.error('Failed to fetch logs', lErr);
      }
    } catch (e) {
      console.error('Failed to load computer details', e);
    }
  };

  if (!computer) {
    return <div className="p-8 text-center text-slate-400 text-sm">Loading computer telemetry profile...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 text-white">
            <Monitor className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-extrabold text-slate-100">{computer.hostname}</h2>
              <StatusBadge status={computer.status} />
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                LIVE 2s Stream
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              IP: {computer.ipAddress} • MAC: {computer.macAddress} • Lab: {computer.labName} • {computer.osName}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <HealthGauge score={health?.overallScore || computer.currentHealthScore || 95} />
        </div>
      </div>

      {/* REMOTE POWER MANAGEMENT CARD SECTION */}
      <RemotePowerManagement computer={computer} onStatusUpdate={fetchComputerData} />

      {/* AI SYSTEM DIAGNOSIS & FAILURE PREDICTION SECTION */}
      <AIDiagnosisCard computerId={id} />

      {/* Navigation Tabs & Time Range Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'cpu', label: 'CPU Usage', icon: Cpu },
            { id: 'ram', label: 'Memory (RAM)', icon: HardDrive },
            { id: 'disk', label: 'Disk Capacity', icon: HardDrive },
            { id: 'network', label: 'Network Throughput', icon: Wifi },
            { id: 'processes', label: 'Processes' },
            { id: 'storage', label: 'Storage Analyzer' },
            { id: 'logs', label: 'System Logs' },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === tab.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Time Range Selector for Historical Graphs */}
        {(activeTab === 'cpu' || activeTab === 'ram' || activeTab === 'disk' || activeTab === 'network') && (
          <div className="flex items-center space-x-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            {['1h', '6h', '24h', '7d', '30d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  timeRange === range
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab Contents: Telemetry Historical Charts */}
      {activeTab === 'cpu' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              CPU Utilization Trend ({timeRange.toUpperCase()})
            </h3>
            <span className="text-xs font-mono text-cyan-400 font-bold">
              Current: {computer.currentCpuUsage != null ? Math.round(computer.currentCpuUsage) : '—'}%
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Critical (85%)', fill: '#ef4444', fontSize: 10 }} />
                <Line type="monotone" dataKey="cpu" name="CPU Usage %" stroke="#06b6d4" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'ram' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-purple-400" />
              Memory Allocation & Availability ({timeRange.toUpperCase()})
            </h3>
            <span className="text-xs font-mono text-purple-400 font-bold">
              Current RAM: {computer.currentRamUsage != null ? Math.round(computer.currentRamUsage) : '—'}%
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Critical (90%)', fill: '#ef4444', fontSize: 10 }} />
                <Line type="monotone" dataKey="ram" name="RAM Usage %" stroke="#a855f7" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'disk' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-amber-400" />
              Disk Capacity & Consumption Trend ({timeRange.toUpperCase()})
            </h3>
            <span className="text-xs font-mono text-amber-400 font-bold">
              Disk Used: {computer.currentDiskUsage != null ? Math.round(computer.currentDiskUsage) : '—'}%
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <ReferenceLine y={90} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Warning (90%)', fill: '#f59e0b', fontSize: 10 }} />
                <Line type="monotone" dataKey="disk" name="Disk Capacity %" stroke="#f59e0b" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'network' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Wifi className="w-5 h-5 text-emerald-400" />
              Network Speed & Throughput Mbps ({timeRange.toUpperCase()})
            </h3>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              Speed: {computer.currentNetworkSpeedMbps != null ? `${computer.currentNetworkSpeedMbps} Mbps` : '—'}
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit=" Mbps" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="rxMbps" name="Download (Rx Mbps)" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="txMbps" name="Upload (Tx Mbps)" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'processes' && <ProcessTable processes={processes} />}
      {activeTab === 'storage' && <FileAnalyzerCard fileReport={fileReport} />}
      {activeTab === 'logs' && <LogAnalyzer logs={logs} />}
    </div>
  );
};

export default ComputerDetails;
