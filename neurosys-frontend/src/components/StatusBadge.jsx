import React from 'react';

const StatusBadge = ({ status }) => {
  const normalized = status ? status.toUpperCase() : 'ONLINE';

  const badgeStyles = {
    ONLINE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 dot-emerald-500',
    WARNING: 'bg-amber-500/10 text-amber-400 border-amber-500/30 dot-amber-500',
    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/30 dot-red-500',
    OFFLINE: 'bg-slate-800 text-slate-400 border-slate-700 dot-slate-500',
  };

  const dotColors = {
    ONLINE: 'bg-emerald-400',
    WARNING: 'bg-amber-400',
    CRITICAL: 'bg-red-400 animate-ping',
    OFFLINE: 'bg-slate-500',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
        badgeStyles[normalized] || badgeStyles.ONLINE
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColors[normalized] || dotColors.ONLINE}`} />
      {normalized}
    </span>
  );
};

export default StatusBadge;
