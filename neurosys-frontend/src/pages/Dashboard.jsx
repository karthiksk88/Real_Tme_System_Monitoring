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
    const interval = setInterval(fetchDashboardData, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      let compList = [];
      let alertList = [];

      // 1. Fetch Computers with Native Fetch Fallback
      try {
        const compRes = await metricsService.getAllComputers();
        compList = compRes?.data || (Array.isArray(compRes) ? compRes : []);
      } catch (e) {
        try {
          const rawRes = await fetch('/api/v1/computers');
          if (rawRes.ok) {
            const rawData = await rawRes.json();
            compList = rawData?.data || [];
          }
        } catch (fetchErr) {
          console.error('Direct fetch fallback failed', fetchErr);
        }
      }

      // 2. Fetch Alerts with Native Fetch Fallback
      try {
        const alertRes = await metricsService.getActiveAlerts();
        alertList = alertRes?.data || (Array.isArray(alertRes) ? alertRes : []);
      } catch (e) {
        try {
          const rawRes = await fetch('/api/v1/alerts');
          if (rawRes.ok) {
            const rawData = await rawRes.json();
            alertList = rawData?.data || [];
          }
        } catch (fetchErr) {
          console.error('Direct alert fetch failed', fetchErr);
        }
      }

      if (Array.isArray(compList) && compList.length > 0) {
        setComputers(compList);
      }
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

  // Real Database Counts - Active endpoints include ONLINE & WARNING
  const totalAssets = computers.length;
  const activeCount = computers.filter(c => c.status === 'ONLINE' || c.status === 'WARNING').length;
  const criticalCount = computers.filter(c => c.status === 'CRITICAL' || c.status === 'OFFLINE').length;
  const warningCount = computers.filter(c => c.status === 'WARNING').length;

  const healthyPercent = totalAssets > 0 ? Math.round((activeCount / totalAssets) * 100) : 100;
  const warningPercent = totalAssets > 0 ? Math.round((warningCount / totalAssets) * 100) : 0;
  const criticalPercent = totalAssets > 0 ? Math.round((criticalCount / totalAssets) * 100) : 0;

  // Group real computers by lab
  const labGroups = computers.reduce((acc, c) => {
    const lab = c.labName || 'Lab Alpha';
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

        {/* Active Endpoints */}
        <div 
          onClick={() => navigate('/computers')}
          className="card-elevated p-4 flex flex-col justify-between border-l-4 border-l-[#10b981] hover:scale-[1.02] hover:shadow-lg transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="material-symbols-outlined text-[#10b981]">check_circle</span>
            <span className="text-label-md font-label-md text-secondary">Active Endpoints</span>
          </div>
          <div>
            <div className="text-display font-display text-on-surface">{activeCount}</div>
            <div className="text-body-md font-body-md text-secondary mt-1">Online &amp; Streaming</div>
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
            <div className="text-body-md font-body-md text-secondary mt-1">High Load / Alerts</div>
          </div>
        </div>
      </section>

      {/* Core Dashboard Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: System Health & AI Predictions */}
        <div className="lg:col-span-2 space-y-6">
          {/* System Health Overview */}
          <section 
            onClick={() => navigate('/analytics')}
            className="card-elevated p-6 animate-fade-in-up hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-headline-md font-headline-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">donut_large</span>
                System Health Overview
              </h3>
              <span className="text-mono-sm font-mono-sm text-secondary">
                {totalAssets > 0 ? `${activeCount} of ${totalAssets} Endpoints Active` : 'Initializing...'}
              </span>
            </div>

            {/* Health Bar Visualization */}
            <div className="space-y-3">
              <div className="w-full bg-surface-container-high h-3 rounded-full overflow-hidden flex">
                <div className="bg-[#10b981] h-full transition-all duration-500" style={{ width: `${healthyPercent}%` }}></div>
                <div className="bg-[#f59e0b] h-full transition-all duration-500" style={{ width: `${warningPercent}%` }}></div>
                <div className="bg-error h-full transition-all duration-500" style={{ width: `${criticalPercent}%` }}></div>
              </div>

              <div className="flex items-center justify-between text-mono-sm font-mono-sm pt-2">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-on-surface font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span> {activeCount} Active
                  </span>
                  <span className="flex items-center gap-1.5 text-on-surface font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span> {warningCount} Attention
                  </span>
                  <span className="flex items-center gap-1.5 text-on-surface font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-error"></span> {criticalCount} Critical
                  </span>
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

          {/* Live Computers Table Card Directly on Dashboard */}
          <section className="card-elevated p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4 border-b border-outline-variant pb-3">
              <h3 className="text-headline-md font-headline-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">desktop_windows</span>
                Live Connected Computers ({computers.length})
              </h3>
              <button 
                onClick={() => navigate('/computers')}
                className="text-label-md font-label-md text-primary hover:underline font-bold cursor-pointer"
              >
                View Full Fleet Page →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant text-label-md font-label-md text-secondary">
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Computer Name</th>
                    <th className="py-2.5 px-3">Lab</th>
                    <th className="py-2.5 px-3">CPU %</th>
                    <th className="py-2.5 px-3">RAM %</th>
                    <th className="py-2.5 px-3">Storage %</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-body-md font-body-md text-on-background divide-y divide-outline-variant/50">
                  {computers.length > 0 ? (
                    computers.map((comp) => {
                      const cpu = Math.round(comp.currentCpuUsage ?? comp.lastRecordedCpuUsage ?? 0);
                      const ram = Math.round(comp.currentRamUsage ?? comp.lastRecordedRamUsage ?? 0);
                      const disk = Math.round(comp.currentDiskUsage ?? comp.lastRecordedDiskUsage ?? 0);
                      const isLaptop = comp.hostname === 'LAPTOP-PALBUQS2';

                      return (
                        <tr key={comp.id} className={`hover:bg-surface-container-lowest transition-colors ${isLaptop ? 'bg-primary-container/10 border-l-4 border-l-primary' : ''}`}>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${comp.status === 'ONLINE' ? 'bg-[#10b981] status-dot-active' : comp.status === 'WARNING' ? 'bg-[#f59e0b] status-dot-active' : 'bg-error'}`}></div>
                              <span className={`text-mono-sm font-mono-sm font-bold ${comp.status === 'ONLINE' ? 'text-[#10b981]' : comp.status === 'WARNING' ? 'text-[#f59e0b]' : 'text-error'}`}>
                                {comp.status}
                              </span>
                            </div>
                          </td>
                          <td 
                            onClick={() => navigate(`/computers/${comp.id}`)}
                            className="py-2.5 px-3 font-bold text-primary cursor-pointer hover:underline"
                          >
                            {comp.hostname} {isLaptop ? '(Your Computer)' : ''}
                          </td>
                          <td className="py-2.5 px-3 text-secondary font-medium">{comp.labName || 'Lab Alpha'}</td>
                          <td className="py-2.5 px-3 font-mono-sm font-bold text-primary">{cpu}%</td>
                          <td className="py-2.5 px-3 font-mono-sm font-bold text-[#10b981]">{ram}%</td>
                          <td className="py-2.5 px-3 font-mono-sm font-bold text-secondary">{disk}%</td>
                          <td className="py-2.5 px-3 text-right">
                            <button 
                              onClick={() => navigate(`/computers/${comp.id}`)}
                              className="text-label-md font-label-md px-3 py-1 rounded border border-outline-variant hover:border-primary hover:text-primary transition-colors bg-surface cursor-pointer font-bold"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-secondary text-body-md">
                        Connecting to database...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                      <span className="material-symbols-outlined text-error text-[18px]">warning</span>
                    </div>
                    <div>
                      <h4 className="text-body-md font-body-md font-semibold text-on-surface">{alert.title || 'System Alert'}</h4>
                      <p className="text-body-md font-body-md text-secondary mt-0.5">{alert.description || alert.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-secondary text-body-md flex flex-col items-center">
                  <span className="material-symbols-outlined text-[#10b981] text-3xl mb-2">check_circle</span>
                  No active telemetry alerts recorded in database.
                </div>
              )}
            </div>
          </section>

          {/* Lab Readiness Overview */}
          <section className="card-elevated p-6">
            <h3 
              onClick={() => navigate('/lab-readiness')}
              className="text-headline-md font-headline-md text-on-surface mb-4 flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-primary">fact_check</span>
              Lab Readiness Overview
            </h3>

            <div className="space-y-4">
              {Object.keys(labGroups).length > 0 ? (
                Object.entries(labGroups).map(([labName, labComps]) => {
                  const labOnline = labComps.filter(c => c.status === 'ONLINE' || c.status === 'WARNING').length;
                  const labPercent = Math.round((labOnline / labComps.length) * 100);

                  return (
                    <div 
                      key={labName}
                      onClick={() => navigate('/lab-readiness')}
                      className="p-3 bg-surface-container-low rounded-lg border border-outline-variant space-y-2 hover:border-primary transition-colors cursor-pointer"
                    >
                      <div className="flex justify-between items-center text-body-md font-body-md font-semibold text-on-surface">
                        <span>{labName}</span>
                        <span className="text-mono-sm font-mono-sm text-primary font-bold">{labOnline} / {labComps.length} Ready ({labPercent}%)</span>
                      </div>
                      <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${labPercent}%` }}></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-secondary text-body-md">
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
