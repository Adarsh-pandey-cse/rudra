import { useUploadStore, UploadTask, UploadStatus } from "@/store/uploadStore";

const MAX_UPLOAD_DURATION_MS = 180000; // 3 minutes timeout (increased for slow mobile networks)

// Module-level map to store non-serializable objects (prevents Zustand/React freezes)
const activeUploads = new Map<string, { abortController: AbortController, uploadTask?: any }>();

export const cancelUploadById = (id: string) => {
  const active = activeUploads.get(id);
  if (active) {
    if (active.uploadTask && typeof active.uploadTask.cancel === 'function') {
      active.uploadTask.cancel();
    }
    if (active.abortController) {
      active.abortController.abort("UPLOAD_CANCELLED_BY_USER");
    }
  }
};

/**
 * Compresses an image file natively in the browser using HTML5 Canvas.
 * Significantly speeds up uploads from mobile devices (10MB -> ~500KB) and avoids ImgBB timeouts.
 */
const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve) => {
    // Only compress images, skip SVGs or non-images
    if (!file.type.startsWith('image/') || file.type.includes('svg')) {
      return resolve(file);
    }
    
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
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
      if (!ctx) return resolve(file); 
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (!blob) return resolve(file); 
        const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpeg", {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        resolve(newFile);
      }, 'image/jpeg', 0.85); // 85% quality JPEG
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); 
    };
    
    img.src = objectUrl;
  });
};

class UploadService {
  /**
   * Uploads a single file and tracks progress in the store.
   * Note: Refactored to use ImgBB API to completely bypass Firebase Storage billing requirements.
   */
  async uploadSingle(task: UploadTask): Promise<string> {
    const store = useUploadStore.getState();
    const startTime = Date.now();

    // Attach AbortController for strict timeout
    const abortController = new AbortController();
    activeUploads.set(task.id, { abortController });
    
    // Remove non-serializable properties before storing in Zustand
    const safeTask = { ...task };
    delete (safeTask as any).abortController;
    delete (safeTask as any).uploadRef;
    store.addTask(safeTask);

    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        abortController.abort("UPLOAD_TIMEOUT_EXCEEDED");
      }, MAX_UPLOAD_DURATION_MS);

      // Handle cancellation manually triggered by user or timeout
      abortController.signal.addEventListener("abort", () => {
        clearTimeout(timeoutId);
        const reason = abortController.signal.reason === "UPLOAD_TIMEOUT_EXCEEDED" 
          ? "Upload took too long (>3m). Please check your connection."
          : "Upload cancelled by user.";
          
        console.warn(`[UploadService] Upload aborted: ${reason}`);
        store.setTaskStatus(task.id, "cancelled", { error: reason });
        activeUploads.delete(task.id);
        reject(new Error(reason));
      });

      try {
        if (abortController.signal.aborted) throw new Error(abortController.signal.reason as string);

        store.setTaskStatus(task.id, "uploading", { progress: 10 });
        
        // Compress the image before uploading (especially for phone cameras)
        const fileToUpload = await compressImage(task.file!);
        const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY || "YOUR_IMGBB_API_KEY_HERE";
        
        if (apiKey === "YOUR_IMGBB_API_KEY_HERE" || !apiKey) {
           throw new Error("Missing ImgBB API Key! Get one instantly (no card needed) at https://api.imgbb.com/");
        }

        store.setTaskStatus(task.id, "uploading", { progress: 30 }); // Indeterminate progress
        
        const formData = new FormData();
        formData.append("image", fileToUpload);

        // Standard fetch upload to ImgBB
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
          method: "POST",
          body: formData,
          signal: abortController.signal
        });
        
        if (!response.ok) {
           const errText = await response.text();
           throw new Error(`ImgBB Upload failed (${response.status}): ${errText}`);
        }
        
        if (abortController.signal.aborted) throw new Error(abortController.signal.reason as string);
        
        store.setTaskStatus(task.id, "processing", { progress: 90 });
        const data = await response.json();
        const downloadURL = data.data.url; // ImgBB provides the direct URL here
        
        store.setTaskStatus(task.id, "completed", { downloadURL, progress: 100 });
        
        const duration = Date.now() - startTime;
        console.log(`[UploadService] Successfully uploaded ${task.name} to ImgBB in ${duration}ms.`);
        activeUploads.delete(task.id);
        clearTimeout(timeoutId);
        resolve(downloadURL);

      } catch (error: any) {
        clearTimeout(timeoutId);
        let friendlyError = error.message || "An unknown error occurred during upload.";
        
        console.error(`[UploadService] Upload error for ${task.name}:`, error);
        store.setTaskStatus(task.id, "failed", { error: friendlyError });
        activeUploads.delete(task.id);
        reject(new Error(friendlyError));
      }
    });
  }

  /**
   * Dispatches parallel uploads for an array of files.
   */
  async uploadFiles(
    files: File[],
    basePath: string,
    entityType?: "homework" | "doubt" | "notice" | "profile" | string,
    entityId?: string
  ): Promise<{ name: string; url: string; size: number; type: string }[]> {
    const uploadPromises = files.map(file => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const path = `${basePath}/${id}_${file.name}`;
      
      const task: UploadTask = {
        id,
        file,
        path,
        name: file.name,
        size: file.size,
        status: "preparing",
        progress: 0,
        bytesTransferred: 0,
        totalBytes: file.size,
        speed: 0,
        remainingTime: 0,
        entityType,
        entityId
      };

      return this.uploadSingle(task).then(url => ({
        name: file.name,
        url,
        size: file.size,
        type: file.type
      }));
    });

    return Promise.all(uploadPromises);
  }
}

export const uploadService = new UploadService();
