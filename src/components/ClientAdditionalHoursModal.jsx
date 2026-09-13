import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Clock, Lock, Loader2, AlertCircle } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Modal para o CLIENTE solicitar horas adicionais durante o serviço (em_andamento).
 * Cria um registro de ProviderUnavailability que TRAVA a agenda do prestador
 * pelo período solicitado, e envia uma mensagem de chat notificando o prestador.
 */
export default function ClientAdditionalHoursModal({ request, onClose, onSuccess }) {
  const [hours, setHours] = useState(1);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!request) return null;

  // Calcula data/hora de início e fim do bloqueio
  const calcDateRange = (hrs) => {
    const start = new Date();
    const end = new Date(start.getTime() + hrs * 60 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const toTimeStr = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return {
      start_date: toDateStr(start),
      end_date: toDateStr(end),
      start_time: toTimeStr(start),
      end_time: toTimeStr(end),
    };
  };

  const handleSubmit = async () => {
    if (!hours || hours <= 0) {
      toast.error('Informe a quantidade de horas');
      return;
    }
    if (!request.provider_id) {
      toast.error('Prestador não atribuído a este atendimento');
      return;
    }

    setLoading(true);
    try {
      const range = calcDateRange(hours);

      // 1. Cria indisponibilidade no prestador — TRAVA a agenda
      await base44.entities.ProviderUnavailability.create({
        provider_id: request.provider_id,
        start_date: range.start_date,
        end_date: range.end_date,
        start_time: range.start_time,
        end_time: range.end_time,
        reason: `Horas adicionais solicitadas pelo cliente ${request.client_name}${description.trim() ? ` — ${description.trim()}` : ''}`,
      });

      // 2. Envia mensagem de chat para o prestador
      try {
        await base44.entities.ChatMessage.create({
          request_id: request.id,
          sender_role: 'cliente',
          sender_name: request.client_name,
          text: `⏰ Solicitei ${hours}h adicional(is) de trabalho. Minha agenda está reservada das ${range.start_time} às ${range.end_time}${range.start_date !== range.end_date ? ` (${range.start_date} a ${range.end_date})` : ''}.${description.trim() ? ` Motivo: ${description.trim()}` : ''}`,
        });
      } catch (chatErr) {
        console.error('Erro ao enviar mensagem de chat:', chatErr);
      }

      toast.success(`${hours}h adicional(is) reservada(s). A agenda do prestador está travada para este período.`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao reservar horas adicionais:', error);
      toast.error('Erro ao reservar horas adicionais. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const range = calcDateRange(hours);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-2">
      <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Horas Adicionais</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Aviso */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2 text-xs text-blue-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            Precisa de mais tempo no atendimento? Informe as horas adicionais e a agenda do prestador será <strong>travada</strong> para este período, garantindo que ele não aceite outro serviço que coincida com o seu.
          </p>
        </div>

        {/* Quantidade de horas */}
        <div className="space-y-1.5">
          <Label>Quantas horas adicionais você precisa? *</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-xl h-10 w-10 flex-shrink-0"
              onClick={() => setHours(Math.max(0.5, parseFloat((hours || 1) - 0.5)))}
            >
              −
            </Button>
            <div className="flex-1 rounded-xl border border-input bg-transparent h-10 flex items-center justify-center text-lg font-bold">
              {hours}h
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-xl h-10 w-10 flex-shrink-0"
              onClick={() => setHours(parseFloat((hours || 0) + 0.5))}
            >
              +
            </Button>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map(h => (
              <button
                key={h}
                onClick={() => setHours(h)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                  hours === h
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>

        {/* Descrição */}
        <div className="space-y-1.5">
          <Label>Motivo (opcional)</Label>
          <Textarea
            placeholder="Ex: O serviço está mais complexo que o previsto..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="rounded-xl min-h-[60px] text-sm"
          />
        </div>

        {/* Resumo do bloqueio */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-primary">Agenda travada para o prestador</p>
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-muted-foreground">
              <Clock className="w-3 h-3 inline mr-1" />
              De: <strong className="text-foreground">{range.start_date} às {range.start_time}</strong>
            </p>
            <p className="text-muted-foreground">
              <Clock className="w-3 h-3 inline mr-1" />
              Até: <strong className="text-foreground">{range.end_date} às {range.end_time}</strong>
            </p>
          </div>
          <p className="text-xs text-muted-foreground pt-1 border-t border-primary/20">
            O prestador não poderá aceitar novos serviços que coincidam com este horário.
          </p>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-xl">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !hours}
            className="flex-1 rounded-xl bg-primary text-primary-foreground font-bold"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
            Travar agenda
          </Button>
        </div>
      </div>
    </div>
  );
}