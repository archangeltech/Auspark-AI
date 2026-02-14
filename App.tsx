
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
import HowToUseModal from './components/HowToUseModal.tsx';
import { AppState, HistoryItem, UserProfile } from './types.ts';
import { interpretParkingSign } from './services/geminiService.ts';
import { dbService } from './services/dbService.ts';
import { compressForHistory, compressForAnalysis } from './services/imageUtils.ts';

const HISTORY_KEY = 'auspark_history_v2';
const ONBOARDING_KEY = 'auspark_onboarding_done';
const PROFILE_KEY = 'auspark_profile_v3'; 
const LEGAL_ACCEPTED_KEY = 'auspark_legal_accepted_v1';
const APP_VERSION = '1.0.9';
const MAX_HISTORY_ITEMS = 8; 

const LOADING_MESSAGES = [
  "Looking at the photo...",
  "Reading the sign...",
  "Checking the rules...",
  "Working out the time...",
  "Checking your permits...",
  "Almost ready!"
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
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  
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
      console.warn("Recovery: Local data reset.");
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

  const safeSaveHistory = (historyItems: HistoryItem[]) => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(historyItems));
      setStorageWarning(null);
    } catch (e) {
      const pruned = historyItems.slice(0, 2);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(pruned));
        setStorageWarning("Storage limited. Keeping only latest scans.");
      } catch (e2) {
        localStorage.removeItem(HISTORY_KEY);
        setStorageWarning("Storage critical. History disabled.");
      }
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Clear all recent scans? This cannot be undone.")) {
      localStorage.removeItem(HISTORY_KEY);
      setState(prev => ({ ...prev, history: [] }));
    }
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
      setStorageWarning("Storage full. Could not save profile.");
      setShowOnboarding(false);
      setIsEditingProfile(false);
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
      // Pre-optimize image for transmission speed
      const optimizedImage = await compressForAnalysis(image);
      
      const location = await getLocation();
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true });
      const dayStr = now.toLocaleDateString('en-AU', { weekday: 'long' });

      // Send the optimized image to Gemini Flash
      const interpretation = await interpretParkingSign(optimizedImage, timeStr, dayStr, state.profile, location);
      
      if (interpretation.errorInfo && interpretation.errorInfo.code !== 'SUCCESS') {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: `${interpretation.errorInfo?.message} ${interpretation.errorInfo?.suggestion}`.trim() 
        }));
        return;
      }

      const thumbnail = await compressForHistory(optimizedImage, 180);

      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        image: thumbnail, 
        interpretation,
      };

      const updatedHistory = [newHistoryItem, ...(state.history || [])].slice(0, MAX_HISTORY_ITEMS);
      
      safeSaveHistory(updatedHistory);

      setState(prev => ({
        ...prev,
        image: optimizedImage, 
        interpretation,
        isLoading: false,
        history: updatedHistory,
        error: null
      }));
    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: "Analysis failed. Please try again."
      }));
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
          quality: 60, 
          width: 1024,
          height: 1024,
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
      if (item && item.interpretation === state.interpretation) return { ...item, feedback: type };
      return item;
    });
    safeSaveHistory(updatedHistory);
    setState(prev => ({ ...prev, history: updatedHistory }));
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = (state.history || []).filter(item => item && item.id !== id);
    safeSaveHistory(updated);
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

  return (
    <div className="h-full bg-white flex flex-col selection:bg-emerald-200 overflow-hidden">
      <Header 
        onOpenLegal={() => setShowLegal(true)} 
        onEditProfile={() => setIsEditingProfile(true)}
        onOpenSettings={() => setShowSettings(true)}
        onLogoClick={handleReset}
      />
      
      <main className="flex-1 flex flex-col overflow-y-auto scrollbar-hide relative">
        {storageWarning && (
          <div className="mx-8 mt-4 bg-slate-900 text-white px-4 py-2.5 rounded-2xl flex items-center justify-between animate-fade-in shadow-lg">
             <p className="text-[10px] font-black uppercase tracking-widest">{storageWarning}</p>
             <button onClick={() => setStorageWarning(null)} className="text-white/40"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        )}

        {state.isLoading ? (
           <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in relative overflow-hidden">
              {/* Dynamic Blurred Background using captured image */}
              {state.image && (
                <div className="absolute inset-0 z-0 opacity-10">
                  <img src={state.image} className="w-full h-full object-cover blur-3xl grayscale" alt="Blur Background" />
                </div>
              )}

              <div className="relative z-10 w-full max-sm flex flex-col items-center">
                <div className="relative w-full aspect-square rounded-[64px] overflow-hidden bg-slate-900 shadow-2xl mb-8 border-8 border-white">
                  {state.image && <img src={state.image} className="w-full h-full object-cover grayscale brightness-50" alt="Captured" />}
                  <div className="absolute top-10 left-10 right-10 bottom-10 pointer-events-none">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl" />
                  </div>
                  {/* Scanning Animation Line */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.8)] animate-[scan_2.5s_linear_infinite] rounded-full z-20" />
                </div>

                <div className="space-y-2 max-w-xs flex flex-col items-center">
                  <div className="bg-emerald-100/50 text-emerald-700 px-5 py-2 rounded-full inline-block text-[11px] font-black uppercase tracking-widest mb-0.5">Vision Analysis</div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-tight min-h-[48px]">
                    <span key={loadingMsgIdx} className="animate-fade-in inline-block">{LOADING_MESSAGES[loadingMsgIdx]}</span>
                  </h3>
                  
                  <div className="px-6 py-2.5 bg-amber-50 border border-amber-100 rounded-[24px] animate-pulse shadow-sm w-full">
                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-[0.1em] leading-relaxed">
                      Analyzing sign... Keep app open to finish.
                    </p>
                  </div>
                </div>
              </div>

              <style>{`
                @keyframes scan {
                  0% { top: 10%; opacity: 0; }
                  15% { opacity: 1; }
                  85% { opacity: 1; }
                  100% { top: 90%; opacity: 0; }
                }
              `}</style>
           </div>
        ) : !state.image && !state.error ? (
          <div className="max-w-md mx-auto pt-5 px-8 pb-16 w-full flex-1 flex flex-col">
            <div className="mb-6 space-y-1">
              <h2 className="text-[32px] font-black text-slate-900 leading-tight tracking-tighter">
                Can I park <span className="text-emerald-500 italic">here?</span>
              </h2>
              <p className="text-slate-400 font-bold text-xs tracking-tight uppercase tracking-widest pt-0.5">
                Vision AI Sign Decoder
              </p>
            </div>

            <Scanner onImageSelected={handleImageSelected} isLoading={state.isLoading} onShowHowToUse={() => setShowHowToUse(true)} />

            {(state.history || []).length > 0 && (
              <div className="mt-12 animate-fade-in mb-8">
                <div className="flex items-center justify-between mb-6 px-1">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Recent Scans</h3>
                  <button 
                    onClick={handleClearHistory} 
                    className="text-[11px] font-black text-rose-500 uppercase tracking-wider active:opacity-50 transition-opacity"
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
                        <button onClick={() => setState(prev => ({ ...prev, image: item.image, interpretation: item.interpretation, error: null }))} className="w-36 aspect-[3/4] rounded-[40px] overflow-hidden border-2 border-slate-50 shadow-2xl active:scale-95 transition-all block relative bg-slate-100">
                          <img src={item.image} className="w-full h-full object-cover" alt="Scan" />
                          <div className={`absolute bottom-0 inset-x-0 h-1.5 ${canPark ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        </button>
                        <button onClick={(e) => deleteHistoryItem(item.id, e)} className="absolute -top-3 -right-3 bg-white text-slate-400 rounded-full p-2.5 shadow-xl border border-slate-100 z-10 active:scale-90"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : state.error ? (
          <div className="p-12 text-center flex flex-col items-center justify-center min-h-[80vh] animate-fade-in max-w-md mx-auto">
            <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[32px] flex items-center justify-center mb-10 shadow-inner">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-4">Analysis Failed</h3>
            <p className="text-slate-500 font-bold mb-12">{state.error}</p>
            <button onClick={handleRetakePhoto} className="w-full bg-slate-900 text-white h-20 rounded-[32px] font-black text-xl shadow-2xl active:scale-95 transition-all">Try Again</button>
            <input type="file" ref={retakeCameraInputRef} onChange={handleRetakeFileChange} accept="image/*" capture="environment" className="hidden" />
          </div>
        ) : state.interpretation && state.image ? (
          <Results 
            data={state.interpretation} image={state.image} 
            onReset={handleReset} onRecheck={handleRecheck} onFeedback={handleFeedback}
            isRechecking={state.isLoading} scanTimestamp={Date.now()} profile={state.profile}
          />
        ) : null}
      </main>

      {!state.isLoading && (
        <footer className="px-10 py-8 bg-slate-50 border-t border-slate-100 text-center shrink-0">
             <div className="flex items-center justify-center gap-8 mb-5">
               <button onClick={() => setShowLegal(true)} className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-slate-900 transition-colors">Legal</button>
               <div className="w-1 h-1 bg-slate-300 rounded-full" />
               <button onClick={() => setIsEditingProfile(true)} className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-slate-900 transition-colors">Permits</button>
             </div>
             <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest max-w-[280px] mx-auto mb-1.5">
               AI is guidance only. User is responsible for their own parking.
             </p>
             <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest leading-relaxed italic">
               Parking Sign Reader v{APP_VERSION}
             </p>
        </footer>
      )}

      <LegalModal isOpen={showLegal} onClose={() => setShowLegal(false)} lastAcceptedDate={lastAcceptedDate} onAccept={handleAcceptLegal} />
      <AppSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} userEmail={state.profile.email} />
      <HowToUseModal isOpen={showHowToUse} onClose={() => setShowHowToUse(false)} />
    </div>
  );
};

export default App;
