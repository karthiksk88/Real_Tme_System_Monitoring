import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { metricsService } from '../services/metricsService';
import api from '../services/api';
import { Monitor, Search, Plus, Download, CheckCircle, XCircle, Terminal, RefreshCw, X, ShieldAlert } from 'lucide-react';

const Computers = () => {
  const [computers, setComputers] = useState([]);
  const [pendingComputers, setPendingComputers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterLab, setFilterLab] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterInternet, setFilterInternet] = useState('ALL');
  const [sortBy, setSortBy] = useState('health');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search');
    if (q) setSearch(q);
  }, [location.search]);

  useEffect(() => {
    fetchComputers();
    fetchPendingComputers();
    const interval = setInterval(() => {
      fetchComputers();
      fetchPendingComputers();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchComputers = async () => {
    try {
      const res = await metricsService.getAllComputers();
      const dataList = res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(dataList)) setComputers(dataList);
    } catch (e) {
      console.error('Failed to load computers', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingComputers = async () => {
    try {
      const res = await api.get('/computers/pending');
      const dataList = res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(dataList)) setPendingComputers(dataList);
    } catch (e) {
      // Ignore background fetch error
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/computers/${id}/approve`);
      fetchComputers();
      fetchPendingComputers();
    } catch (e) {
      console.error('Failed to approve computer', e);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/computers/${id}/reject`);
      fetchComputers();
      fetchPendingComputers();
    } catch (e) {
      console.error('Failed to reject computer', e);
    }
  };

  const formatLastSeen = (timestampStr) => {
    if (!timestampStr) return 'Never';
    try {
      const d = new Date(timestampStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return timestampStr;
    }
  };

  // Comprehensive Search (hostname, computerName, ipAddress, macAddress, labName)
  const filteredComputers = computers
    .filter((c) => {
      const s = search.toLowerCase().trim();
      const matchesSearch =
        !s ||
        (c.hostname && c.hostname.toLowerCase().includes(s)) ||
        (c.computerName && c.computerName.toLowerCase().includes(s)) ||
        (c.ipAddress && c.ipAddress.toLowerCase().includes(s)) ||
        (c.macAddress && c.macAddress.toLowerCase().includes(s)) ||
        (c.labName && c.labName.toLowerCase().includes(s));

      const matchesLab = filterLab === 'ALL' || c.labName === filterLab;
      const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;

      const isOffline = c.status === 'OFFLINE';
      const isUnknown = c.status === 'UNKNOWN';
      const isConnected = c.internetConnected && !isOffline && !isUnknown;

      const matchesInternet =
        filterInternet === 'ALL' ||
        (filterInternet === 'CONNECTED' && isConnected) ||
        (filterInternet === 'DISCONNECTED' && !c.internetConnected && !isOffline && !isUnknown) ||
        (filterInternet === 'UNKNOWN' && (isOffline || isUnknown));

      return matchesSearch && matchesLab && matchesStatus && matchesInternet;
    })
    .sort((a, b) => {
      if (sortBy === 'health') return (b.currentHealthScore || 0) - (a.currentHealthScore || 0);
      if (sortBy === 'cpu') return (b.currentCpuUsage || 0) - (a.currentCpuUsage || 0);
      if (sortBy === 'ram') return (b.currentRamUsage || 0) - (a.currentRamUsage || 0);
      if (sortBy === 'disk') return (b.currentDiskUsage || 0) - (a.currentDiskUsage || 0);
      if (sortBy === 'networkSpeed') return (b.currentNetworkSpeedMbps || 0) - (a.currentNetworkSpeedMbps || 0);
      if (sortBy === 'name') return (a.hostname || '').localeCompare(b.hostname || '');
      if (sortBy === 'lastSeen') return new Date(b.lastSeenAt || 0) - new Date(a.lastSeenAt || 0);
      return 0;
    });

  const labs = Array.from(new Set(computers.map((c) => c.labName).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            Monitored Computers Catalog
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
              LIVE Telemetry
            </span>
          </h2>
          <p className="text-xs text-slate-400">Searchable catalog of registered computer endpoints with real-time status and telemetry</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Computer</span>
        </button>
      </div>

      {/* Pending Computer Approvals Notification Banner */}
      {pendingComputers.length > 0 && (
        <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-amber-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              New Computer Registrations Detected ({pendingComputers.length} Pending Approval)
            </h3>
            <span className="text-[10px] font-mono text-amber-400">Action Required</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {pendingComputers.map((pc) => (
              <div key={pc.id} className="p-3 rounded-xl bg-slate-900 border border-amber-500/20 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-200">{pc.hostname}</p>
                  <p className="text-[10px] font-mono text-slate-400">{pc.ipAddress} • {pc.labName}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleApprove(pc.id)}
                    className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                    title="Approve Endpoint"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleReject(pc.id)}
                    className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                    title="Reject Endpoint"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-2xl glass-panel border border-slate-800">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hostname, computer name, IP, MAC, lab..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={filterLab}
          onChange={(e) => setFilterLab(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">All Labs</option>
          {labs.map((lab) => (
            <option key={lab} value={lab}>{lab}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">All Status</option>
          <option value="ONLINE">Online 🟢</option>
          <option value="WARNING">Warning 🟡</option>
          <option value="CRITICAL">Critical 🔴</option>
          <option value="OFFLINE">Offline ⚪</option>
          <option value="UNKNOWN">Unknown ⚫</option>
        </select>

        <select
          value={filterInternet}
          onChange={(e) => setFilterInternet(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">All Internet</option>
          <option value="CONNECTED">Internet Connected 🌐</option>
          <option value="DISCONNECTED">No Internet 🔴</option>
          <option value="UNKNOWN">Offline / Unknown —</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="health">Sort: Health Score ↓</option>
          <option value="cpu">Sort: CPU Usage ↓</option>
          <option value="ram">Sort: RAM Usage ↓</option>
          <option value="disk">Sort: Disk Usage ↓</option>
          <option value="networkSpeed">Sort: Internet Speed ↓</option>
          <option value="lastSeen">Sort: Last Seen ↓</option>
          <option value="name">Sort: Hostname (A-Z)</option>
        </select>
      </div>

      {/* Grid of Computer Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs italic">Loading computer catalog...</div>
      ) : filteredComputers.length === 0 ? (
        <div className="p-12 glass-panel rounded-2xl border border-slate-800 text-center text-slate-400 text-xs">
          No computers found matching your search and filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredComputers.map((c) => {
            const isOffline = c.status === 'OFFLINE';
            const isUnknown = c.status === 'UNKNOWN';

            return (
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

                {/* Hardware Metrics Table */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800/60 text-center">
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">CPU</p>
                    <p className="text-xs font-bold text-slate-200 mt-0.5">
                      {isOffline || isUnknown || c.currentCpuUsage == null ? '—' : `${Math.round(c.currentCpuUsage)}%`}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">RAM</p>
                    <p className="text-xs font-bold text-slate-200 mt-0.5">
                      {isOffline || isUnknown || c.currentRamUsage == null ? '—' : `${Math.round(c.currentRamUsage)}%`}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Health</p>
                    <p className="text-xs font-bold text-emerald-400 mt-0.5">
                      {isOffline ? '—' : `${Math.round(c.currentHealthScore || 100)}/100`}
                    </p>
                  </div>
                </div>

                {/* Footer: Internet Status and Last Seen */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono text-[10px]">
                    Last seen: {formatLastSeen(c.lastSeenAt)}
                  </span>

                  {isOffline || isUnknown ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                      Internet: —
                    </span>
                  ) : !c.internetConnected ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                      🔴 No Internet
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      🌐 {c.currentNetworkSpeedMbps != null && c.currentNetworkSpeedMbps > 0
                            ? `${c.currentNetworkSpeedMbps} Mbps`
                            : 'Connected'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Computer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Monitor className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-100">Add Computer Setup Guide</h3>
                  <p className="text-xs text-slate-400">Follow these 6 simple steps to register a new computer</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <p className="font-bold text-cyan-400 flex items-center gap-2">
                  <Terminal className="w-4 h-4" /> Step-by-Step Setup Guide:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-slate-300">
                  <li>Download the Windows package: <code className="text-cyan-300 font-mono">NeuroSys-Agent-Windows.zip</code></li>
                  <li>Extract the ZIP archive to any directory on the target computer.</li>
                  <li>Double-click <code className="text-cyan-300 font-mono">setup-agent.bat</code> (or run via CMD).</li>
                  <li>The agent automatically detects system specs (CPU, RAM, Disk, OS, IP, MAC).</li>
                  <li>The computer registers with the central server automatically.</li>
                  <li>Approve the computer under <strong>Pending Registrations</strong> above.</li>
                </ol>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <a
                  href="/api/v1/download/agent-windows"
                  download="NeuroSys-Agent-Windows.zip"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Windows Agent Package (.zip)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Computers;
