import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Monitor, 
  Bell, 
  PackageCheck, 
  CheckCircle2, 
  BrainCircuit, 
  Clock, 
  Settings, 
  LogOut, 
  Activity,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [activeAlertCount, setActiveAlertCount] = useState(0);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchCounts = async () => {
    try {
      const [pendingRes, alertsRes] = await Promise.all([
        api.get('/computers/pending').catch(() => null),
        api.get('/alerts/active').catch(() => null)
      ]);

      const pendingList = pendingRes?.data || (Array.isArray(pendingRes) ? pendingRes : []);
      if (Array.isArray(pendingList)) {
        setPendingCount(pendingList.length);
      }

      const alertsList = alertsRes?.data || (Array.isArray(alertsRes) ? alertsRes : []);
      if (Array.isArray(alertsList)) {
        setActiveAlertCount(alertsList.length);
      }
    } catch (e) {
      // Ignore background errors
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Computers', path: '/computers', icon: Monitor },
    { name: 'Alerts', path: '/alerts', icon: Bell, badge: activeAlertCount, badgeColor: 'bg-error text-on-error' },
    { name: 'Software Inventory', path: '/software', icon: PackageCheck },
    { name: 'Lab Readiness', path: '/lab-readiness', icon: CheckCircle2 },
    { name: 'AI Intelligence', path: '/analytics', icon: BrainCircuit },
    { name: 'Pending Approvals', path: '/pending-computers', icon: Clock, badge: pendingCount, badgeColor: 'bg-amber-500 text-white' },
  ];

  return (
    <aside className="w-sidebar-width h-screen border-r border-outline-variant bg-surface text-primary font-body-md fixed left-0 top-0 flex flex-col z-40 hidden md:flex shadow-sm">
      {/* Brand Header */}
      <div className="p-gutter border-b border-outline-variant flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight">NeuroSys</h2>
            <p className="text-label-md font-label-md text-secondary">Lab Management & AI</p>
          </div>
        </div>
      </div>

      {/* Admin Profile Section */}
      <div className="px-4 py-3 border-b border-outline-variant/60 bg-surface-container-low flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary-container/20 border border-primary-container/40 flex items-center justify-center text-primary font-bold text-xs">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-on-surface truncate">{user?.name || 'Lab Administrator'}</p>
          <p className="text-[11px] text-secondary truncate">{user?.email || 'admin@neurosys.io'}</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-bold text-secondary uppercase tracking-wider font-label-md">
          Enterprise Console
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-body-md font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-surface-container text-primary font-bold border-r-4 border-primary shadow-sm'
                    : 'text-secondary hover:bg-surface-container-high hover:text-on-surface'
                }`
              }
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                <span className="truncate">{item.name}</span>
              </div>
              {item.badge > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm ${item.badgeColor || 'bg-primary text-white'}`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer / Settings & Logout */}
      <div className="p-3 border-t border-outline-variant space-y-1 bg-surface-container-lowest">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-md transition-all duration-200 group ${
              isActive
                ? 'bg-surface-container text-primary font-bold border-r-4 border-primary'
                : 'text-secondary hover:bg-surface-container-high'
            }`
          }
        >
          <Settings className="w-5 h-5 transition-transform duration-300 group-hover:rotate-45" />
          <span>Settings</span>
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-error hover:bg-error-container/40 transition-colors duration-200 font-label-md text-label-md font-semibold"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </div>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
