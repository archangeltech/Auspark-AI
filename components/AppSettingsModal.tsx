import React from 'react';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AppSettingsModal: React.FC<AppSettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      alert("Permission requested! If you don't see a prompt, please check your browser's address bar or site settings.");
    } catch (err) {
      alert("Permission was denied or is blocked. Please go to your device Settings > Browser > AusPark AI and enable Camera access manually.");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      
      <div className="relative bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-fade-in flex flex-col pointer-events-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <h2 className="text-xl font-black text-slate-900 text-center flex-1 ml-8">App Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Device Permissions</h3>
            
            <div className="space-y-3">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-4">
                <div className="bg-white p-2.5 rounded-xl shadow-sm text-emerald-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 text-sm">Camera Access</p>
                  <p className="text-xs text-slate-500 mt-1">Required to scan parking signs in real-time.</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-4">
                <div className="bg-white p-2.5 rounded-xl shadow-sm text-emerald-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 text-sm">Location Access</p>
                  <p className="text-xs text-slate-500 mt-1">Helpful for applying council-specific rules automatically.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">How to Enable</h3>
            <div className="text-sm text-slate-600 space-y-3">
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center bg-slate-900 text-white rounded-full text-[10px] font-bold">1</span>
                Open your device <strong>Settings</strong>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center bg-slate-900 text-white rounded-full text-[10px] font-bold">2</span>
                Find <strong>Privacy</strong> or your <strong>Browser</strong>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center bg-slate-900 text-white rounded-full text-[10px] font-bold">3</span>
                Select <strong>AusPark AI</strong> and allow Camera
              </p>
            </div>
          </div>

          <button 
            onClick={handleRequestPermission}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-all"
          >
            Request Permissions
          </button>
        </div>
        
        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">AusPark AI v1.2.1 • Built for AU</p>
        </div>
      </div>
    </div>
  );
};

export default AppSettingsModal;