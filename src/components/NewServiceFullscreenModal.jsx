import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Phone, MapPin, Clock, AlertCircle, CheckCircle2, ZoomIn } from 'lucide-react';

export default function NewServiceFullscreenModal({ service, onAccept, onDecline }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const photos = service.problem_photos || [];
  const hasPhotos = photos.length > 0;

  const handleAccept = () => {
    onAccept(service);
  };

  const handleDecline = () => {
    onDecline(service);
  };

  const openLightbox = (idx) => setLightboxIndex(idx);
  const closeLightbox = () => setLightboxIndex(null);
  const nextPhoto = () => setLightboxIndex((prev) => (prev == null ? prev : (prev + 1) % photos.length));
  const prevPhoto = () => setLightboxIndex((prev) => (prev == null ? prev : (prev - 1 + photos.length) % photos.length));

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
          <button
            onClick={onDecline}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Photos Section — thumbnails (amplia só ao clicar) */}
          {hasPhotos ? (
            <div className="lg:col-span-2 flex flex-col">
              <div className="bg-black/30 rounded-2xl p-4 border border-white/10">
                <p className="text-xs font-semibold text-slate-400 uppercase mb-3 flex items-center gap-1">
                  <ZoomIn className="w-3.5 h-3.5" /> Toque em uma foto para ampliar
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {photos.map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => openLightbox(idx)}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-white/20 hover:border-green-500 transition-all cursor-pointer group"
                    >
                      <img src={photo} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
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

          {/* Lightbox — abre só ao clicar */}
          {lightboxIndex !== null && (
            <div
              className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center p-4"
              onClick={closeLightbox}
            >
              <button
                className="absolute top-4 right-4 text-white bg-black/70 hover:bg-black rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold z-[10001]"
                onClick={closeLightbox}
              >
                ×
              </button>
              <img
                src={photos[lightboxIndex]}
                alt="Foto ampliada"
                className="max-w-[95vw] max-h-[90vh] object-contain rounded-2xl"
                onClick={(e) => e.stopPropagation()}
              />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl z-[10001]"
                  >
                    ←
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl z-[10001]"
                  >
                    →
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-2 rounded-full text-sm text-white z-[10001]">
                    {lightboxIndex + 1} / {photos.length}
                  </div>
                </>
              )}
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

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
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