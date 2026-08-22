import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

export interface UploadProgress {
  progress: number;
  downloadURL: string | null;
  error: Error | null;
}

export const uploadFile = async (
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const storageRef = ref(storage, path);
      
      // Simulate progress for UI since uploadBytes doesn't support live progress
      let simulatedProgress = 0;
      const simInterval = setInterval(() => {
        if (simulatedProgress < 90) {
          simulatedProgress += Math.floor(Math.random() * 10) + 5;
          if (simulatedProgress > 90) simulatedProgress = 90;
          if (onProgress) onProgress(simulatedProgress);
        }
      }, 400);

      const snapshot = await uploadBytes(storageRef, file);
      
      clearInterval(simInterval);
      if (onProgress) onProgress(100);
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      resolve(downloadURL);
    } catch (error) {
      reject(error);
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
