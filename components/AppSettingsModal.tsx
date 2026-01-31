import React, { useState } from 'react';
import { dbService } from '../services/dbService';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

const AppSettingsModal: React.FC<AppSettingsModalProps> = ({ isOpen, onClose, userEmail }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleHardReset = async () => {
    const confirmed = window.confirm(
      "CLEAR ALL LOCAL DATA:\n\nThis will delete your local permits, history, and profile settings. This cannot be undone."
    );
    if (confirmed) {
      localStorage.clear();
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) await r.unregister();
      }
      window.location.reload();
    }
  };

  const handleDeleteCloudData = async () => {
    if (!userEmail) return;
    const confirmed = window.confirm(
      "DELETE FEEDBACK DATA?\n\nThis will permanently delete any Issue Reports or feedback you have sent to our servers. Your local profile will also be cleared.\n\nContinue?"
    );
    if (confirmed) {
      setIsDeleting(true);
      try {
        // We still provide a way to delete reported issues from the cloud for privacy
        await dbService.deleteProfile(userEmail);
        localStorage.clear();
        alert("Your cloud reports and local data have been deleted.");
        window.location.reload();
      } catch (err: any) {
        alert("Deletion failed: " + err.message);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-fade-in flex flex-col pointer-events-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-black text-slate-900 text-center flex-1 ml-8">App Settings</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] scrollbar-hide">
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Data & Privacy</h3>
            <button onClick={handleHardReset} className="w-full bg-slate-100 text-slate-900 h-14 rounded-2xl font-black text-sm">Clear Local Data</button>
            {userEmail && (
              <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100">
                <p className="text-[11px] text-rose-600 mb-3 font-bold leading-relaxed">Privacy Request: You can request the removal of any feedback and reports linked to your email below.</p>
                <button 
                  onClick={handleDeleteCloudData} 
                  disabled={isDeleting}
                  className="w-full bg-rose-600 text-white h-14 rounded-xl font-black text-sm disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete My Cloud Reports'}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center"><p className="text-[10px] font-black uppercase text-slate-400">Parking Sign Reader v1.0.1</p></div>
      </div>
    </div>
  );
};

export default AppSettingsModal;