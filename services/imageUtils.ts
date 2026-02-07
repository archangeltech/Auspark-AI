
/**
 * Utility to downscale and compress base64 images for localStorage efficiency.
 */
export const compressForHistory = (base64Str: string, maxWidth: number = 200): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str); // Fallback
        return;
      }

      // Calculate new dimensions
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      
      // Use better image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Highly compressed JPEG for storage
      const compressed = canvas.toDataURL('image/jpeg', 0.4);
      resolve(compressed);
    };
    img.onerror = () => reject(new Error("Failed to process image for history"));
    img.src = base64Str;
  });
};

/**
 * Utility to optimize images for AI analysis to reduce network latency.
 */
export const compressForAnalysis = (base64Str: string, maxWidth: number = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64Str);

      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      ctx.drawImage(img, 0, 0, width, height);
      
      // 0.7 quality is the "sweet spot" for OCR accuracy vs file size
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => reject(new Error("Compression failed"));
    img.src = base64Str;
  });
};
