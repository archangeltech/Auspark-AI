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
        <button onClick={onReset} className="mt-6 bg-slate-900 text-white w-full h-16 rounded-2xl font-black uppercase text-sm">Back</button>
      </div>
    );
  }

  const activeResult: DirectionalResult = data.results[activeIdx] || data.results[0];
  const isAllowed = activeResult?.canParkNow;

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type);
    if (onFeedback) onFeedback(type);
  };

  /**
   * More robust asynchronous conversion of Data URL to File object
   */
  const convertDataURLtoFile = async (dataurl: string, filename: string) => {
    try {
      const res = await fetch(dataurl);
      const blob = await res.blob();
      return new File([blob], filename, { type: 'image/jpeg' });
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
      formData.append('subject', `Parking Sign Reader Issue: ${reportIssue} (${activeResult.direction})`);
      formData.append('from_name', profile?.fullName || 'Parking Sign Reader User');
      formData.append('from_email', profile?.email || 'support@parkingsignreader.ai');
      
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

      if (includeImage && image) {
        // Ensure the file is actually created and appended correctly
        const file = await convertDataURLtoFile(image, 'parking_sign_report.jpg');
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
        // If it's a file size error, try sending without the attachment as a fallback
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
    <div className="p-5 space-y-8 w-full max-w-lg mx-auto pb-32 animate-fade-in overflow-x-hidden">
      {formattedScanTime && (
        <div className="flex justify-center -mb-4">
           <div className="bg-slate-900 text-white/90 backdrop-blur-sm border border-slate-700 px-5 py-2 rounded-full flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest shadow-xl">
             <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             Calculated for: <span className="text-white font-bold">{formattedScanTime}</span>
           </div>
        </div>
      )}

      {/* Image View */}
      <div className="relative group overflow-hidden rounded-[32px] border border-slate-200 shadow-2xl bg-slate-900 ring-4 ring-white">
        <img src={image} alt="Sign" className="w-full max-h-[42vh] object-contain mx-auto" />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 flex justify-between items-end">
           <span className="text-white/60 text-[9px] font-black uppercase tracking-[0.2em]">Vision AI scan</span>
           {onRecheck && (
             <button 
               onClick={onRecheck}
               disabled={isRechecking}
               className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl border border-emerald-400 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/40 whitespace-nowrap shrink-0"
             >
               <svg className={`w-3.5 h-3.5 ${isRechecking ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
               </svg>
               {isRechecking ? 'Processing...' : 'Re-Check'}
             </button>
           )}
        </div>
      </div>

      {/* Multi-Sign Tab Selector - Styled as a segmented control */}
      {data.results.length > 1 && (
        <div className="flex p-1.5 bg-slate-200/60 backdrop-blur-md rounded-2xl border border-slate-200 gap-1.5 shadow-inner">
          {data.results.map((res, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={`flex-1 py-3 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeIdx === idx ? 'bg-white text-slate-900 shadow-md transform scale-[1.02]' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <DirectionIcon dir={res.direction} />
              <span className="truncate">{res.direction === 'general' ? 'Center' : res.direction}</span>
            </button>
          ))}
        </div>
      )}

      {!isValidationError && activeResult && (
        <>
          <div className={`p-8 rounded-[32px] border shadow-2xl transition-all duration-300 relative overflow-hidden ${isAllowed ? 'bg-white border-emerald-100 ring-8 ring-emerald-50/50' : 'bg-white border-rose-100 ring-8 ring-rose-50/50'}`}>
            <div className="flex items-start justify-between mb-8">
              <div className="flex-1 min-w-0 pr-4">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ${isAllowed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                   <DirectionIcon dir={activeResult.direction} />
                   <span>{activeResult.direction} arrow</span>
                </div>
                <h2 className={`text-[36px] sm:text-[42px] font-black tracking-tighter leading-none mb-3 ${isAllowed ? 'text-emerald-950' : 'text-rose-950'}`}>
                  {isAllowed ? 'GO AHEAD' : 'STOP'}
                </h2>
                <p className="text-slate-500 font-black uppercase text-[12px] tracking-widest flex items-center gap-2">
                   {activeResult.summary}
                </p>
              </div>
              <div className={`p-6 rounded-[24px] shadow-2xl transition-all shrink-0 ${isAllowed ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-rose-500 text-white shadow-rose-200'}`}>
                 {isAllowed ? (
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                 ) : (
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                 )}
              </div>
            </div>

            <div className="space-y-5 border-t border-slate-100 pt-8">
              <div className="bg-slate-50/80 p-5 rounded-[24px] border border-slate-100">
                <p className="text-sm leading-relaxed text-slate-800 font-bold break-words italic">
                  "{activeResult.explanation}"
                </p>
              </div>
              
              {activeResult.rules && activeResult.rules.length > 0 && (
                <div className="flex flex-wrap gap-2.5">
                  {activeResult.rules.map((rule, i) => (
                    <span key={i} className="text-[10px] font-black bg-slate-900 text-white/90 px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-sm">
                      {rule}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-5 pt-4">
            <div className="flex items-center gap-2.5 shrink-0">
               <button onClick={() => handleFeedback('up')} className={`p-3.5 h-16 w-16 rounded-2xl border-2 transition-all active:scale-90 flex items-center justify-center ${feedback === 'up' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-300 hover:text-slate-500 hover:border-slate-200'}`}>
                 <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 10.133a1.5 1.5 0 00-.8.2z" /></svg>
               </button>
               <button onClick={() => handleFeedback('down')} className={`p-3.5 h-16 w-16 rounded-2xl border-2 transition-all active:scale-90 flex items-center justify-center ${feedback === 'down' ? 'bg-rose-500 border-rose-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-300 hover:text-slate-500 hover:border-slate-200'}`}>
                 <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 00-1-1v-.667a4 4 0 01.8-2.4l1.4-1.867a1.5 1.5 0 00.8-.2z" /></svg>
               </button>
               <button onClick={() => setShowReportModal(true)} className="p-3.5 h-16 w-16 rounded-2xl border-2 bg-white border-slate-100 text-slate-300 hover:text-rose-500 hover:border-rose-100 transition-all active:scale-90 flex items-center justify-center">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               </button>
            </div>
            <button onClick={onReset} className="flex-1 bg-slate-900 text-white h-16 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-slate-200 active:scale-[0.98] transition-all">
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
              <h2 className="text-xl font-black text-slate-900 text-center flex-1 ml-8">{reportSuccess ? 'Success' : 'Report Issue'}</h2>
              <button onClick={closeReportModal} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
              {reportSuccess ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                   <div className="w-24 h-24 bg-emerald-100 rounded-[32px] flex items-center justify-center mb-8 text-emerald-600 shadow-inner"><svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>
                   <h3 className="text-2xl font-black text-slate-900 mb-2">Report Sent</h3>
                   <p className="text-slate-500 font-medium">Our team will review this sign logic.</p>
                   <button onClick={closeReportModal} className="mt-10 w-full bg-slate-900 text-white h-16 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl">Back to Result</button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none ml-1">What's the issue?</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Wrong result", icon: "❌" },
                        { label: "Time error", icon: "⏰" },
                        { label: "Arrow error", icon: "↔️" },
                        { label: "Other", icon: "❓" }
                      ].map(issue => (
                        <button 
                          key={issue.label} 
                          type="button"
                          onClick={() => setReportIssue(issue.label)} 
                          className={`flex flex-col items-center justify-center p-5 rounded-[24px] border-2 transition-all active:scale-[0.96] ${reportIssue === issue.label ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-inner' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 hover:bg-slate-100/50'}`}
                        >
                          <span className="text-3xl mb-2.5 filter drop-shadow-sm">{issue.icon}</span>
                          <span className="font-black text-[11px] uppercase tracking-wider">{issue.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none ml-1">Additional details</p>
                    <textarea 
                      placeholder="e.g. This is a 2-hour zone on weekends..." 
                      value={reportDescription} 
                      onChange={(e) => setReportDescription(e.target.value)} 
                      className="w-full h-32 p-5 rounded-[24px] border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all font-medium text-sm text-slate-800 resize-none shadow-inner" 
                    />
                  </div>
                  
                  <div className={`p-4 rounded-[20px] border flex items-center gap-3.5 transition-all ${image ? 'bg-emerald-50/60 border-emerald-100' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                    <div className={`p-2.5 rounded-xl ${image ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${image ? 'text-emerald-800' : 'text-slate-500'}`}>
                        {image ? 'Photo Attached' : 'No photo detected'}
                      </p>
                      <p className={`text-[10px] font-medium leading-tight ${image ? 'text-emerald-600/70' : 'text-slate-400'}`}>
                        {image ? 'The sign image will be sent for review.' : 'Try scanning again for a better result.'}
                      </p>
                    </div>
                  </div>

                  {reportError && <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-xs font-black border border-rose-100 tracking-wide uppercase">{reportError}</div>}
                  <button 
                    onClick={() => handleSendReport(true)} 
                    disabled={isSendingReport || !reportIssue || !reportDescription.trim()} 
                    className="w-full bg-slate-900 text-white h-16 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 transition-all"
                  >
                    {isSendingReport ? (
                      <div className="flex items-center gap-2.5">
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span>Transmitting...</span>
                      </div>
                    ) : 'Send Feedback'}
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
