import React from 'react';
import { HardDrive, Trash2, Copy, Sparkles } from 'lucide-react';

const FileAnalyzerCard = ({ report }) => {
  if (!report) {
    return (
      <div className="glass-panel rounded-2xl p-8 border border-slate-800 text-center text-slate-400 text-xs italic">
        Scanning storage breakdown and analyzing disk utilization for this computer...
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-cyan-400" /> Disk Storage & File Analyzer
        </h3>
        <span className="text-xs text-cyan-400 font-mono">Total Scanned: {report.totalScannedSizeGb} GB</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Copy className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Duplicate Files</p>
            <p className="text-base font-bold text-slate-200">{report.duplicateFilesSizeGb} GB ({report.duplicateFilesCount} files)</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400">
            <Trash2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Temp & Junk Files</p>
            <p className="text-base font-bold text-slate-200">{report.tempJunkFilesSizeGb} GB ({report.tempJunkFilesCount} items)</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Large Files (&gt;100MB)</p>
            <p className="text-base font-bold text-slate-200">{report.largeFilesSizeGb} GB ({report.largeFilesCount} files)</p>
          </div>
        </div>
      </div>

      {report.optimizationSuggestions && report.optimizationSuggestions.length > 0 && (
        <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
          <h4 className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Optimization Recommendations
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {report.optimizationSuggestions.map((s, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileAnalyzerCard;
