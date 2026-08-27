import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = ({ selectedLab, onSelectLab }) => {
  const navigate = useNavigate();
  const [showLabDropdown, setShowLabDropdown] = useState(false);

  const labs = ['All Campuses', 'General Lab', 'Computer Lab A', 'Computer Lab B', 'Hardware Lab'];

  return (
    <header className="bg-surface text-primary font-headline-md text-headline-md w-full h-16 border-b border-outline-variant sticky top-0 right-0 flex items-center justify-between px-gutter z-30 shrink-0">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button className="md:hidden p-2 rounded-full text-secondary hover:bg-secondary-container transition-transform scale-95 active:scale-90">
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Brand Anchor */}
        <div 
          onClick={() => navigate('/dashboard')}
          className="text-headline-lg font-headline-lg font-black text-primary flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined icon-fill text-[28px]">biotech</span>
          NeuroSys
        </div>

        {/* Contextual Lab Selector (Desktop) */}
        <div className="relative hidden lg:block ml-8">
          <div
            onClick={() => setShowLabDropdown(!showLabDropdown)}
            className="flex items-center bg-surface-container-low border border-outline-variant rounded-lg px-3 py-1.5 cursor-pointer hover:border-primary-fixed-dim transition-colors"
          >
            <span className="text-body-md font-body-md text-on-surface mr-2">
              {selectedLab || 'All Campuses'}
            </span>
            <span className="material-symbols-outlined text-[18px] text-secondary">expand_more</span>
          </div>

          {showLabDropdown && (
            <div className="absolute left-0 mt-1 w-48 bg-surface border border-outline-variant rounded-lg shadow-lg py-1 z-50 animate-fade-in-up">
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

      <div className="flex items-center gap-2">
        {/* Search Action */}
        <button
          onClick={() => navigate('/computers')}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-secondary hover:bg-secondary-container transition-transform scale-95 active:scale-90 font-label-md text-label-md"
        >
          <span className="material-symbols-outlined text-[20px]">search</span>
          <span className="hidden sm:inline">Search Labs</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
