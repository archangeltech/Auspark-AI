import React, { useState } from 'react';
import { UserProfile } from '../types';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  initialProfile?: UserProfile;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, initialProfile }) => {
  // Step 1: Intro, Step 2: Privacy/Legal, Step 3: Permits
  const [step, setStep] = useState<1 | 2 | 3>(initialProfile ? 3 : 1);
  const [profile, setProfile] = useState<UserProfile>(initialProfile || {
    hasDisabilityPermit: false,
    hasResidentPermit: false,
    residentArea: '',
    hasLoadingZonePermit: false,
    hasBusinessPermit: false,
  });

  const togglePermit = (key: keyof UserProfile) => {
    if (typeof profile[key] === 'boolean') {
      setProfile(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  // STEP 1: LANDING / INTRO
  if (step === 1) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex flex-col p-8 safe-pb animate-fade-in overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 max-w-sm mx-auto">
          <div className="w-24 h-24 bg-emerald-500 rounded-[32px] flex items-center justify-center shadow-2xl shadow-emerald-200">
             <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
             </svg>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-slate-900 leading-tight">AusPark AI</h1>
            <p className="text-slate-500 font-medium leading-relaxed">
              Decoding Australian parking signs with advanced vision AI.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 w-full text-left">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-start gap-4">
               <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
               </div>
               <div>
                  <p className="font-bold text-slate-900 text-sm">Vision Engine</p>
                  <p className="text-xs text-slate-500">Instant analysis of multiple restriction panels.</p>
               </div>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4 max-w-sm mx-auto w-full">
          <button 
            onClick={() => setStep(2)}
            className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black shadow-xl active:scale-95 transition-all"
          >
            Start Setup
          </button>
        </div>
      </div>
    );
  }

  // STEP 2: PRIVACY & TERMS
  if (step === 2) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex flex-col p-8 safe-pb animate-fade-in overflow-hidden">
        <div className="flex-1 flex flex-col max-w-md mx-auto w-full overflow-hidden">
          <div className="mb-6">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Privacy & Terms</h2>
            <p className="text-slate-500 font-medium mt-1">Please review our safety guidelines.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 text-sm text-slate-600 leading-relaxed scrollbar-hide border-t border-slate-100 pt-6">
            <section>
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-2">Guidance Only</h3>
              <p>AusPark AI is an assistive tool. AI can make mistakes. <strong>This is not a substitute for your own knowledge of Road Rules.</strong></p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-2">Your Responsibility</h3>
              <p>You are solely responsible for your vehicle. Verify all physical signs and markings. We are not liable for fines or towing costs.</p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-2">Privacy</h3>
              <p>Camera and location data are used temporarily to provide service. Images are processed in real-time and not stored permanently.</p>
            </section>
            
            <section className="bg-amber-50 p-4 rounded-xl border border-amber-100">
               <p className="text-amber-800 text-xs font-semibold">By continuing, you acknowledge that physical signs always take precedence over AI interpretation.</p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <button 
              onClick={() => setStep(3)}
              className="w-full bg-emerald-600 text-white py-5 rounded-[24px] font-black shadow-xl shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Accept & Continue</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
            <button 
              onClick={() => setStep(1)}
              className="w-full text-slate-400 font-bold text-xs py-4 uppercase tracking-widest"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 3: PERMITS
  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col p-8 safe-pb animate-fade-in max-w-md mx-auto">
      <div className="flex-1 space-y-8 overflow-y-auto pt-8 scrollbar-hide">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Active Permits</h2>
          <p className="text-slate-500 font-medium">Select permits you hold to apply state-specific exemptions.</p>
        </div>

        <div className="space-y-3">
          {[
            { id: 'hasDisabilityPermit', label: 'MPS / Disability', icon: '♿' },
            { id: 'hasResidentPermit', label: 'Resident Permit', icon: '🏠' },
            { id: 'hasLoadingZonePermit', label: 'Loading Zone', icon: '📦' },
            { id: 'hasBusinessPermit', label: 'Business Permit', icon: '💼' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => togglePermit(item.id as keyof UserProfile)}
              className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center justify-between text-left ${
                profile[item.id as keyof UserProfile] 
                  ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100' 
                  : 'border-slate-100 bg-slate-50 grayscale hover:grayscale-0'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{item.icon}</span>
                <span className="font-bold text-slate-900">{item.label}</span>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                profile[item.id as keyof UserProfile] ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
              }`}>
                {profile[item.id as keyof UserProfile] && (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          ))}

          {profile.hasResidentPermit && (
            <div className="mt-2 animate-fade-in">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Permit Area / Zone</label>
              <input 
                type="text"
                placeholder="e.g. Area 15 / North Sydney"
                value={profile.residentArea}
                onChange={(e) => setProfile(prev => ({ ...prev, residentArea: e.target.value }))}
                className="w-full p-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <button 
          onClick={() => onComplete(profile)}
          className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black shadow-xl active:scale-95 transition-all"
        >
          {initialProfile ? 'Save Changes' : 'Confirm & Finish'}
        </button>
        {!initialProfile && (
           <button 
            onClick={() => setStep(2)}
            className="w-full text-slate-400 font-bold text-xs py-2 uppercase tracking-widest"
          >
            Review Terms
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;