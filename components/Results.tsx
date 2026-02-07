
import React, { useState } from 'react';
import { ParkingInterpretation, DirectionalResult, UserProfile } from '../types.ts';
import { dbService } from '../services/dbService.ts';

interface ResultsProps {
  data: ParkingInterpretation;
  image: string;
  onReset: () => void;
  onRecheck?: () => void;
  onFeedback?: (type: 'up' | 'down') => void;
  isRechecking?: boolean;
  initialFeedback?: 'up' | 'down';
  scanTimestamp?: number;
  profile?: UserProfile;
}

const Results: React.FC<ResultsProps> = ({ 
  data, 
  image, 
  onReset, 
  onRecheck, 
  onFeedback,
  isRechecking,
  initialFeedback,
  scanTimestamp,
  profile
}) => {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(initialFeedback || null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [reportIssue, setReportIssue] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // Safety check for data and results
  if (!data || !data.results || data.results.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center min-h-[80vh] animate-fade-in max-w-md mx-auto bg-white">
        <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[32px] flex items-center justify-center mb-10 shadow-inner">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01" /></svg>
        </div>
        <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-4">No Data Found</h3>
        <p className="text-slate-500 font-bold mb-12">The AI couldn't extract any parking rules from this image.</p>
        <button onClick={onReset} className="w-full bg-slate-900 text-white h-20 rounded-[32px] font-black text-xl shadow-2xl active:scale-95 transition-all">Try Another</button>
      </div>
    );
  }

  const activeResult: DirectionalResult = data.results[activeIdx] || data.results[0];
  const isAllowed = activeResult?.canParkNow;

  const formattedTimestamp = scanTimestamp 
    ? new Date(scanTimestamp).toLocaleString('en-AU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    : null;

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type);
    if (onFeedback) onFeedback(type);
  };

  const handleSendReport = async () => {
    setIsSendingReport(true);
    setReportError(null);
    
    const WEB3FORMS_ACCESS_KEY = "af4bf796-f781-401e-ad3c-f6668d08fa52";

    try {
      const saveResult = await dbService.saveReport({
        userEmail: profile?.email || 'anonymous',
        issueCategory: reportIssue,
        description: reportDescription,
        aiSummary: activeResult.summary,
        aiExplanation: activeResult.explanation,
        timestamp: Date.now(),
        imageAttached: true,
        imageData: image,
        source: 'Original'
      });

      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save report to database');
      }

      const imageUrl = saveResult.imageUrl;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const emailMessage = `
🚗 PARKING SIGN READER - ISSUE REPORT
📋 Category: ${reportIssue}
👤 User: ${profile?.fullName || 'Anonymous'} (${profile?.email || 'N/A'})
📝 Description: ${reportDescription}
🤖 AI Summary: ${activeResult.summary}
💬 AI Explanation: ${activeResult.explanation}
🔗 Image: ${imageUrl || 'No image link'}
⏰ Date: ${new Date().toLocaleString('en-AU')}
      `.trim();

      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `🚗 Parking Report - ${reportIssue}`,
          from_name: profile?.fullName || "App User",
          message: emailMessage,
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`Email service error`);
      setReportSuccess(true);
    } catch (err: any) {
      setReportError(err.message || "Failed to send report. Please try again.");
    } finally {
      setIsSendingReport(false);
    }
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setTimeout(() => {
      setReportSuccess(false);
      setReportIssue('');
      setReportDescription('');
      setReportError(null);
    }, 300);
  };

  const renderTabLabel = (res: DirectionalResult) => {
    const label = res.direction === 'left' ? 'Left' : res.direction === 'right' ? 'Right' : 'Rules';
    return (
      <div className="flex items-center gap-1.5">
        <span className="leading-none">{label}</span>
        {res.direction === 'left' && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>}
        {res.direction === 'right' && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1 animate-fade-in bg-white">
      <div className="relative w-full aspect-[4/3] bg-slate-900 border-b border-slate-200 overflow-hidden shrink-0">
        <img src={image} alt="Target Sign" className="w-full h-full object-contain cursor-zoom-in" onClick={() => setIsImageFullscreen(true)} />
        <div className="absolute top-6 left-6 flex flex-col gap-2 pointer-events-none">
           <div className="bg-slate-900/60 backdrop-blur-xl border border-white/20 px-3 py-1.5 rounded-full inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-white text-[10px] font-black uppercase tracking-[0.1em]">Vision Analysis</span>
           </div>
           {formattedTimestamp && <span className="text-white/60 text-[9px] font-bold px-1">{formattedTimestamp}</span>}
        </div>
        
        {onRecheck && (
           <button onClick={onRecheck} disabled={isRechecking} className="absolute bottom-6 right-6 z-10 bg-white/10 backdrop-blur-xl border border-white/20 text-white text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-2xl active:scale-95 transition-all flex items-center gap-2 shadow-2xl">
             {isRechecking ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9" /></svg><span>Rechecking...</span></> : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9" /></svg><span>Recheck</span></>}
           </button>
        )}
      </div>

      {data.results.length > 1 && (
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex gap-3 overflow-x-auto scrollbar-hide shrink-0">
          {data.results.map((res, idx) => (
            <button key={idx} onClick={() => setActiveIdx(idx)} className={`px-4 py-2.5 rounded-full font-black text-[10px] uppercase tracking-wider whitespace-nowrap transition-all flex items-center justify-center ${activeIdx === idx ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}>
              {renderTabLabel(res)}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-10 max-w-2xl mx-auto w-full">
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                 {activeResult.direction === 'left' && <span className="text-2xl leading-none">←</span>}
                 {activeResult.direction === 'right' && <span className="text-2xl leading-none">→</span>}
                 <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.15em]">{activeResult.direction === 'left' ? 'Left Arrow' : activeResult.direction === 'right' ? 'Right Arrow' : 'General'}</p>
              </div>
              <h2 className={`text-4xl font-black tracking-tighter leading-none ${isAllowed ? 'text-emerald-500' : 'text-rose-500'}`}>{isAllowed ? 'ALLOWED' : 'NOPE'}</h2>
              <p className="text-slate-400 font-black uppercase text-xs tracking-[0.15em]">{activeResult.summary}</p>
            </div>
            <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center shadow-2xl ${isAllowed ? 'bg-emerald-500' : 'bg-rose-500'}`}>
               {isAllowed ? <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg> : <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" /></svg>}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-8 rounded-[36px] mb-8 relative">
             <div className="absolute -top-3 left-8 bg-slate-900 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">Interpretation</div>
             <p className="text-slate-900 font-bold text-lg leading-snug italic">"{activeResult.explanation}"</p>
          </div>

          <div className="space-y-3 mb-10">
            <h4 className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] px-2 mb-4">Detected Rules</h4>
            {activeResult.rules.map((rule, idx) => (
              <div key={idx} className="flex items-start gap-4 bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
                 <div className="w-6 h-6 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center shrink-0 mt-0.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>
                 <p className="text-sm font-bold text-slate-600 leading-tight">{rule}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 py-8 border-t border-slate-100">
             <div className="flex gap-2">
                <button onClick={() => handleFeedback('up')} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm ${feedback === 'up' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-300'}`} aria-label="Helpful"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 10.133a1.5 1.5 0 00-.8.2z" /></svg></button>
                <button onClick={() => setShowReportModal(true)} className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 text-slate-300 flex items-center justify-center active:scale-90 transition-all shadow-sm" aria-label="Report">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                </button>
             </div>
             <button onClick={onReset} className="flex-1 bg-slate-900 text-white h-20 rounded-[32px] font-black text-lg shadow-xl active:scale-95 transition-all tracking-tight">Scan Another</button>
          </div>
        </div>
      </div>

      {isImageFullscreen && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in" onClick={() => setIsImageFullscreen(false)}>
          <button className="absolute top-10 right-8 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all active:scale-90"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
          <div className="w-full h-full p-4 flex items-center justify-center"><img src={image} alt="Sign Detail" className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" onClick={(e) => e.stopPropagation()} /></div>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 z-[10000] grid place-items-center p-6">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={closeReportModal} />
          <div className="relative bg-white w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl animate-fade-in flex flex-col pointer-events-auto max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{reportSuccess ? 'Success' : isSendingReport ? 'Sending...' : 'Report Issue'}</h2>
              <button onClick={closeReportModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-10 space-y-8 overflow-y-auto scrollbar-hide">
              {reportSuccess ? (
                <div className="text-center py-4">
                   <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[36px] flex items-center justify-center mx-auto mb-8 shadow-inner"><svg className="w-12 h-12" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg></div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Submitted!</h3>
                   <p className="text-slate-500 font-bold text-sm leading-relaxed px-4">Thank you! Your report has been uploaded.</p>
                   <button onClick={closeReportModal} className="mt-10 w-full bg-slate-900 text-white h-20 rounded-[32px] font-black active:scale-95 transition-all">Back</button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {["Logic error", "Can't find sign", "Rules misread", "Other"].map(label => <button key={label} onClick={() => setReportIssue(label)} className={`p-4 rounded-3xl border-2 font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center text-center ${reportIssue === label ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>{label}</button>)}
                  </div>
                  <textarea placeholder="Describe the interpretation error..." value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} className="w-full h-40 p-6 rounded-[32px] border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all font-bold text-sm resize-none" />
                  {reportError && <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-4"><p className="text-rose-600 text-xs font-black uppercase text-center">{reportError}</p></div>}
                  <button onClick={handleSendReport} disabled={isSendingReport || !reportIssue || !reportDescription.trim()} className="w-full bg-slate-900 text-white h-20 rounded-[32px] font-black disabled:opacity-30 shadow-xl active:scale-95 transition-all text-lg tracking-tight">{isSendingReport ? 'Uploading...' : 'Submit Report'}</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
