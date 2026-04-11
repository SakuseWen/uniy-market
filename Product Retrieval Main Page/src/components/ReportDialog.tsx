import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from './ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from './ui/select';
import { Loader2, ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Language, translate } from '../lib/i18n';
import { reportService } from '../services/reportService';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: Language;
  reportType: 'product' | 'user';
  targetId: string;
  targetName?: string;
}

const CATEGORIES = [
  'inappropriate_content', 'spam', 'fraud', 'harassment', 'fake_product', 'other',
] as const;

const MAX_IMAGES = 5;
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

export function ReportDialog({ open, onOpenChange, language, reportType, targetId, targetName }: ReportDialogProps) {
  const t = (key: any) => translate(language, key);
  const [category, setCategory] = useState<string>('');
  const [reason, setReason] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: File[]) => {
    const valid = files.filter((f: File) => {
      if (!ALLOWED_TYPES.includes(f.type)) { toast.error(t('reportInvalidImage') || 'Only jpeg/png/gif/webp allowed'); return false; }
      if (f.size > MAX_SIZE) { toast.error(t('reportImageTooLarge') || 'Image must be under 5MB'); return false; }
      return true;
    });
    const remaining = MAX_IMAGES - images.length;
    const toAdd = valid.slice(0, remaining);
    if (valid.length > remaining) toast.error(`${t('reportMaxImages') || 'Max'} ${MAX_IMAGES} ${t('reportImages') || 'images'}`);

    setImages((prev: File[]) => [...prev, ...toAdd]);
    toAdd.forEach((f: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews((prev: string[]) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    e.target.value = '';
    addFiles(files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = (Array.from(e.dataTransfer.files) as File[]).filter((f: File) => f.type.startsWith('image/'));
    if (files.length > 0) addFiles(files);
  };

  const removeImage = (index: number) => {
    setImages((prev: File[]) => prev.filter((_: File, i: number) => i !== index));
    setPreviews((prev: string[]) => prev.filter((_: string, i: number) => i !== index));
  };

  const resetForm = () => {
    setCategory('');
    setReason('');
    setImages([]);
    setPreviews([]);
  };

  const handleSubmit = async () => {
    if (!category || !reason.trim()) {
      toast.error(t('reportMissingFields') || 'Please select a category and provide a reason');
      return;
    }
    if (images.length === 0) {
      toast.error(t('reportImageRequired') || 'Please upload at least one evidence image');
      return;
    }

    setSubmitting(true);
    try {
      await reportService.createReport({
        report_type: reportType,
        category,
        reason: reason.trim(),
        images,
        ...(reportType === 'product' ? { product_id: targetId } : { reported_user_id: targetId }),
      });
      toast.success(t('reportSubmitted') || 'Report submitted successfully');
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      const serverError = err.response?.data?.error || '';
      if (serverError.includes('already reported')) {
        toast.error(t('alreadyReported'));
      } else {
        toast.error(t('reportFailed'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('reportListing')}</DialogTitle>
          <DialogDescription>{targetName || targetId}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Category */}
          <div className="space-y-2">
            <Label>{t('reportCategory')}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder={t('selectCategory')} /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{t(cat) || cat.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>{t('reportReason')}</Label>
            <Textarea
              placeholder={t('reportReasonPlaceholder')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>{t('reportEvidence') || 'Evidence Images'} <span className="text-red-500">*</span></Label>

            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />

            {/* Drag & drop zone */}
            {images.length < MAX_IMAGES && (
              <div
                className={`flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}`}
                onDragOver={(e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center">
                  <ImagePlus className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">{t('dragDropImages') || 'Drag & drop images here, or click to select'}</p>
                  <p className="text-xs text-gray-500">{t('reportEvidenceHint') || `Upload 1-${MAX_IMAGES} images (max 5MB each)`}</p>
                </div>
              </div>
            )}

            {/* Preview grid */}
            {previews.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {previews.map((src: string, i: number) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                      onClick={() => removeImage(i)}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }} disabled={submitting}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !category || !reason.trim() || images.length === 0}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {t('submitReport')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
