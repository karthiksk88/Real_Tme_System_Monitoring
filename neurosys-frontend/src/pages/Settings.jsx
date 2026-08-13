import React, { useState } from 'react';
import { Settings as SettingsIcon, Mail, Download, Monitor, Save, Terminal, ShieldCheck } from 'lucide-react';

const Settings = () => {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [adminEmail, setAdminEmail] = useState('admin@neurosys.com');
  const [interval, setIntervalVal] = useState(5);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-2 border-b border-slate-800">
        <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">System Settings & Agent Deployment</h2>
        <p className="text-xs text-slate-400">Configure alert thresholds, email notifications, and download Monitoring Agent setup files</p>
      </div>

      {/* Monitoring Agent Installer Card */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">NeuroSys Agent for Windows Package</h3>
              <p className="text-xs text-slate-400">Complete distribution containing executable JAR and 1-click batch setup scripts</p>
            </div>
          </div>

          <a
            href="/api/v1/download/agent-windows"
            download="NeuroSys-Agent-Windows.zip"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download NeuroSys Agent for Windows (.zip)</span>
          </a>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs text-slate-300">
          <p className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-cyan-400" /> Quick Agent Installation Guide:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
            <li>Download <code className="text-cyan-300 font-mono">NeuroSys-Agent-Windows.zip</code> using the button above.</li>
            <li>Extract the ZIP archive to a folder on the target computer.</li>
            <li>Double-click <code className="text-cyan-300 font-mono">setup-agent.bat</code> to launch setup.</li>
            <li>The agent automatically detects hardware specs and registers with the server.</li>
          </ol>
          <div className="p-3 rounded-lg bg-slate-950 font-mono text-[11px] text-emerald-400 border border-slate-800 select-all overflow-x-auto">
            setup-agent.bat
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Monitored computers will appear in the <strong>Computers Catalog</strong> and trigger notifications on registration.
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-medium">
          Configuration settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Mail className="w-4 h-4 text-cyan-400" /> Email Notifications
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-200">Critical Alert Email Dispatches</p>
              <p className="text-[11px] text-slate-400">Send instant SMTP emails for critical CPU/RAM/Disk alerts</p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Administrator Email</label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full max-w-md px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-cyan-400" /> Agent Sampling Rules
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Telemetry Collection Interval (Seconds)</label>
            <input
              type="number"
              value={interval}
              onChange={(e) => setIntervalVal(Number(e.target.value))}
              min="1"
              max="60"
              className="w-32 px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
