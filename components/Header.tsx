import React from 'react';

interface HeaderProps {
  onOpenLegal: () => void;
  onEditProfile: () => void;
  onOpenSettings: () => void;
  onLogoClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenLegal, onEditProfile, onOpenSettings, onLogoClick }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-5 py-3.5 flex items-center justify-between">
      <button 
        onClick={onLogoClick}
        className="flex items-center gap-2.5 hover:opacity-80 transition-opacity focus:outline-none" 
        aria-label="AusPark AI Home - Return to Scan"
      >
        <div className="bg-emerald-500 p-1.5 rounded-xl shadow-sm">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">AusPark <span className="text-emerald-500">AI</span></h1>
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
        <button 
          onClick={onOpenSettings}
          className="p-2.5 text-slate-400 hover:text-slate-600 transition-colors"
          title="App Settings"
          aria-label="Open application settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;