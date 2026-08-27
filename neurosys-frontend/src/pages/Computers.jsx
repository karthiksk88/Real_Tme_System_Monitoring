import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { metricsService } from '../services/metricsService';

const Computers = () => {
  const navigate = useNavigate();
  const [computers, setComputers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [bulkActionType, setBulkActionType] = useState('SELECTED'); // 'SELECTED' | 'ALL_ONLINE'
  const [actionResults, setActionResults] = useState({ total: 0, sent: 0, failed: 0, skipped: 0, details: [] });

  useEffect(() => {
    fetchComputers();
    const interval = setInterval(fetchComputers, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchComputers = async () => {
    setIsRefreshing(true);
    try {
      const res = await metricsService.getAllComputers();
      const list = res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list)) {
        setComputers(list);
      }
    } catch (err) {
      console.error('Error fetching computers', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const isComputerOnline = (comp) => {
    if (!comp) return false;
    if (comp.status === 'ONLINE' || comp.status === 'WARNING' || comp.status === 'CRITICAL') return true;
    if (comp.lastSeenAt) {
      const diffMs = new Date().getTime() - new Date(comp.lastSeenAt).getTime();
      return diffMs < 120000; // Active heartbeat within 2 minutes
    }
    return false;
  };

  const filteredComputers = computers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.hostname || '').toLowerCase().includes(q) ||
      (c.ipAddress || '').toLowerCase().includes(q) ||
      (c.labName || '').toLowerCase().includes(q)
    );
  });

  const handleSelectAllOnline = () => {
    const onlineComps = filteredComputers.filter(c => isComputerOnline(c)).map(c => c.id);
    if (selectedIds.length === onlineComps.length && onlineComps.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(onlineComps);
    }
  };

  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const triggerBulkShutdown = (actionType = 'SELECTED') => {
    setBulkActionType(actionType);
    setShowBulkDropdown(false);
    setShowConfirmModal(true);
  };

  const executeBulkAction = async () => {
    setShowConfirmModal(false);
    
    const targetIds = bulkActionType === 'ALL_ONLINE'
      ? computers.filter(c => isComputerOnline(c)).map(c => c.id)
      : selectedIds;

    if (targetIds.length === 0) return;

    let sent = 0;
    let failed = 0;
    const details = [];

    for (const id of targetIds) {
      const comp = computers.find(c => c.id === id);
      const name = comp?.hostname || id;
      try {
        await metricsService.sendPowerCommand(id, 'SHUTDOWN');
        sent++;
        details.push({ name, status: 'SUCCESS', message: 'Shutdown command delivered successfully' });
      } catch (e) {
        failed++;
        details.push({ name, status: 'FAILED', message: e.message || 'Target machine unreachable' });
      }
    }

    setActionResults({
      total: targetIds.length,
      sent,
      failed,
      skipped: 0,
      details
    });

    setSelectedIds([]);
    setShowResultsModal(true);
    fetchComputers();
  };

  const totalAssets = computers.length || 0;
  const onlineCount = computers.filter(c => isComputerOnline(c)).length;
  const offlineCount = Math.max(0, totalAssets - onlineCount);
  const avgHealth = totalAssets > 0 ? `${Math.round((onlineCount / totalAssets) * 100)}%` : '100%';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-display font-display text-on-background">Computers Management</h1>
          <p className="text-body-lg font-body-lg text-secondary mt-1">Monitor, inspect telemetry, and manage power controls across all connected workstations.</p>
        </div>

        {/* Search & Refresh Toolbar */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">search</span>
            <input 
              className="w-full h-[40px] pl-10 pr-3 rounded-lg border border-outline-variant bg-surface text-body-md font-body-md focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary-container transition-shadow" 
              placeholder="Search by hostname, IP, or lab..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button 
            onClick={fetchComputers}
            title="Refresh Computers Data"
            className="h-[40px] px-3.5 rounded-lg border border-outline-variant bg-surface text-on-surface hover:bg-surface-container-high transition-colors flex items-center justify-center shrink-0 cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[20px] ${isRefreshing ? 'animate-spin text-primary' : 'text-secondary'}`}>
              refresh
            </span>
          </button>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-surface-container-low border border-outline-variant rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <span className="text-body-md font-bold text-primary">Selected Workstations: {selectedIds.length}</span>
          <button 
            onClick={handleSelectAllOnline}
            className="text-label-md font-label-md px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary hover:text-on-primary transition-colors cursor-pointer"
          >
            {selectedIds.length === onlineCount && onlineCount > 0 ? 'Deselect All Online' : 'Select All Online'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowBulkDropdown(!showBulkDropdown)}
              className="h-10 px-4 rounded-lg bg-primary text-on-primary text-label-md font-label-md flex items-center gap-2 hover:bg-primary-container transition-colors cursor-pointer"
            >
              <span>Bulk Actions</span>
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </button>
            
            {showBulkDropdown && (
              <div className="absolute right-0 mt-2 w-60 bg-surface border border-outline-variant rounded-lg shadow-lg z-50 animate-fade-in-up">
                <div className="p-1">
                  <button 
                    onClick={() => triggerBulkShutdown('SELECTED')}
                    disabled={selectedIds.length === 0}
                    className="w-full text-left px-3 py-2.5 text-body-md hover:bg-surface-container-high rounded flex items-center gap-2 text-error disabled:opacity-40 disabled:cursor-not-allowed font-medium cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">power_settings_new</span>
                    Shut Down Selected ({selectedIds.length})
                  </button>

                  <button 
                    onClick={() => triggerBulkShutdown('ALL_ONLINE')}
                    disabled={onlineCount === 0}
                    className="w-full text-left px-3 py-2.5 text-body-md hover:bg-surface-container-high rounded flex items-center gap-2 text-error disabled:opacity-40 disabled:cursor-not-allowed font-medium border-t border-outline-variant cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">power_off</span>
                    Shut Down All Online ({onlineCount})
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-outline-variant rounded-xl p-4 flex flex-col">
          <span className="text-mono-sm font-mono-sm text-secondary">Total Computers</span>
          <span className="text-headline-lg font-headline-lg text-on-background mt-1">{totalAssets}</span>
        </div>
        <div className="bg-surface border border-outline-variant rounded-xl p-4 flex flex-col border-l-4 border-l-[#10b981]">
          <span className="text-mono-sm font-mono-sm text-secondary flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#10b981]"></span> Online &amp; Streaming
          </span>
          <span className="text-headline-lg font-headline-lg text-[#10b981] mt-1">{onlineCount}</span>
        </div>
        <div className="bg-surface border border-outline-variant rounded-xl p-4 flex flex-col border-l-4 border-l-error">
          <span className="text-mono-sm font-mono-sm text-secondary flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-error"></span> Offline
          </span>
          <span className="text-headline-lg font-headline-lg text-error mt-1">{offlineCount}</span>
        </div>
        <div className="bg-surface border border-outline-variant rounded-xl p-4 flex flex-col">
          <span className="text-mono-sm font-mono-sm text-secondary">Avg Fleet Readiness</span>
          <span className="text-headline-lg font-headline-lg text-on-background mt-1">{avgHealth}</span>
        </div>
      </div>

      {/* Fleet Table */}
      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-label-md font-label-md text-secondary">
                <th className="py-3 px-4 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-outline-variant text-primary focus:ring-primary-container cursor-pointer"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredComputers.length}
                    onChange={handleSelectAllOnline}
                  />
                </th>
                <th className="py-3 px-4 font-medium whitespace-nowrap">Status</th>
                <th className="py-3 px-4 font-medium">Computer Name</th>
                <th className="py-3 px-4 font-medium">Lab</th>
                <th className="py-3 px-4 font-medium w-32">CPU Usage</th>
                <th className="py-3 px-4 font-medium w-32">Memory Usage</th>
                <th className="py-3 px-4 font-medium w-32">Storage Usage</th>
                <th className="py-3 px-4 font-medium text-right">Health Score</th>
                <th className="py-3 px-4 font-medium text-right">Last Seen</th>
                <th className="py-3 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-body-md font-body-md text-on-background divide-y divide-outline-variant/50">
              {filteredComputers.length > 0 ? (
                filteredComputers.map((comp) => {
                  const isSelected = selectedIds.includes(comp.id);
                  const active = isComputerOnline(comp);
                  const isUserLaptop = comp.hostname === 'LAPTOP-PALBUQS2';
                  
                  const cpu = Math.round(comp.currentCpuUsage ?? comp.lastRecordedCpuUsage ?? comp.cpuUsagePercent ?? 0);
                  const ram = Math.round(comp.currentRamUsage ?? comp.lastRecordedRamUsage ?? comp.memoryUsagePercent ?? 0);
                  const disk = Math.round(comp.currentDiskUsage ?? comp.lastRecordedDiskUsage ?? comp.diskUsagePercent ?? 35);
                  const health = Math.round(comp.currentHealthScore ?? comp.healthScore ?? 100);

                  return (
                    <tr key={comp.id} className={`hover:bg-surface-container-lowest transition-colors group ${isSelected ? 'bg-primary/5' : ''} ${isUserLaptop ? 'bg-primary-container/10 border-l-4 border-l-primary' : ''}`}>
                      <td className="py-2.5 px-4 w-10">
                        <input 
                          type="checkbox" 
                          className="rounded border-outline-variant text-primary focus:ring-primary-container cursor-pointer"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(comp.id)}
                        />
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${active ? (ram > 90 ? 'bg-[#f59e0b] status-dot-active' : 'bg-[#10b981] status-dot-active') : 'bg-error'}`}></div>
                          <span className={`text-mono-sm font-mono-sm font-bold ${active ? (ram > 90 ? 'text-[#f59e0b]' : 'text-[#10b981]') : 'text-error'}`}>
                            {active ? (ram > 90 ? 'Online (Warning)' : 'Online') : 'Offline'}
                          </span>
                        </div>
                      </td>
                      <td 
                        onClick={() => navigate(`/computers/${comp.id}`)} 
                        className="py-2.5 px-4 font-bold text-primary cursor-pointer hover:underline"
                      >
                        {comp.hostname} {isUserLaptop ? '(Your Laptop)' : ''}
                      </td>
                      <td className="py-2.5 px-4 text-secondary font-medium">{comp.labName || 'Lab Alpha'}</td>
                      <td className="py-2.5 px-4">
                        {active ? (
                          <div className="space-y-1">
                            <div className="flex justify-between text-mono-sm font-mono-sm">
                              <span className="font-bold text-primary">{cpu}%</span>
                            </div>
                            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${cpu > 80 ? 'bg-error' : 'bg-primary'}`} style={{ width: `${cpu}%` }}></div>
                            </div>
                          </div>
                        ) : <span className="text-secondary text-mono-sm">-</span>}
                      </td>
                      <td className="py-2.5 px-4">
                        {active ? (
                          <div className="space-y-1">
                            <div className="flex justify-between text-mono-sm font-mono-sm">
                              <span className="font-bold text-[#10b981]">{ram}%</span>
                            </div>
                            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${ram > 90 ? 'bg-[#f59e0b]' : 'bg-[#10b981]'}`} style={{ width: `${ram}%` }}></div>
                            </div>
                          </div>
                        ) : <span className="text-secondary text-mono-sm">-</span>}
                      </td>
                      <td className="py-2.5 px-4">
                        {active ? (
                          <div className="space-y-1">
                            <div className="flex justify-between text-mono-sm font-mono-sm">
                              <span className="font-bold text-secondary">{disk}%</span>
                            </div>
                            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                              <div className="h-full bg-secondary rounded-full" style={{ width: `${disk}%` }}></div>
                            </div>
                          </div>
                        ) : <span className="text-secondary text-mono-sm">-</span>}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono-sm font-bold">
                        <span className={health >= 90 ? 'text-[#10b981]' : health >= 75 ? 'text-[#f59e0b]' : 'text-error'}>
                          {health} / 100
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right text-mono-sm text-secondary whitespace-nowrap">
                        {active ? 'Just now' : (comp.lastSeenAt ? new Date(comp.lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Offline')}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button 
                          onClick={() => navigate(`/computers/${comp.id}`)}
                          className="px-3 py-1 text-label-md font-label-md rounded border border-outline-variant hover:border-primary hover:text-primary transition-colors bg-surface cursor-pointer font-bold"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-secondary text-body-md">
                    No computers registered in database matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-headline-md font-headline-md text-error flex items-center gap-2">
              <span className="material-symbols-outlined text-error">power_settings_new</span>
              Confirm Bulk Shutdown
            </h3>
            <p className="text-body-md text-secondary">
              You are about to issue a remote shutdown command to{' '}
              <strong className="text-on-surface">
                {bulkActionType === 'ALL_ONLINE' ? `${onlineCount} Online Computer(s)` : `${selectedIds.length} Selected Computer(s)`}
              </strong>.
              Are you sure you want to proceed?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg border border-outline-variant hover:bg-surface-container text-label-md font-label-md cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={executeBulkAction}
                className="px-4 py-2 rounded-lg bg-error text-on-error hover:bg-error/90 text-label-md font-label-md cursor-pointer"
              >
                Execute Shutdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-headline-md font-headline-md text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">task_alt</span>
              Bulk Shutdown Execution Report
            </h3>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-surface-container rounded-lg">
                <div className="text-headline-md font-bold text-on-surface">{actionResults.total}</div>
                <div className="text-label-md text-secondary">Total Target</div>
              </div>
              <div className="p-3 bg-[#10b981]/10 rounded-lg">
                <div className="text-headline-md font-bold text-[#10b981]">{actionResults.sent}</div>
                <div className="text-label-md text-[#10b981]">Delivered</div>
              </div>
              <div className="p-3 bg-error/10 rounded-lg">
                <div className="text-headline-md font-bold text-error">{actionResults.failed}</div>
                <div className="text-label-md text-error">Failed</div>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-outline-variant border border-outline-variant rounded-lg p-2 text-body-md">
              {actionResults.details.map((item, index) => (
                <div key={index} className="py-2 px-1 flex justify-between items-center text-xs">
                  <span className="font-bold text-on-surface">{item.name}</span>
                  <span className={`px-2 py-0.5 rounded font-mono ${item.status === 'SUCCESS' ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-error/20 text-error'}`}>
                    {item.message}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setShowResultsModal(false)}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary text-label-md font-label-md cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Computers;
