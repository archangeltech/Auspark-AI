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
╔══════════════════════════════════════════╗
║   PARKING SIGN READER - ISSUE REPORT    ║
╚══════════════════════════════════════════╝

📋 Issue Category: ${reportIssue}

👤 User: ${profile?.fullName || 'Anonymous'}
📧 Email: ${profile?.email || 'Not provided'}

📝 User Description:
${reportDescription}

🤖 AI Summary: 
${activeResult.summary}

💬 AI Explanation:
${activeResult.explanation}

📸 Image: ${imageUrl ? '✅ Uploaded to Supabase Storage' : '⚠️ No image'}
${imageUrl ? `🔗 View Image: ${imageUrl}` : ''}

⏰ Timestamp: ${new Date().toLocaleString('en-AU')}
📍 Report ID: ${Date.now()}

---
Sent from Parking Sign Reader App v1.0.5
      `.trim();

      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Accept: "application/json" 
        },
        signal: controller.signal,
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `🚗 Parking Sign Reader - ${reportIssue}`,
          from_name: profile?.fullName || "App User",
          email: profile?.email || "noreply@parkingsignreader.com.au",
          message: emailMessage,
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Email service error (${res.status}): ${errorText || res.statusText}`);
      }

      const json = await res.json();
      
      if (json.success) {
        setReportSuccess(true);
      } else {
        throw new Error(json.message || "Email service rejected submission");
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setReportError("Request timeout. Please check your internet connection.");
      } else if (err.message.includes('Database not configured')) {
        setReportError("Database error. Please check your Supabase configuration.");
      } else {
        setReportError(err.message || "Failed to send report. Please try again.");
      }
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

  const getDirectionLabel = (dir: string) => {
    switch (dir) {
      case 'left': return 'Left Arrow ←';
      case 'right': return 'Right Arrow →';
      default: return 'General Rules';
    }
  };

  return (
    <div className="flex flex-col flex-1 animate-fade-in bg-white">
      <div className="relative w-full aspect-[4/3] bg-slate-900 border-b border-slate-200 overflow-hidden shrink-0">
        <img 
          src={image} 
          alt="Target Sign" 
          className="w-full h-full object-contain cursor-zoom-in" 
          onClick={() => setIsImageFullscreen(true)}
        />
        <div className="absolute top-6 left-6 flex flex-col gap-2 pointer-events-none">
           <div className="bg-slate-900/60 backdrop-blur-xl border border-white/20 px-3 py-1.5 rounded-full inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-white text-[10px] font-black uppercase tracking-[0.1em]">Vision Analysis</span>
           </div>
           {formattedTimestamp && (
             <span className="text-white/60 text-[9px] font-bold px-1">{formattedTimestamp}</span>
           )}
        </div>
        
        <div className="absolute top-6 right-6 pointer-events-none">
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20 text-white/60">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
          </div>
        </div>

        {onRecheck && (
           <button 
             onClick={onRecheck} 
             disabled={isRechecking} 
             className="absolute bottom-6 right-6 z-10 bg-white/10 backdrop-blur-xl border border-white/20 text-white text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-2xl active:scale-95 transition-all flex items-center gap-2 shadow-2xl"
           >
             {isRechecking ? (
               <>
                 <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                 <span>Rechecking...</span>
               </>
             ) : (
               <>
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                 <span>Recheck</span>
               </>
             )}
           </button>
        )}
      </div>

      {data.results.length > 1 && (
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
          {data.results.map((res, idx) => (
            <button 
              key={idx} 
              onClick={() => setActiveIdx(idx)} 
              className={`px-4 py-2 rounded-2xl font-bold text-[10px] uppercase tracking-wider whitespace-nowrap transition-all ${activeIdx === idx ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}
            >
              {getDirectionLabel(res.direction)}
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
                 <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.15em]">{getDirectionLabel(activeResult.direction)}</p>
              </div>
              <h2 className={`text-4xl font-black tracking-tighter leading-none ${isAllowed ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isAllowed ? 'ALLOWED' : 'NOPE'}
              </h2>
              <p className="text-slate-400 font-black uppercase text-xs tracking-[0.15em]">{activeResult.summary}</p>
            </div>
            <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center shadow-2xl ${isAllowed ? 'bg-emerald-500 shadow-emerald-200' : 'bg-rose-500 shadow-rose-200'}`}>
               {isAllowed ? (
                 <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
               ) : (
                 <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" /></svg>
               )}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-8 rounded-[36px] mb-8 relative">
             <div className="absolute -top-3 left-8 bg-slate-900 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">Interpretation</div>
             <p className="text-slate-900 font-bold text-lg leading-snug italic">
               "{activeResult.explanation}"
             </p>
          </div>

          <div className="space-y-3 mb-10">
            <h4 className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] px-2 mb-4">Detected Rules</h4>
            {activeResult.rules.map((rule, idx) => (
              <div key={idx} className="flex items-start gap-4 bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
                 <div className="w-6 h-6 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                   <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                 </div>
                 <p className="text-sm font-bold text-slate-600 leading-tight">{rule}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 py-8 border-t border-slate-100">
             <div className="flex gap-2">
                <button 
                  onClick={() => handleFeedback('up')} 
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm ${feedback === 'up' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-300 border border-slate-100'}`}
                  aria-label="Helpful"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 10.133a1.5 1.5 0 00-.8.2z" /></svg>
                </button>
                <button 
                  onClick={() => setShowReportModal(true)}
                  className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 text-slate-300 flex items-center justify-center active:scale-90 transition-all shadow-sm"
                  aria-label="Report"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </button>
             </div>
             <button 
              onClick={onReset} 
              className="flex-1 bg-slate-900 text-white h-20 rounded-[32px] font-black text-lg shadow-xl active:scale-95 transition-all tracking-tight"
             >
               Scan Another
             </button>
          </div>
        </div>
      </div>

      {isImageFullscreen && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in">
          <button 
            onClick={() => setIsImageFullscreen(false)} 
            className="absolute top-10 right-8 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all active:scale-90"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="w-full h-full p-4 flex items-center justify-center" onClick={() => setIsImageFullscreen(false)}>
            <img 
              src={image} 
              alt="Sign Detail" 
              className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
          {formattedTimestamp && (
             <div className="absolute bottom-10 inset-x-0 text-center text-white/40 text-[10px] font-black uppercase tracking-[0.2em] pointer-events-none">
                Captured: {formattedTimestamp}
             </div>
          )}
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 z-[10000] grid place-items-center p-6">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={closeReportModal} />
          <div className="relative bg-white w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl animate-fade-in flex flex-col pointer-events-auto max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {reportSuccess ? 'Success' : isSendingReport ? 'Sending...' : 'Report Issue'}
              </h2>
              <button onClick={closeReportModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-10 space-y-8 overflow-y-auto scrollbar-hide">
              {reportSuccess ? (
                <div className="text-center py-4">
                   <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[36px] flex items-center justify-center mx-auto mb-8 shadow-inner">
                     <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                     </svg>
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Report Submitted!</h3>
                   <p className="text-slate-500 font-bold text-sm leading-relaxed px-4">
                     Thank you! Your parking sign image has been uploaded to our database. Our team will review it to improve the AI.
                   </p>
                   <button 
                     onClick={closeReportModal} 
                     className="mt-10 w-full bg-slate-900 text-white h-20 rounded-[32px] font-black active:scale-95 transition-all"
                   >
                     Back to Results
                   </button>
                </div>
              ) : isSendingReport ? (
                <div className="text-center py-4">
                   <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-[36px] flex items-center justify-center mx-auto mb-8 shadow-inner">
                     <svg className="w-12 h-12 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                     </svg>
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Uploading Image...</h3>
                   <p className="text-slate-500 font-bold text-sm leading-relaxed px-4">
                     Saving to Supabase Storage and notifying our team
                   </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {["Logic error", "Can't find sign", "Rules misread", "Other"].map(label => (
                      <button 
                        key={label} 
                        onClick={() => setReportIssue(label)} 
                        className={`p-4 rounded-3xl border-2 font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center text-center ${reportIssue === label ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  
                  <textarea 
                    placeholder="Describe the interpretation error..." 
                    value={reportDescription} 
                    onChange={(e) => setReportDescription(e.target.value)} 
                    className="w-full h-40 p-6 rounded-[32px] border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all font-bold text-sm resize-none" 
                  />
                  
                  {reportError && (
                    <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-4">
                      <p className="text-rose-600 text-xs font-black uppercase text-center leading-relaxed">
                        {reportError}
                      </p>
                    </div>
                  )}
                  
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center px-4 leading-relaxed">
                    Your parking sign image will be uploaded to Supabase Storage to help improve AI accuracy.
                  </p>

                  <button 
                    onClick={handleSendReport} 
                    disabled={isSendingReport || !reportIssue || !reportDescription.trim()} 
                    className="w-full bg-slate-900 text-white h-20 rounded-[32px] font-black disabled:opacity-30 shadow-xl active:scale-95 transition-all text-lg tracking-tight"
                  >
                    {isSendingReport ? 'Uploading...' : 'Submit Report'}
                  </button>
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