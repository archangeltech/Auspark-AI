import React from 'react';

interface HeaderProps {
  onOpenLegal: () => void;
  onEditProfile: () => void;
  onOpenSettings: () => void;
  onLogoClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenLegal, onEditProfile, onOpenSettings, onLogoClick }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 px-5 pt-[env(safe-area-inset-top)] pb-3.5 flex items-center justify-between min-h-[60px]">
      <button 
        onClick={onLogoClick}
        className="flex items-center gap-2.5 hover:opacity-80 transition-opacity focus:outline-none text-left py-2" 
        aria-label="Parking Sign Reader Home - Return to Scan"
      >
        <div className="shrink-0">
          <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 95C50 95 90 60 90 35C90 12 72 0 50 0C28 0 10 12 10 35C10 60 50 95 50 95Z" fill="#10B981" stroke="black" stroke-width="4"/>
            <circle cx="50" cy="35" r="28" fill="#F1F5F9" stroke="black" stroke-width="4"/>
            <circle cx="50" cy="35" r="20" fill="#A7F3D0" stroke="black" stroke-width="4"/>
            <text x="50" y="44" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="26" fill="black">P</text>
          </svg>
        </div>
        <h1 className="text-lg font-black tracking-tight text-slate-900 leading-tight">
          Parking Sign <span className="text-emerald-500">Reader</span>
        </h1>
      </button>
      
      <div className="flex items-center gap-1">
        <button 
          onClick={onEditProfile}
          className="p-2.5 text-slate-400 hover:text-emerald-600 transition-colors"
          title="Edit My Permits"
          aria-label="Edit user parking permits"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
        <button 
          onClick={onOpenLegal}
          className="p-2.5 text-slate-400 hover:text-slate-600 transition-colors"
          title="Legal & Privacy"
          aria-label="View Legal and Privacy information"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;