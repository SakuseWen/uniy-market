import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function StarRating({ rating, size = 16, interactive = false, onChange }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  const handleClick = (star: number, isHalf: boolean) => {
    if (!interactive || !onChange) return;
    onChange(isHalf ? star - 0.5 : star);
  };

  return (
    <div className="flex items-center gap-0.5">
      {stars.map(star => {
        const filled = rating >= star;
        const half = !filled && rating >= star - 0.5;
        return (
          <div key={star} className="relative" style={{ width: size, height: size, cursor: interactive ? 'pointer' : 'default' }}>
            {/* Empty star background */}
            <Star style={{ width: size, height: size, color: '#d1d5db', fill: '#d1d5db' }} />
            {/* Filled portion */}
            {(filled || half) && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: half ? '50%' : '100%', height: '100%', overflow: 'hidden' }}>
                <Star style={{ width: size, height: size, color: '#facc15', fill: '#facc15' }} />
              </div>
            )}
            {/* Click areas for interactive */}
            {interactive && (
              <>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%' }} onClick={() => handleClick(star, true)} />
                <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%' }} onClick={() => handleClick(star, false)} />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
