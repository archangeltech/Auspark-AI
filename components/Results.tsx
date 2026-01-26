import React, { useState } from 'react';
import { ParkingInterpretation, DirectionalResult } from '../types';

interface ResultsProps {
  data: ParkingInterpretation;
  image: string;
  onReset: () => void;
  onRecheck?: () => void;
  onFeedback?: (type: 'up' | 'down') => void;
  isRechecking?: boolean;
  initialFeedback?: 'up' | 'down';
}

const Results: React.FC<ResultsProps> = ({ 
  data, 
  image, 
  onReset, 
  onRecheck, 
  onFeedback,
  isRechecking,
  initialFeedback 
}) => {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(initialFeedback || null);
  const [showThanks, setShowThanks] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  // Hard safety check for blank screen prevention
  if (!data || !data.results || data.results.length === 0) {
    return (
      <div className="p-10 text-center animate-fade-in">
        <p className="text-slate-500 font-bold">Could not read sign results. Please try again.</p>
        <button onClick={onReset} className="mt-4 bg-slate-900 text-white px-6 py-2 rounded-xl">Back</button>
      </div>
    );
  }

  const activeResult: DirectionalResult = data.results[activeIdx] || data.results[0];
  const isAllowed = activeResult.canParkNow;

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type);
    if (onFeedback) onFeedback(type);
    setShowThanks(true);
    setTimeout(() => setShowThanks(false), 3000);
  };

  const formatDuration = (mins?: number) => {
    if (mins === undefined || mins === null || mins <= 0) return null;
    if (mins >= 1440) return "Unlimited";
    
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    
    if (hours > 0 && remainingMins > 0) {
      return `${hours} hour ${remainingMins} mins`;
    } else if (hours > 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    return `${remainingMins} mins`;
  };

  const formatRuleTag = (rule: string) => {
    let formatted = rule.replace(/^1\/2P$/i, "30 mins");
    formatted = formatted.replace(/^1\/4P$/i, "15 mins");
    formatted = formatted.replace(/^(\d+)P$/i, "$1 hour");
    formatted = formatted.replace(/(\d+)P/gi, (match, p1) => {
        const val = parseInt(p1);
        return `${val} ${val === 1 ? 'hour' : 'hours'}`;
    });
    return formatted;
  };

  const durationText = formatDuration(activeResult.timeRemainingMinutes);
  const hasValidPermit = activeResult.permitApplied && activeResult.permitApplied !== "null" && activeResult.permitApplied.trim() !== "";
  const permitDisplayText = hasValidPermit ? activeResult.permitApplied : "No permits applied";

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-32 animate-fade-in">
      <div className="relative group overflow-hidden rounded-2xl border border-slate-200 shadow-lg bg-slate-900">
        <img 
          src={image} 
          alt="Sign" 
          className="w-full max-h-[40vh] object-contain mx-auto"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex justify-between items-end">
           <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Image Processed by AI</span>
           {onRecheck && (
             <button 
               onClick={onRecheck}
               disabled={isRechecking}
               className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg border border-white/20 active:scale-95 transition-all flex items-center gap-1.5"
             >
               <svg className={`w-3 h-3 ${isRechecking ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
               </svg>
               {isRechecking ? 'Updating...' : 'Check again'}
             </button>
           )}
        </div>
      </div>

      {data.results.length > 1 && (
        <div className="bg-white p-1 rounded-2xl border border-slate-100 shadow-sm flex gap-1">
          {data.results.map((res, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                activeIdx === idx 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {res.direction === 'left' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>}
              <span>{res.direction === 'general' ? 'Results' : `${res.direction} Side`}</span>
              {res.direction === 'right' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
            </button>
          ))}
        </div>
      )}

      <div className={`p-6 rounded-3xl border shadow-xl transition-colors duration-300 ${isAllowed ? 'bg-white border-emerald-100' : 'bg-white border-rose-100'}`}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${isAllowed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
               <span className={`w-1.5 h-1.5 rounded-full ${isAllowed ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
               {isAllowed ? 'Parkable Now' : 'Restriction Active'}
            </div>
            <h2 className={`text-4xl font-black tracking-tight leading-none ${isAllowed ? 'text-emerald-900' : 'text-rose-900'}`}>
              {isAllowed ? 'GO AHEAD' : 'STOP'}
            </h2>
            <p className="text-slate-500 font-medium mt-2">{activeResult.summary}</p>
          </div>
          <div className={`p-4 rounded-2xl shadow-lg transition-colors ${isAllowed ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-rose-500 text-white shadow-rose-200'}`}>
             {isAllowed ? (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
             ) : (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                </svg>
             )}
          </div>
        </div>

        {/* Prominent Highlighting for Duration */}
        {isAllowed && durationText && (
          <div className="mb-6 bg-emerald-50 border-2 border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4 animate-fade-in shadow-sm">
            <div className="bg-emerald-500 text-white p-3 rounded-xl shadow-md shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-1">Time Limit</p>
              <p className="text-lg font-bold text-slate-900 leading-tight">
                Maximum <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-lg font-black inline-block transform -rotate-1 shadow-sm">{durationText}</span> paid parking allowed.
              </p>
            </div>
          </div>
        )}

        <div className={`${hasValidPermit ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'} border rounded-2xl p-4 mb-4 flex items-center gap-3 transition-colors`}>
          <div className={`${hasValidPermit ? 'bg-emerald-500' : 'bg-slate-200'} p-2 rounded-lg text-white transition-colors`}>
            {hasValidPermit ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest leading-none mb-1 ${hasValidPermit ? 'text-emerald-600' : 'text-slate-400'}`}>
              Permit Interpretation
            </p>
            <p className={`text-sm font-black leading-none ${hasValidPermit ? 'text-emerald-900' : 'text-slate-500'}`}>
              {permitDisplayText}
            </p>
          </div>
        </div>

        {activeResult.nextStatusChange && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rule Changes At</p>
                <p className="text-sm font-bold text-slate-700">{activeResult.nextStatusChange}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-600 font-medium">
            {activeResult.explanation}
          </p>
          
          <div className="flex flex-wrap gap-2">
            {(activeResult.rules || []).map((rule, idx) => (
              <span key={idx} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-bold uppercase tracking-tight">
                {formatRuleTag(rule)}
              </span>
            ))}
          </div>
        </div>
        
        {activeResult.permitRequired && !hasValidPermit && (
          <div className="mt-4 bg-amber-50 text-amber-800 p-3 rounded-xl text-[11px] font-bold flex items-center gap-2 border border-amber-100">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            ZONE REQUIRES A PERMIT YOU HAVEN'T CONFIGURED
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 relative">
           <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Helpful?</span>
           <button 
             onClick={() => handleFeedback('up')}
             className={`p-2 rounded-lg border transition-all ${feedback === 'up' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white text-slate-400 hover:text-slate-600'}`}
           >
             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 10.133a1.5 1.5 0 00-.8.2z" /></svg>
           </button>
           <button 
             onClick={() => handleFeedback('down')}
             className={`p-2 rounded-lg border transition-all ${feedback === 'down' ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white text-slate-400 hover:text-slate-600'}`}
           >
             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.867a1.5 1.5 0 00.8-.2z" /></svg>
           </button>
           
           {showThanks && (
             <div className="absolute left-full ml-3 px-3 py-1 bg-slate-800 text-white text-[10px] font-bold rounded-full whitespace-nowrap animate-fade-in">
               Feedback saved!
             </div>
           )}
        </div>
        <button
          onClick={onReset}
          className="flex-1 bg-slate-900 text-white py-3 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98]"
        >
          Scan Another
        </button>
      </div>

      <div className="pt-6 text-center space-y-2">
        <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic max-w-xs mx-auto">
          AI guidance only. Interpretations can be wrong. Always verify physical signs. 
          You are responsible for your own parking decisions.
        </p>
      </div>
    </div>
  );
};

export default Results;