import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.name || 'Admin User');
  const [email, setEmail] = useState(user?.email || 'sysadmin@neurosys.edu');
  const [pollingInterval, setPollingInterval] = useState('5');
  const [cpuThreshold, setCpuThreshold] = useState('80');
  const [ramThreshold, setRamThreshold] = useState('85');
  const [tempThreshold, setTempThreshold] = useState('80');
  const [autoApprove, setAutoApprove] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    showToast('✓ Profile updated successfully.');
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    showToast('✓ System configuration saved successfully.');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-display text-on-background mb-2">Settings</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Manage your account, security, and global system configurations.</p>
      </div>

      {toastMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 text-xs font-bold animate-fade-in-up">
          {toastMessage}
        </div>
      )}

      {/* Settings Grid (Bento Style matching code.html) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Account Section */}
        <section className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">person</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Account</h2>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="fullName">Full Name</label>
                <input 
                  className="w-full h-10 bg-surface-container-lowest border border-outline-variant rounded px-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-fixed-dim focus:border-primary transition-all" 
                  id="fullName" 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="email">Email Address</label>
                <input 
                  className="w-full h-10 bg-surface-container-lowest border border-outline-variant rounded px-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-fixed-dim focus:border-primary transition-all" 
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="role">Primary Role</label>
                <input 
                  className="w-full h-10 bg-surface-container border border-outline-variant rounded px-3 font-body-md text-on-surface-variant cursor-not-allowed" 
                  disabled 
                  id="role" 
                  type="text" 
                  value="Systems Administrator" 
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-outline-variant flex justify-end">
              <button 
                type="submit"
                className="bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md py-2 px-4 rounded-lg transition-all duration-200 transform active:scale-95 shadow-sm hover:shadow cursor-pointer"
              >
                Save Profile
              </button>
            </div>
          </form>
        </section>

        {/* Security Section */}
        <section className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">lock</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Security</h2>
          </div>

          <div className="space-y-6 flex-1">
            <div>
              <h3 className="font-label-md text-label-md text-on-surface mb-2">Password</h3>
              <button 
                onClick={() => showToast('Password change modal opened')}
                className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container-low font-label-md text-label-md py-2 px-4 rounded-lg transition-all duration-200 transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">key</span>
                Change Password
              </button>
              <p className="font-mono-sm text-mono-sm text-on-surface-variant mt-2 text-center">Last changed 45 days ago</p>
            </div>

            <div className="border-t border-outline-variant pt-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-label-md text-label-md text-on-surface">Two-Factor Authentication</h3>
                <div className="flex items-center gap-1 text-primary">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  <span className="font-label-md text-label-md">Enabled</span>
                </div>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">Requires a verification code from your authenticator app.</p>
              <button 
                onClick={() => showToast('2FA settings updated')}
                className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container-low font-label-md text-label-md py-2 px-4 rounded-lg transition-all duration-200 transform active:scale-95 cursor-pointer"
              >
                Manage 2FA Settings
              </button>
            </div>
          </div>
        </section>

        {/* Agent Management (Status) */}
        <section className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 flex flex-col h-full relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-surface-container-high opacity-50 pointer-events-none">
            <span className="material-symbols-outlined text-9xl">memory</span>
          </div>

          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">deployed_code</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Agent Status</h2>
          </div>

          <div className="space-y-5 flex-1 relative z-10">
            <div className="bg-surface-container-low rounded-lg p-4 flex items-center justify-between border border-outline-variant">
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface-variant">Global Connection</span>
                <span className="font-body-md text-body-md text-on-surface font-medium">Optimal</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-surface-container-lowest border border-outline-variant flex items-center justify-center text-primary relative">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-20 animate-ping"></span>
                <span className="material-symbols-outlined text-[18px] relative z-10">wifi</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-container-lowest border border-outline-variant rounded p-3 text-center shimmer-effect">
                <span className="font-display text-display text-primary block leading-none mb-1">142</span>
                <span className="font-label-md text-label-md text-on-surface-variant">Active Agents</span>
              </div>
              <div className="bg-surface-container-lowest border border-error-container rounded p-3 text-center shimmer-effect">
                <span className="font-display text-display text-error block leading-none mb-1">3</span>
                <span className="font-label-md text-label-md text-on-surface-variant">Offline</span>
              </div>
            </div>

            <div>
              <h3 className="font-label-md text-label-md text-on-surface mb-2">Agent Installation</h3>
              <a 
                href="https://realtmesystemmonitoring-production.up.railway.app/downloads/NeuroSys-Agent.jar"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container-low font-label-md text-label-md py-2 px-4 rounded-lg transition-all duration-200 transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Download Agent Package (.jar)
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* System Infrastructure Configuration */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-outline-variant pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">tune</span>
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface">Global System Configuration</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">Telemetry thresholds and polling rates.</p>
            </div>
          </div>

          <button
            onClick={handleSaveConfig}
            className="bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md py-2 px-4 rounded-lg transition-all duration-200 transform active:scale-95 cursor-pointer font-bold"
          >
            Save Infrastructure Configuration
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="font-label-md text-label-md text-on-surface-variant font-bold block mb-1">
              Agent Polling Interval
            </label>
            <select
              value={pollingInterval}
              onChange={(e) => setPollingInterval(e.target.value)}
              className="w-full h-10 bg-surface-container-lowest border border-outline-variant rounded px-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-fixed-dim focus:border-primary"
            >
              <option value="3">3 Seconds (High Frequency)</option>
              <option value="5">5 Seconds (Standard Recommended)</option>
              <option value="10">10 Seconds (Low Network Workload)</option>
            </select>
          </div>

          <div>
            <label className="font-label-md text-label-md text-on-surface-variant font-bold block mb-1">
              CPU Warning Threshold (%)
            </label>
            <input
              type="number"
              value={cpuThreshold}
              onChange={(e) => setCpuThreshold(e.target.value)}
              className="w-full h-10 bg-surface-container-lowest border border-outline-variant rounded px-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-fixed-dim focus:border-primary"
            />
          </div>

          <div>
            <label className="font-label-md text-label-md text-on-surface-variant font-bold block mb-1">
              RAM Warning Threshold (%)
            </label>
            <input
              type="number"
              value={ramThreshold}
              onChange={(e) => setRamThreshold(e.target.value)}
              className="w-full h-10 bg-surface-container-lowest border border-outline-variant rounded px-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-fixed-dim focus:border-primary"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-outline-variant flex items-center justify-between">
          <div>
            <h4 className="font-body-md text-body-md font-bold text-on-surface">Auto-Approve Registered Agents</h4>
            <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">Automatically onboard new monitoring agents upon setup-agent.bat execution.</p>
          </div>
          <input 
            type="checkbox" 
            checked={autoApprove}
            onChange={(e) => setAutoApprove(e.target.checked)}
            className="w-5 h-5 accent-primary rounded cursor-pointer" 
          />
        </div>
      </section>
    </div>
  );
};

export default Settings;
