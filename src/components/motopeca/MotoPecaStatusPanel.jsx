import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Bike, Store, MapPinned, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PECA_STEPS = [
  { key: 'aguardando', label: 'Aguardando', icon: Clock, next: 'iniciando_deslocamento', nextLabel: 'Iniciar deslocamento', desc: 'Motoby ainda não saiu' },
  { key: 'iniciando_deslocamento', label: 'Deslocando p/ loja', icon: Bike, next: 'compra_realizada', nextLabel: 'Compra realizada', desc: 'A caminho da loja de peças' },
  { key: 'compra_realizada', label: 'Compra realizada', icon: Store, next: 'a_caminho_cliente', nextLabel: 'A caminho do cliente', desc: 'Peça comprada na loja' },
  { key: 'a_caminho_cliente', label: 'A caminho do cliente', icon: MapPinned, next: 'peca_entregue', nextLabel: 'Peça entregue', desc: 'Levando a peça ao cliente' },
  { key: 'peca_entregue', label: 'Peça entregue', icon: CheckCircle2, next: null, nextLabel: null, desc: 'Entrega concluída' },
];

export default function MotoPecaStatusPanel({ service, onUpdate }) {
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(false);
  const currentStatus = service.peca_status || 'aguardando';
  const currentIdx = PECA_STEPS.findIndex(s => s.key === currentStatus);
  const currentStep = PECA_STEPS[currentIdx];

  const advance = async () => {
    if (!currentStep?.next) return;
    setUpdating(true);
    try {
      const nextStatus = currentStep.next;
      const isLast = nextStatus === 'peca_entregue';
      const payload = { peca_status: nextStatus };
      if (isLast) {
        payload.status = 'concluido';
        payload.final_price = service.estimated_price || service.client_suggested_price || null;
      }
      await base44.entities.ServiceRequest.update(service.id, payload);
      toast.success(isLast ? 'Peça entregue! OS concluída.' : `Status atualizado: ${PECA_STEPS.find(s => s.key === nextStatus)?.label}`);
      if (isLast) {
        setTimeout(() => navigate('/prestador'), 1200);
      } else if (onUpdate) {
        onUpdate();
      }
    } catch (e) {
      toast.error('Erro ao atualizar status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-card sticky top-0 z-10">
        <button onClick={() => navigate('/prestador')} className="p-1.5 rounded-lg hover:bg-accent">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-foreground flex-1 text-center">Moto Peça — Entrega</h1>
        <div className="w-7" />
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* OS info */}
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bike className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground">{service.service_number || '—'}</p>
              <p className="text-xs text-muted-foreground">Busca de peça por moto</p>
            </div>
          </div>
          <div className="pt-2 border-t border-border space-y-1.5">
            <p className="text-xs text-muted-foreground">Peças:</p>
            <p className="text-sm text-foreground line-clamp-3">{service.description || '—'}</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm space-y-3">
          <p className="text-sm font-bold text-foreground">Progresso da entrega</p>
          <div className="space-y-0">
            {PECA_STEPS.map((step, idx) => {
              const isDone = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors",
                      isDone ? "bg-green-500 border-green-500" : isCurrent ? "bg-primary border-primary" : "bg-muted border-border"
                    )}>
                      {isDone
                        ? <CheckCircle2 className="w-5 h-5 text-white" />
                        : <Icon className={cn("w-4 h-4", isCurrent ? "text-primary-foreground" : "text-muted-foreground")} />}
                    </div>
                    {idx < PECA_STEPS.length - 1 && (
                      <div className={cn("w-0.5 h-6 mt-0.5", isDone ? "bg-green-500" : "bg-border")} />
                    )}
                  </div>
                  <div className="pt-1.5 pb-6">
                    <p className={cn("text-sm font-semibold", isCurrent ? "text-primary" : isDone ? "text-green-700" : "text-muted-foreground")}>
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cliente / Entrega info */}
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm space-y-2">
          <p className="text-sm font-bold text-foreground">Dados de entrega</p>
          <div className="flex items-start gap-2 text-xs text-black">
            <MapPinned className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <span>{service.address || '—'}{service.number ? `, ${service.number}` : ''}{service.neighborhood ? ` — ${service.neighborhood}` : ''}{service.city ? `, ${service.city}` : ''}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-black">
            <span className="font-semibold">Cliente:</span>
            <span>{service.client_name || '—'}</span>
          </div>
          {service.client_phone && (
            <a href={`tel:${service.client_phone.replace(/\D/g, '')}`} className="flex items-center gap-2 text-xs text-primary font-semibold">
              <span>📞 {service.client_phone}</span>
            </a>
          )}
        </div>
      </div>

      {/* Footer — botões de ação do motoboy */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 py-2.5 bg-card border-t border-border space-y-1.5 max-h-[60vh] overflow-y-auto">
        {currentStep?.next ? (
          PECA_STEPS.filter(s => s.next).map(step => {
            const stepIdx = PECA_STEPS.findIndex(s => s.key === step.key);
            const isDone = stepIdx < currentIdx;
            const isCurrent = stepIdx === currentIdx;
            const isFuture = stepIdx > currentIdx;
            const isLast = step.next === 'peca_entregue';
            const Icon = step.icon;
            return (
              <button
                key={step.key}
                onClick={isCurrent ? advance : undefined}
                disabled={!isCurrent || updating}
                className={cn(
                  "w-full rounded-xl h-11 px-4 font-bold text-sm gap-2 flex items-center justify-center transition-colors",
                  isCurrent && isLast && "bg-green-600 hover:bg-green-700 text-white",
                  isCurrent && !isLast && "bg-primary hover:bg-primary/90 text-primary-foreground",
                  isDone && "bg-green-100 text-green-700",
                  isFuture && "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {isCurrent && updating ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    <span>{isDone ? step.label : step.nextLabel}</span>
                    {isFuture && <span className="text-[11px] font-normal opacity-70">• em breve</span>}
                  </>
                )}
              </button>
            );
          })
        ) : (
          <div className="w-full rounded-xl h-11 py-2.5 bg-green-100 text-green-700 font-bold text-sm flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Entrega concluída
          </div>
        )}
      </div>
    </div>
  );
}