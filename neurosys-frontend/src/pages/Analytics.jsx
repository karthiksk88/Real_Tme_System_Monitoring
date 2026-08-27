import React, { useState, useEffect } from 'react';
import { metricsService } from '../services/metricsService';

const Analytics = () => {
  const [predictionData, setPredictionData] = useState(null);
  const [computers, setComputers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntelligenceData();
  }, []);

  const fetchIntelligenceData = async () => {
    try {
      const [compRes] = await Promise.all([
        metricsService.getAllComputers().catch(() => ({ data: [] }))
      ]);

      const compList = compRes?.data || (Array.isArray(compRes) ? compRes : []);
      setComputers(Array.isArray(compList) ? compList : []);

      if (Array.isArray(compList) && compList.length > 0) {
        const targetId = compList[0].id;
        const predRes = await metricsService.getCrashPrediction(targetId).catch(() => null);
        setPredictionData(predRes?.data || predRes);
      }
    } catch (e) {
      console.error('Error fetching AI intelligence metrics', e);
    } finally {
      setLoading(false);
    }
  };

  const riskScore = "12%";
  const predictedFailuresCount = 4;
  const efficiencyScore = "84%";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-display text-display text-on-background mb-2">AI Intelligence</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Predictive analytics and system risk modeling.</p>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Risk Overview (Bento Box 1) */}
        <div className="lg:col-span-1 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-fade-in-up stagger-1">
          <div>
            <div className="flex items-center gap-2 text-on-surface-variant mb-4">
              <span className="material-symbols-outlined text-primary">warning</span>
              <span className="font-label-md text-label-md uppercase tracking-wider">Fleet Risk Score</span>
            </div>
            <div className="font-display text-display text-error mb-1 animate-pulse-risk inline-block">{riskScore}</div>
            <p className="font-body-md text-body-md text-on-surface-variant">Overall risk of critical failure across all managed labs within the next 30 days.</p>
          </div>
          <div className="mt-6 pt-4 border-t border-outline-variant flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">Trend:</span>
            <div className="flex items-center text-primary font-label-md text-label-md">
              <span className="material-symbols-outlined text-[16px] mr-1">trending_down</span>
              -2.4% from last week
            </div>
          </div>
        </div>

        {/* Performance Trends (Bento Box 2) */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col animate-fade-in-up stagger-2">
          <div className="flex items-center gap-2 text-on-surface-variant mb-6">
            <span className="material-symbols-outlined text-primary">insights</span>
            <span className="font-label-md text-label-md uppercase tracking-wider">Performance Trends</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
            <div>
              <div className="font-headline-md text-headline-md text-on-surface mb-2">Predicted Failures</div>
              <div className="font-display text-display text-tertiary-container mb-2">{predictedFailuresCount}</div>
              <p className="font-body-md text-body-md text-on-surface-variant">Machines showing high probability of hardware or critical software failure.</p>
            </div>
            <div>
              <div className="font-headline-md text-headline-md text-on-surface mb-2">Efficiency Insights</div>
              <div className="font-display text-display text-primary mb-2">{efficiencyScore}</div>
              <p className="font-body-md text-body-md text-on-surface-variant">Average resource utilization efficiency. 16% of fleet is underutilized.</p>
            </div>
          </div>
        </div>

        {/* High Risk Predictions Cards */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-fade-in-up stagger-3">
          <div className="flex items-center gap-2 text-on-surface-variant mb-6">
            <span className="material-symbols-outlined text-primary">computer</span>
            <span className="font-label-md text-label-md uppercase tracking-wider">High Risk Predictions</span>
          </div>
          <div className="space-y-4">
            {/* Card 1 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-outline-variant rounded-DEFAULT bg-surface-bright gap-4 transition-all hover:bg-surface-container-lowest hover:border-primary/30">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined">memory</span>
                </div>
                <div>
                  <div className="font-headline-md text-headline-md text-on-surface">PC-18</div>
                  <div className="font-body-md text-body-md text-error flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-error animate-pulse-risk"></div>
                    Increasing Performance Risk
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:flex gap-4 sm:gap-8 w-full sm:w-auto">
                <div>
                  <span className="block font-label-md text-label-md text-on-surface-variant">Reason</span>
                  <span className="font-body-md text-body-md">Memory usage trend</span>
                </div>
                <div>
                  <span className="block font-label-md text-label-md text-on-surface-variant">Confidence</span>
                  <span className="font-body-md text-body-md font-bold">89%</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="block font-label-md text-label-md text-on-surface-variant">Timeframe</span>
                  <span className="font-body-md text-body-md">10-14 days</span>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-outline-variant rounded-DEFAULT bg-surface-bright gap-4 transition-all hover:bg-surface-container-lowest hover:border-primary/30">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined">hard_drive</span>
                </div>
                <div>
                  <div className="font-headline-md text-headline-md text-on-surface">LAB-A-04</div>
                  <div className="font-body-md text-body-md text-tertiary-container flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-tertiary-container animate-pulse"></div>
                    Storage Degradation
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:flex gap-4 sm:gap-8 w-full sm:w-auto">
                <div>
                  <span className="block font-label-md text-label-md text-on-surface-variant">Reason</span>
                  <span className="font-body-md text-body-md">Read/Write errors</span>
                </div>
                <div>
                  <span className="block font-label-md text-label-md text-on-surface-variant">Confidence</span>
                  <span className="font-body-md text-body-md font-bold">76%</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="block font-label-md text-label-md text-on-surface-variant">Timeframe</span>
                  <span className="font-body-md text-body-md">21-30 days</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="lg:col-span-1 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col animate-fade-in-up stagger-4 shimmer-effect">
          <div className="flex items-center gap-2 text-on-surface-variant mb-6 relative z-10">
            <span className="material-symbols-outlined text-primary">lightbulb</span>
            <span className="font-label-md text-label-md uppercase tracking-wider">AI Recommendations</span>
          </div>
          <div className="space-y-4 flex-1 relative z-10">
            <div className="p-4 bg-secondary-container/20 rounded-DEFAULT border border-secondary-container">
              <div className="font-label-md text-label-md font-bold text-primary mb-1">High Priority</div>
              <p className="font-body-md text-body-md text-on-surface mb-3">Re-image 3 computers in Lab B to improve overall lab performance score.</p>
              <button className="bg-primary text-on-primary font-label-md text-label-md px-4 py-2 rounded-DEFAULT w-full hover:bg-primary/90 transition-colors">Schedule Re-image</button>
            </div>
            <div className="p-4 bg-surface-container-high rounded-DEFAULT border border-outline-variant">
              <div className="font-label-md text-label-md text-on-surface-variant mb-1">Optimization</div>
              <p className="font-body-md text-body-md text-on-surface">Update graphics drivers on 12 machines showing rendering anomalies.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
