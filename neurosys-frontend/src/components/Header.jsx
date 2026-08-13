import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { Search, Bell, LogOut, Wifi, WifiOff, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, logout } = useAuth();
  const { connectionState, lastUpdateAt, notifications, markAllAsRead } = useWebSocket();
  const [showNotifications, setShowNotifications] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      if (lastUpdateAt) {
        const diff = Math.floor((new Date() - new Date(lastUpdateAt)) / 1000);
        setSecondsAgo(Math.max(0, diff));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdateAt]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/computers?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-16 glass-panel border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search Input */}
      <div className="relative w-72">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchSubmit}
          placeholder="Search computers, IP, lab..."
          className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700/60 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all duration-200"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Realtime 3-State Telemetry Connection Indicator */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
          {connectionState === 'CONNECTED' ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-medium text-emerald-400">
                🟢 Live Telemetry ({secondsAgo}s ago)
              </span>
            </>
          ) : connectionState === 'CONNECTING' ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-[11px] font-medium text-amber-400">
                🟡 Connecting...
              </span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[11px] font-medium text-red-400">
                🔴 Telemetry Disconnected (Retrying...)
              </span>
            </>
          )}
        </div>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl glass-panel border border-slate-800 shadow-2xl p-4 z-50 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-cyan-400" /> Notifications ({unreadCount} unread)
                </h4>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] text-cyan-400 hover:underline font-semibold"
                    >
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)} className="text-slate-500 hover:text-slate-300">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 text-xs">
                {notifications.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No new notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl border transition-all ${
                        n.type === 'CRITICAL'
                          ? 'bg-red-500/10 border-red-500/30 text-red-300'
                          : n.type === 'SUCCESS'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-[11px]">
                        <span>{n.title}</span>
                        <span className="text-[9px] opacity-60 font-mono">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] mt-0.5 opacity-90">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-[1px] bg-slate-800" />

        {/* User Profile Info */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-500/20">
            {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-slate-200">{user?.username || 'Administrator'}</p>
            <p className="text-[10px] text-cyan-400 font-mono">{user?.role || 'ROLE_ADMIN'}</p>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/60 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
