import React, { useState, useEffect } from 'react';
import { metricsService } from '../services/metricsService';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info, 
  RefreshCw, 
  Filter, 
  ShieldAlert, 
  Clock, 
  ChevronRight,
  Search,
  Check
} from 'lucide-react';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'RESOLVED'
  const [searchQuery, setSearchQuery] = useState('');
  const [resolvingId, setResolvingId] = useState(null);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await metricsService.getAllAlerts();
      const list = res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list)) {
        setAlerts(list);
      }
    } catch (e) {
      console.error('Error fetching alerts', e);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (alertId) => {
    setResolvingId(alertId);
    try {
      await metricsService.resolveAlert(alertId);
      fetchAlerts();
    } catch (e) {
      console.error('Error resolving alert', e);
    } finally {
      setResolvingId(null);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch = 
      (alert.message || alert.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alert.computerHostname || '').toLowerCase().includes(searchQuery.toLowerCase());

    const isResolved = alert.resolved || alert.status === 'RESOLVED';
    const matchesFilter = 
      selectedFilter === 'ALL' ||
      (selectedFilter === 'ACTIVE' && !isResolved) ||
      (selectedFilter === 'RESOLVED' && isResolved);

    return matchesSearch && matchesFilter;
  });

  const activeAlertsCount = alerts.filter(a => !a.resolved && a.status !== 'RESOLVED').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <Bell className="w-7 h-7 text-primary" />
            <h1 className="font-display text-display text-on-background tracking-tight">System Alerts & Audit Log</h1>
          </div>
          <p className="font-body-md text-body-md text-secondary mt-1">
            Real-time telemetry incident detection, persistent hardware alerts, and audit history across computer labs.
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="p-2.5 rounded-lg border border-outline-variant text-secondary hover:bg-surface-container hover:text-primary transition-colors flex items-center gap-2 text-xs font-bold shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="card-elevated p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alert message, PC..."
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-outline-variant">
          {[
            { id: 'ALL', label: `All Alerts (${alerts.length})` },
            { id: 'ACTIVE', label: `Active Incidents (${activeAlertsCount})` },
            { id: 'RESOLVED', label: 'Resolved History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                selectedFilter === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const isResolved = alert.resolved || alert.status === 'RESOLVED';
            const isCritical = alert.severity === 'CRITICAL' || alert.type?.includes('CRITICAL');

            return (
              <div
                key={alert.id}
                className={`card-elevated p-5 transition-all ${
                  isResolved 
                    ? 'opacity-75 bg-surface-container-low/50' 
                    : isCritical 
                    ? 'border-l-4 border-l-error bg-error-container/10' 
                    : 'border-l-4 border-l-[#f59e0b]'
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 mt-0.5 ${
                      isResolved ? 'bg-emerald-100 text-emerald-700' : isCritical ? 'bg-error-container text-error' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {isResolved ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`font-label-md text-label-md px-2 py-0.5 rounded font-bold ${
                          isResolved ? 'bg-emerald-500 text-white' : isCritical ? 'bg-error text-on-error' : 'bg-[#f59e0b] text-white'
                        }`}>
                          {isResolved ? 'RESOLVED' : alert.severity || 'ACTIVE ALERT'}
                        </span>
                        <span className="font-mono-sm text-mono-sm font-bold text-on-surface bg-surface-container px-2 py-0.5 rounded border border-outline-variant">
                          {alert.computerHostname || 'Computer Asset'}
                        </span>
                        {alert.occurrenceCount > 1 && (
                          <span className="font-label-md text-label-md bg-surface-container-high text-primary px-2 py-0.5 rounded font-bold">
                            Detected {alert.occurrenceCount}x
                          </span>
                        )}
                        <span className="font-mono-sm text-mono-sm text-secondary flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'Recently'}
                        </span>
                      </div>

                      <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                        {alert.message || alert.title || 'Telemetry Threshold Exceeded'}
                      </h3>

                      {alert.recommendedAction && (
                        <p className="font-body-md text-body-md text-secondary mt-1.5">
                          <strong className="text-on-surface font-semibold">Remediation Action:</strong> {alert.recommendedAction}
                        </p>
                      )}
                    </div>
                  </div>

                  {!isResolved && (
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      disabled={resolvingId === alert.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm transition-transform active:scale-95 flex-shrink-0"
                    >
                      <Check className="w-4 h-4" />
                      <span>{resolvingId === alert.id ? 'Resolving...' : 'Acknowledge & Resolve'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="card-elevated p-12 text-center text-secondary">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface">All Clear — No Incidents Found</h3>
            <p className="font-body-md text-body-md text-secondary mt-1">There are no active or matching system alerts at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
