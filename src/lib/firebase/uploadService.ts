import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
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
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Provide immediate feedback by simulating initial progress if the connection is slow
    let simulatedProgress = 0;
    const simInterval = setInterval(() => {
      if (simulatedProgress < 85) {
        simulatedProgress += 5;
        if (onProgress) onProgress(simulatedProgress);
      }
    }, 500);

    const timeout = setTimeout(() => {
      clearInterval(simInterval);
      uploadTask.cancel();
      reject(new Error("Upload timed out after 30 seconds. Check your internet or Firebase Storage rules."));
    }, 30000);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const actualProgress = snapshot.totalBytes > 0 ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100 : 0;
        if (actualProgress > simulatedProgress) {
          simulatedProgress = actualProgress;
        }
        if (onProgress) {
          onProgress(simulatedProgress);
        }
      },
      (error) => {
        clearInterval(simInterval);
        clearTimeout(timeout);
        reject(error);
      },
      async () => {
        clearInterval(simInterval);
        clearTimeout(timeout);
        try {
          if (onProgress) onProgress(100);
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
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

