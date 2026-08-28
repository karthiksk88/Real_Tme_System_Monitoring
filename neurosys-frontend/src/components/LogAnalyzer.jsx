import React, { useState, useEffect } from 'react';
import { metricsService } from '../services/metricsService';
import { FileText, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const LogAnalyzer = ({ computerId, logs: propLogs }) => {
  const [logs, setLogs] = useState(propLogs || []);
  const [loading, setLoading] = useState(!propLogs);

  useEffect(() => {
    if (!propLogs && computerId) {
      fetchLogs();
    }
  }, [computerId, propLogs]);

  const fetchLogs = async () => {
    try {
      const data = await metricsService.getLogs(computerId);
      const list = Array.isArray(data) ? data : (data?.data || data?.content || []);
      if (Array.isArray(list)) {
        setLogs(list);
      }
    } catch (e) {
      console.error('Error fetching logs for computer', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-elevated rounded-xl p-6 border border-slate-200 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <h3 className="text-headline-md font-headline-md text-slate-900 font-bold flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" /> Windows Event Log Diagnostics
        </h3>
        <span className="text-mono-sm font-mono-sm text-slate-700 font-bold">Real Event Stream</span>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-slate-700 text-body-md font-semibold">
            Loading Windows log stream...
          </div>
        ) : (!logs || logs.length === 0) ? (
          <div className="p-8 text-center text-slate-700 text-body-md font-semibold border border-dashed border-slate-200 rounded-xl bg-slate-50">
            This analysis is not available because the agent has not collected this data yet.
          </div>
        ) : (
          logs.map((log, idx) => (
            <div key={log.id || idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {log.logLevel === 'Critical' || log.logLevel === 'Error' ? (
                    <AlertTriangle className="w-4 h-4 text-red-600 font-bold" />
                  ) : log.logLevel === 'Warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 font-bold" />
                  ) : (
                    <Info className="w-4 h-4 text-primary font-bold" />
                  )}
                  <span className="text-body-md font-bold text-slate-900">
                    Event ID {log.eventId || 'System Event'} ({log.providerName || log.source || 'Windows Kernel'})
                  </span>
                </div>
                <span className="text-mono-sm text-mono-sm font-bold text-slate-700">
                  {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recently'}
                </span>
              </div>

              <p className="text-body-md font-body-md text-slate-800 font-medium">
                <strong className="text-primary font-bold">Event Message:</strong> {log.message || log.simplifiedEnglish || log.eventMessage}
              </p>

              {log.suggestedSolution && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-body-md text-emerald-800 flex items-start gap-2 font-medium">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-700 flex-shrink-0" />
                  <div>
                    <strong className="font-bold">Recommended Solution:</strong> {log.suggestedSolution}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogAnalyzer;
