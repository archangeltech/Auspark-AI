import React, { useState } from 'react';
import { UserProfile } from '../types';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  initialProfile?: UserProfile;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, initialProfile }) => {
  // Step 1: Intro/Value Prop, Step 2: Privacy/Legal, Step 3: Permits
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

  // STEP 1: LANDING / VALUE PROP
  if (step === 1) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex flex-col p-8 safe-pb animate-fade-in overflow-y-auto scrollbar-hide">
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-10 max-w-sm mx-auto py-10">
          <div className="relative">
            <div className="w-24 h-24 bg-emerald-500 rounded-[32px] flex items-center justify-center shadow-2xl shadow-emerald-200 animate-pulse">
               <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
               </svg>
            </div>
            <div className="absolute -top-2 -right-2 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">
              AI Powered
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-[40px] font-black text-slate-900 leading-[0.9] tracking-tight">
              Australian Parking, <span className="text-emerald-500">Simplified.</span>
            </h1>
            <p className="text-slate-500 font-medium leading-relaxed px-2">
              Instantly decode complex multi-panel parking signs with high-precision vision AI. Built specifically for Australian road rules.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 w-full text-left">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
               <div className="bg-white p-2 rounded-xl shadow-sm shrink-0">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
               <p className="font-bold text-slate-800 text-sm">Vision-First Interpretation</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
               <div className="bg-white p-2 rounded-xl shadow-sm shrink-0">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
               </div>
               <p className="font-bold text-slate-800 text-sm">State-Specific Logic</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
               <div className="bg-white p-2 rounded-xl shadow-sm shrink-0">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
               </div>
               <p className="font-bold text-slate-800 text-sm">Permit-Aware Feedback</p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4 max-w-sm mx-auto w-full pb-6">
          <button 
            onClick={() => setStep(2)}
            className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black shadow-xl active:scale-95 transition-all text-lg"
          >
            Start Setup
          </button>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
            Takes less than 30 seconds
          </p>
        </div>
      </div>
    );
  }

  // STEP 2: PRIVACY & TERMS (Identical content to LegalModal)
  if (step === 2) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex flex-col p-8 safe-pb animate-fade-in overflow-hidden">
        <div className="flex-1 flex flex-col max-w-md mx-auto w-full overflow-hidden">
          <div className="mb-6">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Privacy & Terms</h2>
            <p className="text-slate-500 font-medium mt-1 leading-snug">Essential safety & usage information.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 text-sm text-slate-600 leading-relaxed scrollbar-hide border-t border-slate-100 pt-6">
            <section>
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-2">Guidance Only Disclaimer</h3>
              <p>AusPark AI is an assistive tool designed for informational guidance. AI models can and do make mistakes, misinterpret visual data, or fail to account for temporary local restrictions. <strong>This app is not a substitute for your own knowledge of Australian Road Rules.</strong></p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-2">User Responsibility</h3>
              <p>You remain solely responsible for your vehicle and all parking decisions. You must manually verify all physical signs, painted lines, and curb markings. AusPark AI is not liable for any fines, infringements, towing costs, or damages resulting from the use of this service.</p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-2">Connectivity & Availability</h3>
              <p>This service requires a stable internet connection to process data through our AI engines. Performance depends on your device network being steady. We do not guarantee 100% uptime.</p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-2">Privacy & Data Handling</h3>
              <p>We value your privacy. Your camera feed and location data are used temporarily to provide the interpretation service. Images are processed in real-time and are not stored permanently by AusPark AI.</p>
            </section>
            
            <section className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
               <p className="text-amber-800 text-[11px] font-black leading-tight italic">
                 By continuing, you acknowledge that physical signs always take precedence over AI interpretation.
               </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <button 
              onClick={() => setStep(3)}
              className="w-full bg-emerald-600 text-white py-5 rounded-[24px] font-black shadow-xl shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-2 text-lg"
            >
              <span>Accept & Continue</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
            <button 
              onClick={() => setStep(1)}
              className="w-full text-slate-400 font-bold text-[10px] py-4 uppercase tracking-widest"
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
    <div className="fixed inset-0 z-[200] bg-white flex flex-col p-8 safe-pb animate-fade-in max-w-md mx-auto overflow-y-auto scrollbar-hide">
      <div className="flex-1 space-y-8 pt-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Active Permits</h2>
          <p className="text-slate-500 font-medium">Select permits you hold to apply state-specific exemptions like time extensions.</p>
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
                  : 'border-slate-100 bg-slate-50 grayscale opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm">
                  {item.icon}
                </div>
                <span className="font-black text-slate-900">{item.label}</span>
              </div>
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                profile[item.id as keyof UserProfile] ? 'bg-emerald-500 border-emerald-500 scale-110' : 'border-slate-300'
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
            <div className="mt-4 animate-fade-in">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 mb-2 block">Permit Area / Zone</label>
              <input 
                type="text"
                placeholder="e.g. Area 15 / North Sydney"
                value={profile.residentArea}
                onChange={(e) => setProfile(prev => ({ ...prev, residentArea: e.target.value }))}
                className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-white focus:border-emerald-500 focus:ring-0 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 space-y-4 pb-8">
        <button 
          onClick={() => onComplete(profile)}
          className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black shadow-xl active:scale-95 transition-all text-lg"
        >
          {initialProfile ? 'Save Changes' : 'Complete Setup'}
        </button>
        {!initialProfile && (
           <button 
            onClick={() => setStep(2)}
            className="w-full text-slate-400 font-bold text-[10px] py-2 uppercase tracking-widest text-center"
          >
            Review Terms Again
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;