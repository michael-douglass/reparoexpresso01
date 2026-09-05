import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Phone, MapPin, Clock, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

const TIMEOUT_SECONDS = 120; // 2 minutos para aceitar ou recusar

export default function NewServiceFullscreenModal({ service, onAccept, onDecline, onTimeout }) {
  const [timeLeft, setTimeLeft] = useState(TIMEOUT_SECONDS);
  const photos = service.problem_photos || [];
  const hasPhotos = photos.length > 0;
  const declinedRef = useRef(false);

  const handleAccept = () => {
    declinedRef.current = true; // bloqueia auto-recusa
    onAccept(service);
  };

  const handleDecline = () => {
    declinedRef.current = true;
    onDecline(service);
  };

  // Timer regressivo — ao zerar, recusa automaticamente (sem pedir motivo) e repassa o serviço
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!declinedRef.current) {
            declinedRef.current = true;
            // Timeout: recusa silenciosa, sem abrir modal de motivo
            (onTimeout || onDecline)(service);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [service, onDecline, onTimeout]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isUrgent = timeLeft <= 30;

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm p-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
              <h1 className="text-xl font-bold text-white">🎯 Novo Chamado Chegou!</h1>
            </div>
            <p className="text-sm text-slate-300 mt-1">Visualize os detalhes e aceite ou recuse</p>
          </div>
          {/* Timer regressivo */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${isUrgent ? 'bg-red-500/20 border-red-500/50 animate-pulse' : 'bg-white/5 border-white/10'}`}>
            <Clock className={`w-5 h-5 ${isUrgent ? 'text-red-400' : 'text-slate-300'}`} />
            <span className={`text-lg font-bold font-mono ${isUrgent ? 'text-red-400' : 'text-white'}`}>{timeStr}</span>
          </div>
          <button
            onClick={handleDecline}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Photos Section — fotos embacadas até aceitar o chamado */}
          {hasPhotos ? (
            <div className="lg:col-span-2 flex flex-col">
              <div className="bg-black/30 rounded-2xl p-4 border border-white/10">
                <p className="text-xs font-semibold text-amber-400 uppercase mb-3 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Aceite o chamado para ver as fotos em detalhe
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {photos.map((photo, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-white/20"
                    >
                      <img src={photo} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover blur-xl scale-110" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Lock className="w-6 h-6 text-white/70" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-300">Nenhuma foto disponível</p>
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            {/* Service Type */}
            <div className="bg-gradient-to-br from-green-900/30 to-green-900/10 border border-green-500/20 rounded-2xl p-5">
              <p className="text-xs font-semibold text-green-400 uppercase mb-2">Tipo de Serviço</p>
              <p className="text-2xl font-bold text-white">{service.service_type?.replace(/_/g, ' ')}</p>
            </div>

            {/* Urgency */}
            <div className="bg-gradient-to-br from-orange-900/30 to-orange-900/10 border border-orange-500/20 rounded-2xl p-5">
              <p className="text-xs font-semibold text-orange-400 uppercase mb-2">Urgência</p>
              <p className="text-lg font-bold text-white capitalize">{service.urgency || 'Agora'}</p>
            </div>

            {/* Client Info */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Cliente</p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">{service.client_name}</p>
                    <p className="text-xs text-slate-400">{service.client_phone}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-white/10">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300">
                    {service.address} {service.city ? `, ${service.city}` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {service.description && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Descrição do Problema</p>
                <p className="text-sm text-slate-200 leading-relaxed">{service.description}</p>
              </div>
            )}

            {/* Price */}
            {service.client_suggested_price && (
              <div className="bg-blue-900/30 border border-blue-500/20 rounded-2xl p-5">
                <p className="text-xs font-semibold text-blue-400 uppercase mb-2">Valor Sugerido</p>
                <p className="text-3xl font-bold text-blue-100">R$ {service.client_suggested_price.toFixed(2)}</p>
              </div>
            )}

            {/* Aviso de timeout */}
            <div className={`text-center text-xs ${isUrgent ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
              {isUrgent
                ? `⚠️ Restam ${timeStr} — o chamado será repassado a outro prestador!`
                : `⏱️ Você tem ${timeStr} para responder. Após esse tempo, o chamado vai para outro prestador.`}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleDecline}
                variant="outline"
                className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 h-12 font-semibold"
              >
                ✕ Recusar
              </Button>
              <Button
                onClick={handleAccept}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 h-12 font-semibold flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" /> Aceitar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}