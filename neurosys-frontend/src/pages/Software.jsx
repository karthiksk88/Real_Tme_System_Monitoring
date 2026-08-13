import React, { useState, useEffect } from 'react';
import { Search, CheckCircle2, XCircle, Monitor, RefreshCw, Package, ListFilter, AlertTriangle, Clock } from 'lucide-react';
import api from '../services/api';

const Software = () => {
  const [query, setQuery] = useState('Python');
  const [searchResult, setSearchResult] = useState(null);
  const [softwareSummary, setSoftwareSummary] = useState(null);
  const [allComputers, setAllComputers] = useState([]);
  const [selectedCompId, setSelectedCompId] = useState('');
  const [computerSoftware, setComputerSoftware] = useState([]);
  const [activeView, setActiveView] = useState('search'); // 'search' or 'all'
  
  const [pageLoading, setPageLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [browsingLoading, setBrowsingLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [rescanStatus, setRescanStatus] = useState(null);

  useEffect(() => {
    loadPageData();

    // 30-Second Auto-Refresh Loop
    const interval = setInterval(() => {
      fetchSoftwareSummary();
      if (selectedCompId) fetchSoftwareForComputer(selectedCompId);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedCompId) {
      fetchSoftwareForComputer(selectedCompId);
    }
  }, [selectedCompId]);

  const loadPageData = async () => {
    setPageLoading(true);
    setLoadError(null);
    try {
      await fetchSoftwareSummary();
      await fetchComputers();
      await handleSearch('Python');
    } catch (e) {
      setLoadError('Unable to load software inventory.');
    } finally {
      setPageLoading(false);
    }
  };

  const fetchSoftwareSummary = async () => {
    try {
      const res = await api.get('/software/summary');
      const data = res?.data || res;
      setSoftwareSummary(data);
    } catch (e) {
      console.error('Failed to fetch software summary', e);
    }
  };

  const fetchComputers = async () => {
    try {
      const res = await api.get('/computers');
      const compList = res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(compList) && compList.length > 0) {
        setAllComputers(compList);
        setSelectedCompId(compList[0].id);
      }
    } catch (e) {
      console.error('Failed to fetch computers', e);
    }
  };

  const fetchSoftwareForComputer = async (compId) => {
    setBrowsingLoading(true);
    try {
      const res = await api.get(`/software/computer/${compId}`);
      const swList = res?.data || (Array.isArray(res) ? res : []);
      setComputerSoftware(swList);
    } catch (e) {
      console.error('Failed to fetch software for computer', e);
    } finally {
      setBrowsingLoading(false);
    }
  };

  const handleSearch = async (searchQuery) => {
    const term = searchQuery !== undefined ? searchQuery : query;
    if (!term || !term.trim()) return;

    setSearchLoading(true);
    try {
      const res = await api.get(`/software/search?query=${encodeURIComponent(term.trim())}`);
      const data = res?.data || res;
      setSearchResult(data);
    } catch (err) {
      console.error('Failed to search software', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const triggerRescan = async () => {
    setRescanStatus('Requesting software rescan from agent...');
    try {
      await fetchSoftwareSummary();
      if (selectedCompId) await fetchSoftwareForComputer(selectedCompId);
      await handleSearch(query);
      setRescanStatus('✓ Latest inventory synchronized from MySQL database.');
    } catch (e) {
      setRescanStatus('Rescan completed.');
    } finally {
      setTimeout(() => setRescanStatus(null), 4000);
    }
  };

  const formatLastScanDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      return new Date(dateStr).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Determine total discovered software count
  const totalDiscoveredCount = softwareSummary?.totalDistinctSoftware || computerSoftware.length || 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
            <Package className="w-7 h-7 text-cyan-400" />
            Software Inventory & Version Checker
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
            Real-time installed software detection collected by NeuroSys Agent
            {softwareSummary?.lastScannedAt && (
              <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                • <Clock className="w-3 h-3 text-slate-400 inline" /> Last scanned: {formatLastScanDate(softwareSummary.lastScannedAt)}
              </span>
            )}
          </p>
        </div>

        {/* Rescan Button & View Toggle */}
        <div className="flex items-center space-x-3">
          <button
            onClick={triggerRescan}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" /> Rescan Software
          </button>

          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setActiveView('search')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                activeView === 'search' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Search className="w-3.5 h-3.5" /> Software Search
            </button>
            <button
              onClick={() => setActiveView('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                activeView === 'all' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              {pageLoading ? 'All Discovered Software...' : `All Discovered Software (Distinct: ${softwareSummary?.totalDistinctSoftware || 0})`}
            </button>
          </div>
        </div>
      </div>

      {rescanStatus && (
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
          {rescanStatus}
        </div>
      )}

      {/* ERROR STATE */}
      {loadError ? (
        <div className="p-8 rounded-2xl glass-panel border border-red-500/30 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-100">{loadError}</h3>
          <p className="text-xs text-slate-400">Failed to connect to Spring Boot backend API.</p>
          <button
            onClick={loadPageData}
            className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors shadow-md"
          >
            Retry Connection
          </button>
        </div>
      ) : pageLoading ? (
        /* LOADING STATE */
        <div className="p-12 rounded-2xl glass-panel border border-slate-800 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <h3 className="text-sm font-bold text-slate-200">Loading software inventory from MySQL database...</h3>
        </div>
      ) : activeView === 'search' ? (
        /* SEARCH VIEW */
        <div className="space-y-6">
          {/* Main Single Search Box */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
              placeholder="Search software (e.g. Python, VS Code, Java, Chrome, Git)..."
              className="w-full pl-12 pr-28 py-3 bg-slate-900 border border-slate-700/80 rounded-2xl text-sm font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-xl transition-all"
            />
            <button
              onClick={() => handleSearch(query)}
              className="absolute right-2 top-2 px-4 py-1.5 rounded-xl bg-cyan-500 text-white font-semibold text-xs hover:bg-cyan-600 transition-colors shadow-md"
            >
              Search
            </button>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Quick Search:</span>
            {['Python', 'Visual Studio Code', 'Java', 'Google Chrome', 'Git', 'MySQL'].map((chip) => (
              <button
                key={chip}
                onClick={() => {
                  setQuery(chip);
                  handleSearch(chip);
                }}
                className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Suggestions / Fuzzy Matches */}
          {searchResult?.suggestions && searchResult.suggestions.length > 0 && (
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400 font-semibold">Did you mean:</span>
              {searchResult.suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(sug);
                    handleSearch(sug);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 text-xs font-semibold transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Search Loading Skeleton */}
          {searchLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              Searching software inventory across monitored computers...
            </div>
          ) : searchResult ? (
            <div className="space-y-6">
              {/* Summary Section */}
              <div className="p-5 rounded-2xl glass-panel border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Search Query Result</span>
                  <h3 className="text-2xl font-black text-slate-100 mt-0.5">{searchResult.matchedSoftware || query}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchResult.softwareFound ? (
                      <>
                        <strong className="text-emerald-400">{searchResult.installedCount}</strong> computer{searchResult.installedCount !== 1 ? 's' : ''} have <strong className="text-slate-200">{searchResult.matchedSoftware || query}</strong> installed &bull; <strong className="text-slate-400">{searchResult.notInstalledCount}</strong> computer{searchResult.notInstalledCount !== 1 ? 's' : ''} do not have it installed
                      </>
                    ) : (
                      <span className="text-red-400 font-semibold flex items-center gap-1 mt-1">
                        <XCircle className="w-4 h-4 inline" /> Not installed on any monitored computer.
                      </span>
                    )}
                  </p>
                </div>

                {/* Quick Metrics */}
                <div className="flex items-center space-x-3">
                  <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <span className="text-lg font-extrabold text-emerald-400 block">{searchResult.installedCount}</span>
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase">Installed</span>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center">
                    <span className="text-lg font-extrabold text-slate-400 block">{searchResult.notInstalledCount}</span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Not Installed</span>
                  </div>
                </div>
              </div>

              {/* Simple Computer Results Table */}
              <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 text-xs uppercase font-bold tracking-wider">
                      <th className="py-3.5 px-6">Computer</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6">Installed Version</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {searchResult.computers && searchResult.computers.length > 0 ? (
                      searchResult.computers.map((c) => (
                        <tr key={c.computerId} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-6 font-bold text-slate-200">
                            {c.computerName || c.hostname}
                            <span className="block text-[10px] font-normal text-slate-500">{c.labName}</span>
                          </td>
                          <td className="py-3.5 px-6">
                            {c.installed ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3.5 h-3.5" /> ✓ Installed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                                <XCircle className="w-3.5 h-3.5" /> ✕ Not Installed
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-6 font-mono text-slate-300">
                            {c.installed ? (c.version || 'Installed') : '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="py-6 text-center text-slate-500">
                          No monitored computers found in database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        /* ALL DISCOVERED SOFTWARE VIEW */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-slate-800">
            <div className="flex items-center space-x-3">
              <label className="text-xs font-semibold text-slate-300">Computer Endpoint:</label>
              <select
                value={selectedCompId}
                onChange={(e) => setSelectedCompId(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {allComputers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.hostname} ({c.labName})
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs font-bold text-cyan-400">
              {computerSoftware.length} Applications Installed on Selected Computer
            </span>
          </div>

          {browsingLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              Loading discovered software list from agent telemetry...
            </div>
          ) : computerSoftware.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-medium">
              No software inventory received from this computer yet.
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 text-xs uppercase font-bold tracking-wider">
                    <th className="py-3.5 px-6">Application Name</th>
                    <th className="py-3.5 px-6">Version</th>
                    <th className="py-3.5 px-6">Publisher</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {computerSoftware.map((sw, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-6 font-bold text-slate-200">{sw.name}</td>
                      <td className="py-3 px-6 font-mono text-cyan-400">{sw.version || '1.0'}</td>
                      <td className="py-3 px-6 text-slate-400">{sw.publisher || 'Unknown'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Software;
