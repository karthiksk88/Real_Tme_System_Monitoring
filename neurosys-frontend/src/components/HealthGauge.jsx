import React from 'react';

const HealthGauge = ({ score = 100 }) => {
  const roundedScore = Math.round(score);

  let colorClass = 'text-emerald-400 stroke-emerald-500';
  let categoryLabel = 'Healthy';

  if (roundedScore < 50) {
    colorClass = 'text-red-400 stroke-red-500';
    categoryLabel = 'Critical';
  } else if (roundedScore < 80) {
    colorClass = 'text-amber-400 stroke-amber-500';
    categoryLabel = 'Warning';
  }

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (roundedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="56"
            cy="56"
            r="40"
            className="stroke-slate-800"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="56"
            cy="56"
            r="40"
            className={`${colorClass} transition-all duration-1000 ease-out`}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-100">{roundedScore}</span>
          <span className="text-[10px] font-semibold uppercase text-slate-400">/ 100</span>
        </div>
      </div>
      <span className={`mt-2 px-3 py-0.5 rounded-full text-xs font-semibold ${categoryLabel === 'Healthy' ? 'bg-emerald-500/10 text-emerald-400' : categoryLabel === 'Warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
        {categoryLabel}
      </span>
    </div>
  );
};

export default HealthGauge;
