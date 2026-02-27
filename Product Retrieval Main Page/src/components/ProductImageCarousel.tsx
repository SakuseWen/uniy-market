import { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent } from './ui/dialog';
import { Language, translate } from '../lib/i18n';

interface ProductImageCarouselProps {
  images: string[];
  title: string;
  badges?: ('includesReceipt' | 'inWarranty' | 'pickupOnly')[];
  language: Language;
}

export function ProductImageCarousel({ images, title, badges, language }: ProductImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const t = (key: any) => translate(language, key);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') setIsZoomed(false);
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Main Image */}
      <div className="relative aspect-[4/3] bg-gray-100 group">
        <ImageWithFallback
          src={images[currentIndex]}
          alt={`${title} - Image ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Badges Overlay */}
        {badges && badges.length > 0 && (
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {badges.includes('inWarranty') && (
              <Badge className="bg-green-500">✓ {t('inWarranty')}</Badge>
            )}
            {badges.includes('includesReceipt') && (
              <Badge className="bg-blue-500">📄 {t('includesReceipt')}</Badge>
            )}
          </div>
        )}

        {/* Zoom Button */}
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsZoomed(true)}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              size="icon"
              variant="secondary"
              className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToPrevious}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToNext}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            {/* Image Counter */}
            <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="p-4 border-t">
          <div className="flex gap-2 overflow-x-auto">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <ImageWithFallback
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Zoom Modal */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
          <div className="relative w-full h-[90vh]">
            <ImageWithFallback
              src={images[currentIndex]}
              alt={`${title} - Full size`}
              className="w-full h-full object-contain"
            />
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-4 right-4"
              onClick={() => setIsZoomed(false)}
            >
              <X className="w-4 h-4" />
            </Button>
            {images.length > 1 && (
              <>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  onClick={goToNext}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
