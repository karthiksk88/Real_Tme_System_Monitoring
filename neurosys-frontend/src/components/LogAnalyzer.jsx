import React from 'react';
import { FileText, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const LogAnalyzer = ({ logs = [] }) => {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" /> Windows Log Humanizer & Diagnostics
        </h3>
        <span className="text-xs text-slate-400">Event logs converted to plain English</span>
      </div>

      <div className="space-y-3">
        {(!logs || logs.length === 0) ? (
          <div className="p-8 text-center text-slate-400 text-xs italic">
            No system error logs reported. All background services and system events operating normally.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {log.logLevel === 'Critical' ? (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  ) : log.logLevel === 'Warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Info className="w-4 h-4 text-cyan-400" />
                  )}
                  <span className="text-xs font-bold text-slate-200">
                    Event ID {log.eventId || '7001'} ({log.providerName || 'Windows System'})
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>

              <p className="text-xs text-slate-300 font-medium">
                <strong className="text-cyan-400">Plain English:</strong> {log.simplifiedEnglish}
              </p>

              {log.suggestedSolution && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 mt-0.5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <strong>Suggested Solution:</strong> {log.suggestedSolution}
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
