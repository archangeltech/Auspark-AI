
import React, { useState } from 'react';
import { ParkingInterpretation } from '../types';

interface ResultsProps {
  data: ParkingInterpretation;
  image: string;
  onReset: () => void;
}

const Results: React.FC<ResultsProps> = ({ data, image, onReset }) => {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const isAllowed = data.canParkNow;

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-32 animate-fade-in">
      <div className="relative group overflow-hidden rounded-2xl border border-slate-200 shadow-lg bg-slate-900">
        <img 
          src={image} 
          alt="Sign" 
          className="w-full max-h-[40vh] object-contain mx-auto"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
           <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Image Processed by AI</span>
        </div>
      </div>

      <div className={`p-6 rounded-3xl border shadow-xl ${isAllowed ? 'bg-white border-emerald-100' : 'bg-white border-rose-100'}`}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${isAllowed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
               <span className={`w-1.5 h-1.5 rounded-full ${isAllowed ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
               {isAllowed ? 'Parkable Now' : 'Restriction Active'}
            </div>
            <h2 className={`text-4xl font-black tracking-tight leading-none ${isAllowed ? 'text-emerald-900' : 'text-rose-900'}`}>
              {isAllowed ? 'GO AHEAD' : 'STOP'}
            </h2>
            <p className="text-slate-500 font-medium mt-2">{data.summary}</p>
          </div>
          <div className={`p-4 rounded-2xl shadow-lg ${isAllowed ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-rose-500 text-white shadow-rose-200'}`}>
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

        {data.permitApplied && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-lg text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none mb-1">Permit Applied</p>
              <p className="text-sm font-black text-emerald-900 leading-none">{data.permitApplied}</p>
            </div>
          </div>
        )}

        {data.nextStatusChange && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valid Until</p>
                <p className="text-sm font-bold text-slate-700">{data.nextStatusChange}</p>
              </div>
            </div>
          </div>
        )}

        <p className="text-sm leading-relaxed text-slate-600 font-medium">
          {data.explanation}
        </p>
        
        {data.permitRequired && !data.permitApplied && (
          <div className="mt-4 bg-amber-50 text-amber-800 p-3 rounded-xl text-[11px] font-bold flex items-center gap-2 border border-amber-100">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            SPECIAL PERMIT REQUIRED FOR THIS ZONE
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
           <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Helpful?</span>
           <button 
             onClick={() => setFeedback('up')}
             className={`p-2 rounded-lg border transition-all ${feedback === 'up' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white text-slate-400 hover:text-slate-600'}`}
           >
             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 10.133a1.5 1.5 0 00-.8.2z" /></svg>
           </button>
           <button 
             onClick={() => setFeedback('down')}
             className={`p-2 rounded-lg border transition-all ${feedback === 'down' ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white text-slate-400 hover:text-slate-600'}`}
           >
             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.867a1.5 1.5 0 00.8-.2z" /></svg>
           </button>
        </div>
        <button
          onClick={onReset}
          className="flex-1 bg-slate-900 text-white py-3 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98]"
        >
          Scan Another
        </button>
      </div>
    </div>
  );
};

export default Results;
