import React, { useState } from 'react';
import { UserProfile } from '../types';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  onCancel?: () => void;
  initialProfile?: UserProfile;
  isSyncing?: boolean;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onCancel, initialProfile, isSyncing }) => {
  const [step, setStep] = useState<1 | 2 | 3>(initialProfile ? 3 : 1);
  const [profile, setProfile] = useState<UserProfile>(initialProfile || {
    fullName: '',
    email: '',
    vehicleNumber: '',
    hasDisabilityPermit: false,
    hasResidentPermit: false,
    hasLoadingZonePermit: false,
    hasBusinessPermit: false,
    residentArea: '',
  });
  const [showError, setShowError] = useState(false);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const togglePermit = (key: keyof UserProfile) => {
    if (typeof profile[key] === 'boolean') {
      setProfile(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    if (field === 'email' && validateEmail(value)) {
      setShowError(false);
    }
  };

  const isEmailValid = !!validateEmail(profile.email);

  const handleComplete = () => {
    if (!isEmailValid) {
      setShowError(true);
      return;
    }
    onComplete(profile);
  };

  if (step === 1) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex flex-col p-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] animate-fade-in overflow-hidden">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mt-10 shrink-0">
          <div className="relative mb-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center filter drop-shadow-lg">
               <svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <path d="M50 95C50 95 90 60 90 35C90 12 72 0 50 0C28 0 10 12 10 35C10 60 50 95 50 95Z" fill="#10B981" stroke="black" stroke-width="4"/>
                  <circle cx="50" cy="35" r="28" fill="#F1F5F9" stroke="black" stroke-width="4"/>
                  <circle cx="50" cy="35" r="20" fill="#A7F3D0" stroke="black" stroke-width="4"/>
                  <text x="50" y="44" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="26" fill="black">P</text>
               </svg>
            </div>
            <div className="absolute -top-1 -right-4 bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">
              Official
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-[32px] sm:text-[38px] font-black text-slate-900 leading-[0.9] tracking-tight">
              Parking Logic, <span className="text-emerald-500">Solved.</span>
            </h1>
            <p className="text-slate-500 font-medium leading-snug px-4 text-xs sm:text-sm">
              Decode complex Australian parking signs in seconds using high-precision Vision AI.
            </p>
          </div>
        </div>

        {/* Steps Section */}
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full py-2 sm:py-4 overflow-hidden">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-2.5 shrink-0">How it works</h2>
          
          <div className="grid grid-cols-1 gap-2 sm:gap-2.5 w-full overflow-y-auto scrollbar-hide">
            <div className="bg-slate-50 p-3 sm:p-4 rounded-[20px] sm:rounded-[24px] border border-slate-100 flex items-center gap-3 sm:gap-4">
               <div className="bg-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-sm shrink-0 text-emerald-500">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
               </div>
               <div className="flex flex-col">
                 <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Step 1</span>
                 <p className="font-bold text-slate-800 text-sm leading-tight">Take a photo of a sign</p>
               </div>
            </div>

            <div className="bg-slate-50 p-3 sm:p-4 rounded-[20px] sm:rounded-[24px] border border-slate-100 flex items-center gap-3 sm:gap-4">
               <div className="bg-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-sm shrink-0 text-emerald-500">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
               </div>
               <div className="flex flex-col">
                 <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Step 2</span>
                 <p className="font-bold text-slate-800 text-sm leading-tight">Instant AI Interpretation</p>
               </div>
            </div>

            <div className="bg-slate-50 p-3 sm:p-4 rounded-[20px] sm:rounded-[24px] border border-slate-100 flex items-center gap-3 sm:gap-4">
               <div className="bg-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-sm shrink-0 text-emerald-500">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
               </div>
               <div className="flex flex-col">
                 <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Step 3</span>
                 <p className="font-bold text-slate-800 text-sm leading-tight">Exemptions for your permits</p>
               </div>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="max-w-sm mx-auto w-full pt-0 mb-6 shrink-0">
          <button 
            onClick={() => setStep(2)}
            className="w-full bg-slate-900 text-white h-16 rounded-[24px] font-black shadow-xl active:scale-95 transition-all text-lg"
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex flex-col p-8 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] animate-fade-in overflow-hidden">
        <div className="flex-1 flex flex-col max-w-md mx-auto w-full overflow-hidden mt-10">
          <div className="mb-6">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Privacy & Terms</h2>
            <p className="text-slate-500 font-medium mt-1 leading-snug">Essential safety & usage information.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 text-sm text-slate-600 leading-relaxed scrollbar-hide border-t border-slate-100 pt-6">
            <section>
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-2">Guidance Only Disclaimer</h3>
              <p>Parking Sign Reader is an assistive tool designed for informational guidance. AI models can and do make mistakes, misinterpret visual data, or fail to account for temporary local restrictions.</p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-2">User Responsibility</h3>
              <p>You remain solely responsible for your vehicle and all parking decisions. You must manually verify all physical signs. Parking Sign Reader is not liable for any fines or infringements.</p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-2">Connectivity</h3>
              <p>This service requires a stable internet connection to process data through our AI engines.</p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-2">Privacy</h3>
              <p>We value your privacy. Your camera feed is used temporarily to provide the interpretation service. Images are not stored permanently by us.</p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 mb-6">
            <button 
              onClick={() => setStep(3)}
              className="w-full bg-emerald-600 text-white h-16 rounded-[24px] font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 text-lg"
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
    <div className="fixed inset-0 z-[200] bg-white flex flex-col p-8 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] animate-fade-in max-w-md mx-auto overflow-hidden">
      {initialProfile && onCancel && (
        <button 
          onClick={onCancel}
          disabled={isSyncing}
          className="absolute top-[calc(env(safe-area-inset-top)+24px)] right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors z-[210] disabled:opacity-30"
          aria-label="Cancel editing"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide mt-10">
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">User Profile</h2>
            {profile.lastSynced && !isSyncing && (
              <div className="flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md">
                <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                Cloud Synced
              </div>
            )}
          </div>
          <p className="text-slate-500 font-medium">Your identification and vehicle details.</p>
        </div>

        <div className="space-y-4 mb-10">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">Full Name</label>
            <input 
              type="text"
              placeholder="e.g. Sarah Jenkins"
              value={profile.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className="w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all font-bold text-slate-900"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block flex items-center gap-1.5">
              Email Address <span className="text-rose-500 font-black">*</span>
            </label>
            <input 
              type="email"
              placeholder="e.g. sarah@example.com"
              value={profile.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full p-4 rounded-xl border-2 bg-slate-50 focus:bg-white outline-none transition-all font-bold text-slate-900 ${showError && !isEmailValid ? 'border-rose-500' : 'border-slate-100 focus:border-emerald-500'}`}
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">Vehicle Registration</label>
            <input 
              type="text"
              placeholder="e.g. XYZ-789"
              value={profile.vehicleNumber}
              onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
              className="w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all font-bold text-slate-900"
            />
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Active Permits</h2>
          <p className="text-slate-500 font-medium">Manage your parking exemptions here.</p>
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
          <div className="mt-6 animate-fade-in pb-10">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">Resident Area / Zone</label>
            <input 
              type="text"
              placeholder="e.g. Area 12"
              value={profile.residentArea}
              onChange={(e) => handleInputChange('residentArea', e.target.value)}
              className="w-full p-4 rounded-xl border-2 border-slate-100 bg-white focus:border-emerald-500 outline-none transition-all font-bold text-slate-900"
            />
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 shrink-0 space-y-3 mb-6">
        <button 
          onClick={handleComplete}
          disabled={!isEmailValid || isSyncing}
          className={`w-full h-16 rounded-[24px] font-black shadow-xl active:scale-95 transition-all text-lg flex items-center justify-center gap-3 ${isEmailValid ? 'bg-slate-900 text-white shadow-emerald-200/50' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
        >
          {isSyncing ? 'Syncing...' : (initialProfile ? 'Save Changes' : 'Complete Setup')}
        </button>
        {initialProfile && onCancel && (
          <button 
            onClick={onCancel}
            disabled={isSyncing}
            className="w-full text-slate-400 py-2 rounded-xl font-bold text-sm active:scale-95 transition-all uppercase tracking-widest disabled:opacity-30"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;