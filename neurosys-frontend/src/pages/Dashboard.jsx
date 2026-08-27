import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { metricsService } from '../services/metricsService';

const Dashboard = () => {
  const navigate = useNavigate();
  const [computers, setComputers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [aiPredictions, setAiPredictions] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('Just now');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
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

      // Fetch real AI crash risk predictions for registered computers
      if (Array.isArray(compList) && compList.length > 0) {
        const predPromises = compList.slice(0, 3).map(c => 
          metricsService.getCrashPrediction(c.id).catch(() => null)
        );
        const predResults = await Promise.all(predPromises);
        const validPreds = predResults.map(r => r?.data || r).filter(Boolean);
        setAiPredictions(validPreds);
      }
    } catch (err) {
      console.error('Error loading real dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  // Real Database Counts
  const totalAssets = computers.length;
  const healthyCount = computers.filter(c => c.status === 'ONLINE').length;
  const criticalCount = computers.filter(c => c.status === 'CRITICAL' || c.status === 'OFFLINE').length;
  const warningCount = computers.filter(c => c.status === 'WARNING' || c.status === 'PENDING').length;

  const healthyPercent = totalAssets > 0 ? Math.round((healthyCount / totalAssets) * 100) : 0;
  const warningPercent = totalAssets > 0 ? Math.round((warningCount / totalAssets) * 100) : 0;
  const criticalPercent = totalAssets > 0 ? Math.round((criticalCount / totalAssets) * 100) : 0;

  // Group real computers by lab
  const labGroups = computers.reduce((acc, c) => {
    const lab = c.labName || 'General Lab';
    if (!acc[lab]) acc[lab] = [];
    acc[lab].push(c);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-display font-display text-on-background tracking-tight">Good morning, Admin</h1>
          <p className="text-body-lg font-body-lg text-secondary mt-1">Here's the real-time operational health of your computer labs.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-label-md font-label-md text-secondary">Last updated: {lastUpdated}</span>
          <button 
            onClick={fetchDashboardData}
            title="Refresh Data"
            className="p-2 rounded-full border border-outline-variant text-secondary hover:bg-surface-container hover:text-primary transition-colors hover:rotate-180 duration-500 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>
      </section>

      {/* Summary Metrics (Bento Grid Style - 100% Real DB Data) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
        {/* Total Assets */}
        <div 
          onClick={() => navigate('/computers')}
          className="card-elevated p-4 flex flex-col justify-between hover:scale-[1.02] hover:shadow-lg transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="material-symbols-outlined text-secondary">dns</span>
            <span className="text-label-md font-label-md text-secondary">Total Assets</span>
          </div>
          <div>
            <div className="text-display font-display text-on-surface">{totalAssets}</div>
            <div className="text-body-md font-body-md text-secondary mt-1">Registered Computers</div>
          </div>
        </div>

        {/* Healthy */}
        <div 
          onClick={() => navigate('/computers?status=ONLINE')}
          className="card-elevated p-4 flex flex-col justify-between border-l-4 border-l-[#10b981] hover:scale-[1.02] hover:shadow-lg transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="material-symbols-outlined text-[#10b981]">check_circle</span>
            <span className="text-label-md font-label-md text-secondary">Healthy</span>
          </div>
          <div>
            <div className="text-display font-display text-on-surface">{healthyCount}</div>
            <div className="text-body-md font-body-md text-secondary mt-1">Online &amp; Ready</div>
          </div>
        </div>

        {/* Offline (Critical) */}
        <div 
          onClick={() => navigate('/computers?status=CRITICAL')}
          className="card-elevated p-4 flex flex-col justify-between border-l-4 border-l-error bg-error-container/10 hover:scale-[1.02] hover:shadow-lg transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="material-symbols-outlined text-error icon-fill animate-pulse">error</span>
            <span className="text-label-md font-label-md text-error font-bold">Critical</span>
          </div>
          <div>
            <div className="text-display font-display text-error">{criticalCount}</div>
            <div className="text-body-md font-body-md text-on-surface-variant mt-1">Offline or Failing</div>
          </div>
        </div>

        {/* Needs Attention (Warning) */}
        <div 
          onClick={() => navigate('/computers?status=WARNING')}
          className="card-elevated p-4 flex flex-col justify-between border-l-4 border-l-[#f59e0b] hover:scale-[1.02] hover:shadow-lg transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="material-symbols-outlined text-[#f59e0b]">warning</span>
            <span className="text-label-md font-label-md text-secondary">Warning</span>
          </div>
          <div>
            <div className="text-display font-display text-on-surface">{warningCount}</div>
            <div className="text-body-md font-body-md text-secondary mt-1">Needs Attention</div>
          </div>
        </div>
      </section>

      {/* Core Dashboard Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Real System Health & Insights */}
        <div className="lg:col-span-2 space-y-6">
          {/* System Health Visual */}
          <section className="card-elevated p-6 animate-fade-in-up">
            <h3 className="text-headline-md font-headline-md text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">donut_large</span>
              System Health Overview
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between text-label-md font-label-md mb-2">
                <span className="text-secondary">Network Operational Status</span>
                <span className="text-on-surface font-medium">{totalAssets > 0 ? `${healthyPercent}% Operational` : 'No Active Endpoints'}</span>
              </div>
              <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden flex">
                <div className="bg-[#10b981] h-full shimmer-effect" style={{ width: `${healthyPercent}%` }} />
                <div className="bg-[#f59e0b] h-full" style={{ width: `${warningPercent}%` }} />
                <div className="bg-error h-full" style={{ width: `${criticalPercent}%` }} />
              </div>
              <div className="flex gap-6 mt-4 pt-4 border-t border-outline-variant">
                <div className="flex items-center gap-2">
                  <span className="status-dot status-healthy animate-pulse-soft"></span>
                  <span className="text-body-md font-body-md text-secondary">{healthyCount} Healthy</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="status-dot status-warning"></span>
                  <span className="text-body-md font-body-md text-secondary">{warningCount} Attention</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="status-dot status-critical animate-pulse-soft"></span>
                  <span className="text-body-md font-body-md text-secondary">{criticalCount} Critical</span>
                </div>
              </div>
            </div>
          </section>

          {/* AI Predictive Insights (Real DB Models) */}
          <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-container/10 to-surface border border-primary/20 p-6">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
            <h3 
              onClick={() => navigate('/analytics')}
              className="text-headline-md font-headline-md text-primary mb-4 flex items-center gap-2 relative z-10 cursor-pointer"
            >
              <span className="material-symbols-outlined icon-fill">psychology</span>
              AI Predictive Insights
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
              {aiPredictions.length > 0 ? (
                aiPredictions.map((pred, idx) => (
                  <div 
                    key={idx}
                    onClick={() => navigate('/analytics')}
                    className="bg-surface/80 backdrop-blur-sm border border-outline-variant rounded-lg p-4 flex items-start gap-3 hover:border-primary-fixed transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[#f59e0b] mt-0.5">timeline</span>
                    <div>
                      <h4 className="text-body-md font-body-md font-semibold text-on-surface">{pred.predictedIssue || 'Resource Risk Analysis'}</h4>
                      <p className="text-body-md font-body-md text-secondary mt-1">
                        {pred.reasons?.[0] || pred.contributingFactors?.[0] || `Estimated timeframe: ${pred.estimatedTimeframe || '~14 days'}`}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-6 bg-surface/80 rounded-lg border border-outline-variant text-center text-secondary text-sm">
                  <span className="material-symbols-outlined text-primary text-3xl mb-1 block">auto_awesome</span>
                  <p className="font-bold text-on-surface">Linear Regression Forecasting Active</p>
                  <p className="text-xs mt-1">Connect your Windows monitoring agent to collect telemetry samples for dynamic failure predictions.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Real DB Active Alerts & Lab Readiness */}
        <div className="space-y-6">
          {/* Active Alerts */}
          <section className="card-elevated p-0 overflow-hidden flex flex-col h-full max-h-[300px]">
            <div className="p-4 border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center sticky top-0">
              <h3 className="text-headline-md font-headline-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">notifications_active</span>
                Active Alerts ({alerts.length})
              </h3>
              <a onClick={() => navigate('/alerts')} className="text-label-md font-label-md text-primary hover:underline cursor-pointer" href="#">View All</a>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-outline-variant">
              {alerts.length > 0 ? (
                alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="p-4 hover:bg-surface-container-lowest transition-colors flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-error-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-error text-[16px]">power_off</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-label-md font-label-md bg-error text-on-error px-1.5 py-0.5 rounded">{alert.severity || 'Critical'}</span>
                        <span className="text-mono-sm font-mono-sm text-secondary">{alert.computerHostname || 'Computer'}</span>
                      </div>
                      <p className="text-body-md font-body-md text-on-surface">{alert.message || alert.title}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-secondary text-xs">
                  <span className="material-symbols-outlined text-[#10b981] text-3xl mb-1 block">check_circle</span>
                  <span>No active telemetry alerts recorded in database.</span>
                </div>
              )}
            </div>
          </section>

          {/* Real Lab Readiness Overview */}
          <section className="card-elevated p-4">
            <h3 className="text-headline-md font-headline-md text-on-surface mb-4 border-b border-outline-variant pb-2">Lab Readiness Overview</h3>
            <div className="space-y-3">
              {Object.keys(labGroups).length > 0 ? (
                Object.entries(labGroups).map(([labName, comps]) => {
                  const online = comps.filter(c => c.status === 'ONLINE').length;
                  const percent = comps.length > 0 ? Math.round((online / comps.length) * 100) : 0;
                  return (
                    <div 
                      key={labName}
                      onClick={() => navigate('/lab-readiness')}
                      className="flex items-center justify-between p-2 hover:bg-surface-container rounded-lg transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary group-hover:text-primary transition-colors">domain</span>
                        <div>
                          <div className="text-body-md font-body-md font-semibold text-on-surface">{labName}</div>
                          <div className="text-label-md font-label-md text-secondary">{comps.length} Computers</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-body-md font-body-md font-semibold ${percent >= 90 ? 'text-[#10b981]' : 'text-[#f59e0b]'}`}>
                          {percent}% Ready
                        </div>
                        <div className="w-16 h-1 bg-surface-container-high rounded-full mt-1 ml-auto">
                          <div className={`h-full rounded-full ${percent >= 90 ? 'bg-[#10b981]' : 'bg-[#f59e0b]'}`} style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-secondary">
                  No labs configured yet. Registered computers will appear here grouped by lab.
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
