import React, { useState } from 'react';
import { UserProfile } from '../types';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  onDelete?: () => void;
  onCancel?: () => void;
  initialProfile?: UserProfile;
  isSyncing?: boolean;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onDelete, onCancel, initialProfile, isSyncing }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialProfile ? 4 : 1);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(initialProfile || {
    fullName: '',
    email: '',
    vehicleNumber: '',
    hasDisabilityPermit: false,
    hasResidentPermit: false,
    hasLoadingZonePermit: false,
    hasBusinessPermit: false,
    hasBusPermit: false,
    hasTaxiPermit: false,
    residentArea: '',
  });
  const [showError, setShowError] = useState(false);

  const validateEmail = (email: string) => {
    return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
  };

  const handleInputChange = (field: keyof UserProfile, value: string | boolean) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    if (field === 'email' && typeof value === 'string' && validateEmail(value)) setShowError(false);
  };

  const handleComplete = () => {
    if (!validateEmail(profile.email)) {
      setShowError(true);
      return;
    }
    onComplete(profile);
  };

  const handleDelete = () => {
    if (window.confirm("ARE YOU SURE?\n\nThis will permanently delete your local profile and history, and return you to the start screen.")) {
      if (onDelete) {
        onDelete();
      }
      // Revert to start and clear local component states
      setStep(1);
      setPrivacyAgreed(false);
      setProfile({
        fullName: '',
        email: '',
        vehicleNumber: '',
        hasDisabilityPermit: false,
        hasResidentPermit: false,
        hasLoadingZonePermit: false,
        hasBusinessPermit: false,
        hasBusPermit: false,
        hasTaxiPermit: false,
        residentArea: '',
      });
    }
  };

  if (step === 1) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex flex-col p-8 items-center text-center justify-center animate-fade-in">
        <div className="w-24 h-24 mb-8 bg-emerald-50 rounded-full flex items-center justify-center">
           <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M50 95C50 95 90 60 90 35C90 12 72 0 50 0C28 0 10 12 10 35C10 60 50 95 50 95Z" fill="#10B981" stroke="black" stroke-width="4"/><circle cx="50" cy="35" r="28" fill="#F1F5F9" stroke="black" stroke-width="4"/><text x="50" y="44" text-anchor="middle" font-weight="900" font-size="26" fill="black">P</text></svg>
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-4">Parking Logic, <span className="text-emerald-500">Solved.</span></h1>
        <p className="text-slate-500 font-medium max-w-xs mb-10">Instant AI-powered interpretation for Australian parking signs.</p>
        <button onClick={() => setStep(2)} className="w-full max-w-sm bg-slate-900 text-white h-16 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all">Get Started</button>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex flex-col p-8 pt-20 animate-fade-in overflow-hidden">
        <h2 className="text-3xl font-black text-slate-900 mb-2">Privacy & Support</h2>
        <p className="text-slate-500 font-medium mb-8">Data Disclosure</p>
        <div className="flex-1 overflow-y-auto space-y-6 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-6 scrollbar-hide">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl shrink-0 flex items-center justify-center"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
            <div><p className="font-black text-slate-900 uppercase text-[10px] tracking-widest mb-1">Support & Identification</p><p>We collect your <b>Name and Email</b> strictly to personalize your reports and identify feedback you send to the developer team.</p></div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl shrink-0 flex items-center justify-center"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg></div>
            <div><p className="font-black text-slate-900 uppercase text-[10px] tracking-widest mb-1">Local Council Rules</p><p>We use your <b>GPS coordinates</b> to identify specific council parking rules. This happens only during an active scan and is never stored permanently.</p></div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl shrink-0 flex items-center justify-center"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></div>
            <div><p className="font-black text-slate-900 uppercase text-[10px] tracking-widest mb-1">Data Control</p><p>All permit data is stored locally on your device. You can clear your data at any time via the <b>Settings</b> menu.</p></div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-100 mb-6 flex flex-col gap-4">
          <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer active:bg-slate-100 transition-colors">
            <input type="checkbox" checked={privacyAgreed} onChange={() => setPrivacyAgreed(!privacyAgreed)} className="w-6 h-6 rounded border-2 border-slate-300 text-emerald-600 focus:ring-emerald-500" />
            <span className="text-xs font-bold text-slate-700">I consent to the usage of my data as described.</span>
          </label>
          <button onClick={() => setStep(3)} disabled={!privacyAgreed} className="w-full bg-emerald-600 text-white h-16 rounded-2xl font-black shadow-xl disabled:opacity-50 transition-all text-lg active:scale-95">Continue</button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex flex-col p-8 pt-20 animate-fade-in overflow-hidden">
        <h2 className="text-3xl font-black text-slate-900 mb-2">Legal Disclaimer</h2>
        <p className="text-slate-500 font-medium mb-8">Usage Guidelines</p>
        <div className="flex-1 overflow-y-auto space-y-6 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-6 scrollbar-hide">
          <p>This app is for <b>guidance only</b>. AI can misinterpret signs or miss temporary restrictions (e.g., roadworks). <b>You are solely responsible</b> for any parking fines incurred.</p>
          <p>Always verify the physical sign yourself. By continuing, you agree that the developer is not liable for infringements.</p>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-100 mb-6">
          <button onClick={() => setStep(4)} className="w-full bg-slate-900 text-white h-16 rounded-2xl font-black shadow-xl text-lg active:scale-95 transition-all">Accept & Setup Profile</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col p-8 pt-20 animate-fade-in max-w-md mx-auto overflow-hidden">
      {onCancel && <button onClick={onCancel} className="absolute top-8 right-6 p-2 text-slate-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>}
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
        <h2 className="text-3xl font-black text-slate-900 mb-2">{initialProfile ? 'Edit Profile' : 'User Profile'}</h2>
        <p className="text-slate-500 font-medium mb-8">Identify yourself for support requests.</p>
        <div className="space-y-4 mb-10">
          <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Full Name</label><input type="text" placeholder="Sarah Jenkins" value={profile.fullName} onChange={(e) => handleInputChange('fullName', e.target.value)} className="w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold outline-none focus:border-emerald-500 transition-colors" /></div>
          <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Email Address *</label><input type="email" placeholder="sarah@example.com" value={profile.email} onChange={(e) => handleInputChange('email', e.target.value)} className={`w-full p-4 rounded-xl border-2 bg-slate-50 font-bold outline-none transition-colors ${showError && !validateEmail(profile.email) ? 'border-rose-500' : 'border-slate-100 focus:border-emerald-500'}`} /></div>
          <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Vehicle Registration</label><input type="text" placeholder="XYZ-789" value={profile.vehicleNumber} onChange={(e) => handleInputChange('vehicleNumber', e.target.value)} className="w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold outline-none focus:border-emerald-500 transition-colors" /></div>
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-4">Permits</h3>
        <div className="grid gap-3 pb-8">
          {[
            { id: 'hasDisabilityPermit', label: 'Disability Permit', icon: '♿' },
            { id: 'hasResidentPermit', label: 'Resident Permit', icon: '🏠' },
            { id: 'hasLoadingZonePermit', label: 'Loading Zone Permit', icon: '📦' },
            { id: 'hasBusinessPermit', label: 'Business Permit', icon: '💼' },
            { id: 'hasBusPermit', label: 'Bus / Auth. Vehicle', icon: '🚌' },
            { id: 'hasTaxiPermit', label: 'Taxi Permit', icon: '🚕' },
          ].map(item => (
            <button key={item.id} onClick={() => handleInputChange(item.id as keyof UserProfile, !profile[item.id as keyof UserProfile])} className={`p-4 rounded-2xl border-2 flex items-center gap-4 text-left transition-all active:scale-[0.98] ${profile[item.id as keyof UserProfile] ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-white'}`}>
              <span className="text-xl">{item.icon}</span><span className="font-bold flex-1">{item.label}</span>
              {profile[item.id as keyof UserProfile] && <div className="bg-emerald-500 rounded-full p-1"><svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>}
            </button>
          ))}
          {profile.hasResidentPermit && (
            <div className="animate-fade-in">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Resident Area / Zone</label>
              <input 
                type="text" 
                placeholder="e.g. Area 5 or Zone B" 
                value={profile.residentArea} 
                onChange={(e) => handleInputChange('residentArea', e.target.value)} 
                className="w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold outline-none focus:border-emerald-500 transition-colors" 
              />
            </div>
          )}
        </div>

        {initialProfile && (
           <div className="pt-6 border-t border-slate-100 pb-10">
              <button 
                onClick={handleDelete}
                className="w-full text-rose-500 border-2 border-rose-100 bg-rose-50/30 h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-rose-50 active:scale-95"
              >
                Delete Profile
              </button>
              <p className="text-center text-[9px] font-medium text-slate-400 mt-3 uppercase tracking-wider">Warning: This action clears all your local data.</p>
           </div>
        )}
      </div>
      <button onClick={handleComplete} disabled={!validateEmail(profile.email) || isSyncing} className="w-full bg-slate-900 text-white h-16 rounded-2xl font-black shadow-xl mt-6 disabled:opacity-50 shrink-0 active:scale-95 transition-all">
        {isSyncing ? 'Saving...' : initialProfile ? 'Save' : 'Finish Setup'}
      </button>
    </div>
  );
};

export default Onboarding;