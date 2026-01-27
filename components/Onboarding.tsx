import React, { useState } from 'react';
import { UserProfile } from '../types';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  initialProfile?: UserProfile;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, initialProfile }) => {
  const [step, setStep] = useState<1 | 2 | 3>(initialProfile ? 3 : 1);
  const [profile, setProfile] = useState<UserProfile>(initialProfile || {
    hasDisabilityPermit: false,
    hasResidentPermit: false,
    hasLoadingZonePermit: false,
    hasBusinessPermit: false,
    residentArea: '',
  });

  const togglePermit = (key: keyof UserProfile) => {
    if (typeof profile[key] === 'boolean') {
      setProfile(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  if (step === 1) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex flex-col p-8 safe-pb animate-fade-in overflow-y-auto scrollbar-hide">
        <div className="flex-1 flex flex-col items-center max-w-sm mx-auto py-10">
          <div className="relative mb-8">
            <div className="w-24 h-24 flex items-center justify-center filter drop-shadow-xl">
               <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 95C50 95 90 60 90 35C90 12 72 0 50 0C28 0 10 12 10 35C10 60 50 95 50 95Z" fill="#10B981" stroke="black" stroke-width="4"/>
                  <circle cx="50" cy="35" r="28" fill="#F1F5F9" stroke="black" stroke-width="4"/>
                  <circle cx="50" cy="35" r="20" fill="#A7F3D0" stroke="black" stroke-width="4"/>
                  <text x="50" y="44" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="26" fill="black">P</text>
               </svg>
            </div>
            <div className="absolute -top-2 -right-6 bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-tighter shadow-lg">
              AU Smart App
            </div>
          </div>
          
          <div className="space-y-4 text-center mb-10">
            <h1 className="text-[38px] font-black text-slate-900 leading-[0.9] tracking-tight">
              Parking Logic, <span className="text-emerald-500 text-[42px]">Solved.</span>
            </h1>
            <p className="text-slate-500 font-medium leading-relaxed px-4 text-sm">
              Decode complex Australian parking signs in seconds using high-precision Vision AI.
            </p>
          </div>

          <div className="w-full space-y-4">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-4">How it works</h2>
            
            <div className="grid grid-cols-1 gap-3 w-full">
              <div className="bg-slate-50 p-4 rounded-[24px] border border-slate-100 flex items-center gap-4 group hover:border-emerald-200 transition-colors">
                 <div className="bg-white p-3 rounded-2xl shadow-sm shrink-0 text-emerald-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Step 1</span>
                   <p className="font-bold text-slate-800 text-sm leading-tight">Take a photo of a sign</p>
                 </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-[24px] border border-slate-100 flex items-center gap-4 group hover:border-emerald-200 transition-colors">
                 <div className="bg-white p-3 rounded-2xl shadow-sm shrink-0 text-emerald-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Step 2</span>
                   <p className="font-bold text-slate-800 text-sm leading-tight">Upload to the app</p>
                 </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-[24px] border border-slate-100 flex items-center gap-4 group hover:border-emerald-200 transition-colors">
                 <div className="bg-white p-3 rounded-2xl shadow-sm shrink-0 text-emerald-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Step 3</span>
                   <p className="font-bold text-slate-800 text-sm leading-tight">Get an instant answer</p>
                 </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-[24px] border border-slate-100 flex items-center gap-4 group hover:border-emerald-200 transition-colors">
                 <div className="bg-white p-3 rounded-2xl shadow-sm shrink-0 text-emerald-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Step 4</span>
                   <p className="font-bold text-slate-800 text-sm leading-tight">Add permits for accuracy</p>
                 </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4 max-w-sm mx-auto w-full pb-6">
          <button 
            onClick={() => setStep(2)}
            className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black shadow-xl active:scale-95 transition-all text-lg"
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

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
              <p>This service <strong>requires a stable internet connection</strong> to process data through our AI engines. Performance depends on your device network being steady. We do not guarantee 100% uptime; the service may be occasionally unavailable due to maintenance or technical issues.</p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-2">Privacy & Data Handling</h3>
              <p>We value your privacy. Your camera feed and location data are used temporarily to provide the interpretation service. Images are processed in real-time via Google Gemini and are not stored permanently by AusPark AI. We do not track individuals or sell personal data to third parties.</p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-2">Compliance</h3>
              <p>Designed for compliance with general Australian parking standards across all states (NSW, VIC, QLD, WA, SA, TAS, ACT, NT).</p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <button 
              onClick={() => setStep(3)}
              className="w-full bg-emerald-600 text-white py-5 rounded-[24px] font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 text-lg"
            >
              <span>Accept & Continue</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col p-8 safe-pb animate-fade-in max-w-md mx-auto overflow-hidden">
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide pt-4">
        <div className="space-y-2 mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Active Permits</h2>
          <p className="text-slate-500 font-medium">Select your current parking permits.</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {[
            { id: 'hasDisabilityPermit', label: 'Disability Permit (MPS)', icon: '♿' },
            { id: 'hasResidentPermit', label: 'Resident Permit', icon: '🏠' },
            { id: 'hasLoadingZonePermit', label: 'Loading Zone Permit', icon: '🚛' },
            { id: 'hasBusinessPermit', label: 'Business Permit', icon: '💼' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => togglePermit(item.id as keyof UserProfile)}
              className={`p-5 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${
                profile[item.id as keyof UserProfile] 
                  ? 'border-emerald-500 bg-emerald-50 shadow-sm' 
                  : 'border-slate-100 bg-slate-50/50'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="font-bold text-slate-900">{item.label}</span>
              <div className="ml-auto">
                {profile[item.id as keyof UserProfile] ? (
                  <div className="bg-emerald-500 rounded-full p-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-slate-200" />
                )}
              </div>
            </button>
          ))}
        </div>

        {profile.hasResidentPermit && (
          <div className="mt-6 animate-fade-in">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">Resident Area / Zone</label>
            <input 
              type="text"
              placeholder="e.g. Area 15"
              value={profile.residentArea}
              onChange={(e) => setProfile(prev => ({ ...prev, residentArea: e.target.value }))}
              className="w-full p-4 rounded-xl border-2 border-slate-100 bg-white focus:border-emerald-500 outline-none transition-all font-bold text-slate-900"
            />
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 shrink-0">
        <button 
          onClick={() => onComplete(profile)}
          className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black shadow-xl active:scale-95 transition-all text-lg"
        >
          {initialProfile ? 'Save Changes' : 'Complete Setup'}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;