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
  return new Promise((resolve, reject) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      return reject(new Error("Cloudinary configuration missing. Please create a free Cloudinary account and set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your .env.local file."));
    }

    // Use 'auto' to support images, videos, and raw files (PDFs, DOCX)
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    
    // We omit explicit folder appending to avoid unsigned upload preset restrictions.

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = (e.loaded / e.total) * 100;
        // Cap visual progress at 99% until fully resolved by server
        onProgress(Math.min(progress, 99));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        if (onProgress) onProgress(100);
        const response = JSON.parse(xhr.responseText);
        resolve(response.secure_url);
      } else {
        const response = JSON.parse(xhr.responseText);
        reject(new Error(response.error?.message || `Upload failed with status ${xhr.status}` ));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error occurred during upload. Please check your connection."));
    };

    xhr.send(formData);
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
