import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StarRatingInput({ value, onChange, size = 'w-8 h-8', readOnly = false }) {
  return (
    <div className="flex gap-1 justify-center">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          className={cn('transition-transform', !readOnly && 'hover:scale-110 active:scale-95')}
        >
          <Star
            className={cn(
              size,
              n <= value
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-muted-foreground/30 fill-current'
            )}
          />
        </button>
      ))}
    </div>
  );
}