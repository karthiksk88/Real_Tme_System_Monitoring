import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { metricsService } from '../services/metricsService';
import { 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  BrainCircuit, 
  RefreshCw, 
  Bell, 
  ArrowRight,
  Activity,
  Layers,
  Cpu,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [computers, setComputers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [aiPredictions, setAiPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('Just now');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [compRes, alertRes] = await Promise.all([
        metricsService.getAllComputers().catch(() => ({ data: [] })),
        metricsService.getActiveAlerts().catch(() => ({ data: [] }))
      ]);

      const compList = compRes?.data || (Array.isArray(compRes) ? compRes : []);
      const alertList = alertRes?.data || (Array.isArray(alertRes) ? alertRes : []);

      setComputers(Array.isArray(compList) ? compList : []);
      setAlerts(Array.isArray(alertList) ? alertList : []);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      // Fetch sample AI predictions for computers
      if (Array.isArray(compList) && compList.length > 0) {
        const topComps = compList.slice(0, 3);
        const predPromises = topComps.map(c => 
          metricsService.getCrashPrediction(c.id).catch(() => null)
        );
        const predResults = await Promise.all(predPromises);
        const validPreds = predResults.map(r => r?.data || r).filter(Boolean);
        setAiPredictions(validPreds);
      }
    } catch (err) {
      console.error('Error loading dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  // Metric counts
  const totalAssets = computers.length;
  const healthyCount = computers.filter(c => c.status === 'ONLINE').length;
  const criticalCount = computers.filter(c => c.status === 'CRITICAL' || c.status === 'OFFLINE').length;
  const warningCount = computers.filter(c => c.status === 'WARNING' || c.status === 'PENDING').length;

  const healthyPercent = totalAssets > 0 ? Math.round((healthyCount / totalAssets) * 100) : 100;
  const warningPercent = totalAssets > 0 ? Math.round((warningCount / totalAssets) * 100) : 0;
  const criticalPercent = totalAssets > 0 ? Math.round((criticalCount / totalAssets) * 100) : 0;

  // Group computers by lab
  const labGroups = computers.reduce((acc, c) => {
    const lab = c.labName || 'General Lab';
    if (!acc[lab]) acc[lab] = [];
    acc[lab].push(c);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2 animate-fade-in-up">
        <div>
          <h1 className="font-display text-display text-on-background tracking-tight">Good morning, Admin</h1>
          <p className="font-body-lg text-body-lg text-secondary mt-1">
            Here is the real-time operational health of your enterprise computer labs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-label-md font-label-md text-secondary">Last updated: {lastUpdated}</span>
          <button 
            onClick={fetchDashboardData}
            className="p-2 rounded-full border border-outline-variant text-secondary hover:bg-surface-container hover:text-primary transition-colors hover:rotate-180 duration-500 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Summary Metrics (Bento Grid Style) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
        {/* Total Assets */}
        <div 
          onClick={() => navigate('/computers')}
          className="card-elevated p-5 flex flex-col justify-between cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <Server className="w-6 h-6 text-secondary" />
            <span className="font-label-md text-label-md text-secondary uppercase font-bold">Total Assets</span>
          </div>
          <div>
            <div className="font-display text-display text-on-surface">{totalAssets}</div>
            <div className="font-body-md text-body-md text-secondary mt-1">Computers Registered</div>
          </div>
        </div>

        {/* Healthy / Online */}
        <div 
          onClick={() => navigate('/computers?status=ONLINE')}
          className="card-elevated p-5 flex flex-col justify-between border-l-4 border-l-[#10b981] cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <CheckCircle2 className="w-6 h-6 text-[#10b981]" />
            <span className="font-label-md text-label-md text-secondary uppercase font-bold">Healthy</span>
          </div>
          <div>
            <div className="font-display text-display text-on-surface">{healthyCount}</div>
            <div className="font-body-md text-body-md text-secondary mt-1">Online & Ready</div>
          </div>
        </div>

        {/* Critical / Offline */}
        <div 
          onClick={() => navigate('/computers?status=CRITICAL')}
          className="card-elevated p-5 flex flex-col justify-between border-l-4 border-l-error bg-error-container/10 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <XCircle className="w-6 h-6 text-error animate-pulse" />
            <span className="font-label-md text-label-md text-error font-bold uppercase">Critical</span>
          </div>
          <div>
            <div className="font-display text-display text-error">{criticalCount}</div>
            <div className="font-body-md text-body-md text-on-surface-variant mt-1">Offline or Failing</div>
          </div>
        </div>

        {/* Warning / Needs Attention */}
        <div 
          onClick={() => navigate('/computers?status=WARNING')}
          className="card-elevated p-5 flex flex-col justify-between border-l-4 border-l-[#f59e0b] cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-6 h-6 text-[#f59e0b]" />
            <span className="font-label-md text-label-md text-secondary uppercase font-bold">Warning</span>
          </div>
          <div>
            <div className="font-display text-display text-on-surface">{warningCount}</div>
            <div className="font-body-md text-body-md text-secondary mt-1">Needs Attention</div>
          </div>
        </div>
      </section>

      {/* Main Core Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: System Health & AI Insights */}
        <div className="lg:col-span-2 space-y-6">
          {/* System Health Visual */}
          <section className="card-elevated p-6 animate-fade-in-up">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              System Health Overview
            </h3>
            {/* Clean Stacked Bar Visualization */}
            <div className="space-y-4">
              <div className="flex justify-between font-label-md text-label-md mb-2">
                <span className="text-secondary">Network Operational Status</span>
                <span className="text-on-surface font-bold">{healthyPercent}% Healthy</span>
              </div>
              <div className="w-full h-3.5 bg-surface-container-high rounded-full overflow-hidden flex">
                <div className="bg-[#10b981] h-full shimmer-effect" style={{ width: `${healthyPercent}%` }} />
                <div className="bg-[#f59e0b] h-full" style={{ width: `${warningPercent}%` }} />
                <div className="bg-error h-full" style={{ width: `${criticalPercent}%` }} />
              </div>
              <div className="flex gap-6 mt-4 pt-4 border-t border-outline-variant">
                <div className="flex items-center gap-2">
                  <span className="status-dot status-healthy" />
                  <span className="font-body-md text-body-md text-secondary">{healthyCount} Healthy</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="status-dot status-warning" />
                  <span className="font-body-md text-body-md text-secondary">{warningCount} Attention</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="status-dot status-critical" />
                  <span className="font-body-md text-body-md text-secondary">{criticalCount} Critical</span>
                </div>
              </div>
            </div>
          </section>

          {/* AI Predictive Insights (Glassmorphism inspired) */}
          <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-container/10 via-surface to-surface border border-primary/20 p-6 shadow-sm">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-2 font-bold">
                <BrainCircuit className="w-6 h-6 text-primary" />
                AI Predictive Insights
              </h3>
              <button 
                onClick={() => navigate('/analytics')}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                View Predictions <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
              {aiPredictions.length > 0 ? (
                aiPredictions.slice(0, 2).map((pred, idx) => (
                  <div key={idx} className="bg-surface/90 backdrop-blur-sm border border-outline-variant rounded-lg p-4 flex items-start gap-3 hover:border-primary-fixed transition-colors">
                    <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-body-md text-body-md font-bold text-on-surface">{pred.predictedIssue || 'Resource Risk'}</h4>
                      <p className="font-body-md text-body-md text-secondary mt-1 line-clamp-2">
                        {pred.reasons?.[0] || pred.mainFactors?.[0] || `Estimated timeframe: ${pred.estimatedTimeframe || '~14 days'}`}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="bg-surface/90 backdrop-blur-sm border border-outline-variant rounded-lg p-4 flex items-start gap-3 hover:border-primary-fixed transition-colors">
                    <Activity className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-body-md text-body-md font-semibold text-on-surface">Performance Risk Trend</h4>
                      <p className="font-body-md text-body-md text-secondary mt-1">Linear regression engines analyzing active process concurrency across registered computers.</p>
                    </div>
                  </div>
                  <div className="bg-surface/90 backdrop-blur-sm border border-outline-variant rounded-lg p-4 flex items-start gap-3 hover:border-primary-fixed transition-colors">
                    <BrainCircuit className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-body-md text-body-md font-semibold text-on-surface">Hardware Degradation Model</h4>
                      <p className="font-body-md text-body-md text-secondary mt-1">Continuous storage exhaustion & thermal trend monitoring active across all lab assets.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Active Alerts & Lab Readiness Overview */}
        <div className="space-y-6">
          {/* Recent Alerts */}
          <section className="card-elevated p-0 overflow-hidden flex flex-col h-full max-h-[320px]">
            <div className="p-4 border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                <Bell className="w-5 h-5 text-secondary" />
                Active Alerts
              </h3>
              <button onClick={() => navigate('/alerts')} className="font-label-md text-label-md text-primary hover:underline font-bold">
                View All ({alerts.length})
              </button>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-outline-variant">
              {alerts.length > 0 ? (
                alerts.slice(0, 4).map((alert) => (
                  <div key={alert.id} className="p-4 hover:bg-surface-container-low transition-colors flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      alert.severity === 'CRITICAL' || alert.type?.includes('CRITICAL') ? 'bg-error-container text-error' : 'bg-amber-100 text-amber-700'
                    }`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-label-md text-label-md px-1.5 py-0.5 rounded font-bold ${
                          alert.severity === 'CRITICAL' ? 'bg-error text-on-error' : 'bg-[#f59e0b] text-white'
                        }`}>
                          {alert.severity || 'WARNING'}
                        </span>
                        <span className="font-mono-sm text-mono-sm text-secondary truncate">{alert.computerHostname || 'Lab Asset'}</span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface truncate">{alert.message || alert.title}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-secondary text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <span>No active critical alerts recorded across computer labs.</span>
                </div>
              )}
            </div>
          </section>

          {/* Lab Readiness Overview */}
          <section className="card-elevated p-4">
            <div className="flex items-center justify-between mb-4 border-b border-outline-variant pb-2">
              <h3 className="font-headline-md text-headline-md text-on-surface">Lab Readiness Overview</h3>
              <button onClick={() => navigate('/lab-readiness')} className="font-label-md text-label-md text-primary hover:underline font-bold">
                Details
              </button>
            </div>
            <div className="space-y-3">
              {Object.keys(labGroups).length > 0 ? (
                Object.entries(labGroups).map(([labName, comps]) => {
                  const labOnline = comps.filter(c => c.status === 'ONLINE').length;
                  const labPercent = comps.length > 0 ? Math.round((labOnline / comps.length) * 100) : 100;
                  return (
                    <div 
                      key={labName}
                      onClick={() => navigate(`/computers?lab=${encodeURIComponent(labName)}`)}
                      className="flex items-center justify-between p-2.5 hover:bg-surface-container rounded-lg transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <Layers className="w-5 h-5 text-secondary group-hover:text-primary transition-colors" />
                        <div>
                          <div className="font-body-md text-body-md font-semibold text-on-surface">{labName}</div>
                          <div className="font-label-md text-label-md text-secondary">{comps.length} Computers</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-body-md text-body-md font-bold ${labPercent >= 90 ? 'text-[#10b981]' : 'text-[#f59e0b]'}`}>
                          {labPercent}% Ready
                        </div>
                        <div className="w-20 h-1.5 bg-surface-container-high rounded-full mt-1 ml-auto overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${labPercent >= 90 ? 'bg-[#10b981]' : 'bg-[#f59e0b]'}`} 
                            style={{ width: `${labPercent}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-secondary">
                  Loading campus labs...
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
