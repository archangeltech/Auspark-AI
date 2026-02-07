
import React from 'react';

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HowToUseModal: React.FC<HowToUseModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const tips = [
    {
      title: "Frame it",
      desc: "Align the sign inside the emerald brackets.",
      icon: (
        <div className="relative w-12 h-12 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-10 h-10">
            <circle cx="50" cy="50" r="40" fill="#fee2e2" stroke="#ef4444" strokeWidth="6" />
            <circle cx="50" cy="50" r="25" fill="none" stroke="#ef4444" strokeWidth="6" />
            <circle cx="50" cy="50" r="10" fill="#ef4444" />
            <path d="M80 20 L55 45" stroke="#3b82f6" strokeWidth="8" strokeLinecap="round" />
            <path d="M85 15 L75 25" stroke="#e5e7eb" strokeWidth="3" />
          </svg>
        </div>
      )
    },
    {
      title: "Steady shot",
      desc: "Wait for focus. Avoid lens flare or deep shadows.",
      icon: (
        <div className="relative w-12 h-12 flex items-center justify-center">
           <svg viewBox="0 0 100 100" className="w-10 h-10">
             <rect x="15" y="30" width="70" height="50" rx="10" fill="#475569" />
             <rect x="35" y="20" width="30" height="15" rx="5" fill="#1e293b" />
             <circle cx="50" cy="55" r="18" fill="#cbd5e1" stroke="#1e293b" strokeWidth="4" />
             <circle cx="50" cy="55" r="8" fill="#10b981" />
             <path d="M80 30 L95 15 M85 25 L95 25 M90 20 L90 10" stroke="#fbbf24" strokeWidth="6" strokeLinecap="round" />
           </svg>
        </div>
      )
    },
    {
      title: "One Pole",
      desc: "Scan one pole at a time for the best accuracy.",
      icon: (
        <div className="relative w-12 h-12 flex items-center justify-center">
           <svg viewBox="0 0 100 100" className="w-10 h-10">
             <rect x="35" y="10" width="30" height="80" rx="10" fill="#334155" />
             <circle cx="50" cy="30" r="8" fill="#ef4444" />
             <circle cx="50" cy="50" r="8" fill="#f59e0b" />
             <circle cx="50" cy="70" r="8" fill="#10b981" />
           </svg>
        </div>
      )
    },
    {
      title: "Set Permits",
      desc: "Ensure your resident zones are set in your profile.",
      icon: (
        <div className="relative w-12 h-12 flex items-center justify-center">
           <svg viewBox="0 0 100 100" className="w-10 h-10">
             <rect x="15" y="20" width="70" height="60" rx="8" fill="#2563eb" />
             <circle cx="40" cy="45" r="12" fill="white" />
             <path d="M25 70 Q40 60 55 70" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round" />
             <rect x="65" y="35" width="10" height="4" fill="white" opacity="0.5" />
             <rect x="65" y="45" width="10" height="4" fill="white" opacity="0.5" />
             <rect x="65" y="55" width="10" height="4" fill="white" opacity="0.5" />
           </svg>
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center p-6">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-[56px] overflow-hidden shadow-2xl animate-fade-in flex flex-col pointer-events-auto border border-slate-100">
        <div className="p-10 pb-6 flex items-center justify-between">
          <h2 className="text-[32px] font-black text-slate-900 tracking-tight">Scanning Tips</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="w-full h-px bg-slate-100 mb-2" />
        
        <div className="px-10 py-8 space-y-10">
          {tips.map((tip, idx) => (
            <div key={idx} className="flex gap-6 items-start">
              <div className="shrink-0 pt-1">
                {tip.icon}
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="text-[20px] font-black text-slate-900 tracking-tight leading-none">{tip.title}</h3>
                <p className="text-[14px] font-bold text-slate-500 leading-snug">{tip.desc}</p>
              </div>
            </div>
          ))}
          
          <button 
            onClick={onClose}
            className="w-full bg-[#10B981] text-white h-[72px] rounded-[36px] font-black text-[22px] shadow-xl shadow-emerald-200/50 active:scale-95 transition-all mt-4 tracking-tight"
          >
            Start Scanning
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowToUseModal;
