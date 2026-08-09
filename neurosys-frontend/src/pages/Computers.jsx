import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { metricsService } from '../services/metricsService';
import { Monitor, Search, Filter, Cpu, HardDrive } from 'lucide-react';

const Computers = () => {
  const [computers, setComputers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterLab, setFilterLab] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterInternet, setFilterInternet] = useState('ALL');
  const [sortBy, setSortBy] = useState('health');
  const navigate = useNavigate();

  useEffect(() => {
    fetchComputers();
    const interval = setInterval(() => {
      fetchComputers();
    }, 2000); // 2-Second Live Auto-Refresh
    return () => clearInterval(interval);
  }, []);

  const fetchComputers = async () => {
    try {
      const res = await metricsService.getAllComputers();
      const dataList = res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(dataList)) setComputers(dataList);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredComputers = computers
    .filter((c) => {
      const matchesSearch = c.hostname.toLowerCase().includes(search.toLowerCase()) || c.ipAddress.includes(search);
      const matchesLab = filterLab === 'ALL' || c.labName === filterLab;
      const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
      const matchesInternet = filterInternet === 'ALL' ||
        (filterInternet === 'CONNECTED' && c.internetConnected) ||
        (filterInternet === 'DISCONNECTED' && !c.internetConnected);
      return matchesSearch && matchesLab && matchesStatus && matchesInternet;
    })
    .sort((a, b) => {
      if (sortBy === 'health') return (b.currentHealthScore || 0) - (a.currentHealthScore || 0);
      if (sortBy === 'cpu') return (b.currentCpuUsage || 0) - (a.currentCpuUsage || 0);
      if (sortBy === 'ram') return (b.currentRamUsage || 0) - (a.currentRamUsage || 0);
      return 0;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            Monitored Computers Catalog
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
              LIVE 2s Stream
            </span>
          </h2>
          <p className="text-xs text-slate-400">Searchable catalog of registered computer endpoints with real-time status and telemetry</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-48 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search hostname or IP..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Status</option>
            <option value="ONLINE">Online 🟢</option>
            <option value="WARNING">Warning 🟡</option>
            <option value="CRITICAL">Critical 🔴</option>
            <option value="OFFLINE">Offline ⚫</option>
          </select>
          <select
            value={filterInternet}
            onChange={(e) => setFilterInternet(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Internet</option>
            <option value="CONNECTED">Internet Connected 🌐</option>
            <option value="DISCONNECTED">No Internet 🔴</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="health">Sort: Health ↓</option>
            <option value="cpu">Sort: CPU ↓</option>
            <option value="ram">Sort: RAM ↓</option>
          </select>
        </div>
      </div>

      {/* Grid of Computer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredComputers.map((c) => (
          <div
            key={c.id}
            onClick={() => navigate(`/computers/${c.id}`)}
            className="p-5 rounded-2xl glass-card border border-slate-800 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10 cursor-pointer transition-all duration-300 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{c.hostname}</h4>
                  <p className="text-[11px] font-mono text-slate-400">{c.ipAddress} • {c.labName}</p>
                </div>
              </div>
              <StatusBadge status={c.status} />
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800/60 text-center">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">CPU</p>
                <p className="text-xs font-bold text-slate-200 mt-0.5">{Math.round(c.currentCpuUsage || 0)}%</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">RAM</p>
                <p className="text-xs font-bold text-slate-200 mt-0.5">{Math.round(c.currentRamUsage || 0)}%</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Health</p>
                <p className="text-xs font-bold text-emerald-400 mt-0.5">{Math.round(c.currentHealthScore || 100)}/100</p>
              </div>
            </div>

            {/* Compact Real-Time Internet / Network Speed Indicator */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 truncate max-w-[110px]">{c.osName}</span>

              {c.status === 'OFFLINE' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                  ⚫ Offline
                </span>
              ) : !c.internetConnected ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                  🔴 No Internet
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  🌐 {c.currentNetworkSpeedMbps !== undefined && c.currentNetworkSpeedMbps !== null
                        ? (c.currentNetworkSpeedMbps > 0 ? `${c.currentNetworkSpeedMbps} Mbps` : '< 0.1 Mbps')
                        : 'Connected'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Computers;
