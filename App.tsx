// Add React to imports to fix 'Cannot find namespace React' errors
import React, { useState, useEffect, useRef } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import Header from './components/Header.tsx';
import Scanner from './components/Scanner.tsx';
import Results from './components/Results.tsx';
import Onboarding from './components/Onboarding.tsx';
import LegalModal from './components/LegalModal.tsx';
import AppSettingsModal from './components/AppSettingsModal.tsx';
import { AppState, HistoryItem, UserProfile } from './types.ts';
import { interpretParkingSign } from './services/geminiService.ts';
import { dbService } from './services/dbService.ts';

const HISTORY_KEY = 'auspark_history_v2';
const ONBOARDING_KEY = 'auspark_onboarding_done';
const PROFILE_KEY = 'auspark_profile_v3'; 
const LEGAL_ACCEPTED_KEY = 'auspark_legal_accepted_v1';
const APP_VERSION = '1.0.4';

const LOADING_MESSAGES = [
  "Capturing vision...",
  "Analyzing rules...",
  "Interpreting hierarchy...",
  "Checking time limits...",
  "Applying permits...",
  "Logic confirmed."
];

const App: React.FC = () => {
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showLegal, setShowLegal] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showHowToUse, setShowHowToUse] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [lastAcceptedDate, setLastAcceptedDate] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [resetKey, setResetKey] = useState<number>(0);
  
  const retakeCameraInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<AppState>({
    image: null,
    interpretation: null,
    isLoading: false,
    error: null,
    history: [],
    profile: {
      fullName: '',
      email: '',
      hasDisabilityPermit: false,
      hasResidentPermit: false,
      hasLoadingVehicle: false,
      hasHorseCarriage: false,
      hasBusPermit: false,
      hasTaxiPermit: false,
      residentArea: '',
    }
  });

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Light });
      StatusBar.setBackgroundColor({ color: '#ffffff' });
    }

    try {
      const onboardingDone = localStorage.getItem(ONBOARDING_KEY);
      if (!onboardingDone) {
        setShowOnboarding(true);
      }

      const savedProfile = localStorage.getItem(PROFILE_KEY);
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        if (parsedProfile && typeof parsedProfile === 'object') {
          setState(prev => ({ ...prev, profile: { ...prev.profile, ...parsedProfile } }));
        }
      }

      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          setState(prev => ({ ...prev, history: parsed.filter(item => item && item.id) }));
        }
      }

      const savedLegal = localStorage.getItem(LEGAL_ACCEPTED_KEY);
      if (savedLegal) {
        setLastAcceptedDate(savedLegal);
      }
    } catch (e) {
      console.warn("Storage recovery: Resetting corrupted local data.");
    }
  }, []);

  useEffect(() => {
    let interval: number | undefined;
    if (state.isLoading) {
      setLoadingMsgIdx(0);
      interval = window.setInterval(() => {
        setLoadingMsgIdx(prev => {
          if (prev < LOADING_MESSAGES.length - 1) return prev + 1;
          return prev;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [state.isLoading]);

  const getFormattedDate = () => {
    return new Date().toLocaleString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const saveProfile = async (profile: UserProfile) => {
    setIsSaving(true);
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      setState(prev => ({ ...prev, profile }));

      if (!localStorage.getItem(ONBOARDING_KEY)) {
        const now = getFormattedDate();
        localStorage.setItem(LEGAL_ACCEPTED_KEY, now);
        setLastAcceptedDate(now);
      }
      
      localStorage.setItem(ONBOARDING_KEY, 'true');
      setShowOnboarding(false);
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProfile = () => {
    localStorage.clear();
    setState({
      image: null,
      interpretation: null,
      isLoading: false,
      error: null,
      history: [],
      profile: {
        fullName: '',
        email: '',
        hasDisabilityPermit: false,
        hasResidentPermit: false,
        hasLoadingVehicle: false,
        hasHorseCarriage: false,
        hasBusPermit: false,
        hasTaxiPermit: false,
        residentArea: '',
      }
    });
    setShowOnboarding(true);
    setIsEditingProfile(false);
    setLastAcceptedDate(null);
    setResetKey(prev => prev + 1);
  };

  const handleCancelEdit = () => setIsEditingProfile(false);

  const handleAcceptLegal = () => {
    const now = getFormattedDate();
    localStorage.setItem(LEGAL_ACCEPTED_KEY, now);
    setLastAcceptedDate(now);
  };

  const getLocation = async (): Promise<{ lat: number; lng: number } | undefined> => {
    try {
      if (Capacitor.isNativePlatform()) {
        const coordinates = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 5000 });
        return { lat: coordinates.coords.latitude, lng: coordinates.coords.longitude };
      } else {
        return new Promise((resolve) => {
          if (!navigator.geolocation) return resolve(undefined);
          // Fix: Use getCurrentPosition instead of getPosition which does not exist on Geolocation
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(undefined),
            { timeout: 5000 }
          );
        });
      }
    } catch (e) { return undefined; }
  };

  const performAnalysis = async (image: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const location = await getLocation();
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true });
      const dayStr = now.toLocaleDateString('en-AU', { weekday: 'long' });

      const interpretation = await interpretParkingSign(image, timeStr, dayStr, state.profile, location);
      
      // Handle AI-detected image quality or logic errors
      if (interpretation.errorInfo && interpretation.errorInfo.code !== 'SUCCESS') {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: `${interpretation.errorInfo?.message} ${interpretation.errorInfo?.suggestion}`.trim() 
        }));
        return;
      }

      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        image,
        interpretation,
      };

      const updatedHistory = [newHistoryItem, ...(state.history || [])].slice(0, 15);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));

      setState(prev => ({
        ...prev,
        image,
        interpretation,
        isLoading: false,
        history: updatedHistory,
        error: null
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message || "Network Error. Please check your connection and try again." }));
    }
  };

  const handleImageSelected = async (base64: string) => {
    setState(prev => ({ ...prev, image: base64, interpretation: null, error: null }));
    await performAnalysis(base64);
  };

  const handleRecheck = async () => {
    if (state.image) await performAnalysis(state.image);
  };

  const handleRetakePhoto = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera
        });
        
        if (image.base64String) {
          handleImageSelected(`data:image/${image.format};base64,${image.base64String}`);
        }
      } catch (error) {
        console.error('Camera error:', error);
      }
    } else {
      retakeCameraInputRef.current?.click();
    }
  };

  const handleRetakeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleImageSelected(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleFeedback = (type: 'up' | 'down') => {
    if (!state.image) return;
    const updatedHistory = (state.history || []).map(item => {
      if (item && item.image === state.image) return { ...item, feedback: type };
      return item;
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    setState(prev => ({ ...prev, history: updatedHistory }));
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = (state.history || []).filter(item => item && item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setState(prev => ({ ...prev, history: updated }));
  };

  const handleReset = () => setState(prev => ({ ...prev, image: null, interpretation: null, isLoading: false, error: null }));

  if (showOnboarding || isEditingProfile) {
    return (
      <Onboarding 
        key={resetKey} 
        onComplete={saveProfile} 
        onDelete={handleDeleteProfile}
        onCancel={isEditingProfile ? handleCancelEdit : undefined}
        initialProfile={isEditingProfile ? state.profile : undefined}
        isSyncing={isSaving}
      />
    );
  }

  const currentItem = (state.history || []).find(h => h && h.image === state.image);

  return (
    <div className="h-full bg-white flex flex-col selection:bg-emerald-200 safe-pb overflow-hidden">
      <Header 
        onOpenLegal={() => setShowLegal(true)} 
        onEditProfile={() => setIsEditingProfile(true)}
        onOpenSettings={() => setShowSettings(true)}
        onLogoClick={handleReset}
      />
      
      <main className="flex-1 flex flex-col overflow-y-auto scrollbar-hide">
        {!state.image && !state.error ? (
          <div className="max-w-md mx-auto py-10 px-8 pb-20 w-full flex-1 flex flex-col">
            <div className="mb-12 space-y-2">
              <h2 className="text-[44px] font-black text-slate-900 leading-[0.95] tracking-tighter">
                Can I park <br/>
                <span className="text-emerald-500 italic">here?</span>
              </h2>
              <p className="text-slate-400 font-bold text-sm tracking-tight uppercase tracking-widest pt-1">
                Vision AI Sign Decoder
              </p>
            </div>

            <Scanner 
              onImageSelected={handleImageSelected} 
              isLoading={state.isLoading}
              onShowHowToUse={() => setShowHowToUse(true)}
            />

            {(state.history || []).length > 0 && (
              <div className="mt-16 animate-fade-in mb-8">
                <div className="flex items-center justify-between mb-6 px-1">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Recent Scans</h3>
                  <button 
                    onClick={() => { if(confirm("Clear history?")) { localStorage.removeItem(HISTORY_KEY); setState(prev => ({ ...prev, history: [] })); } }}
                    className="text-[11px] font-black text-rose-500 uppercase tracking-wider"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide -mx-1 px-1">
                  {(state.history || []).filter(Boolean).map((item) => {
                    const results = item?.interpretation?.results || [];
                    const canPark = Array.isArray(results) && results.some(r => r?.canParkNow === true);
                    return (
                      <div key={item.id} className="relative shrink-0">
                        <button
                          onClick={() => setState(prev => ({ ...prev, image: item.image, interpretation: item.interpretation, error: null }))}
                          className="w-36 aspect-[3/4] rounded-[40px] overflow-hidden border-2 border-slate-50 shadow-2xl active:scale-95 transition-all block relative"
                        >
                          <img src={item.image} className="w-full h-full object-cover" alt="Scan" />
                          <div className={`absolute bottom-0 inset-x-0 h-1.5 ${canPark ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <div className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-black border-2 border-white/20 backdrop-blur-md ${canPark ? 'bg-emerald-500/80' : 'bg-rose-500/80'}`}>
                            {canPark ? '✓' : '✕'}
                          </div>
                        </button>
                        <button 
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                          className="absolute -top-3 -right-3 bg-white text-slate-400 rounded-full p-2.5 shadow-xl border border-slate-100 z-10 active:scale-90"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : state.isLoading ? (
           <div className="flex flex-col items-center justify-center min-h-[75vh] p-10 text-center animate-fade-in bg-white">
              <div className="w-32 h-32 bg-emerald-50 rounded-[48px] flex items-center justify-center mb-12 relative shadow-inner">
                 <div className="absolute inset-0 border-[10px] border-emerald-500 border-t-transparent rounded-[48px] animate-spin" />
                 <svg className="w-14 h-14 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                 </svg>
              </div>
              <div className="space-y-4 max-w-xs">
                <div className="bg-emerald-100/50 text-emerald-700 px-5 py-2 rounded-full inline-block text-[11px] font-black uppercase tracking-widest mb-4">Processing Vision</div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-tight min-h-[72px] flex items-center justify-center">
                   <span key={loadingMsgIdx} className="animate-fade-in">{LOADING_MESSAGES[loadingMsgIdx]}</span>
                </h3>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-6">Stay patient while we think...</p>
              </div>
           </div>
        ) : state.error ? (
          <div className="p-12 text-center flex flex-col items-center justify-center min-h-[80vh] animate-fade-in max-w-md mx-auto">
            <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[32px] flex items-center justify-center mb-10 shadow-inner ring-1 ring-rose-100">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-4">Analysis Failed</h3>
            <div className="bg-rose-50/50 border border-rose-100 rounded-[32px] p-6 mb-12">
              <p className="text-slate-700 font-bold text-lg leading-snug">{state.error}</p>
            </div>
            <div className="flex flex-col w-full gap-4">
              <button 
                onClick={handleRetakePhoto} 
                className="w-full bg-slate-900 text-white h-20 rounded-[32px] font-black text-xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                Retake Photo
              </button>
              <button 
                onClick={() => {
                  setState(prev => ({ ...prev, error: null, image: null }));
                }}
                className="w-full bg-white text-slate-400 h-16 rounded-[28px] font-black text-sm uppercase tracking-[0.2em] hover:text-slate-600 transition-all"
              >
                Back to Dashboard
              </button>
            </div>
            {/* Hidden Input for Web Fallback */}
            <input type="file" ref={retakeCameraInputRef} onChange={handleRetakeFileChange} accept="image/*" capture="environment" className="hidden" />
          </div>
        ) : state.interpretation && state.image ? (
          <Results 
            data={state.interpretation} 
            image={state.image} 
            onReset={handleReset} 
            onRecheck={handleRecheck}
            onFeedback={handleFeedback}
            isRechecking={state.isLoading}
            initialFeedback={currentItem?.feedback}
            scanTimestamp={currentItem?.timestamp}
            profile={state.profile}
          />
        ) : null}
      </main>

      {!state.isLoading && (
        <footer className="px-10 py-10 bg-slate-50 border-t border-slate-100 text-center shrink-0">
             <div className="flex items-center justify-center gap-10 mb-8">
               <button onClick={() => setShowLegal(true)} className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Legal</button>
               <div className="w-1 h-1 bg-slate-300 rounded-full" />
               <button onClick={() => setIsEditingProfile(true)} className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Permits</button>
             </div>
             <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest max-w-[280px] mx-auto mb-2">
               AI is guidance only. User is responsible for their own parking.
             </p>
             <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest leading-relaxed italic">
               Parking Sign Reader v{APP_VERSION}
             </p>
        </footer>
      )}

      <LegalModal isOpen={showLegal} onClose={() => setShowLegal(false)} lastAcceptedDate={lastAcceptedDate} onAccept={handleAcceptLegal} />
      <AppSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} userEmail={state.profile.email} />

      {showHowToUse && (
        <div className="fixed inset-0 z-[10000] grid place-items-center p-6">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" onClick={() => setShowHowToUse(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-[48px] overflow-hidden shadow-2xl animate-fade-in flex flex-col pointer-events-auto max-h-[85vh]">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Scanning Tips</h2>
              <button onClick={() => setShowHowToUse(false)} className="p-2 text-slate-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-10 space-y-10 overflow-y-auto scrollbar-hide">
              <div className="space-y-10">
                {[
                  { icon: '🎯', title: 'Frame it', text: 'Align the sign inside the emerald brackets.' },
                  { icon: '📸', title: 'Steady shot', text: 'Wait for focus. Avoid lens flare or deep shadows.' },
                  { icon: '🚥', title: 'One Pole', text: 'Scan one pole at a time for the best accuracy.' },
                  { icon: '🛂', title: 'Set Permits', text: 'Ensure your resident zones are set in your profile.' }
                ].map((step, idx) => (
                  <div key={idx} className="flex gap-6 items-start">
                    <div className="text-4xl shrink-0">{step.icon}</div>
                    <div>
                      <p className="font-black text-slate-900 text-xl tracking-tight leading-none mb-2">{step.title}</p>
                      <p className="text-sm font-bold text-slate-500 leading-snug">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowHowToUse(false)} className="w-full bg-emerald-500 text-white h-20 rounded-[32px] font-black text-xl shadow-2xl shadow-emerald-100 active:scale-95 transition-all">Start Scanning</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;