import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Laptop, Monitor, Clock, Bell, BarChart3, Settings, Cpu, PackageCheck, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const Sidebar = () => {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(() => {
      fetchPendingCount();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingCount = async () => {
    try {
      const res = await api.get('/computers/pending');
      const dataList = res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(dataList)) {
        setPendingCount(dataList.length);
      }
    } catch (e) {
      // Ignore background errors
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Computers', path: '/computers', icon: Monitor },
    { name: 'Software Inventory', path: '/software', icon: PackageCheck },
    { name: 'AI Intelligence', path: '/analytics', icon: BarChart3 },
    { name: 'Alert Center', path: '/alerts', icon: Bell },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col h-screen sticky top-0 z-30 transition-all duration-300">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
          <Cpu className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            NeuroSys
          </h1>
          <p className="text-xs text-cyan-400 font-medium">Predictive Monitoring</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Main Console
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <div className="flex items-center">
                <Icon className="w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110" />
                {item.name}
              </div>
              {item.badge > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950 shadow-sm animate-pulse">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer System Status Badge */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="glass-card rounded-xl p-3.5 flex items-center justify-between border border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500" />
            <span className="text-xs font-semibold text-slate-300">System Active</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
