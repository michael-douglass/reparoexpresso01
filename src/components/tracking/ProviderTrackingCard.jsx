import React from 'react';
import { Phone, MessageCircle, MapPin, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function Stars({ rating }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className={cn('w-3.5 h-3.5', s <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/40')}
        />
      ))}
    </div>
  );
}

export default function ProviderTrackingCard({ request, provider, onChat, onCall }) {
  if (!request?.provider_name) return null;

  const photo = provider?.photo_url;
  const rating = provider?.rating || provider?.average_rating;
  const totalJobs = provider?.total_jobs ?? provider?.jobs_completed;

  // Endereço encurtado
  const shortAddr = request.neighborhood
    ? `${request.neighborhood} • ${request.city || ''}${request.state ? ' - ' + request.state : ''}`
    : request.address;

  return (
    <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Foto */}
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {photo ? (
            <img src={photo} alt={request.provider_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl font-bold text-primary">{request.provider_name.charAt(0)}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-sm truncate">{request.provider_name}</p>
          {rating != null && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Stars rating={rating} />
              <span className="text-xs font-semibold text-foreground">{rating.toFixed(1)}</span>
              {totalJobs != null && (
                <span className="text-xs text-muted-foreground">• {totalJobs} serviços</span>
              )}
            </div>
          )}
          {shortAddr && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" /> {shortAddr}
            </p>
          )}
          {request.estimated_arrival_minutes != null && (
            <p className="text-xs text-primary font-semibold flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" /> Chega em ~{request.estimated_arrival_minutes} min
            </p>
          )}
        </div>
      </div>

      {/* Botões */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <Button
          variant="outline"
          onClick={onCall}
          className="rounded-xl h-11 border-primary/30 text-primary hover:bg-primary/10 font-semibold gap-1.5"
        >
          <Phone className="w-4 h-4" /> Ligar
        </Button>
        <Button
          onClick={onChat}
          className="rounded-xl h-11 bg-primary text-primary-foreground font-semibold gap-1.5"
        >
          <MessageCircle className="w-4 h-4" /> Chat
        </Button>
      </div>
    </div>
  );
}