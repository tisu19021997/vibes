import React from 'react';
import { TarotCard } from '@/types/dream';

interface TarotFlipCardProps {
  card: TarotCard;
  isFlipped?: boolean;
  onToggleFlip?: () => void;
  className?: string;
  onFrontClick?: () => void;
}

export const TarotFlipCard: React.FC<TarotFlipCardProps> = ({
  card,
  isFlipped = false,
  onToggleFlip,
  className = '',
  onFrontClick,
}) => {
  return (
    <div className={`flip-card ${className} ${isFlipped ? 'is-flipped' : ''}`}>
      <div className="flip-card-inner">
        <div className="flip-card-front">
          <img
            src={card.imageUrl}
            alt={card.title}
            className="w-full h-full object-cover rounded-lg shadow-dream"
            onClick={onFrontClick}
          />
        </div>
        <div className="flip-card-back">
          <div className="w-full h-full rounded-lg shadow-dream border p-4 flex flex-col gap-3 bg-card">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{card.title}</div>
              {card.subtitle && (
                <p className="text-sm leading-relaxed mt-1 whitespace-pre-wrap min-h-[2rem]">{card.subtitle}</p>
              )}
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">the dream</div>
              <p className="text-sm leading-relaxed mt-1 whitespace-pre-wrap min-h-[2rem]">
                {card.backside?.brief || '—'}
              </p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">the poem</div>
              <pre className="text-sm leading-relaxed mt-1 whitespace-pre-wrap font-serif">{card.backside?.poem || '—'}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TarotFlipCard;


