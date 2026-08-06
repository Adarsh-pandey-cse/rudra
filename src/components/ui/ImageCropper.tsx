import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/lib/utils/cropImage';
import GlassCard from './GlassCard';
import GradientButton from './GradientButton';
import GlassButton from './GlassButton';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImageBase64: string) => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const onCropCompleteInternal = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <GlassCard className="w-full max-w-md p-6 relative">
        <h2 className="text-xl font-bold text-white mb-4">Crop Profile Picture</h2>
        <div className="relative w-full h-[300px] bg-black/50 rounded-xl overflow-hidden mb-6">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={setZoom}
          />
        </div>
        
        <div className="flex flex-col gap-2 mb-6">
          <label className="text-[13px] text-[#B6C2D9]">Zoom</label>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-[#5B5CFF]"
          />
        </div>

        <div className="flex justify-end gap-3">
          <GlassButton onClick={onCancel}>Cancel</GlassButton>
          <GradientButton onClick={handleSave}>Save Picture</GradientButton>
        </div>
      </GlassCard>
    </div>
  );
}
