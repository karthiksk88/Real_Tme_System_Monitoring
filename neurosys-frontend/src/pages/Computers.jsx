import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { metricsService } from '../services/metricsService';
import { 
  Monitor, 
  Search, 
  Power, 
  RotateCw, 
  Lock, 
  Filter, 
  CheckSquare, 
  Square, 
  ChevronRight, 
  Cpu, 
  HardDrive, 
  Activity, 
  AlertTriangle,
  CheckCircle2,
  Trash2,
  SlidersHorizontal,
  LayoutGrid,
  List
} from 'lucide-react';
import RemotePowerManagement from '../components/RemotePowerManagement';

const Computers = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [computers, setComputers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedLabFilter, setSelectedLabFilter] = useState(searchParams.get('lab') || 'ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [bulkActionConfirm, setBulkActionConfirm] = useState(null); // 'SHUTDOWN' | 'RESTART' | 'LOCK'

  useEffect(() => {
    fetchComputers();
    const interval = setInterval(fetchComputers, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchComputers = async () => {
    try {
      const res = await metricsService.getAllComputers();
      const list = res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list)) {
        setComputers(list);
      }
    } catch (err) {
      console.error('Error fetching computers', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter computers
  const filteredComputers = computers.filter((c) => {
    const matchesSearch = 
      (c.hostname || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.ipAddress || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.labName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLab = selectedLabFilter === 'ALL' || c.labName === selectedLabFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' || c.status === selectedStatusFilter;

    return matchesSearch && matchesLab && matchesStatus;
  });

  // Select all handler
  const handleSelectAll = () => {
    if (selectedIds.length === filteredComputers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredComputers.map((c) => c.id));
    }
  };

  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Execute bulk command
  const executeBulkCommand = async (commandType) => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(
        selectedIds.map(id => metricsService.sendPowerCommand(id, commandType).catch(() => null))
      );
      setSelectedIds([]);
      setBulkActionConfirm(null);
      fetchComputers();
    } catch (e) {
      console.error('Error executing bulk command', e);
    }
  };

  const labNames = ['ALL', ...new Set(computers.map(c => c.labName || 'General Lab'))];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header & Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <Monitor className="w-7 h-7 text-primary" />
            <h1 className="font-display text-display text-on-background tracking-tight">Computers Management</h1>
          </div>
          <p className="font-body-md text-body-md text-secondary mt-1">
            Monitor, inspect telemetry trends, and trigger remote commands across campus computer assets.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg border text-xs font-semibold transition-colors ${
              viewMode === 'grid' ? 'bg-primary text-white border-primary' : 'bg-surface-container-low border-outline-variant text-secondary hover:bg-surface-container'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg border text-xs font-semibold transition-colors ${
              viewMode === 'table' ? 'bg-primary text-white border-primary' : 'bg-surface-container-low border-outline-variant text-secondary hover:bg-surface-container'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (When items are selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-primary/10 border-2 border-primary rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in-up shadow-md">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center">
              {selectedIds.length}
            </span>
            <span className="font-headline-md text-body-lg font-bold text-primary">
              {selectedIds.length} Computer{selectedIds.length > 1 ? 's' : ''} Selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setBulkActionConfirm('SHUTDOWN')}
              className="px-3.5 py-2 bg-error text-on-error hover:bg-red-700 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-transform active:scale-95"
            >
              <Power className="w-4 h-4" />
              Shut Down Selected ({selectedIds.length})
            </button>
            <button
              onClick={() => setBulkActionConfirm('RESTART')}
              className="px-3.5 py-2 bg-amber-500 text-white hover:bg-amber-600 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-transform active:scale-95"
            >
              <RotateCw className="w-4 h-4" />
              Restart Selected
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-2 border border-outline-variant text-secondary hover:bg-surface-container rounded-lg text-xs font-semibold"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="card-elevated p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hostname, IP, lab..."
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-medium text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Select All */}
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-outline-variant text-xs font-semibold text-secondary hover:bg-surface-container transition-colors"
          >
            {selectedIds.length === filteredComputers.length && filteredComputers.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-primary" />
            ) : (
              <Square className="w-4 h-4 text-secondary" />
            )}
            <span>Select All ({filteredComputers.length})</span>
          </button>

          {/* Lab Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-secondary">Lab:</span>
            <select
              value={selectedLabFilter}
              onChange={(e) => setSelectedLabFilter(e.target.value)}
              className="px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
            >
              {labNames.map(lab => (
                <option key={lab} value={lab}>{lab}</option>
              ))}
            </select>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-outline-variant">
            {['ALL', 'ONLINE', 'CRITICAL', 'WARNING', 'OFFLINE'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatusFilter(status)}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-colors ${
                  selectedStatusFilter === status
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredComputers.map((comp) => {
            const isSelected = selectedIds.includes(comp.id);
            const isOnline = comp.status === 'ONLINE';
            const isCritical = comp.status === 'CRITICAL';
            const isWarning = comp.status === 'WARNING';

            const cpu = comp.latestCpuPercent ?? comp.cpuUsagePercent ?? 0;
            const ram = comp.latestRamPercent ?? comp.memoryUsagePercent ?? 0;
            const diskFree = comp.latestDiskFreeGb ?? comp.diskFreeGb ?? 100;

            return (
              <div
                key={comp.id}
                className={`card-elevated p-5 flex flex-col justify-between relative transition-all duration-200 ${
                  isSelected ? 'border-2 border-primary bg-primary/5' : ''
                } ${isCritical ? 'border-l-4 border-l-error' : isWarning ? 'border-l-4 border-l-[#f59e0b]' : 'border-l-4 border-l-[#10b981]'}`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleSelect(comp.id)}
                        className="text-secondary hover:text-primary transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                          <Square className="w-5 h-5 text-outline-variant" />
                        )}
                      </button>
                      <div>
                        <h3 
                          onClick={() => navigate(`/computers/${comp.id}`)}
                          className="font-headline-md text-headline-md font-bold text-on-surface hover:text-primary cursor-pointer tracking-tight"
                        >
                          {comp.hostname}
                        </h3>
                        <span className="font-mono-sm text-mono-sm text-secondary block">{comp.ipAddress || '192.168.1.100'}</span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full font-mono-sm text-mono-sm font-bold bg-surface-container text-on-surface-variant border border-outline-variant">
                      {comp.labName || 'General Lab'}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`status-dot ${
                      isCritical ? 'status-critical' : isWarning ? 'status-warning' : isOnline ? 'status-healthy' : 'status-neutral'
                    }`} />
                    <span className="font-label-md text-label-md font-bold text-on-surface-variant uppercase tracking-wider">
                      {comp.status || 'UNKNOWN'}
                    </span>
                  </div>

                  {/* Telemetry Mini Bars */}
                  <div className="space-y-3 pt-3 border-t border-outline-variant">
                    {/* CPU */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-secondary flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5 text-primary" /> CPU Load
                        </span>
                        <span className="text-on-surface">{Math.round(cpu)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${cpu >= 85 ? 'bg-error' : cpu >= 70 ? 'bg-[#f59e0b]' : 'bg-primary'}`} 
                          style={{ width: `${Math.min(100, Math.max(5, cpu))}%` }} 
                        />
                      </div>
                    </div>

                    {/* RAM */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-secondary flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-primary" /> RAM Usage
                        </span>
                        <span className="text-on-surface">{Math.round(ram)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${ram >= 90 ? 'bg-error' : ram >= 80 ? 'bg-[#f59e0b]' : 'bg-[#10b981]'}`} 
                          style={{ width: `${Math.min(100, Math.max(5, ram))}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-5 pt-3 border-t border-outline-variant flex items-center justify-between gap-2">
                  <button
                    onClick={() => navigate(`/computers/${comp.id}`)}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    View Metrics <ChevronRight className="w-4 h-4" />
                  </button>

                  <RemotePowerManagement 
                    computerId={comp.id} 
                    hostname={comp.hostname}
                    status={comp.status} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="card-elevated overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant font-label-md text-label-md text-secondary">
                  <th className="p-4 w-10">
                    <button onClick={handleSelectAll}>
                      {selectedIds.length === filteredComputers.length && filteredComputers.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-secondary" />
                      )}
                    </button>
                  </th>
                  <th className="p-4">Computer / Hostname</th>
                  <th className="p-4">Lab Campus</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">IP Address</th>
                  <th className="p-4 text-right">CPU %</th>
                  <th className="p-4 text-right">RAM %</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant font-body-md text-body-md">
                {filteredComputers.map((comp) => {
                  const isSelected = selectedIds.includes(comp.id);
                  return (
                    <tr key={comp.id} className={`hover:bg-surface-container-low transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                      <td className="p-4">
                        <button onClick={() => handleToggleSelect(comp.id)}>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4 text-outline-variant" />
                          )}
                        </button>
                      </td>
                      <td className="p-4 font-bold text-on-surface hover:text-primary cursor-pointer" onClick={() => navigate(`/computers/${comp.id}`)}>
                        {comp.hostname}
                      </td>
                      <td className="p-4 text-secondary font-medium">{comp.labName || 'General Lab'}</td>
                      <td className="p-4">
                        <span className="flex items-center gap-2">
                          <span className={`status-dot ${comp.status === 'ONLINE' ? 'status-healthy' : comp.status === 'CRITICAL' ? 'status-critical' : 'status-warning'}`} />
                          <span className="font-bold text-xs">{comp.status}</span>
                        </span>
                      </td>
                      <td className="p-4 font-mono-sm text-mono-sm text-secondary">{comp.ipAddress || '192.168.1.100'}</td>
                      <td className="p-4 text-right font-mono-sm text-mono-sm font-bold">{Math.round(comp.latestCpuPercent ?? comp.cpuUsagePercent ?? 0)}%</td>
                      <td className="p-4 text-right font-mono-sm text-mono-sm font-bold">{Math.round(comp.latestRamPercent ?? comp.memoryUsagePercent ?? 0)}%</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => navigate(`/computers/${comp.id}`)}
                          className="px-3 py-1 bg-surface-container text-primary font-bold rounded hover:bg-surface-container-high text-xs"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Bulk Power Operations */}
      {bulkActionConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 max-w-md w-full shadow-2xl animate-fade-in-up">
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface mb-2">
              Confirm Bulk {bulkActionConfirm === 'SHUTDOWN' ? 'Shutdown' : 'Restart'}
            </h3>
            <p className="font-body-md text-body-md text-secondary mb-6">
              Are you sure you want to execute remote <strong className="text-on-surface">{bulkActionConfirm}</strong> on <strong className="text-primary">{selectedIds.length}</strong> selected computers?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setBulkActionConfirm(null)}
                className="px-4 py-2 border border-outline-variant text-secondary rounded-lg font-bold text-xs hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                onClick={() => executeBulkCommand(bulkActionConfirm)}
                className={`px-4 py-2 rounded-lg font-bold text-xs text-white shadow-md ${
                  bulkActionConfirm === 'SHUTDOWN' ? 'bg-error hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                Confirm {bulkActionConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Computers;
