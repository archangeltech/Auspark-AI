import React from 'react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastAcceptedDate: string | null;
  onAccept: () => void;
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, lastAcceptedDate, onAccept }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center p-4">
      {/* Semi-transparent backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Content Frame */}
      <div className="relative bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-fade-in max-h-[90dvh] flex flex-col pointer-events-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <h2 className="text-xl font-black text-slate-900 text-center flex-1 ml-8">Privacy & Terms</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400" 
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-600 leading-relaxed scrollbar-hide">
          <section>
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-2">Guidance Only Disclaimer</h3>
            <p>Parking Sign Reader is an assistive tool designed for informational guidance. AI models can and do make mistakes, misinterpret visual data, or fail to account for temporary local restrictions. <strong>This app is not a substitute for your own knowledge of Australian Road Rules.</strong></p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-2">User Responsibility</h3>
            <p>You remain solely responsible for your vehicle and all parking decisions. You must manually verify all physical signs, painted lines, and curb markings. Parking Sign Reader is not liable for any fines, infringements, towing costs, or damages resulting from the use of this service.</p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-2">Data Privacy & Reporting</h3>
            <p>We collect your <strong>Name and Email</strong> to personalize your experience and facilitate support. If you choose to "Report an Issue," your name and the captured image of the sign will be shared with our developers via email and secure database to help improve our logic engine.</p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-2">Location & Permits</h3>
            <p>During an active scan, we use your <strong>GPS coordinates</strong> to identify local council jurisdictions and specific parking rules. This location data is processed in real-time. Additionally, the app considers your locally stored <strong>Permit Status</strong> (Disability, Resident, Loading Zone, etc.) to provide accurate exemptions.</p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-2">Data Control & Deletion</h3>
            <p>You have full control over your data. You can edit your profile at any time. Selecting <strong>"Delete Profile"</strong> will permanently wipe your local history and account details from the device. To remove data submitted via reports, use the "Delete My Cloud Reports" option in the App Settings.</p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-2">Technical Requirements</h3>
            <p>This service requires a stable internet connection to communicate with our AI engines. Performance is dependent on image quality; ensure signs are clear and well-lit for the best results.</p>
          </section>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
          {lastAcceptedDate ? (
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 animate-fade-in">
              <div className="bg-emerald-500 p-2 rounded-lg text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Status: Accepted</p>
                <p className="text-xs font-bold text-emerald-900">Accepted on {lastAcceptedDate}</p>
              </div>
            </div>
          ) : (
            <button 
              onClick={onAccept}
              className="w-full bg-slate-900 text-white h-20 rounded-[32px] font-black text-lg shadow-lg active:scale-[0.98] transition-all"
            >
              I Accept the Terms
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalModal;