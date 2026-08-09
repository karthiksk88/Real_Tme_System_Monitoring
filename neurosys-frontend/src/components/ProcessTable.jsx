import React, { useState } from 'react';
import { Search, ArrowUpDown, Cpu, HardDrive } from 'lucide-react';

const ProcessTable = ({ processes = [], onSearch, onSort }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" /> Top Resource Processes
          </h3>
          <p className="text-xs text-slate-400">Live process list sorted by CPU and memory consumption</p>
        </div>
        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search PID or process..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-400 border-b border-slate-800/60 pb-2">
              <th className="py-2.5 px-3 font-semibold">PID</th>
              <th className="py-2.5 px-3 font-semibold">Process Name</th>
              <th className="py-2.5 px-3 font-semibold">Status</th>
              <th className="py-2.5 px-3 font-semibold cursor-pointer hover:text-cyan-400" onClick={() => onSort && onSort('cpu')}>
                CPU % <ArrowUpDown className="w-3 h-3 inline ml-1" />
              </th>
              <th className="py-2.5 px-3 font-semibold cursor-pointer hover:text-cyan-400" onClick={() => onSort && onSort('ram')}>
                RAM (MB) <ArrowUpDown className="w-3 h-3 inline ml-1" />
              </th>
              <th className="py-2.5 px-3 font-semibold">User</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {processes.map((p, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-3 font-mono text-slate-400">{p.pid}</td>
                <td className="py-3 px-3 font-medium text-slate-200">{p.processName}</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400">
                    {p.status || 'RUNNING'}
                  </span>
                </td>
                <td className="py-3 px-3 font-semibold text-slate-200">
                  <div className="flex items-center gap-2">
                    <span>{p.cpuPercent}%</span>
                    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${p.cpuPercent > 50 ? 'bg-red-500' : p.cpuPercent > 20 ? 'bg-amber-500' : 'bg-cyan-500'}`}
                        style={{ width: `${Math.min(100, p.cpuPercent)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 font-mono text-slate-300">{p.memoryUsedMb} MB</td>
                <td className="py-3 px-3 text-slate-400">{p.user || 'SYSTEM'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProcessTable;
