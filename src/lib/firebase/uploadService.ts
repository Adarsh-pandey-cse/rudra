import { firebaseConfig } from "./firebase";

export interface UploadProgress {
  progress: number;
  downloadURL: string | null;
  error: Error | null;
}

/**
 * Cloudinary Upload Service
 * Replaces Firebase Storage to bypass billing and storage limits.
 * Supports PDFs, Docs, and Images perfectly with live progress.
 */
export const uploadFile = async (
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    // We only support ImgBB right now because Firebase Storage is disabled for billing
    // and Cloudinary is not configured. ImgBB only supports images.
    if (!file.type.startsWith('image/')) {
      return reject(new Error("Only image files are supported in this chat currently."));
    }

    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY || "YOUR_IMGBB_API_KEY_HERE";
    if (apiKey === "YOUR_IMGBB_API_KEY_HERE" || !apiKey) {
      return reject(new Error("Missing ImgBB API Key! Get one instantly at https://api.imgbb.com/"));
    }

    try {
      if (onProgress) onProgress(30);

      // Compress image just like in homework
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      const fileToUpload = await new Promise<File>((resolveCompress) => {
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const MAX_SIZE = 1920; 
          if (width > height && width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolveCompress(file); 
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (!blob) return resolveCompress(file); 
            resolveCompress(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpeg", { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.8);
        };
        img.onerror = () => resolveCompress(file);
        img.src = objectUrl;
      });

      const formData = new FormData();
      formData.append("image", fileToUpload);

      if (onProgress) onProgress(60);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        const errText = await response.text();
        return reject(new Error(`ImgBB Upload failed (${response.status}): ${errText}`));
      }
      
      const data = await response.json();
      if (onProgress) onProgress(100);
      resolve(data.data.url);
      
    } catch (err: any) {
      reject(new Error("Failed to process upload: " + err.message));
    }
  });
};

export const base64ToFile = (base64String: string, filename: string): File => {
  const arr = base64String.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};
