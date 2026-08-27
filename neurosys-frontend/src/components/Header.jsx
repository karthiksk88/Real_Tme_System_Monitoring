import React, { useState } from 'react';
import { Search, RefreshCw, ChevronDown, Menu, Bell, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = ({ onRefresh, selectedLab, onSelectLab }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showLabDropdown, setShowLabDropdown] = useState(false);

  const labs = ['All Campuses', 'General Lab', 'Computer Lab A', 'Computer Lab B', 'Hardware Lab'];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/computers?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="bg-surface/90 text-primary font-headline-md text-headline-md w-full h-16 border-b border-outline-variant sticky top-0 right-0 flex items-center justify-between px-container-padding z-30 shrink-0 backdrop-blur-md">
      {/* Left Section: Brand / Mobile menu / Lab Selector */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button className="md:hidden p-2 rounded-full text-secondary hover:bg-surface-container-high transition-transform active:scale-95">
          <Menu className="w-5 h-5" />
        </button>

        {/* Contextual Lab Selector (Desktop) */}
        <div className="relative">
          <button
            onClick={() => setShowLabDropdown(!showLabDropdown)}
            className="flex items-center gap-2 bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-1.5 hover:border-primary transition-colors text-xs font-semibold text-on-surface"
          >
            <span>{selectedLab || 'All Campuses'}</span>
            <ChevronDown className="w-4 h-4 text-secondary" />
          </button>

          {showLabDropdown && (
            <div className="absolute left-0 mt-1 w-48 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg py-1 z-50 animate-fade-in-up">
              {labs.map((lab) => (
                <button
                  key={lab}
                  onClick={() => {
                    if (onSelectLab) onSelectLab(lab === 'All Campuses' ? '' : lab);
                    setShowLabDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  {lab}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center Section: Search Bar */}
      <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center max-w-md w-full mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search labs, computers, IP addresses..."
            className="w-full pl-10 pr-4 py-1.5 bg-surface-container-low border border-outline-variant rounded-full text-xs font-medium text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all shadow-sm"
          />
        </div>
      </form>

      {/* Right Section: System Live Status & Quick Actions */}
      <div className="flex items-center gap-3">
        {/* System Active Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 status-dot-active" />
          <span className="text-[11px] font-bold text-emerald-700 tracking-wider uppercase">System Live</span>
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh Data"
            className="p-2 rounded-full border border-outline-variant text-secondary hover:bg-surface-container hover:text-primary transition-colors hover:rotate-180 duration-500"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
