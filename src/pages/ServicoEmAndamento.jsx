import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { ArrowLeft, Wrench, Clock, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import BeforeAfterPhotos from '@/components/servico/BeforeAfterPhotos';
import MaterialExtraList from '@/components/servico/MaterialExtraList';
import SignAndCompleteModal from '@/components/servico/SignAndCompleteModal';
import { toast } from 'sonner';

const SERVICE_LABELS = {
  eletrica: "Elétrica", hidraulica: "Hidráulica", pintura: "Pintura",
  reparo_geral: "Reparo Geral", montagem: "Montagem", alvenaria: "Alvenaria",
  fechadura: "Fechadura", ar_condicionado: "Ar Condicionado", outros: "Outros",
};

export default function ServicoEmAndamento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSignModal, setShowSignModal] = useState(false);
  const [observation, setObservation] = useState('');

  const fetchService = async () => {
    try {
      const data = await base44.entities.ServiceRequest.get(id);
      setService(data);
      setObservation(data?.checklist?.notes || '');
    } catch (err) {
      toast.error('Serviço não encontrado');
      navigate('/prestador');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchService();
    // Real-time updates
    const unsub = base44.entities.ServiceRequest.subscribe((event) => {
      if (event.id === id && event.type === 'update') {
        setService(event.data);
      }
    });
    return unsub;
  }, [id]);

  const saveObservation = async () => {
    const checklist = { ...(service.checklist || {}), notes: observation };
    await base44.entities.ServiceRequest.update(id, { checklist });
    toast.success('Observação salva');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F4F0] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!service) return null;

  const startedAt = service.updated_date
    ? new Date(service.updated_date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <div className="min-h-screen bg-[#F7F4F0] max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-white sticky top-0 z-10">
        <button onClick={() => navigate('/prestador')} className="p-1.5 rounded-lg hover:bg-accent">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-foreground flex-1 text-center">Serviço em Andamento</h1>
        <div className="w-7" />
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* Order Info Card */}
        <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl font-bold text-foreground">{service.service_number || '—'}</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Em execução
            </span>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Iniciado {startedAt} • Técnico: {service.provider_name || user?.full_name || '—'}
          </p>
          <div className="mt-2 pt-2 border-t border-border flex items-center gap-2">
            <Wrench className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-semibold text-foreground">{SERVICE_LABELS[service.service_type] || service.service_type}</span>
          </div>
        </div>

        {/* Fotos Antes/Depois */}
        <BeforeAfterPhotos service={service} onUpdate={fetchService} />

        {/* Material Extra */}
        <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
          <MaterialExtraList service={service} onUpdate={fetchService} />
        </div>

        {/* Observação */}
        <div className="bg-white rounded-2xl p-4 border border-border shadow-sm space-y-2">
          <h3 className="text-sm font-bold text-foreground">Observação</h3>
          <Textarea
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="Descreva detalhes ou observações..."
            className="rounded-xl min-h-[80px] resize-none"
            onBlur={saveObservation}
          />
        </div>
      </div>

      {/* Footer — Assinar e Concluir */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 py-3 bg-white border-t border-border">
        <Button
          onClick={() => setShowSignModal(true)}
          className="w-full rounded-2xl h-13 py-3.5 bg-[#008744] hover:bg-[#006d37] text-white font-bold text-base gap-2"
        >
          <PenLine className="w-5 h-5" />
          Assinar e Concluir
        </Button>
      </div>

      {/* Modal de Assinatura */}
      <SignAndCompleteModal
        open={showSignModal}
        onClose={() => setShowSignModal(false)}
        service={service}
        providerName={service.provider_name || user?.full_name}
        onComplete={() => {
          setShowSignModal(false);
          navigate('/prestador');
        }}
      />
    </div>
  );
}