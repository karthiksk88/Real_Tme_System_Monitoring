import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  SlidersHorizontal, 
  ShieldCheck, 
  Bell, 
  Save, 
  Database, 
  Server,
  Key,
  Cpu
} from 'lucide-react';

const Settings = () => {
  const [pollingInterval, setPollingInterval] = useState('5');
  const [cpuThreshold, setCpuThreshold] = useState('80');
  const [ramThreshold, setRamThreshold] = useState('85');
  const [tempThreshold, setTempThreshold] = useState('80');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-7 h-7 text-primary" />
            <h1 className="font-display text-display text-on-background tracking-tight">System Settings & Configuration</h1>
          </div>
          <p className="font-body-md text-body-md text-secondary mt-1">
            Configure agent telemetry ingestion intervals, alert threshold limits, and Railway backend API integration policies.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-primary hover:bg-primary-container text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-transform active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 text-xs font-bold animate-fade-in-up">
          ✓ Configuration settings saved successfully.
        </div>
      )}

      {/* Form Grid */}
      <div className="space-y-6">
        {/* Telemetry Polling Section */}
        <section className="card-elevated p-6 space-y-4">
          <h3 className="font-headline-md text-headline-md font-bold text-on-surface flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            Agent Polling & Ingestion Intervals
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="font-label-md text-label-md text-secondary font-bold block mb-1">
                Agent Polling Interval (Seconds)
              </label>
              <select
                value={pollingInterval}
                onChange={(e) => setPollingInterval(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="3">3 Seconds (High Frequency)</option>
                <option value="5">5 Seconds (Standard Recommended)</option>
                <option value="10">10 Seconds (Low Network Workload)</option>
                <option value="30">30 Seconds (Minimal Telemetry)</option>
              </select>
              <p className="text-[11px] text-secondary mt-1">Frequency at which OSHI agent posts hardware metrics to backend REST API.</p>
            </div>

            <div>
              <label className="font-label-md text-label-md text-secondary font-bold block mb-1">
                Railway Production API URL
              </label>
              <input
                type="text"
                readOnly
                value="https://realtmesystemmonitoring-production.up.railway.app/api/v1"
                className="w-full px-3.5 py-2.5 bg-surface-container-high border border-outline-variant rounded-lg text-xs font-mono font-bold text-secondary cursor-not-allowed"
              />
              <p className="text-[11px] text-secondary mt-1">Production Railway server endpoint for agent heartbeat and telemetry REST calls.</p>
            </div>
          </div>
        </section>

        {/* Incident Threshold Limits */}
        <section className="card-elevated p-6 space-y-4">
          <h3 className="font-headline-md text-headline-md font-bold text-on-surface flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Telemetry Incident Alert Thresholds
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="font-label-md text-label-md text-secondary font-bold block mb-1">
                CPU Warning Threshold (%)
              </label>
              <input
                type="number"
                value={cpuThreshold}
                onChange={(e) => setCpuThreshold(e.target.value)}
                className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-bold text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="font-label-md text-label-md text-secondary font-bold block mb-1">
                RAM Warning Threshold (%)
              </label>
              <input
                type="number"
                value={ramThreshold}
                onChange={(e) => setRamThreshold(e.target.value)}
                className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-bold text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="font-label-md text-label-md text-secondary font-bold block mb-1">
                Thermal CPU Limit (°C)
              </label>
              <input
                type="number"
                value={tempThreshold}
                onChange={(e) => setTempThreshold(e.target.value)}
                className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-bold text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </section>

        {/* Security & Authorization */}
        <section className="card-elevated p-6 space-y-4">
          <h3 className="font-headline-md text-headline-md font-bold text-on-surface flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Security & Agent Onboarding Policy
          </h3>

          <div className="p-4 bg-surface-container-low border border-outline-variant rounded-lg flex items-center justify-between gap-4">
            <div>
              <h4 className="font-body-md text-body-md font-bold text-on-surface">Auto-Approve Registered Agents</h4>
              <p className="font-body-md text-body-md text-secondary mt-0.5">Automatically onboard new monitoring agents upon setup-agent.bat execution.</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary rounded cursor-pointer" />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
