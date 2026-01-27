import React, { useRef } from 'react';

interface ScannerProps {
  onImageSelected: (base64: string) => void;
  isLoading: boolean;
}

const Scanner: React.FC<ScannerProps> = ({ onImageSelected, isLoading }) => {
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
    // Reset input so the same file can be selected again if needed
    e.target.value = '';
  };

  const triggerGallery = () => {
    galleryInputRef.current?.click();
  };

  const triggerCamera = () => {
    cameraInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="w-full max-w-sm aspect-[3/4] rounded-[32px] border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-center p-8 transition-all hover:border-emerald-400 hover:bg-emerald-50/30">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-6 transform -rotate-3 border border-slate-100">
          <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        
        <h3 className="text-xl font-black text-slate-900 tracking-tight">Select Parking Sign</h3>
        <p className="text-sm text-slate-500 mt-2 font-medium">Capture a live photo or upload from your gallery for instant analysis.</p>
        
        <div className="mt-8 w-full space-y-3">
          <button
            onClick={triggerCamera}
            disabled={isLoading}
            className="w-full bg-slate-900 text-white py-4 px-6 rounded-[20px] font-black flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-slate-200"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
                <span>Take Photo</span>
              </>
            )}
          </button>

          <button
            onClick={triggerGallery}
            disabled={isLoading}
            className="w-full bg-white text-slate-900 border-2 border-slate-200 py-4 px-6 rounded-[20px] font-black flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Gallery Upload</span>
          </button>
        </div>
      </div>

      {/* Hidden Inputs */}
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
      
      <div className="flex flex-col gap-4 w-full max-w-sm px-2">
        <div className="flex items-start gap-3 text-xs text-slate-500 font-medium bg-slate-100/50 p-4 rounded-2xl border border-slate-100">
           <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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