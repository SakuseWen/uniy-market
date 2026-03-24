import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Loader2 } from 'lucide-react';

interface AvatarCropperProps {
  imageSrc: string;
  open: boolean;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
  saving?: boolean;
  labels: {
    title: string;
    zoom: string;
    cancel: string;
    save: string;
    saving: string;
  };
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const size = Math.min(pixelCrop.width, pixelCrop.height);
  canvas.width = size;
  canvas.height = size;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/jpeg', 0.9);
  });
}

export function AvatarCropper({ imageSrc, open, onClose, onCropComplete, saving, labels }: AvatarCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropDone = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
    onCropComplete(croppedBlob);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
        </DialogHeader>
        <div style={{ position: 'relative', width: '100%', height: 300, background: '#111' }} className="rounded-lg overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropDone}
          />
        </div>
        <div className="flex items-center gap-3 px-1">
          <span className="text-sm text-gray-500 whitespace-nowrap">{labels.zoom}</span>
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.1}
            onValueChange={(v) => setZoom(v[0])}
            className="flex-1"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            {labels.cancel}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}
            className="bg-gradient-to-r from-blue-500 to-purple-600">
            {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />{labels.saving}</> : labels.save}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
