import React, { useState, useEffect } from 'react';
import { metricsService } from '../services/metricsService';
import { HardDrive, Trash2, Copy, Sparkles } from 'lucide-react';

const FileAnalyzerCard = ({ computerId, report: propReport }) => {
  const [report, setReport] = useState(propReport || null);
  const [loading, setLoading] = useState(!propReport);

  useEffect(() => {
    if (!propReport && computerId) {
      fetchFileAnalysis();
    }
  }, [computerId, propReport]);

  const fetchFileAnalysis = async () => {
    try {
      const data = await metricsService.getFileAnalysis(computerId);
      if (data) {
        setReport(data.data || data);
      }
    } catch (e) {
      console.error('Error fetching file analysis', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card-elevated rounded-xl p-8 border border-slate-200 text-center text-slate-700 text-body-md font-semibold">
        Scanning storage breakdown for this workstation...
      </div>
    );
  }

  if (!report || !report.totalScannedSizeGb) {
    return (
      <div className="card-elevated rounded-xl p-8 border border-dashed border-slate-200 bg-slate-50 text-center text-slate-700 text-body-md font-semibold">
        This analysis is not available because the agent has not collected this data yet.
      </div>
    );
  }

  return (
    <div className="card-elevated rounded-xl p-6 border border-slate-200 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <h3 className="text-headline-md font-headline-md text-slate-900 font-bold flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-primary" /> Disk Storage & File Analyzer
        </h3>
        <span className="text-mono-sm font-mono-sm text-primary font-bold">Total Scanned: {report.totalScannedSizeGb} GB</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700 font-bold">
            <Copy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-label-md font-label-md text-slate-700 font-bold">Duplicate Files</p>
            <p className="text-body-lg font-bold text-slate-900">{report.duplicateFilesSizeGb || 0} GB ({report.duplicateFilesCount || 0} files)</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-red-100 text-red-700 font-bold">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-label-md font-label-md text-slate-700 font-bold">Temp & Junk Files</p>
            <p className="text-body-lg font-bold text-slate-900">{report.tempJunkFilesSizeGb || 0} GB ({report.tempJunkFilesCount || 0} items)</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-primary-container/20 text-primary font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-label-md font-label-md text-slate-700 font-bold">Large Files (&gt;100MB)</p>
            <p className="text-body-lg font-bold text-slate-900">{report.largeFilesSizeGb || 0} GB ({report.largeFilesCount || 0} files)</p>
          </div>
        </div>
      </div>

      {report.optimizationSuggestions && report.optimizationSuggestions.length > 0 && (
        <div className="p-4 rounded-xl bg-primary-container/10 border border-primary/20">
          <h4 className="text-body-md font-bold text-primary flex items-center gap-1.5 mb-2">
            <Sparkles className="w-4 h-4" /> Storage Optimization Recommendations
          </h4>
          <ul className="space-y-1.5 text-body-md text-slate-800 font-medium">
            {report.optimizationSuggestions.map((s, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileAnalyzerCard;
