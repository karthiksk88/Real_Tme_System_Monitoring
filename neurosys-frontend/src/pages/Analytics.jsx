import React, { useState, useEffect } from 'react';
import { metricsService } from '../services/metricsService';

const Analytics = () => {
  const [computers, setComputers] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const compRes = await metricsService.getAllComputers().catch(() => ({ data: [] }));
      const compList = compRes?.data || (Array.isArray(compRes) ? compRes : []);
      const validComps = Array.isArray(compList) ? compList : [];
      setComputers(validComps);

      if (validComps.length > 0) {
        const predPromises = validComps.map(c => 
          metricsService.getCrashPrediction(c.id).catch(() => null)
        );
        const predResults = await Promise.all(predPromises);
        const validPreds = predResults
          .map((r, idx) => {
            const data = r?.data || r;
            if (data) {
              return { ...data, computerName: validComps[idx]?.hostname || validComps[idx]?.id };
            }
            return null;
          })
          .filter(Boolean);

        setPredictions(validPreds);
      }
    } catch (e) {
      console.error('Error loading analytics', e);
    } finally {
      setLoading(false);
    }
  };

  const totalComps = computers.length;
  const highRiskCount = predictions.filter(p => (p.confidencePercent || p.confidence || 0) >= 70).length;
  const fleetRiskPercent = totalComps > 0 ? Math.round((highRiskCount / totalComps) * 100) : 0;
  const efficiencyPercent = totalComps > 0 
    ? Math.round((computers.filter(c => c.status === 'ONLINE').length / totalComps) * 100) 
    : 100;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-display text-display text-on-background mb-2">AI Intelligence</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Predictive analytics and system risk modeling based on real telemetry data.</p>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fleet Risk Score (Bento Box 1) */}
        <div className="lg:col-span-1 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div>
            <div className="flex items-center gap-2 text-on-surface-variant mb-4">
              <span className="material-symbols-outlined text-primary">warning</span>
              <span className="font-label-md text-label-md uppercase tracking-wider">Fleet Risk Score</span>
            </div>
            <div className={`font-display text-display ${fleetRiskPercent > 20 ? 'text-error animate-pulse-risk' : 'text-primary'} mb-1 inline-block`}>
              {fleetRiskPercent}%
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Calculated probability of hardware or memory resource exhaustion across active registered endpoints.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-outline-variant flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">Active Endpoints:</span>
            <span className="font-bold text-on-surface text-label-md">{totalComps} Machines</span>
          </div>
        </div>

        {/* Performance Trends (Bento Box 2) */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col">
          <div className="flex items-center gap-2 text-on-surface-variant mb-6">
            <span className="material-symbols-outlined text-primary">insights</span>
            <span className="font-label-md text-label-md uppercase tracking-wider">Performance Trends</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
            <div>
              <div className="font-headline-md text-headline-md text-on-surface mb-2">Predicted Risk Endpoints</div>
              <div className="font-display text-display text-tertiary-container mb-2">{highRiskCount}</div>
              <p className="font-body-md text-body-md text-on-surface-variant">Computers showing statistical trend toward RAM or CPU degradation.</p>
            </div>
            <div>
              <div className="font-headline-md text-headline-md text-on-surface mb-2">Fleet Operational Score</div>
              <div className="font-display text-display text-primary mb-2">{efficiencyPercent}%</div>
              <p className="font-body-md text-body-md text-on-surface-variant">Real-time percentage of online endpoints active in lab database.</p>
            </div>
          </div>
        </div>

        {/* Real Risk Predictions Cards */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-center gap-2 text-on-surface-variant mb-6">
            <span className="material-symbols-outlined text-primary">computer</span>
            <span className="font-label-md text-label-md uppercase tracking-wider">Machine Predictions Log</span>
          </div>
          <div className="space-y-4">
            {predictions.length > 0 ? (
              predictions.map((pred, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-outline-variant rounded-DEFAULT bg-surface-bright gap-4 transition-all hover:bg-surface-container-lowest hover:border-primary/30">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">memory</span>
                    </div>
                    <div>
                      <div className="font-headline-md text-headline-md text-on-surface">{pred.computerName}</div>
                      <div className="font-body-md text-body-md text-primary flex items-center gap-1 font-bold">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                        {pred.predictedIssue || 'Telemetry Active'}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:flex gap-4 sm:gap-8 w-full sm:w-auto">
                    <div>
                      <span className="block font-label-md text-label-md text-on-surface-variant">Reason</span>
                      <span className="font-body-md text-body-md">{pred.reasons?.[0] || 'Normal Usage'}</span>
                    </div>
                    <div>
                      <span className="block font-label-md text-label-md text-on-surface-variant">Confidence</span>
                      <span className="font-body-md text-body-md font-bold">{pred.confidencePercent || pred.confidence || 85}%</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="block font-label-md text-label-md text-on-surface-variant">Timeframe</span>
                      <span className="font-body-md text-body-md">{pred.estimatedTimeframe || '~14 days'}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 border border-dashed border-outline-variant rounded-lg text-center text-secondary text-body-md">
                No telemetry prediction models logged yet. Connect a Windows agent endpoint to generate real-time AI forecasts.
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="lg:col-span-1 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col">
          <div className="flex items-center gap-2 text-on-surface-variant mb-6 relative z-10">
            <span className="material-symbols-outlined text-primary">lightbulb</span>
            <span className="font-label-md text-label-md uppercase tracking-wider">System Recommendations</span>
          </div>
          <div className="space-y-4 flex-1 relative z-10">
            <div className="p-4 bg-secondary-container/20 rounded-DEFAULT border border-secondary-container">
              <div className="font-label-md text-label-md font-bold text-primary mb-1">Infrastructure Insight</div>
              <p className="font-body-md text-body-md text-on-surface mb-3">
                {totalComps > 0 
                  ? `Monitoring ${totalComps} registered workstation endpoints in live MySQL database.` 
                  : 'Run setup-agent.bat to connect your local machine to the monitoring backend.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
