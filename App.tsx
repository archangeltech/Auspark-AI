import React, { useState, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import Header from './components/Header.tsx';
import Scanner from './components/Scanner.tsx';
import Results from './components/Results.tsx';
import Onboarding from './components/Onboarding.tsx';
import LegalModal from './components/LegalModal.tsx';
import AppSettingsModal from './components/AppSettingsModal.tsx';
import { AppState, HistoryItem, UserProfile } from './types.ts';
import { interpretParkingSign } from './services/geminiService.ts';

const HISTORY_KEY = 'auspark_history_v2';
const ONBOARDING_KEY = 'auspark_onboarding_done';
const PROFILE_KEY = 'auspark_profile_v3'; 
const LEGAL_ACCEPTED_KEY = 'auspark_legal_accepted_v1';
const APP_VERSION = '1.4.1';

const LOADING_MESSAGES = [
  "Analyzing sign vision...",
  "Interpreting rule hierarchy...",
  "Checking time restrictions...",
  "Applying permit exemptions...",
  "Calculating stay duration...",
  "Finalizing parking logic..."
];

const App: React.FC = () => {
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showLegal, setShowLegal] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showHowToUse, setShowHowToUse] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [lastAcceptedDate, setLastAcceptedDate] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  
  const [state, setState] = useState<AppState>({
    image: null,
    interpretation: null,
    isLoading: false,
    error: null,
    history: [],
    profile: {
      fullName: '',
      email: '',
      vehicleNumber: '',
      hasDisabilityPermit: false,
      hasResidentPermit: false,
      hasLoadingZonePermit: false,
      hasBusinessPermit: false,
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
          if (prev < LOADING_MESSAGES.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 1800);
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

  const saveProfile = (profile: UserProfile) => {
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      const now = getFormattedDate();
      localStorage.setItem(LEGAL_ACCEPTED_KEY, now);
      setLastAcceptedDate(now);
    }
    
    localStorage.setItem(ONBOARDING_KEY, 'true');
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    setState(prev => ({ ...prev, profile }));
    setShowOnboarding(false);
    setIsEditingProfile(false);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
  };

  const handleAcceptLegal = () => {
    const now = getFormattedDate();
    localStorage.setItem(LEGAL_ACCEPTED_KEY, now);
    setLastAcceptedDate(now);
  };

  const getLocation = async (): Promise<{ lat: number; lng: number } | undefined> => {
    try {
      if (Capacitor.isNativePlatform()) {
        const coordinates = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 5000
        });
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
    } catch (e) {
      return undefined;
    }
  };

  const performAnalysis = async (image: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const location = await getLocation();
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true });
      const dayStr = now.toLocaleDateString('en-AU', { weekday: 'long' });

      const interpretation = await interpretParkingSign(image, timeStr, dayStr, state.profile, location);
      
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
        history: updatedHistory
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || "Network Error. Please try again."
      }));
    }
  };

  const handleImageSelected = async (base64: string) => {
    setState(prev => ({ ...prev, image: base64, interpretation: null }));
    await performAnalysis(base64);
  };

  const handleRecheck = async () => {
    if (state.image) {
      await performAnalysis(state.image);
    }
  };

  const handleFeedback = (type: 'up' | 'down') => {
    if (!state.image) return;
    
    const updatedHistory = (state.history || []).map(item => {
      if (item && item.image === state.image) {
        return { ...item, feedback: type };
      }
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

  const handleReset = () => {
    setState(prev => ({ ...prev, image: null, interpretation: null, isLoading: false, error: null }));
  };

  if (showOnboarding || isEditingProfile) {
    return (
      <Onboarding 
        onComplete={saveProfile} 
        onCancel={isEditingProfile ? handleCancelEdit : undefined}
        initialProfile={isEditingProfile ? state.profile : undefined} 
      />
    );
  }

  const currentItem = (state.history || []).find(h => h && h.image === state.image);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-200 safe-pb overflow-x-hidden">
      <Header 
        onOpenLegal={() => setShowLegal(true)} 
        onEditProfile={() => setIsEditingProfile(true)}
        onOpenSettings={() => setShowSettings(true)}
        onLogoClick={handleReset}
      />
      
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        {!state.image ? (
          <div className="max-w-md mx-auto py-6 px-5 pb-10">
            <div className="mb-6 space-y-1">
              <h2 className="text-[32px] font-black text-slate-900 leading-tight tracking-tight">
                Can I park <span className="text-emerald-500 underline decoration-[6px] underline-offset-[2px]">here?</span>
              </h2>
              <p className="text-slate-500 font-semibold text-base leading-snug">
                Analyze signs with your camera.
              </p>
            </div>

            <Scanner 
              onImageSelected={handleImageSelected} 
              isLoading={state.isLoading}
              onShowHowToUse={() => setShowHowToUse(true)}
            />

            {(state.history || []).length > 0 && (
              <div className="mt-10 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Recent Scans</h3>
                  <button 
                    onClick={() => {
                      if(confirm("Clear all history?")) {
                        localStorage.removeItem(HISTORY_KEY);
                        setState(prev => ({ ...prev, history: [] }));
                      }
                    }}
                    className="text-[10px] font-bold text-rose-500 uppercase tracking-wider"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-1 px-1">
                  {(state.history || []).filter(Boolean).map((item) => {
                    const results = item?.interpretation?.results || [];
                    const canPark = Array.isArray(results) && results.some(r => r?.canParkNow === true);

                    return (
                      <div key={item.id} className="relative group shrink-0">
                        <button
                          onClick={() => setState(prev => ({ ...prev, image: item.image, interpretation: item.interpretation }))}
                          className="w-24 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white shadow-lg active:scale-95 transition-all block"
                        >
                          <img src={item.image} className="w-full h-full object-cover" alt="History" />
                          <div className={`absolute bottom-0 inset-x-0 h-1 ${canPark ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        </button>
                        <button 
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                          className="absolute -top-2 -right-2 bg-white text-rose-500 rounded-full p-1 shadow-md border border-slate-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : state.isLoading ? (
           <div className="flex flex-col items-center justify-center h-[70vh] p-8 text-center animate-fade-in">
              <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center mb-10 relative shadow-2xl shadow-emerald-200/50">
                 <div className="absolute inset-0 border-[6px] border-emerald-500 border-t-transparent rounded-[32px] animate-spin" />
                 <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                 </svg>
              </div>
              
              <div className="space-y-3">
                <div className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full inline-block text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                  Step {loadingMsgIdx + 1} of {LOADING_MESSAGES.length}
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 tracking-tight h-8 flex items-center justify-center overflow-hidden">
                   <span key={loadingMsgIdx} className="animate-fade-in inline-block">
                     {LOADING_MESSAGES[loadingMsgIdx]}
                   </span>
                </h3>
                
                <p className="text-slate-400 font-semibold text-xs leading-relaxed max-w-[200px] mx-auto">
                  Analysing rules for {new Date().toLocaleTimeString('en-AU', {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
           </div>
        ) : state.error ? (
          <div className="p-10 text-center flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Analysis Failed</h3>
            <p className="text-slate-500 mt-3 mb-10 font-medium leading-relaxed">{state.error}</p>
            <button onClick={handleReset} className="bg-slate-900 text-white py-4 px-12 rounded-[24px] font-extrabold shadow-xl">Try Again</button>
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
        <footer className="px-8 py-6 bg-white border-t border-slate-100 text-center pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
             <p className="text-[10px] text-slate-400 font-semibold leading-relaxed italic max-w-[320px] mx-auto mb-4">
               AI Guidance only. Users are solely responsible for their own parking and compliance.<br/>
               AusPark AI v{APP_VERSION} - Internet required
             </p>
             <div className="flex items-center justify-center gap-4">
               <button onClick={() => setShowLegal(true)} className="text-[10px] font-black uppercase tracking-widest text-emerald-600 underline decoration-2 underline-offset-4">Privacy & Terms</button>
               <button onClick={() => setIsEditingProfile(true)} className="text-[10px] font-black uppercase tracking-widest text-slate-500">Edit Profile</button>
             </div>
        </footer>
      )}

      <LegalModal 
        isOpen={showLegal} 
        onClose={() => setShowLegal(false)} 
        lastAcceptedDate={lastAcceptedDate}
        onAccept={handleAcceptLegal}
      />

      <AppSettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* How To Use Modal */}
      {showHowToUse && (
        <div className="fixed inset-0 z-[10000] grid place-items-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowHowToUse(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-fade-in flex flex-col pointer-events-auto max-h-[85vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h2 className="text-xl font-black text-slate-900 text-center flex-1 ml-8">How to Use</h2>
              <button onClick={() => setShowHowToUse(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-8 space-y-6 overflow-y-auto scrollbar-hide">
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl shrink-0 font-black text-xs">01</div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Align the sign</p>
                    <p className="text-xs text-slate-500 mt-1">Make sure the sign fills most of the frame and is level.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl shrink-0 font-black text-xs">02</div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Wait for focus</p>
                    <p className="text-xs text-slate-500 mt-1">Hold steady for 1-2 seconds before snapping the photo.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl shrink-0 font-black text-xs">03</div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">One at a time</p>
                    <p className="text-xs text-slate-500 mt-1">For best results, scan individual poles rather than busy street scenes.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl shrink-0 font-black text-xs">04</div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Review permits</p>
                    <p className="text-xs text-slate-500 mt-1">Ensure your Resident or Disability permits are active in your profile.</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowHowToUse(false)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg">Got it!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;