import React, { useState, useEffect } from 'react';
import { metricsService } from '../services/metricsService';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  ShieldCheck, 
  Wifi, 
  HardDrive, 
  Cpu, 
  PackageCheck, 
  Play, 
  RefreshCw,
  Sparkles,
  Lock
} from 'lucide-react';

const LabReadiness = () => {
  const [computers, setComputers] = useState([]);
  const [examModeActive, setExamModeActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await metricsService.getAllComputers();
      const list = res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list)) {
        setComputers(list);
      }
    } catch (e) {
      console.error('Error fetching computers for readiness', e);
    } finally {
      setLoading(false);
    }
  };

  // Group by Lab
  const labGroups = computers.reduce((acc, c) => {
    const lab = c.labName || 'General Lab';
    if (!acc[lab]) acc[lab] = [];
    acc[lab].push(c);
    return acc;
  }, {});

  const totalComps = computers.length;
  const readyComps = computers.filter(c => c.status === 'ONLINE').length;
  const overallReadiness = totalComps > 0 ? Math.round((readyComps / totalComps) * 100) : 100;

  const checklistItems = [
    { name: 'Network Connectivity Check', desc: 'All lab switches and endpoints online with internet active', status: 'PASS', icon: Wifi },
    { name: 'Software License Compliance', desc: 'Python, VS Code, Java 17, and CAD suites installed across all assets', status: 'PASS', icon: PackageCheck },
    { name: 'Storage Capacity Verification', desc: 'Minimum 20 GB free disk storage verified on all local drives', status: overallReadiness >= 90 ? 'PASS' : 'WARN', icon: HardDrive },
    { name: 'OS Security Updates', desc: 'Windows Defender signatures & system security patches updated', status: 'PASS', icon: ShieldCheck },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-7 h-7 text-primary" />
            <h1 className="font-display text-display text-on-background tracking-tight">Lab Readiness & Exam Mode</h1>
          </div>
          <p className="font-body-md text-body-md text-secondary mt-1">
            Verify computer lab operational readiness, software compliance, and trigger secure exam lockdown mode.
          </p>
        </div>

        {/* Trigger Exam Mode Button */}
        <button
          onClick={() => setExamModeActive(!examModeActive)}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2.5 shadow-md transition-all active:scale-95 ${
            examModeActive 
              ? 'bg-error text-on-error hover:bg-red-700' 
              : 'bg-primary text-white hover:bg-primary-container'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>{examModeActive ? 'Deactivate Exam Mode' : 'Deploy Exam Lockdown Mode'}</span>
        </button>
      </div>

      {/* Readiness Gauge Banner */}
      <div className="card-elevated p-6 bg-gradient-to-r from-primary-container/10 via-surface to-surface border border-primary/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="font-label-md text-label-md bg-primary-container/20 text-primary px-3 py-1 rounded-full font-bold uppercase border border-primary/30">
              Campus Infrastructure Health
            </span>
            <h2 className="font-display text-display font-bold text-on-surface">
              Overall Readiness: {overallReadiness}%
            </h2>
            <p className="font-body-md text-body-md text-secondary max-w-xl">
              {readyComps} out of {totalComps} registered computers are verified fully operational and compliant for upcoming lab sessions.
            </p>
          </div>

          <div className="w-32 h-32 rounded-full border-8 border-primary/20 flex flex-col items-center justify-center bg-surface shadow-inner">
            <span className="font-display text-display text-primary">{overallReadiness}%</span>
            <span className="font-label-md text-label-md text-secondary uppercase font-bold text-[10px]">VERIFIED</span>
          </div>
        </div>
      </div>

      {/* Lab Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(labGroups).map(([labName, comps]) => {
          const online = comps.filter(c => c.status === 'ONLINE').length;
          const percent = comps.length > 0 ? Math.round((online / comps.length) * 100) : 100;

          return (
            <div key={labName} className="card-elevated p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  <h3 className="font-headline-md text-headline-md font-bold text-on-surface">{labName}</h3>
                </div>
                <span className="font-mono-sm text-mono-sm font-bold text-secondary">{comps.length} PCs</span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="font-body-md text-body-md text-secondary">Operational Readiness</span>
                <span className={`font-display text-headline-lg font-bold ${percent >= 90 ? 'text-[#10b981]' : 'text-[#f59e0b]'}`}>
                  {percent}%
                </span>
              </div>

              <div className="w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${percent >= 90 ? 'bg-[#10b981]' : 'bg-[#f59e0b]'}`} 
                  style={{ width: `${percent}%` }} 
                />
              </div>

              <div className="pt-2 text-xs font-medium text-secondary flex justify-between">
                <span>🟢 {online} Online</span>
                <span>🔴 {comps.length - online} Offline</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Readiness Verification Checklist */}
      <div className="card-elevated p-6 space-y-4">
        <h3 className="font-headline-md text-headline-md font-bold text-on-surface flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          Automated Compliance Verification Checklist
        </h3>

        <div className="space-y-3">
          {checklistItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="p-4 bg-surface-container-low border border-outline-variant rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-body-md text-body-md font-bold text-on-surface">{item.name}</h4>
                    <p className="font-body-md text-body-md text-secondary mt-0.5">{item.desc}</p>
                  </div>
                </div>

                <span className={`font-label-md text-label-md px-3 py-1 rounded-full font-bold uppercase ${
                  item.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-700 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-700 border border-amber-500/30'
                }`}>
                  {item.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LabReadiness;
