import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Clock, Loader2, AlertCircle, Calculator } from 'lucide-react';
import { toast } from 'sonner';

export default function AdditionalHourModal({ job, onClose, onSuccess }) {
  const [hours, setHours] = useState(1);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(null);
  const [loadingRate, setLoadingRate] = useState(true);
  const [manualRate, setManualRate] = useState('');

  const originalPrice = Number(job.final_price || job.estimated_price || 0) || 0;
  const effectiveRate = Number(hourlyRate ?? (parseFloat(manualRate) || 0)) || 0;
  const subtotal = (hours || 0) * effectiveRate;
  const newTotal = originalPrice + subtotal;

  // Busca a regra de precificação do tipo de serviço
  useEffect(() => {
    if (!job?.service_type) { setLoadingRate(false); return; }
    let cancelled = false;
    setLoadingRate(true);
    (async () => {
      try {
        const result = await base44.entities.ServicePricing.filter({ service_type: job.service_type });
        // Proteção contra retorno paginado/objeto (bug sistêmico do filter em alguns contextos)
        const pricingList = Array.isArray(result) ? result : (Array.isArray(result?.data) ? result.data : []);
        const defaultRule = pricingList.find(p => !p.city) || pricingList[0];
        if (!cancelled) {
          setHourlyRate(defaultRule && defaultRule.price_min > 0 ? defaultRule.price_min : null);
        }
      } catch (e) {
        if (!cancelled) setHourlyRate(null);
      } finally {
        if (!cancelled) setLoadingRate(false);
      }
    })();
    return () => { cancelled = true; };
  }, [job?.service_type]);

  const handleSubmit = async () => {
    if (!hours || hours <= 0) {
      toast.error('Informe a quantidade de horas');
      return;
    }
    if (!effectiveRate || effectiveRate <= 0) {
      toast.error('Não foi possível determinar o valor da hora. Informe manualmente.');
      return;
    }

    setLoading(true);
    try {
      const item = {
        type: 'hours',
        description: description.trim() || 'Hora adicional de trabalho',
        quantity: parseFloat(hours),
        price: effectiveRate,
      };

      await base44.entities.ServiceRequest.update(job.id, {
        extra_charges: {
          items: [item],
          total: subtotal,
          notes: `Hora adicional: ${hours}h × R$ ${effectiveRate.toFixed(2)}`,
          requested_at: new Date().toISOString(),
          status: 'pending_approval',
          new_total: newTotal,
        },
      });

      try {
        await base44.functions.invoke('notifyExtraChargesApproval', {
          service_id: job.id,
          client_email: job.created_by,
          service_number: job.service_number,
          client_name: job.client_name,
          provider_name: job.provider_name,
          items: [item],
          extra_total: subtotal,
          new_total: newTotal,
          notes: `Hora adicional: ${hours}h × R$ ${effectiveRate.toFixed(2)}`,
        });
      } catch (notifyError) {
        console.error('Erro ao notificar cliente:', notifyError);
        toast.warning('Hora adicional salva, mas notificação ao cliente falhou');
      }

      toast.success('Hora adicional enviada para aprovação do cliente');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao enviar hora adicional');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-2">
      <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Hora Adicional</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Aviso */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2 text-xs text-blue-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>O serviço demorou mais que o previsto? Informe o tempo extra e o sistema calcula o valor automaticamente conforme a tabela de precificação.</p>
        </div>

        {/* Quantidade de horas */}
        <div className="space-y-1.5">
          <Label>Quantidade de horas *</Label>
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
            <Input
              type="number"
              min="0.5"
              step="0.5"
              value={hours}
              onChange={e => setHours(parseFloat(e.target.value) || 0)}
              className="rounded-xl text-center text-lg font-bold"
            />
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

        {/* Valor da hora — auto-calculado pela regra de precificação */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-primary" />
            Valor da hora (calculado automaticamente)
          </Label>
          {loadingRate ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Buscando regra de precificação...
            </div>
          ) : hourlyRate != null ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/30">
              <span className="text-sm text-muted-foreground">Valor/hora conforme tabela</span>
              <span className="text-lg font-bold text-primary">R$ {hourlyRate.toFixed(2)}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-700">
                Nenhuma regra de precificação cadastrada para este serviço. Informe o valor manualmente.
              </div>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Valor por hora (R$)"
                value={manualRate}
                onChange={e => setManualRate(e.target.value)}
                className="rounded-xl"
              />
            </div>
          )}
        </div>

        {/* Descrição */}
        <div className="space-y-1.5">
          <Label>Justificativa (opcional)</Label>
          <Textarea
            placeholder="Ex: Serviço exigiu mais tempo devido à complexidade..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="rounded-xl min-h-[60px] text-sm"
          />
        </div>

        {/* Resumo */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Valor original do serviço:</p>
          <p className="text-xs font-semibold text-foreground">R$ {originalPrice.toFixed(2)}</p>
          <div className="border-t border-primary/20 pt-2 mt-2">
            <p className="text-xs text-muted-foreground">
              + {hours || 0}h × R$ {effectiveRate.toFixed(2)}:
            </p>
            <p className="text-sm font-bold text-primary">R$ {subtotal.toFixed(2)}</p>
          </div>
          <div className="border-t border-primary/20 pt-2 mt-2">
            <p className="text-xs text-muted-foreground">= Novo total:</p>
            <p className="text-lg font-bold text-foreground">R$ {newTotal.toFixed(2)}</p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-xl">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !hours || !effectiveRate}
            className="flex-1 rounded-xl bg-primary text-primary-foreground font-bold"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
            Enviar para aprovação
          </Button>
        </div>
      </div>
    </div>
  );
}