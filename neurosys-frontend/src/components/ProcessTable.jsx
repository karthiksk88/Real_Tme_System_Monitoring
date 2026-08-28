import React, { useState, useEffect } from 'react';
import { Search, ArrowUpDown, Cpu, HardDrive, RefreshCw, Terminal, Activity } from 'lucide-react';
import { metricsService, fetchRealApi } from '../services/metricsService';

const ProcessTable = ({ computerId, processes: propProcesses, onSearch, onSort }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('cpu');
  const [processes, setProcesses] = useState(propProcesses || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (propProcesses && propProcesses.length > 0) {
      setProcesses(propProcesses);
    } else if (computerId) {
      loadProcesses();
      const interval = setInterval(loadProcesses, 3000);
      return () => clearInterval(interval);
    }
  }, [computerId, searchQuery, sortBy, propProcesses]);

  const loadProcesses = async () => {
    if (!computerId) return;
    setLoading(true);
    try {
      const fetchApi = fetchRealApi || metricsService.fetchRealApi;
      const res = await fetchApi(`/computers/${computerId}/processes?search=${encodeURIComponent(searchQuery)}&sortBy=${sortBy}`);
      
      const data = res?.data || res;
      let list = data?.processes || data?.topCpuProcesses || data?.topRamProcesses || (Array.isArray(data) ? data : []);
      
      if (!Array.isArray(list) || list.length === 0) {
        list = data?.topCpuProcesses || [];
      }

      if (Array.isArray(list)) {
        setProcesses(list);
      }
    } catch (e) {
      console.warn('Error loading active processes:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const handleSortToggle = (field) => {
    setSortBy(field);
    if (onSort) onSort(field);
  };

  // Filter processes locally if using prop processes
  const displayedProcesses = (propProcesses && propProcesses.length > 0)
    ? processes.filter(p => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (p.processName || '').toLowerCase().includes(q) || String(p.pid || '').includes(q);
      })
    : processes;

  return (
    <div className="card-elevated rounded-xl p-6 border border-slate-200 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h3 className="font-headline-md text-headline-md font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" /> Active System Processes ({displayedProcesses.length})
          </h3>
          <p className="text-xs text-slate-600 font-semibold mt-0.5">Live processes monitored by NeuroSys Agent sorted by CPU and memory</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search PID or process name..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:border-primary"
            />
          </div>
          {computerId && (
            <button
              onClick={loadProcesses}
              className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
              title="Refresh Active Processes"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[650px]">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-label-md font-label-md text-slate-900 font-extrabold">
              <th className="p-3">PID</th>
              <th className="p-3">Process Name</th>
              <th className="p-3">Status</th>
              <th 
                className="p-3 cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSortToggle('cpu')}
              >
                CPU Usage % <ArrowUpDown className="w-3.5 h-3.5 inline ml-1" />
              </th>
              <th 
                className="p-3 cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSortToggle('ram')}
              >
                Memory Usage <ArrowUpDown className="w-3.5 h-3.5 inline ml-1" />
              </th>
              <th className="p-3">User Account</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-body-md text-body-md text-slate-800 font-medium">
            {loading && displayedProcesses.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-700 font-bold space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                  <div>Loading live active processes from workstation...</div>
                </td>
              </tr>
            ) : displayedProcesses.length > 0 ? (
              displayedProcesses.map((p, idx) => {
                const cpuVal = Math.round(p.cpuPercent ?? p.cpuUsagePercent ?? 0);
                const ramMb = Math.round(p.memoryUsedMb ?? p.memoryMb ?? 0);

                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono-sm text-mono-sm font-bold text-slate-700">{p.pid || 'N/A'}</td>
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-primary shrink-0" />
                      <span>{p.processName || 'system_process'}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-label-md text-label-md px-2.5 py-0.5 rounded-full font-bold uppercase bg-emerald-500/20 text-emerald-700 border border-emerald-500/30">
                        {p.status || 'RUNNING'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono-sm text-mono-sm font-bold text-slate-900 w-12">{cpuVal}%</span>
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${cpuVal > 50 ? 'bg-red-500' : cpuVal > 20 ? 'bg-amber-500' : 'bg-primary'}`}
                            style={{ width: `${Math.min(100, Math.max(5, cpuVal))}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono-sm text-mono-sm font-bold text-slate-900">
                      {ramMb > 0 ? `${ramMb} MB` : `${p.memoryPercent || 0}%`}
                    </td>
                    <td className="p-3 text-slate-700 font-semibold">{p.user || 'SYSTEM'}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-700 font-semibold">
                  {searchQuery ? `No active processes found matching "${searchQuery}".` : 'No active processes reported yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProcessTable;
