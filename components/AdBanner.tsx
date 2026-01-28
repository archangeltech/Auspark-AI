import React from 'react';

const AdBanner: React.FC = () => {
  return (
    <div className="w-full bg-slate-100 border-t border-slate-200 py-2 px-4 flex items-center justify-center animate-fade-in shrink-0">
      <div className="max-w-md w-full flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
        {/* Ad Tag */}
        <div className="absolute top-0 left-0 bg-slate-200 text-slate-500 text-[8px] font-black px-1.5 py-0.5 rounded-br-md uppercase tracking-tighter">
          Ad
        </div>
        
        {/* Ad Content Placeholder */}
        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0 text-emerald-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Sponsored</span>
          </div>
          <p className="text-xs font-bold text-slate-900 truncate leading-tight mt-0.5">
            Save on Comprehensive Car Insurance
          </p>
          <p className="text-[10px] text-slate-500 font-medium truncate">
            Quick quotes for Australian drivers.
          </p>
        </div>
        
        <button className="bg-slate-900 text-white text-[10px] font-black px-3 py-2 rounded-lg hover:bg-emerald-600 transition-colors shrink-0">
          VIEW
        </button>
      </div>
    </div>
  );
};

export default AdBanner;