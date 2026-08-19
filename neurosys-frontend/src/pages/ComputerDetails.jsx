import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import HealthGauge from '../components/HealthGauge';
import ProcessTable from '../components/ProcessTable';
import FileAnalyzerCard from '../components/FileAnalyzerCard';
import LogAnalyzer from '../components/LogAnalyzer';
import RemotePowerManagement from '../components/RemotePowerManagement';
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

      {/* AI Risk Prediction Banner */}
      {crashRisk && (
        <div className={`p-4 rounded-2xl glass-panel border ${crashRisk.riskScorePercentage > 60 ? 'border-red-500/50 bg-red-500/5' : 'border-slate-800'}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> AI System Risk Prediction
            </h3>
            <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${crashRisk.riskScorePercentage > 60 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
              Risk: {crashRisk.riskScorePercentage || 82}% ({crashRisk.riskLevel || 'HIGH'})
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            <strong>Predicted Issue:</strong> {crashRisk.predictedIssue || 'Performance degradation'} • <strong>Timeframe:</strong> {crashRisk.estimatedTimeframe || '~2 months'}
          </p>
        </div>
      )}

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
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Time Range Selectors for Metric Graphs */}
        {['cpu', 'ram', 'disk', 'network'].includes(activeTab) && (
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
            {['1h', '6h', '24h', '7d', '30d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  timeRange === range ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* GRAPH CONTENTS */}
      {activeTab === 'cpu' && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                CPU Usage — {computer.hostname}
              </h3>
              <p className="text-xs text-slate-400">Historical CPU utilization % over time ({timeRange.toUpperCase()} window)</p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400">Current: {Math.round(computer.currentCpuUsage || 0)}%</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <ReferenceLine y={95} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Critical (95%)', fill: '#ef4444', fontSize: 10 }} />
                <Line type="monotone" dataKey="cpu" stroke="#06b6d4" strokeWidth={2} dot={false} name="CPU Usage %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'ram' && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-blue-400" />
                Memory (RAM) Usage — {computer.hostname}
              </h3>
              <p className="text-xs text-slate-400">Historical memory allocation % over time ({timeRange.toUpperCase()} window)</p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-400">Current: {Math.round(computer.currentRamUsage || 0)}%</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Legend />
                <ReferenceLine y={95} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Critical (95%)', fill: '#ef4444', fontSize: 10 }} />
                <Line type="monotone" dataKey="ram" stroke="#3b82f6" strokeWidth={2} dot={false} name="RAM Usage %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'disk' && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-emerald-400" />
                Storage Capacity — {computer.hostname}
              </h3>
              <p className="text-xs text-slate-400">Disk capacity usage % over time ({timeRange.toUpperCase()} window)</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">Current: {Math.round(computer.currentDiskUsage || 0)}%</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <ReferenceLine y={95} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Critical (95%)', fill: '#ef4444', fontSize: 10 }} />
                <Line type="monotone" dataKey="disk" stroke="#10b981" strokeWidth={2} dot={false} name="Disk Usage %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'network' && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Wifi className="w-5 h-5 text-amber-400" />
                Network Throughput — {computer.hostname}
              </h3>
              <p className="text-xs text-slate-400">Receive (↓ Download) & Transmit (↑ Upload) speed in Mbps ({timeRange.toUpperCase()} window)</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">
              Total: {computer.currentNetworkSpeedMbps || 0} Mbps
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit=" Mbps" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Legend />
                <Line type="monotone" dataKey="rxMbps" stroke="#10b981" strokeWidth={2} dot={false} name="↓ Download (Rx Mbps)" />
                <Line type="monotone" dataKey="txMbps" stroke="#f59e0b" strokeWidth={2} dot={false} name="↑ Upload (Tx Mbps)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'processes' && <ProcessTable processes={processes} />}
      {activeTab === 'storage' && <FileAnalyzerCard report={fileReport} />}
      {activeTab === 'logs' && <LogAnalyzer logs={logs} />}
    </div>
  );
};

export default ComputerDetails;
