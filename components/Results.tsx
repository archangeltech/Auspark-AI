import React, { useState } from 'react';
import { ParkingInterpretation, DirectionalResult, UserProfile } from '../types';

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
  const [reportIssue, setReportIssue] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const error = data?.errorInfo;
  const isValidationError = error && error.code !== 'SUCCESS' && error.code !== 'MULTIPLE_SIGNS';

  if (!data || (!data.results?.length && !isValidationError)) {
    return (
      <div className="p-10 text-center animate-fade-in w-full max-w-md mx-auto">
        <p className="text-slate-500 font-bold">Could not read sign results. Please try again.</p>
        <button onClick={onReset} className="mt-4 bg-slate-900 text-white px-6 py-2 rounded-xl">Back</button>
      </div>
    );
  }

  const activeResult: DirectionalResult = data.results[activeIdx] || data.results[0];
  const isAllowed = activeResult?.canParkNow;

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type);
    if (onFeedback) onFeedback(type);
  };

  const dataURLtoFile = (dataurl: string, filename: string) => {
    try {
      const arr = dataurl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
    } catch (e) {
      console.error("Binary conversion failed:", e);
      return null;
    }
  };

  const handleSendReport = async (includeImage: boolean = true) => {
    setIsSendingReport(true);
    setReportError(null);
    const WEB3FORMS_ACCESS_KEY = "af4bf796-f781-401e-ad3c-f6668d08fa52"; 
    const BACKEND_URL = "https://api.web3forms.com/submit";

    try {
      const formData = new FormData();
      formData.append('access_key', WEB3FORMS_ACCESS_KEY);
      formData.append('subject', `AusPark AI Issue: ${reportIssue} (${activeResult.direction})`);
      formData.append('from_name', profile?.fullName || 'AusPark AI User');
      formData.append('from_email', profile?.email || 'no-email@auspark.ai');
      
      formData.append('Issue Category', reportIssue);
      formData.append('Description', reportDescription);
      
      if (profile) {
        formData.append('User Name', profile.fullName);
        formData.append('User Email', profile.email);
        formData.append('Vehicle', profile.vehicleNumber);
        formData.append('Permits', [
          profile.hasDisabilityPermit ? 'Disability' : null,
          profile.hasResidentPermit ? `Resident (${profile.residentArea})` : null,
          profile.hasLoadingZonePermit ? 'Loading Zone' : null,
          profile.hasBusinessPermit ? 'Business' : null
        ].filter(Boolean).join(', '));
      }

      formData.append('Scan Time', scanTimestamp ? new Date(scanTimestamp).toLocaleString('en-AU') : 'N/A');
      formData.append('AI Result', activeResult.canParkNow ? "ALLOWED" : "FORBIDDEN");
      formData.append('AI Summary', activeResult.summary);
      formData.append('AI Explanation', activeResult.explanation);
      formData.append('Direction', activeResult.direction);

      if (includeImage) {
        const file = dataURLtoFile(image, 'parking_sign_report.jpg');
        if (file) {
          formData.append('attachment', file);
        }
      }

      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setReportSuccess(true);
      } else {
        const msg = result.message || 'Transmission failed';
        if (includeImage && (msg.toLowerCase().includes('file') || msg.toLowerCase().includes('permitted') || msg.toLowerCase().includes('size'))) {
          return handleSendReport(false); 
        }
        throw new Error(msg);
      }
    } catch (err: any) {
      setReportError(err.message || "Connection error.");
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

  const DirectionIcon = ({ dir }: { dir: string }) => {
    if (dir === 'left') return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
    if (dir === 'right') return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>;
    return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
  };

  const formattedScanTime = scanTimestamp ? new Date(scanTimestamp).toLocaleString('en-AU', {
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }) : null;

  return (
    <div className="p-4 space-y-6 w-full max-w-lg mx-auto pb-32 animate-fade-in overflow-x-hidden">
      {formattedScanTime && (
        <div className="flex justify-center -mb-2">
           <div className="bg-slate-900/5 backdrop-blur-sm border border-slate-200 px-4 py-1.5 rounded-full flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest shadow-sm">
             <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             Calculated for: <span className="text-slate-900">{formattedScanTime}</span>
           </div>
        </div>
      )}

      {/* Image View */}
      <div className="relative group overflow-hidden rounded-3xl border border-slate-200 shadow-lg bg-slate-900">
        <img src={image} alt="Sign" className="w-full max-h-[40vh] object-contain mx-auto" />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex justify-between items-end">
           <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Vision AI Scan</span>
           {onRecheck && (
             <button 
               onClick={onRecheck}
               disabled={isRechecking}
               className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg border border-white/20 active:scale-95 transition-all flex items-center gap-1.5"
             >
               <svg className={`w-3 h-3 ${isRechecking ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
               </svg>
               {isRechecking ? 'Updating...' : 'Refresh Logic'}
             </button>
           )}
        </div>
      </div>

      {/* Multi-Sign Tab Selector */}
      {data.results.length > 1 && (
        <div className="flex p-1 bg-slate-200/50 backdrop-blur-sm rounded-2xl border border-slate-200 gap-1">
          {data.results.map((res, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={`flex-1 py-3 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeIdx === idx ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <DirectionIcon dir={res.direction} />
              {res.direction === 'general' ? 'Full Pole' : `${res.direction} Sign`}
            </button>
          ))}
        </div>
      )}

      {!isValidationError && activeResult && (
        <>
          <div className={`p-6 rounded-3xl border shadow-xl transition-colors duration-300 overflow-hidden ${isAllowed ? 'bg-white border-emerald-100' : 'bg-white border-rose-100'}`}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1 min-w-0">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${isAllowed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                   <DirectionIcon dir={activeResult.direction} />
                   <span>{activeResult.direction} Arrow Rule</span>
                </div>
                <h2 className={`text-4xl font-black tracking-tight leading-none break-words ${isAllowed ? 'text-emerald-900' : 'text-rose-900'}`}>
                  {isAllowed ? 'GO AHEAD' : 'STOP'}
                </h2>
                <p className="text-slate-500 font-bold mt-2 uppercase text-[11px] tracking-wide flex items-center gap-1.5">
                   {activeResult.summary}
                </p>
              </div>
              <div className={`p-4 rounded-2xl shadow-lg transition-colors shrink-0 ml-4 ${isAllowed ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-rose-500 text-white shadow-rose-200'}`}>
                 {isAllowed ? (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                 ) : (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                 )}
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-5">
              <p className="text-sm leading-relaxed text-slate-700 font-semibold break-words bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {activeResult.explanation}
              </p>
              
              {activeResult.rules && activeResult.rules.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeResult.rules.map((rule, i) => (
                    <span key={i} className="text-[9px] font-black bg-slate-900/5 text-slate-500 px-2.5 py-1 rounded-lg border border-slate-100 uppercase tracking-tighter">
                      {rule}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 relative shrink-0">
               <button onClick={() => handleFeedback('up')} className={`p-2.5 rounded-xl border transition-all ${feedback === 'up' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white text-slate-400 hover:text-slate-600'}`}>
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 10.133a1.5 1.5 0 00-.8.2z" /></svg>
               </button>
               <button onClick={() => handleFeedback('down')} className={`p-2.5 rounded-xl border transition-all ${feedback === 'down' ? 'bg-rose-500 border-rose-500 text-white shadow-lg' : 'bg-white text-slate-400 hover:text-slate-600'}`}>
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.867a1.5 1.5 0 00.8-.2z" /></svg>
               </button>
               <button onClick={() => setShowReportModal(true)} className="p-2.5 rounded-xl border bg-white text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               </button>
            </div>
            <button onClick={onReset} className="flex-1 bg-slate-900 text-white py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all">
              Scan Another
            </button>
          </div>
        </>
      )}

      {showReportModal && (
        <div className="fixed inset-0 z-[10000] grid place-items-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeReportModal} />
          <div className="relative bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-fade-in flex flex-col pointer-events-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h2 className="text-xl font-black text-slate-900 text-center flex-1 ml-8">{reportSuccess ? 'Report Received' : 'Report Problem'}</h2>
              <button onClick={closeReportModal} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
              {reportSuccess ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                   <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>
                   <h3 className="text-xl font-black text-slate-900 mb-2">Thank you!</h3>
                   <button onClick={closeReportModal} className="mt-8 w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest">Done</button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none">Issue Type</p>
                    <div className="grid grid-cols-1 gap-2">
                      {["Incorrect GO/STOP", "Wrong time limit", "Arrow confusion", "Other"].map(issue => (
                        <button key={issue} onClick={() => setReportIssue(issue)} className={`w-full p-4 rounded-xl border-2 text-left font-bold text-sm transition-all ${reportIssue === issue ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-100 bg-slate-50 text-slate-600'}`}>{issue}</button>
                      ))}
                    </div>
                  </div>
                  <textarea placeholder="Tell us what's wrong..." value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} className="w-full h-32 p-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all font-medium text-sm text-slate-800 resize-none" />
                  {reportError && <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold border border-rose-100">{reportError}</div>}
                  <button onClick={() => handleSendReport(true)} disabled={isSendingReport || !reportIssue || !reportDescription.trim()} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 disabled:opacity-50">
                    {isSendingReport ? <span>Sending...</span> : 'Submit Securely'}
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