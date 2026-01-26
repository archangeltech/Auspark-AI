import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Scanner from './components/Scanner';
import Results from './components/Results';
import Onboarding from './components/Onboarding';
import LegalModal from './components/LegalModal';
import { AppState, HistoryItem, UserProfile } from './types';
import { interpretParkingSign } from './services/geminiService';

const HISTORY_KEY = 'auspark_history_v2';
const ONBOARDING_KEY = 'auspark_onboarding_done';
const PROFILE_KEY = 'auspark_profile_v2';
const LEGAL_ACCEPTED_KEY = 'auspark_legal_accepted_v1';

const App: React.FC = () => {
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showLegal, setShowLegal] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [lastAcceptedDate, setLastAcceptedDate] = useState<string | null>(null);
  const [state, setState] = useState<AppState>({
    image: null,
    interpretation: null,
    isLoading: false,
    error: null,
    history: [],
    profile: {
      hasDisabilityPermit: false,
      hasResidentPermit: false,
      hasLoadingZonePermit: false,
      hasBusinessPermit: false,
    }
  });

  useEffect(() => {
    const onboardingDone = localStorage.getItem(ONBOARDING_KEY);
    if (!onboardingDone) {
      setShowOnboarding(true);
    }

    const savedProfile = localStorage.getItem(PROFILE_KEY);
    if (savedProfile) {
      try {
        setState(prev => ({ ...prev, profile: JSON.parse(savedProfile) }));
      } catch (e) {
        console.error("Failed to load profile");
      }
    }

    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      try {
        setState(prev => ({ ...prev, history: JSON.parse(savedHistory) }));
      } catch (e) {
        console.error("Failed to load history");
      }
    }

    const savedLegal = localStorage.getItem(LEGAL_ACCEPTED_KEY);
    if (savedLegal) {
      setLastAcceptedDate(savedLegal);
    }
  }, []);

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
    // If we're finishing onboarding for the first time, auto-accept legal
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

  const handleAcceptLegal = () => {
    const now = getFormattedDate();
    localStorage.setItem(LEGAL_ACCEPTED_KEY, now);
    setLastAcceptedDate(now);
  };

  const getLocation = (): Promise<{ lat: number; lng: number } | undefined> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(undefined);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(undefined),
        { timeout: 5000 }
      );
    });
  };

  const handleImageSelected = async (base64: string) => {
    setState(prev => ({ ...prev, image: base64, isLoading: true, error: null, interpretation: null }));
    
    try {
      const location = await getLocation();
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true });
      const dayStr = now.toLocaleDateString('en-AU', { weekday: 'long' });

      const interpretation = await interpretParkingSign(base64, timeStr, dayStr, state.profile, location);
      
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        image: base64,
        interpretation,
      };

      const updatedHistory = [newHistoryItem, ...state.history].slice(0, 15);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));

      setState(prev => ({
        ...prev,
        interpretation,
        isLoading: false,
        history: updatedHistory
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || "Network Error. Please check your connection and try again."
      }));
    }
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = state.history.filter(item => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setState(prev => ({ ...prev, history: updated }));
  };

  const handleReset = () => {
    setState(prev => ({ ...prev, image: null, interpretation: null, isLoading: false, error: null }));
  };

  if (showOnboarding || isEditingProfile) {
    return <Onboarding onComplete={saveProfile} initialProfile={isEditingProfile ? state.profile : undefined} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-200 safe-pb">
      <Header 
        onOpenLegal={() => setShowLegal(true)} 
        onEditProfile={() => setIsEditingProfile(true)}
      />
      
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        {!state.image ? (
          <div className="max-w-md mx-auto py-6 px-5 pb-20">
            <div className="mb-6 space-y-1">
              <h2 className="text-[32px] font-black text-slate-900 leading-tight tracking-tight">
                Can I park <span className="text-emerald-500 underline decoration-[6px] underline-offset-[2px]">here?</span>
              </h2>
              <p className="text-slate-500 font-semibold text-base leading-snug">
                {state.profile.hasDisabilityPermit || state.profile.hasResidentPermit 
                  ? "Checking rules with your active permits..." 
                  : "Analyze signs with your camera."}
              </p>
            </div>

            <Scanner 
              onImageSelected={handleImageSelected} 
              isLoading={state.isLoading} 
            />

            {state.history.length > 0 && (
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
                  {state.history.map((item) => (
                    <div key={item.id} className="relative group shrink-0">
                      <button
                        onClick={() => setState(prev => ({ ...prev, image: item.image, interpretation: item.interpretation }))}
                        className="w-24 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white shadow-lg active:scale-95 transition-all block"
                      >
                        <img src={item.image} className="w-full h-full object-cover" alt="History" />
                        <div className={`absolute bottom-0 inset-x-0 h-1 ${item.interpretation.canParkNow ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      </button>
                      <button 
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        className="absolute -top-2 -right-2 bg-white text-rose-500 rounded-full p-1 shadow-md border border-slate-100 hover:scale-110 transition-transform"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : state.isLoading ? (
           <div className="flex flex-col items-center justify-center h-[75vh] p-8 text-center animate-fade-in">
              <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center mb-8 relative shadow-2xl shadow-emerald-200/50">
                 <div className="absolute inset-0 border-[6px] border-emerald-500 border-t-transparent rounded-[32px] animate-spin" />
                 <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                 </svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">AI Reasoning...</h3>
              <p className="text-slate-500 mt-3 font-medium max-w-[240px] leading-relaxed">
                Interpreting Australian traffic logic. Keep connection steady.
              </p>
           </div>
        ) : state.error ? (
          <div className="p-10 text-center flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
            <div className="bg-rose-50 p-6 rounded-[32px] mb-8 border border-rose-100">
              <svg className="w-12 h-12 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Analysis Failed</h3>
            <p className="text-slate-500 mt-3 mb-10 max-w-[260px] mx-auto font-medium leading-relaxed">{state.error}</p>
            <button
              onClick={handleReset}
              className="bg-slate-900 text-white py-4 px-12 rounded-[24px] font-extrabold shadow-xl active:scale-[0.96] transition-all flex items-center gap-3"
            >
              Try Again
            </button>
          </div>
        ) : state.interpretation && state.image ? (
          <Results data={state.interpretation} image={state.image} onReset={handleReset} />
        ) : null}
      </main>

      {!state.image && !state.isLoading && (
        <footer className="px-8 py-10 bg-white border-t border-slate-100 text-center pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
             <div className="flex items-center justify-center gap-4 mb-4">
                <div className="h-px bg-slate-100 flex-1" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">AusPark AI v1.2</span>
                <div className="h-px bg-slate-100 flex-1" />
             </div>
             <p className="text-[10px] text-slate-400 font-semibold leading-relaxed italic max-w-[280px] mx-auto mb-4">
               AI Guidance only. Internet required. Physical signs take precedence. AusPark AI is not responsible for any fines or penalties.
             </p>
             <div className="flex items-center justify-center gap-4">
               <button 
                 onClick={() => setShowLegal(true)}
                 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 underline decoration-2 underline-offset-4"
               >
                 Privacy & Terms
               </button>
               <span className="text-slate-300 text-[10px]">•</span>
               <button 
                 onClick={() => setIsEditingProfile(true)}
                 className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700"
               >
                 Edit Permits
               </button>
             </div>
        </footer>
      )}

      <LegalModal 
        isOpen={showLegal} 
        onClose={() => setShowLegal(false)} 
        lastAcceptedDate={lastAcceptedDate}
        onAccept={handleAcceptLegal}
      />
    </div>
  );
};

export default App;