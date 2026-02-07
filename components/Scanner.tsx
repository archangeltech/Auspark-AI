
import React, { useRef } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface ScannerProps {
  onImageSelected: (base64: string) => void;
  isLoading: boolean;
  onShowHowToUse?: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onImageSelected, isLoading, onShowHowToUse }) => {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelected(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const triggerGallery = (e: React.MouseEvent) => {
    e.stopPropagation();
    galleryInputRef.current?.click();
  };

  const triggerCamera = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (Capacitor.isNativePlatform()) {
      try {
        const image = await Camera.getPhoto({
          quality: 80, 
          width: 1024,
          height: 1024,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera
        });
        
        if (image.base64String) {
          onImageSelected(`data:image/${image.format};base64,${image.base64String}`);
        }
      } catch (error: any) {
        // Handle common Capacitor/Mobile errors
        if (error.message.includes('User cancelled') || error.message.includes('cancelled')) {
           return;
        }
        alert("Camera Error: Please ensure you've granted camera permissions in your device settings to scan signs.");
      }
    } else {
      cameraInputRef.current?.click();
    }
  };

  const handleShowTips = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShowHowToUse) onShowHowToUse();
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto animate-fade-in">
      {/* Viewfinder Container */}
      <div className="relative w-full aspect-[4/5] rounded-[48px] overflow-hidden bg-slate-900 shadow-2xl group border-[6px] border-white ring-1 ring-slate-200">
        
        {/* Backdrop Visuals */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 flex flex-col items-center justify-center p-12 text-center pb-40 z-0">
           <div className="w-24 h-24 bg-white/5 backdrop-blur-md rounded-[32px] flex items-center justify-center mb-8 ring-1 ring-white/10">
              <svg className="w-12 h-12 text-emerald-400 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
           </div>
           <p className="text-white font-black text-2xl tracking-tighter mb-2">Ready to Decode</p>
           <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-[200px]">Align the sign for precision analysis.</p>
        </div>

        {/* Viewfinder Brackets */}
        <div className="absolute top-10 left-10 right-10 bottom-36 pointer-events-none z-10">
          <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-emerald-500/80 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-emerald-500/80 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-emerald-500/80 rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-emerald-500/80 rounded-br-2xl" />
        </div>

        {/* Interface Bar */}
        <div className="absolute bottom-0 inset-x-0 p-8 pb-10 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent z-30">
          <button 
            type="button"
            onClick={triggerGallery}
            className="w-14 h-14 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all shadow-xl hover:bg-white/20"
            aria-label="Gallery"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>

          <button 
            type="button"
            onClick={triggerCamera}
            disabled={isLoading}
            className="relative flex items-center justify-center p-1 bg-white rounded-full shadow-2xl active:scale-90 transition-all disabled:opacity-50"
            aria-label="Take Photo"
          >
            <div className="w-[72px] h-[72px] border-[4px] border-slate-900 rounded-full flex items-center justify-center">
               <div className={`w-12 h-12 bg-emerald-500 rounded-full ${isLoading ? 'animate-pulse' : ''}`} />
            </div>
          </button>

          <button 
            type="button"
            onClick={handleShowTips}
            className="w-14 h-14 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all shadow-xl hover:bg-white/20"
            aria-label="Help"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* State Support Badge */}
      <div className="mt-8 w-full">
        <div className="flex items-center gap-4 bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
           <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
             </svg>
           </div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 leading-none mb-1.5">Optimized for States</p>
             <p className="text-[11px] font-bold text-slate-900 tracking-tight">NSW, VIC, QLD, WA, SA, TAS, ACT, NT</p>
           </div>
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input type="file" ref={cameraInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" aria-hidden="true" />
      <input type="file" ref={galleryInputRef} onChange={handleFileChange} accept="image/*" className="hidden" aria-hidden="true" />
    </div>
  );
};

export default Scanner;
