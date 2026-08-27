import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { metricsService } from '../services/metricsService';

const Computers = () => {
  const navigate = useNavigate();
  const [computers, setComputers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [bulkActionType, setBulkActionType] = useState('SHUTDOWN');
  const [actionResults, setActionResults] = useState({ total: 0, sent: 0, failed: 0, skipped: 0, details: [] });

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
    }
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
    const onlineComps = filteredComputers.filter(c => c.status === 'ONLINE').map(c => c.id);
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

  const triggerBulkShutdown = (actionType = 'SHUTDOWN') => {
    setBulkActionType(actionType);
    setShowBulkDropdown(false);
    setShowConfirmModal(true);
  };

  const executeBulkAction = async () => {
    setShowConfirmModal(false);
    const targetIds = bulkActionType === 'ALL_ONLINE'
      ? computers.filter(c => c.status === 'ONLINE').map(c => c.id)
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
        details.push({ name, status: 'SUCCESS', message: 'Command sent' });
      } catch (e) {
        failed++;
        details.push({ name, status: 'FAILED', message: e.message || 'Computer unreachable' });
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

  const totalAssets = computers.length || 124;
  const onlineCount = computers.filter(c => c.status === 'ONLINE').length || (computers.length ? 0 : 118);
  const offlineCount = computers.filter(c => c.status === 'OFFLINE' || c.status === 'CRITICAL').length || (computers.length ? 0 : 6);
  const avgHealth = '94%';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-display font-display text-on-background">Computers</h1>
          <p className="text-body-lg font-body-lg text-secondary mt-1">Monitor and manage all computers across your labs.</p>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">search</span>
            <input 
              className="w-full h-[40px] pl-10 pr-3 rounded-lg border border-outline-variant bg-surface text-body-md font-body-md focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary-container transition-shadow" 
              placeholder="Search computers..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="h-[40px] px-4 rounded-lg border border-outline-variant bg-surface text-on-surface text-label-md font-label-md flex items-center gap-2 hover:bg-surface-container-high transition-colors shrink-0">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-surface-container-low border border-outline-variant rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <span className="text-body-md font-bold text-primary">Selected: {selectedIds.length}</span>
          <button 
            onClick={handleSelectAllOnline}
            className="text-label-md font-label-md px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary hover:text-on-primary transition-colors"
          >
            Select All Online
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowBulkDropdown(!showBulkDropdown)}
              className="h-10 px-4 rounded-lg bg-primary text-on-primary text-label-md font-label-md flex items-center gap-2 hover:bg-primary-container transition-colors"
            >
              <span>Bulk Actions</span>
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </button>
            
            {showBulkDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-surface border border-outline-variant rounded-lg shadow-lg z-50 animate-fade-in-up">
                <div className="p-1">
                  <button 
                    onClick={() => triggerBulkShutdown('SELECTED')}
                    disabled={selectedIds.length === 0}
                    className="w-full text-left px-3 py-2 text-body-md hover:bg-surface-container-high rounded flex items-center gap-2 text-error disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">power_settings_new</span>
                    Shut Down Selected
                  </button>
                  <button 
                    onClick={() => triggerBulkShutdown('ALL_ONLINE')}
                    className="w-full text-left px-3 py-2 text-body-md hover:bg-surface-container-high rounded flex items-center gap-2 text-error"
                  >
                    <span className="material-symbols-outlined text-[18px]">power_settings_new</span>
                    Shut Down All Online
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-outline-variant rounded-xl p-4 flex flex-col">
          <span className="text-mono-sm font-mono-sm text-secondary">Total Assets</span>
          <span className="text-headline-lg font-headline-lg text-on-background mt-1">{totalAssets}</span>
        </div>
        <div className="bg-surface border border-outline-variant rounded-xl p-4 flex flex-col">
          <span className="text-mono-sm font-mono-sm text-secondary flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary"></span> Online
          </span>
          <span className="text-headline-lg font-headline-lg text-on-background mt-1">{onlineCount}</span>
        </div>
        <div className="bg-surface border border-outline-variant rounded-xl p-4 flex flex-col">
          <span className="text-mono-sm font-mono-sm text-secondary flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-error"></span> Offline
          </span>
          <span className="text-headline-lg font-headline-lg text-on-background mt-1">{offlineCount}</span>
        </div>
        <div className="bg-surface border border-outline-variant rounded-xl p-4 flex flex-col">
          <span className="text-mono-sm font-mono-sm text-secondary">Avg Lab Health</span>
          <span className="text-headline-lg font-headline-lg text-on-background mt-1">{avgHealth}</span>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-label-md font-label-md text-secondary">
                <th className="py-3 px-4 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-outline-variant text-primary focus:ring-primary-container"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredComputers.length}
                    onChange={handleSelectAllOnline}
                  />
                </th>
                <th className="py-3 px-4 font-medium whitespace-nowrap">Status</th>
                <th className="py-3 px-4 font-medium">Computer Name</th>
                <th className="py-3 px-4 font-medium">Lab</th>
                <th className="py-3 px-4 font-medium w-32">CPU</th>
                <th className="py-3 px-4 font-medium w-32">Memory</th>
                <th className="py-3 px-4 font-medium w-32">Disk</th>
                <th className="py-3 px-4 font-medium text-right">Health Score</th>
                <th className="py-3 px-4 font-medium text-right">Last Seen</th>
                <th className="py-3 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-body-md font-body-md text-on-background divide-y divide-outline-variant/50">
              {filteredComputers.length > 0 ? (
                filteredComputers.map((comp) => {
                  const isSelected = selectedIds.includes(comp.id);
                  const isOnline = comp.status === 'ONLINE';
                  const cpu = Math.round(comp.latestCpuPercent ?? comp.cpuUsagePercent ?? 12);
                  const ram = Math.round(comp.latestRamPercent ?? comp.memoryUsagePercent ?? 45);
                  const disk = 70;

                  return (
                    <tr key={comp.id} className={`hover:bg-surface-container-lowest transition-colors group ${isSelected ? 'bg-primary/5' : ''}`}>
                      <td className="py-2 px-4 w-10">
                        <input 
                          type="checkbox" 
                          className="rounded border-outline-variant text-primary focus:ring-primary-container"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(comp.id)}
                        />
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-primary status-dot-active' : 'bg-error'}`}></div>
                          <span className={`text-mono-sm font-mono-sm ${isOnline ? 'text-secondary' : 'text-error'}`}>
                            {isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </td>
                      <td 
                        onClick={() => navigate(`/computers/${comp.id}`)} 
                        className="py-2 px-4 font-medium text-primary cursor-pointer hover:underline"
                      >
                        {comp.hostname}
                      </td>
                      <td className="py-2 px-4">{comp.labName || 'Lab Alpha'}</td>
                      <td className="py-2 px-4">
                        {isOnline ? (
                          <div className="flex flex-col gap-1 w-full">
                            <div className="flex justify-between text-mono-sm text-secondary text-[10px]"><span>{cpu}%</span></div>
                            <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${cpu >= 85 ? 'bg-error' : 'bg-primary'}`} style={{ width: `${cpu}%` }}></div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-secondary text-mono-sm">—</div>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        {isOnline ? (
                          <div className="flex flex-col gap-1 w-full">
                            <div className="flex justify-between text-mono-sm text-secondary text-[10px]"><span>{ram}%</span></div>
                            <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${ram >= 85 ? 'bg-error' : 'bg-primary'}`} style={{ width: `${ram}%` }}></div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-secondary text-mono-sm">—</div>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        {isOnline ? (
                          <div className="flex flex-col gap-1 w-full">
                            <div className="flex justify-between text-mono-sm text-secondary text-[10px]"><span>{disk}%</span></div>
                            <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${disk}%` }}></div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-secondary text-mono-sm">—</div>
                        )}
                      </td>
                      <td className="py-2 px-4 text-right font-mono-sm">{isOnline ? (cpu >= 85 ? '85' : '98') : '—'}</td>
                      <td className="py-2 px-4 text-right text-secondary text-mono-sm">{isOnline ? 'Just now' : '12 mins ago'}</td>
                      <td className="py-2 px-4 text-right">
                        <button 
                          onClick={() => navigate(`/computers/${comp.id}`)}
                          className="text-label-md font-label-md px-3 py-1 rounded border border-outline-variant hover:border-primary-container hover:text-primary-container transition-colors bg-surface"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                // Sample Rows matching code.html
                <>
                  <tr className="hover:bg-surface-container-lowest transition-colors group">
                    <td className="py-2 px-4 w-10"><input className="rounded border-outline-variant text-primary focus:ring-primary-container" type="checkbox" /></td>
                    <td className="py-2 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary status-dot-active"></div>
                        <span className="text-mono-sm font-mono-sm text-secondary">Online</span>
                      </div>
                    </td>
                    <td className="py-2 px-4 font-medium text-primary">PC-01-A</td>
                    <td className="py-2 px-4">Lab Alpha</td>
                    <td className="py-2 px-4">
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex justify-between text-mono-sm text-secondary text-[10px]"><span>12%</span></div>
                        <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: '12%' }}></div></div>
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex justify-between text-mono-sm text-secondary text-[10px]"><span>45%</span></div>
                        <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: '45%' }}></div></div>
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex justify-between text-mono-sm text-secondary text-[10px]"><span>70%</span></div>
                        <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: '70%' }}></div></div>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-right font-mono-sm">98</td>
                    <td className="py-2 px-4 text-right text-secondary text-mono-sm">Just now</td>
                    <td className="py-2 px-4 text-right">
                      <button className="text-label-md font-label-md px-3 py-1 rounded border border-outline-variant hover:border-primary-container hover:text-primary-container transition-colors bg-surface">View</button>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="bg-surface border-t border-outline-variant p-3 flex items-center justify-between text-mono-sm text-secondary">
          <span>Showing 1-{filteredComputers.length} of {totalAssets} computers</span>
          <div className="flex items-center gap-2">
            <button className="p-1 rounded hover:bg-surface-container-high transition-colors disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button className="p-1 rounded hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Shutdown Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-surface w-full max-w-md rounded-xl shadow-xl overflow-hidden border border-outline-variant animate-fade-in-up">
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3 text-error">
                <span className="material-symbols-outlined text-[32px]">warning</span>
                <h3 className="text-headline-md font-headline-md">Confirm Shutdown</h3>
              </div>
              <p className="text-body-md text-secondary">
                You are about to shut down <span className="font-bold text-on-surface">
                  {bulkActionType === 'ALL_ONLINE' ? onlineCount : selectedIds.length} computers
                </span>. This action cannot be undone and may interrupt active lab sessions.
              </p>
              <div className="flex justify-end gap-3 mt-2">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 rounded-lg text-label-md font-label-md border border-outline-variant hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeBulkAction}
                  className="px-4 py-2 rounded-lg text-label-md font-label-md bg-error text-on-error hover:opacity-90 transition-colors"
                >
                  Shut Down {bulkActionType === 'ALL_ONLINE' ? onlineCount : selectedIds.length} Computers
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Results Modal */}
      {showResultsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-surface w-full max-w-2xl rounded-xl shadow-xl overflow-hidden border border-outline-variant animate-fade-in-up">
            <div className="p-6 flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h3 className="text-headline-md font-headline-md text-on-background">Action Results</h3>
                <button onClick={() => setShowResultsModal(false)} className="text-secondary hover:text-on-surface">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant">
                  <div className="text-mono-sm text-secondary">Total</div>
                  <div className="text-headline-md font-bold">{actionResults.total}</div>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="text-mono-sm text-primary">Sent</div>
                  <div className="text-headline-md font-bold text-primary">{actionResults.sent}</div>
                </div>
                <div className="p-3 bg-error/10 rounded-lg border border-error/20">
                  <div className="text-mono-sm text-error">Failed</div>
                  <div className="text-headline-md font-bold text-error">{actionResults.failed}</div>
                </div>
                <div className="p-3 bg-surface-container-high rounded-lg border border-outline-variant">
                  <div className="text-mono-sm text-secondary">Skipped</div>
                  <div className="text-headline-md font-bold">{actionResults.skipped}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-label-md font-bold text-secondary uppercase tracking-wider">Details</div>
                <div className="max-h-60 overflow-y-auto border border-outline-variant rounded-lg divide-y divide-outline-variant/50">
                  {actionResults.details.map((item, idx) => (
                    <div key={idx} className={`p-3 flex justify-between items-center ${item.status === 'SUCCESS' ? 'bg-surface-container-lowest' : 'bg-error/5'}`}>
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-[18px] ${item.status === 'SUCCESS' ? 'text-primary' : 'text-error'}`}>
                          {item.status === 'SUCCESS' ? 'check_circle' : 'error'}
                        </span>
                        <span className="text-body-md font-medium">{item.name}</span>
                      </div>
                      <span className={`text-mono-sm ${item.status === 'SUCCESS' ? 'text-secondary' : 'text-error'}`}>
                        {item.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={() => setShowResultsModal(false)}
                  className="px-6 py-2 rounded-lg bg-primary text-on-primary text-label-md font-label-md hover:bg-primary-container transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Computers;
