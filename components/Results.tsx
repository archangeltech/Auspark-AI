import React, { useState } from 'react';
import { ParkingInterpretation, DirectionalResult, UserProfile } from '../types';
import { dbService } from '../services/dbService';

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
  profile
}) => {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(initialFeedback || null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportIssue, setReportIssue] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [activeIdx] = useState(0);

  const activeResult: DirectionalResult = data.results[activeIdx] || data.results[0];
  const isAllowed = activeResult?.canParkNow;

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type);
    if (onFeedback) onFeedback(type);
  };

  const handleSendReport = async () => {
    setIsSendingReport(true);
    setReportError(null);
    // standard Access Key for demo purposes
    const WEB3FORMS_ACCESS_KEY = "af4bf796-f781-401e-ad3c-f6668d08fa52"; 

    try {
      // 1. Log to database (local or supabase) including the image
      await dbService.saveReport({
        userEmail: profile?.email || 'anonymous',
        issueCategory: reportIssue,
        description: reportDescription,
        aiSummary: activeResult.summary,
        aiExplanation: activeResult.explanation,
        timestamp: Date.now(),
        imageAttached: true,
        imageData: image, // Store the captured image
        source: 'Original'
      });

      // 2. Submit text-only report via JSON fetch to avoid "Pro" file errors
      // We include the image base64 as a string field in the JSON body
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `Parking Issue: ${reportIssue}`,
          from_name: profile?.fullName || "App User",
          from_email: profile?.email || "support@auspark.ai",
          message: `
            User: ${profile?.fullName || 'Anonymous User'}
            User Email: ${profile?.email || 'Anonymous'}
            Issue Category: ${reportIssue}
            
            Description:
            ${reportDescription}
            
            AI Result Info:
            Summary: ${activeResult.summary}
            Allowed: ${activeResult.canParkNow ? "YES" : "NO"}
            Logic: ${activeResult.explanation}
            Timestamp: ${new Date().toLocaleString('en-AU')}
          `,
          captured_image: image // Included as a text string field
        }),
      });
      
      const json = await res.json();
      if (json.success) {
        setReportSuccess(true);
      } else {
        throw new Error(json.message || "Submission failed");
      }
    } catch (err: any) {
      setReportError(err.message || "Failed to transmit report.");
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

  return (
    <div className="p-5 space-y-8 w-full max-w-lg mx-auto pb-32 animate-fade-in overflow-x-hidden">
      <div className="relative overflow-hidden rounded-[32px] border border-slate-200 shadow-2xl bg-slate-900 ring-4 ring-white">
        <img src={image} alt="Sign" className="w-full max-h-[42vh] object-contain mx-auto" />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 flex justify-between items-end">
           <span className="text-white/60 text-[9px] font-black uppercase tracking-[0.2em]">Vision AI scan</span>
           {onRecheck && (
             <button onClick={onRecheck} disabled={isRechecking} className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl border border-emerald-400 active:scale-95 transition-all flex items-center gap-2 shadow-lg whitespace-nowrap">
               <svg className={`w-3.5 h-3.5 ${isRechecking ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357-2H15" /></svg>
               {isRechecking ? 'Processing...' : 'Re-Check'}
             </button>
           )}
        </div>
      </div>

      <div className={`p-8 rounded-[32px] border shadow-2xl transition-all relative overflow-hidden ${isAllowed ? 'bg-white border-emerald-100 ring-8 ring-emerald-50/50' : 'bg-white border-rose-100 ring-8 ring-rose-50/50'}`}>
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className={`text-[36px] sm:text-[42px] font-black tracking-tighter leading-none mb-3 ${isAllowed ? 'text-emerald-950' : 'text-rose-950'}`}>
              {isAllowed ? 'GO AHEAD' : 'STOP'}
            </h2>
            <p className="text-slate-500 font-black uppercase text-[12px] tracking-widest">{activeResult.summary}</p>
          </div>
          <div className={`p-6 rounded-[24px] shadow-2xl ${isAllowed ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
             {isAllowed ? <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg> : <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>}
          </div>
        </div>
        <div className="bg-slate-50/80 p-5 rounded-[24px] border border-slate-100 italic text-sm font-bold text-slate-800 leading-relaxed">"{activeResult.explanation}"</div>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <div className="flex gap-2">
          <button onClick={() => handleFeedback('up')} className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${feedback === 'up' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-100 text-slate-300'}`} title="Helpful Result"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 10.133a1.5 1.5 0 00-.8.2z" /></svg></button>
          <button onClick={() => handleFeedback('down')} className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${feedback === 'down' ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-slate-100 text-slate-300'}`} title="Incorrect Result"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 00-1-1v-.667a4 4 0 01.8-2.4l1.4-1.867a1.5 1.5 0 00.8-.2z" /></svg></button>
          <button onClick={() => setShowReportModal(true)} className="w-14 h-14 rounded-2xl border-2 bg-white border-slate-100 text-slate-300 flex items-center justify-center transition-colors hover:border-rose-200 hover:text-rose-400" title="Report Issue"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></button>
        </div>
        <button onClick={onReset} className="flex-1 bg-slate-900 text-white h-14 rounded-2xl font-black uppercase text-sm active:scale-[0.98] transition-all">Scan Another</button>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 z-[10000] grid place-items-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeReportModal} />
          <div className="relative bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-fade-in flex flex-col pointer-events-auto max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h2 className="text-xl font-black text-slate-900 text-center flex-1 ml-8">{reportSuccess ? 'Success' : 'Report Issue'}</h2>
              <button onClick={closeReportModal} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-8 space-y-6 overflow-y-auto scrollbar-hide">
              {reportSuccess ? (
                <div className="text-center py-10">
                   <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>
                   <h3 className="text-2xl font-black text-slate-900">Report Sent</h3>
                   <p className="text-slate-500 mt-2 font-medium">Thank you! Our logic team will review this case shortly.</p>
                   <button onClick={closeReportModal} className="mt-8 w-full bg-slate-900 text-white h-14 rounded-2xl font-black active:scale-95 transition-all">Close</button>
                </div>
              ) : (
                <>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Category</p>
                  <div className="grid grid-cols-2 gap-3">
                    {["Incorrect logic", "Sign not found", "Rules misread", "Other"].map(label => (
                      <button key={label} onClick={() => setReportIssue(label)} className={`p-4 rounded-2xl border-2 font-bold text-xs transition-all ${reportIssue === label ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>{label}</button>
                    ))}
                  </div>
                  
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 mt-4">Details</p>
                  <textarea 
                    placeholder="Briefly describe what's wrong with the interpretation..." 
                    value={reportDescription} 
                    onChange={(e) => setReportDescription(e.target.value)} 
                    className="w-full h-36 p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all font-medium text-sm" 
                  />
                  
                  {reportError && <p className="text-rose-500 text-[10px] font-bold uppercase text-center">{reportError}</p>}
                  <button 
                    onClick={handleSendReport} 
                    disabled={isSendingReport || !reportIssue || !reportDescription.trim()} 
                    className="w-full bg-slate-900 text-white h-16 rounded-2xl font-black disabled:opacity-50 mt-4 shadow-lg active:scale-95 transition-all"
                  >
                    {isSendingReport ? 'Transmitting...' : 'Send Report'}
                  </button>
                  <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-wider">Note: The captured image is attached to this report.</p>
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