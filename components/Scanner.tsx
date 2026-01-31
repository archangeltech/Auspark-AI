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

  const triggerGallery = () => {
    galleryInputRef.current?.click();
  };

  const triggerCamera = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera
        });
        
        if (image.base64String) {
          onImageSelected(`data:image/${image.format};base64,${image.base64String}`);
        }
      } catch (error) {
        console.error('Camera error:', error);
      }
    } else {
      cameraInputRef.current?.click();
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <div className="w-full aspect-[3/4] rounded-[32px] border-2 border-dashed border-slate-300 bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8 transition-all hover:border-emerald-400 hover:bg-emerald-50/30 relative shadow-sm">
        <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center shadow-xl mb-8 border border-slate-100 ring-8 ring-slate-50 shrink-0">
          <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        
        <div className="space-y-2 shrink-0">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Select Parking Sign</h3>
          <p className="text-sm text-slate-500 font-medium px-4 leading-relaxed">Capture a live photo or upload from your gallery for instant analysis.</p>
        </div>
        
        <div className="mt-10 w-full space-y-4 px-2 shrink-0">
          <button
            onClick={triggerCamera}
            disabled={isLoading}
            className="w-full bg-slate-900 text-white h-16 rounded-[20px] font-black flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-slate-200"
          >
            {isLoading ? (
              <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
                <span className="text-base">Take Photo</span>
              </div>
            )}
          </button>

          <button
            onClick={triggerGallery}
            disabled={isLoading}
            className="w-full bg-white text-slate-900 border-2 border-slate-200 h-16 rounded-[20px] font-black flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-base">Gallery Upload</span>
          </button>
        </div>
      </div>

      <button 
        onClick={onShowHowToUse}
        className="flex items-center gap-2.5 text-slate-400 hover:text-emerald-500 transition-colors py-3 px-5 rounded-2xl border border-slate-200 bg-white shadow-sm active:scale-95 transition-all font-black text-[10px] uppercase tracking-widest"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        How to scan correctly
      </button>

      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <div className="w-full max-w-sm px-2">
        <div className="flex items-start gap-4 text-xs text-slate-500 font-medium bg-slate-100/50 p-5 rounded-[24px] border border-slate-100">
           <svg className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
           </svg>
           <p className="leading-relaxed">
             Sign recognition optimized for all Australian states: <br/>
             <span className="font-bold text-slate-700">NSW, VIC, QLD, WA, SA, TAS, ACT, NT.</span>
           </p>
        </div>
      </div>
    </div>
  );
};

export default Scanner;