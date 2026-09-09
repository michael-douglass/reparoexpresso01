import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Bike, Store, MapPinned, CheckCircle2, Clock, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const PECA_STEPS = [
  { key: 'aguardando', label: 'Motoby aguardando', icon: Clock, desc: 'Buscando motoby' },
  { key: 'iniciando_deslocamento', label: 'Saiu p/ loja', icon: Bike, desc: 'A caminho da loja' },
  { key: 'compra_realizada', label: 'Peça comprada', icon: Store, desc: 'Compra realizada' },
  { key: 'a_caminho_cliente', label: 'A caminho de você', icon: MapPinned, desc: 'Levando a peça' },
  { key: 'peca_entregue', label: 'Peça entregue', icon: CheckCircle2, desc: 'Entrega concluída' },
];

export default function MotoPecaTrackingCard({ originalRequest, motoPecaOs }) {
  const [loading, setLoading] = useState(false);
  const currentStatus = motoPecaOs?.peca_status || 'aguardando';
  const currentIdx = PECA_STEPS.findIndex(s => s.key === currentStatus);
  const canSolicitarRetorno = ['a_caminho_cliente', 'peca_entregue'].includes(currentStatus);
  const retornoJaSolicitado = !originalRequest?.peca_solicitada;

  const solicitarRetorno = async () => {
    if (!originalRequest?.id) return;
    setLoading(true);
    try {
      await base44.entities.ServiceRequest.update(originalRequest.id, {
        status: 'aceito',
        peca_solicitada: false,
      });
      if (originalRequest.provider_id) {
        await base44.entities.ProviderNotification.create({
          provider_id: originalRequest.provider_id,
          type: 'retorno_solicitado',
          title: 'Retorno solicitado pelo cliente',
          message: `O cliente solicitou o retorno para concluir o atendimento ${originalRequest.service_number || ''}. A peça já está a caminho/entregue via Moto Peça.`,
          action_url: '/prestador',
          is_read: false,
        }).catch(() => {});
      }
      toast.success('Retorno solicitado! O prestador foi avisado.');
    } catch (e) {
      toast.error('Erro ao solicitar retorno. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!motoPecaOs) return null;

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-5 mb-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
          <Bike className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <p className="font-bold text-blue-900 text-sm">Moto Peça — busca de peça em andamento</p>
          <p className="text-xs text-blue-700">Acompanhe o status da entrega da sua peça</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="space-y-0">
        {PECA_STEPS.map((step, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                  isDone ? "bg-green-500 border-green-500" : isCurrent ? "bg-blue-600 border-blue-600" : "bg-white border-blue-200"
                )}>
                  {isDone
                    ? <CheckCircle2 className="w-4 h-4 text-white" />
                    : <Icon className={cn("w-4 h-4", isCurrent ? "text-white" : "text-blue-300")} />}
                </div>
                {idx < PECA_STEPS.length - 1 && (
                  <div className={cn("w-0.5 h-5 mt-0.5", isDone ? "bg-green-500" : "bg-blue-200")} />
                )}
              </div>
              <div className="pt-1 pb-5">
                <p className={cn("text-sm font-semibold", isCurrent ? "text-blue-900" : isDone ? "text-green-700" : "text-blue-400")}>
                  {step.label}
                </p>
                <p className="text-xs text-blue-600">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Solicitar retorno */}
      {canSolicitarRetorno && !retornoJaSolicitado && (
        <div className="pt-2 border-t border-blue-200">
          <Button
            onClick={solicitarRetorno}
            disabled={loading}
            className="w-full rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold h-12 gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <RotateCcw className="w-4 h-4" />
                Solicitar retorno do prestador
              </>
            )}
          </Button>
          <p className="text-xs text-blue-700 text-center mt-2">
            A peça já está a caminho. Avise o prestador para voltar e concluir o serviço.
          </p>
        </div>
      )}

      {retornoJaSolicitado && canSolicitarRetorno && (
        <div className="pt-2 border-t border-blue-200">
          <div className="bg-green-100 border border-green-300 rounded-2xl p-3 text-center">
            <p className="text-sm font-bold text-green-800">✓ Retorno solicitado</p>
            <p className="text-xs text-green-700 mt-0.5">O prestador foi avisado e retornará para concluir o serviço</p>
          </div>
        </div>
      )}
    </div>
  );
}