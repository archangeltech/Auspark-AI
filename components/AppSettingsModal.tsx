
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
      alert("Permission was denied or is blocked. Please go to your device Settings > Browser > Parking Sign Reader and enable Camera access manually.");
    }
  };

  const handleHardReset = async () => {
    const confirmed = window.confirm(
      "HARD RESET:\n\nThis will delete all your permits, history, and app data, and unregister the service worker. This usually fixes loading issues. \n\nContinue?"
    );

    if (confirmed) {
      try {
        // 1. Clear LocalStorage
        localStorage.clear();

        // 2. Unregister Service Workers
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }
        }

        // 3. Clear Caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          for (const name of cacheNames) {
            await caches.delete(name);
          }
        }

        // 4. Reload the page
        window.location.reload();
      } catch (error) {
        console.error("Reset failed:", error);
        alert("Reset failed. Please manually clear your browser data for this site.");
      }
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
        
        <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh] scrollbar-hide">
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
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Maintenance</h3>
            <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100">
              <p className="text-xs text-rose-700 font-bold mb-3">App not loading correctly?</p>
              <p className="text-[11px] text-rose-600 mb-4 leading-relaxed">If the app works in Incognito but not here, a hard reset will clear the browser's internal cache for this site.</p>
              <button 
                onClick={handleHardReset}
                className="w-full bg-rose-600 text-white py-3 rounded-xl font-black text-sm shadow-md active:scale-[0.98] transition-all"
              >
                Clear Cache & Hard Reset
              </button>
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
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Parking Sign Reader v1.2.1 • Built for AU</p>
        </div>
      </div>
    </div>
  );
};

export default AppSettingsModal;
