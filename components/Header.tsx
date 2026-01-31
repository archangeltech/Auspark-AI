import React from 'react';

interface HeaderProps {
  onOpenLegal: () => void;
  onEditProfile: () => void;
  onOpenSettings: () => void;
  onLogoClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenLegal, onEditProfile, onOpenSettings, onLogoClick }) => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-50 px-6 pt-[calc(env(safe-area-inset-top)+16px)] pb-5 flex items-center justify-between min-h-[80px]">
      <button 
        onClick={onLogoClick}
        className="flex items-center gap-3 active:scale-95 transition-all focus:outline-none" 
        aria-label="Home"
      >
        <div className="w-11 h-11 bg-slate-900 rounded-[16px] flex items-center justify-center shadow-lg">
          <svg width="26" height="26" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 95C50 95 90 60 90 35C90 12 72 0 50 0C28 0 10 12 10 35C10 60 50 95 50 95Z" fill="#10B981" />
            <circle cx="50" cy="35" r="22" fill="white" />
            <text x="50" y="44" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="28" fill="#10B981">P</text>
          </svg>
        </div>
        <div className="flex flex-col text-left">
          <h1 className="text-base font-black tracking-tight text-slate-900 leading-none">
            Parking Sign <span className="text-emerald-500">Reader</span>
          </h1>
          <span className="text-[8px] font-black uppercase text-slate-400 tracking-[0.25em] mt-1.5">Vision Engine</span>
        </div>
      </button>
      
      <div className="flex items-center gap-2.5">
        <button 
          onClick={onEditProfile}
          className="w-11 h-11 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center active:scale-90 transition-all border border-slate-100 shadow-sm"
          title="Profile"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
        <button 
          onClick={onOpenSettings}
          className="w-11 h-11 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center active:scale-90 transition-all border border-slate-100 shadow-sm"
          title="Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;