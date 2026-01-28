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
  scanTimestamp?: number;
}

const Results: React.FC<ResultsProps> = ({ 
  data, 
  image, 
  onReset, 
  onRecheck, 
  onFeedback,
  isRechecking,
  initialFeedback,
  scanTimestamp
}) => {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(initialFeedback || null);
  const [showThanks, setShowThanks] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportIssue, setReportIssue] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const error = data?.errorInfo;
  const isValidationError = error && error.code !== 'SUCCESS' && error.code !== 'MULTIPLE_SIGNS';
  const isMultipleSigns = error?.code === 'MULTIPLE_SIGNS';

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
    setShowThanks(true);
    setTimeout(() => setShowThanks(false), 3000);
  };

  const handleSendReport = async () => {
    setIsSendingReport(true);
    setReportError(null);
    
    // CONFIGURATION: Replace this URL with your backend endpoint or Formspree URL
    // Example: "https://formspree.io/f/your_id"
    const BACKEND_URL = "https://formspree.io/f/xlgbyodk"; 

    const payload = {
      developer_email: "contact@archangeltech.com.au",
      subject: `AusPark AI Report: ${reportIssue}`,
      issue_category: reportIssue,
      user_description: reportDescription,
      scan_details: {
        timestamp: scanTimestamp ? new Date(scanTimestamp).toISOString() : 'N/A',
        interpretation: activeResult.summary,
        explanation: activeResult.explanation,
        can_park: activeResult.canParkNow,
        detected_rules: activeResult.rules
      },
      // Note: In a production environment, you might want to send the image separately 
      // or as a base64 string if your backend allows large payloads.
      image_data: image 
    };

    try {
      // If you haven't set up a backend yet, we'll simulate success for now.
      // To enable real sending, uncomment the fetch block below and remove the timeout.
      
      /*
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Server returned an error');
      */

      // Simulated Delay for Demo Purposes
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setReportSuccess(true);
    } catch (err: any) {
      console.error("Report submission failed:", err);
      setReportError("Could not transmit report. Please check your connection or try again later.");
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

  const formatDuration = (mins?: number) => {
    if (mins === undefined || mins === null || mins <= 0) return null;
    if (mins >= 1440) return "Unlimited";
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours > 0 && remainingMins > 0) return `${hours}h ${remainingMins}m`;
    if (hours > 0) return `${hours}${hours === 1 ? 'hr' : 'hrs'}`;
    return `${remainingMins}m`;
  };

  const durationText = formatDuration(activeResult?.timeRemainingMinutes);
  const hasValidPermit = activeResult?.permitApplied && activeResult.permitApplied !== "null" && activeResult.permitApplied.trim() !== "";
  const permitDisplayText = hasValidPermit ? activeResult.permitApplied : "No permits applied";

  const formattedScanTime = scanTimestamp ? new Date(scanTimestamp).toLocaleString('en-AU', {
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }) : null;

  return (
    <div className="p-4 space-y-6 w-full max-w-lg mx-auto pb-32 animate-fade-in overflow-x-hidden">
      {/* Context Badge */}
      {formattedScanTime && (
        <div className="flex justify-center -mb-2">
           <div className="bg-slate-900/5 backdrop-blur-sm border border-slate-200 px-4 py-1.5 rounded-full flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest shadow-sm animate-fade-in">
             <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             Calculated for: <span className="text-slate-900">{formattedScanTime}</span>
           </div>
        </div>
      )}

      {/* Image Preview */}
      <div className="relative group overflow-hidden rounded-3xl border border-slate-200 shadow-lg bg-slate-900">
        <img 
          src={image} 
          alt="Sign" 
          className="w-full max-h-[40vh] object-contain mx-auto"
        />
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

      {/* Results View */}
      {!isValidationError && activeResult && (
        <>
          {/* Main Interpretation Card */}
          <div className={`p-6 rounded-3xl border shadow-xl transition-colors duration-300 overflow-hidden ${isAllowed ? 'bg-white border-emerald-100' : 'bg-white border-rose-100'}`}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1 min-w-0">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${isAllowed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                   <span className={`w-1.5 h-1.5 rounded-full ${isAllowed ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
                   {isAllowed ? 'Parkable Now' : 'Restriction Active'}
                </div>
                <h2 className={`text-4xl font-black tracking-tight leading-none break-words ${isAllowed ? 'text-emerald-900' : 'text-rose-900'}`}>
                  {isAllowed ? 'GO AHEAD' : 'STOP'}
                </h2>
                <p className="text-slate-500 font-medium mt-2 break-words">{activeResult.summary}</p>
              </div>
              <div className={`p-4 rounded-2xl shadow-lg transition-colors shrink-0 ml-4 ${isAllowed ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-rose-500 text-white shadow-rose-200'}`}>
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

            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-slate-600 font-medium break-words">
                {activeResult.explanation}
              </p>
            </div>
          </div>

          {/* Actions & Feedback */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 relative shrink-0">
               <button 
                 onClick={() => handleFeedback('up')}
                 className={`p-2.5 rounded-xl border transition-all ${feedback === 'up' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white text-slate-400 hover:text-slate-600'}`}
               >
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 10.133a1.5 1.5 0 00-.8.2z" /></svg>
               </button>
               <button 
                 onClick={() => handleFeedback('down')}
                 className={`p-2.5 rounded-xl border transition-all ${feedback === 'down' ? 'bg-rose-500 border-rose-500 text-white shadow-lg' : 'bg-white text-slate-400 hover:text-slate-600'}`}
               >
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.867a1.5 1.5 0 00.8-.2z" /></svg>
               </button>
               <button 
                  onClick={() => setShowReportModal(true)}
                  className="p-2.5 rounded-xl border bg-white text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all"
                  title="Report Problem"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               </button>
            </div>
            <button
              onClick={onReset}
              className="flex-1 bg-slate-900 text-white py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all"
            >
              Scan Another
            </button>
          </div>
        </>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[10000] grid place-items-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeReportModal} />
          <div className="relative bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-fade-in flex flex-col pointer-events-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h2 className="text-xl font-black text-slate-900 text-center flex-1 ml-8">
                {reportSuccess ? 'Report Received' : 'Report Problem'}
              </h2>
              <button onClick={closeReportModal} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              {reportSuccess ? (
                <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
                   <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                   </div>
                   <h3 className="text-xl font-black text-slate-900 mb-2">Thank you!</h3>
                   <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[240px]">
                     Our engineering team will review the scan data and photo to improve interpretation logic.
                   </p>
                   <button
                    onClick={closeReportModal}
                    className="mt-8 w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none">What is wrong?</p>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        "Incorrect 'GO/STOP' result",
                        "Wrong time limit detected",
                        "Confused by arrows",
                        "Other issue"
                      ].map((issue) => (
                        <button
                          key={issue}
                          disabled={isSendingReport}
                          onClick={() => setReportIssue(issue)}
                          className={`w-full p-4 rounded-xl border-2 text-left font-bold text-sm transition-all ${
                            reportIssue === issue ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-100 bg-slate-50 text-slate-600'
                          }`}
                        >
                          {issue}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none">Describe the error</p>
                    <textarea 
                      disabled={isSendingReport}
                      placeholder="e.g. 'This should be a 1P zone, but app says Forbidden...'"
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      className="w-full h-32 p-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all font-medium text-sm text-slate-800 resize-none"
                    />
                  </div>

                  {reportError && (
                    <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold border border-rose-100 animate-fade-in">
                      {reportError}
                    </div>
                  )}

                  <button
                    onClick={handleSendReport}
                    disabled={isSendingReport || !reportIssue || !reportDescription.trim()}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSendingReport ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Transmitting...</span>
                      </>
                    ) : (
                      'Submit Securely'
                    )}
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