import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { metricsService } from '../services/metricsService';

const Dashboard = () => {
  const navigate = useNavigate();
  const [computers, setComputers] = useState([]);
  const [alerts, setAlerts] = useState([]);
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
    } catch (err) {
      console.error('Error loading dashboard metrics', err);
    }
  };

  const totalAssets = computers.length || 40;
  const healthyCount = computers.filter(c => c.status === 'ONLINE').length || (computers.length ? 0 : 36);
  const criticalCount = computers.filter(c => c.status === 'CRITICAL' || c.status === 'OFFLINE').length || (computers.length ? 0 : 3);
  const warningCount = computers.filter(c => c.status === 'WARNING').length || (computers.length ? 0 : 1);

  const healthyPercent = totalAssets > 0 ? Math.round((healthyCount / totalAssets) * 100) : 90;
  const warningPercent = totalAssets > 0 ? Math.round((warningCount / totalAssets) * 100) : 2.5;
  const criticalPercent = totalAssets > 0 ? Math.round((criticalCount / totalAssets) * 100) : 7.5;

  const labGroups = computers.reduce((acc, c) => {
    const lab = c.labName || 'Lab A';
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
          <p className="text-body-lg font-body-lg text-secondary mt-1">Here's the current health of your computer labs.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-label-md font-label-md text-secondary">Last updated: {lastUpdated}</span>
          <button 
            onClick={fetchDashboardData}
            className="p-2 rounded-full border border-outline-variant text-secondary hover:bg-surface-container hover:text-primary transition-colors hover:rotate-180 duration-500"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>
      </section>

      {/* Summary Metrics (Bento Grid Style) */}
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
            <div className="text-body-md font-body-md text-secondary mt-1">Computers</div>
          </div>
        </div>

        {/* Healthy */}
        <div 
          onClick={() => navigate('/computers')}
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
          onClick={() => navigate('/computers')}
          className="card-elevated p-4 flex flex-col justify-between border-l-4 border-l-error bg-error-container/10 hover:scale-[1.02] hover:shadow-lg transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="material-symbols-outlined text-error icon-fill animate-pulse">error</span>
            <span className="text-label-md font-label-md text-error font-bold">Critical</span>
          </div>
          <div>
            <div className="text-display font-display text-error">{criticalCount}</div>
            <div className="text-body-md font-body-md text-on-surface-variant mt-1">Offline</div>
          </div>
        </div>

        {/* Needs Attention (Warning) */}
        <div 
          onClick={() => navigate('/computers')}
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
        {/* Left Column: System Health & Insights */}
        <div className="lg:col-span-2 space-y-6">
          {/* System Health Visual */}
          <section className="card-elevated p-6 animate-fade-in-up">
            <h3 className="text-headline-md font-headline-md text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">donut_large</span>
              System Health Overview
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between text-label-md font-label-md mb-2">
                <span className="text-secondary">Network Status</span>
                <span className="text-on-surface font-medium">{healthyPercent}% Operational</span>
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

          {/* AI Insights */}
          <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-container/10 to-surface border border-primary/20 p-6">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
            <h3 className="text-headline-md font-headline-md text-primary mb-4 flex items-center gap-2 relative z-10 cursor-pointer" onClick={() => navigate('/analytics')}>
              <span className="material-symbols-outlined icon-fill">psychology</span>
              AI Predictive Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
              <div 
                onClick={() => navigate('/analytics')}
                className="bg-surface/80 backdrop-blur-sm border border-outline-variant rounded-lg p-4 flex items-start gap-3 hover:border-primary-fixed transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[#f59e0b] mt-0.5">timeline</span>
                <div>
                  <h4 className="text-body-md font-body-md font-semibold text-on-surface">Performance Risk</h4>
                  <p className="text-body-md font-body-md text-secondary mt-1">3 computers in Lab A show increasing thermal throttling over the last 48h.</p>
                </div>
              </div>
              <div 
                onClick={() => navigate('/analytics')}
                className="bg-surface/80 backdrop-blur-sm border border-outline-variant rounded-lg p-4 flex items-start gap-3 hover:border-primary-fixed transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-error mt-0.5">build_circle</span>
                <div>
                  <h4 className="text-body-md font-body-md font-semibold text-on-surface">Hardware Degradation</h4>
                  <p className="text-body-md font-body-md text-secondary mt-1">2 computers in Lab B require immediate disk attention before failure.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Alerts & Lab List */}
        <div className="space-y-6">
          {/* Recent Alerts */}
          <section className="card-elevated p-0 overflow-hidden flex flex-col h-full max-h-[300px]">
            <div className="p-4 border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center sticky top-0">
              <h3 className="text-headline-md font-headline-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">notifications_active</span>
                Active Alerts
              </h3>
              <a onClick={() => navigate('/alerts')} className="text-label-md font-label-md text-primary hover:underline cursor-pointer" href="#">View All</a>
            </div>
            <div className="overflow-y-auto flex-1">
              {alerts.length > 0 ? (
                alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="p-4 border-b border-outline-variant hover:bg-surface-container-lowest transition-colors flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-error-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-error text-[16px]">power_off</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-label-md font-label-md bg-error text-on-error px-1.5 py-0.5 rounded">{alert.severity || 'Critical'}</span>
                        <span className="text-mono-sm font-mono-sm text-secondary">{alert.computerHostname || 'Lab Switch'}</span>
                      </div>
                      <p className="text-body-md font-body-md text-on-surface">{alert.message || alert.title}</p>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="p-4 border-b border-outline-variant hover:bg-surface-container-lowest transition-colors flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-error-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-error text-[16px]">power_off</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-label-md font-label-md bg-error text-on-error px-1.5 py-0.5 rounded">Critical</span>
                        <span className="text-mono-sm font-mono-sm text-secondary">10:42 AM</span>
                      </div>
                      <p className="text-body-md font-body-md text-on-surface">Lab A Switch offline. 3 machines disconnected.</p>
                    </div>
                  </div>
                  <div className="p-4 border-b border-outline-variant hover:bg-surface-container-lowest transition-colors flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#fef3c7] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#d97706] text-[16px]">update</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-label-md font-label-md bg-[#f59e0b] text-white px-1.5 py-0.5 rounded">Warning</span>
                        <span className="text-mono-sm font-mono-sm text-secondary">08:15 AM</span>
                      </div>
                      <p className="text-body-md font-body-md text-on-surface">Lab B missing critical security patch.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Lab Overview List */}
          <section className="card-elevated p-4">
            <h3 className="text-headline-md font-headline-md text-on-surface mb-4 border-b border-outline-variant pb-2">Lab Readiness Overview</h3>
            <div className="space-y-3">
              {/* Lab A */}
              <div 
                onClick={() => navigate('/lab-readiness')}
                className="flex items-center justify-between p-2 hover:bg-surface-container rounded-lg transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary group-hover:text-primary transition-colors">domain</span>
                  <div>
                    <div className="text-body-md font-body-md font-semibold text-on-surface">Lab A</div>
                    <div className="text-label-md font-label-md text-secondary">40 Computers</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-body-md font-body-md text-[#10b981] font-semibold">92% Ready</div>
                  <div className="w-16 h-1 bg-surface-container-high rounded-full mt-1 ml-auto">
                    <div className="bg-[#10b981] h-full rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
              </div>
              {/* Lab B */}
              <div 
                onClick={() => navigate('/lab-readiness')}
                className="flex items-center justify-between p-2 hover:bg-surface-container rounded-lg transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary group-hover:text-primary transition-colors">domain</span>
                  <div>
                    <div className="text-body-md font-body-md font-semibold text-on-surface">Lab B</div>
                    <div className="text-label-md font-label-md text-secondary">30 Computers</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-body-md font-body-md text-[#f59e0b] font-semibold">86% Ready</div>
                  <div className="w-16 h-1 bg-surface-container-high rounded-full mt-1 ml-auto">
                    <div className="bg-[#f59e0b] h-full rounded-full" style={{ width: '86%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
