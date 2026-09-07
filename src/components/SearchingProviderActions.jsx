import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, Calendar, X, Clock, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function SearchingProviderActions({ request, onCancel }) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  const handleSearchAnother = async () => {
    setIsSearching(true);
    try {
      // Re-trigger search: limpa qualquer provider temporário e mantém aguardando
      await base44.entities.ServiceRequest.update(request.id, {
        status: 'aguardando',
        provider_id: null,
        provider_name: null,
        provider_phone: null,
      });
      toast.success('Buscando outros prestadores disponíveis...');
    } catch {
      toast.error('Erro ao buscar prestadores. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduledDate || !scheduledTime) {
      toast.error('Selecione data e horário');
      return;
    }
    setIsScheduling(true);
    try {
      await base44.entities.ServiceRequest.update(request.id, {
        status: 'agendado',
        modality: 'agendado',
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        provider_id: null,
        provider_name: null,
        provider_phone: null,
      });
      toast.success('Serviço agendado! Buscaremos um prestador para a data escolhida.');
      setShowSchedule(false);
    } catch {
      toast.error('Erro ao agendar. Tente novamente.');
    } finally {
      setIsScheduling(false);
    }
  };

  // Data mínima = amanhã
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  if (showSchedule) {
    return (
      <div className="bg-card rounded-3xl p-5 border border-blue-300 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-5 h-5 text-blue-500" />
          <p className="font-bold text-foreground">Agendar serviço</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Escolha a data e horário para o atendimento. Buscaremos um prestador disponível.
        </p>
        <div className="space-y-3">
          <div>
            <Label htmlFor="sched-date" className="text-sm font-semibold mb-1.5 block">Data</Label>
            <Input
              id="sched-date"
              type="date"
              min={minDateStr}
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="sched-time" className="text-sm font-semibold mb-1.5 block">Horário</Label>
            <Input
              id="sched-time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 rounded-2xl"
            onClick={() => setShowSchedule(false)}
            disabled={isScheduling}
          >
            Voltar
          </Button>
          <Button
            className="flex-1 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSchedule}
            disabled={isScheduling}
          >
            {isScheduling ? 'Agendando...' : 'Confirmar agendamento'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Botão: Procurar outro prestador */}
      <Button
        variant="outline"
        className="w-full rounded-2xl border-primary/30 text-primary hover:bg-primary/10 font-semibold h-11"
        onClick={handleSearchAnother}
        disabled={isSearching}
      >
        <Search className="w-4 h-4 mr-2" />
        {isSearching ? 'Buscando...' : 'Procurar outro prestador'}
      </Button>

      {/* Botão: Agendar */}
      <Button
        variant="outline"
        className="w-full rounded-2xl border-blue-400/40 text-blue-500 hover:bg-blue-50 font-semibold h-11"
        onClick={() => setShowSchedule(true)}
      >
        <Calendar className="w-4 h-4 mr-2" />
        Agendar para outro dia
      </Button>

      {/* Botão: Cancelar */}
      <Button
        variant="outline"
        className="w-full rounded-2xl text-destructive border-destructive/30 hover:bg-destructive/10 font-semibold h-11"
        onClick={onCancel}
      >
        <X className="w-4 h-4 mr-2" />
        Cancelar solicitação
      </Button>
    </div>
  );
}