import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { ArrowLeft, CheckCircle2, Shield, Check, Loader2, User, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import StarRatingInput from '@/components/avaliacao/StarRatingInput';
import { toast } from 'sonner';

const SERVICE_LABELS = {
  eletrica: "Elétrica", hidraulica: "Hidráulica", pintura: "Pintura",
  reparo_geral: "Reparo Geral", montagem: "Montagem", alvenaria: "Alvenaria",
  fechadura: "Fechadura", ar_condicionado: "Ar Condicionado", outros: "Outros",
};

const CLIENT_TAGS = [
  { key: 'chegou_rapido', label: 'Chegou rápido', icon: '⚡' },
  { key: 'educado', label: 'Educado', icon: '🤝' },
  { key: 'servico_limpo', label: 'Serviço limpo', icon: '✨' },
];

const PROVIDER_TAGS = [
  { key: 'pontual', label: 'Cliente pontual', icon: '⏰' },
  { key: 'facilitou_acesso', label: 'Facilitou acesso', icon: '🔑' },
  { key: 'pagou_dia', label: 'Pagou em dia', icon: '💳' },
];

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AvaliacaoMutua() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Client evaluating provider
  const [clientRating, setClientRating] = useState(0);
  const [clientTags, setClientTags] = useState([]);
  const [clientComment, setClientComment] = useState('');

  // Provider evaluating client
  const [providerRating, setProviderRating] = useState(0);
  const [providerTags, setProviderTags] = useState([]);
  const [providerComment, setProviderComment] = useState('');

  // Existing reviews
  const [existingClientReview, setExistingClientReview] = useState(null);
  const [existingProviderReview, setExistingProviderReview] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await base44.entities.ServiceRequest.get(id);
        setService(data);
      } catch {
        toast.error('Serviço não encontrado');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetch();
    const unsub = base44.entities.ServiceRequest.subscribe((event) => {
      if (event.id === id && event.type === 'update') setService(event.data);
    });
    return unsub;
  }, [id]);

  // Fetch existing reviews
  useEffect(() => {
    if (!service?.id) return;
    // Client's review of the provider
    base44.entities.Review.filter({ service_request_id: id, client_id: user?.id })
      .then(list => setExistingClientReview(list[0] || null))
      .catch(() => {});
    // Provider's review of the client
    base44.entities.ClientReview.filter({ service_request_id: id })
      .then(list => setExistingProviderReview(list[0] || null))
      .catch(() => {});
  }, [service?.id, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!service) return null;

  // Determine role
  const isClient = service.created_by === user?.email || !user?.role || user?.role === 'user';
  const isProvider = !isClient;

  // Warranty date
  const warrantyEnd = service.warranty_end_date
    ? new Date(service.warranty_end_date)
    : addDays(service.updated_date || new Date().toISOString(), 90);

  const toggleTag = (key, selected, setSelected) => {
    setSelected(prev => prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]);
  };

  const handleSubmit = async () => {
    if (isClient && clientRating === 0) {
      toast.error('Selecione uma nota para o prestador');
      return;
    }
    if (isProvider && providerRating === 0) {
      toast.error('Selecione uma nota para o cliente');
      return;
    }
    setSubmitting(true);
    try {
      if (isClient) {
        // Create Review (client → provider)
        await base44.entities.Review.create({
          professional_id: service.provider_id,
          provider_id: service.provider_id,
          service_request_id: id,
          client_id: user.id,
          client_name: user.full_name,
          overall_rating: clientRating,
          punctuality_rating: clientTags.includes('chegou_rapido') ? 5 : null,
          behavior_rating: clientTags.includes('educado') ? 5 : null,
          quality_rating: clientTags.includes('servico_limpo') ? 5 : null,
          comment: clientComment || `Tags: ${clientTags.map(t => CLIENT_TAGS.find(c => c.key === t)?.label).join(', ')}`,
          is_detailed: false,
          service_description: SERVICE_LABELS[service.service_type] || service.service_type,
        });
        // Mark service as rated
        await base44.entities.ServiceRequest.update(id, { rating_client: clientRating });
        // Award loyalty points (backend function — may fail without plan)
        try {
          await base44.functions.invoke('awardLoyaltyPoints', {
            user_id: user.id,
            points: clientComment ? 25 : 10,
            reason: clientComment ? 'Avaliação com comentário' : 'Avaliação básica',
            service_request_id: id,
          });
        } catch {}
      }

      if (isProvider) {
        // Create ClientReview (provider → client)
        await base44.entities.ClientReview.create({
          client_id: service.client_id || user.id,
          client_name: service.client_name,
          provider_id: service.provider_id,
          provider_name: service.provider_name,
          service_request_id: id,
          overall_rating: providerRating,
          comment: providerComment || `Tags: ${providerTags.map(t => PROVIDER_TAGS.find(c => c.key === t)?.label).join(', ')}`,
          tags: providerTags,
        });
      }

      setDone(true);
      setTimeout(() => navigate(-1), 2000);
    } catch (err) {
      toast.error('Erro ao enviar avaliação');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />
        <h2 className="text-xl font-bold text-foreground">Avaliação enviada!</h2>
        <p className="text-sm text-muted-foreground mt-1">Obrigado pelo seu feedback</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 bg-white border-b border-border sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-accent">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-foreground flex-1 text-center">Avaliação Mútua</h1>
        <div className="w-7" />
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Status & Warranty Card */}
        <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-foreground">{service.service_number || '—'}</p>
              <p className="text-xs text-muted-foreground">Concluído</p>
            </div>
          </div>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="text-xs font-bold text-green-700">Garantia de 90 dias</span>
            <span className="text-xs text-green-600">válida até {formatDate(warrantyEnd)}</span>
          </div>
        </div>

        {/* Client evaluates Provider */}
        {isClient && (
          <div className="bg-white rounded-2xl p-4 border border-border shadow-sm space-y-4">
            <h2 className="text-base font-bold text-foreground">Avalie o prestador</h2>
            <StarRatingInput value={clientRating} onChange={setClientRating} size="w-9 h-9" />
            <p className="text-sm text-muted-foreground text-center">Como foi o serviço?</p>
            {/* Tags */}
            <div className="flex flex-wrap gap-2 justify-center">
              {CLIENT_TAGS.map(tag => {
                const selected = clientTags.includes(tag.key);
                return (
                  <button
                    key={tag.key}
                    onClick={() => toggleTag(tag.key, clientTags, setClientTags)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                      selected
                        ? 'bg-green-50 border-green-400 text-green-700'
                        : 'bg-white border-border text-muted-foreground hover:border-green-200'
                    }`}
                  >
                    {selected ? <Check className="w-3.5 h-3.5 text-green-600" /> : <span>{tag.icon}</span>}
                    {tag.label}
                  </button>
                );
              })}
            </div>
            <Textarea
              value={clientComment}
              onChange={e => setClientComment(e.target.value)}
              placeholder="Comentário (opcional)..."
              className="rounded-xl min-h-[70px] resize-none text-sm"
            />
          </div>
        )}

        {/* Provider evaluates Client */}
        {isProvider && (
          <div className="bg-white rounded-2xl p-4 border border-border shadow-sm space-y-4">
            <h2 className="text-base font-bold text-foreground">Avalie o cliente</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center relative">
                <User className="w-5 h-5 text-muted-foreground" />
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">C</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{service.client_name || 'Cliente'}</p>
                <p className="text-xs text-muted-foreground">Cliente</p>
              </div>
            </div>
            <StarRatingInput value={providerRating} onChange={setProviderRating} size="w-9 h-9" />
            <div className="flex flex-wrap gap-2 justify-center">
              {PROVIDER_TAGS.map(tag => {
                const selected = providerTags.includes(tag.key);
                return (
                  <button
                    key={tag.key}
                    onClick={() => toggleTag(tag.key, providerTags, setProviderTags)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                      selected
                        ? 'bg-blue-50 border-blue-400 text-blue-700'
                        : 'bg-white border-border text-muted-foreground hover:border-blue-200'
                    }`}
                  >
                    {selected ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <span>{tag.icon}</span>}
                    {tag.label}
                  </button>
                );
              })}
            </div>
            <Textarea
              value={providerComment}
              onChange={e => setProviderComment(e.target.value)}
              placeholder="Comentário sobre o cliente..."
              className="rounded-xl min-h-[70px] resize-none text-sm"
            />
          </div>
        )}

        {/* Read-only: the other party's evaluation */}
        {isClient && existingProviderReview && (
          <div className="bg-white rounded-2xl p-4 border border-border shadow-sm space-y-3">
            <h2 className="text-base font-bold text-foreground">Avaliação do cliente pelo prestador</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center relative">
                <User className="w-5 h-5 text-muted-foreground" />
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">C</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{service.client_name || 'Cliente'}</p>
                <p className="text-xs text-muted-foreground">Cliente</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Sua avaliação:</p>
              <StarRatingInput value={existingProviderReview.overall_rating || 0} readOnly size="w-6 h-6" />
            </div>
            {existingProviderReview.comment && (
              <div className="bg-muted/50 rounded-xl p-3 flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{existingProviderReview.comment}</p>
              </div>
            )}
          </div>
        )}

        {isClient && !existingProviderReview && (
          <div className="bg-white rounded-2xl p-4 border border-dashed border-border shadow-sm text-center">
            <p className="text-sm text-muted-foreground">Aguardando avaliação do prestador...</p>
          </div>
        )}

        {isProvider && existingClientReview && (
          <div className="bg-white rounded-2xl p-4 border border-border shadow-sm space-y-3">
            <h2 className="text-base font-bold text-foreground">Avaliação do prestador pelo cliente</h2>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Avaliação do cliente:</p>
              <StarRatingInput value={existingClientReview.overall_rating || 0} readOnly size="w-6 h-6" />
            </div>
            {existingClientReview.comment && (
              <div className="bg-muted/50 rounded-xl p-3 flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{existingClientReview.comment}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer — Enviar avaliação */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 py-3 bg-white border-t border-border">
        <Button
          onClick={handleSubmit}
          disabled={submitting || (isClient ? clientRating === 0 : providerRating === 0)}
          className="w-full rounded-2xl h-13 py-3.5 bg-[#0066CC] hover:bg-[#0055aa] text-white font-bold text-base gap-2"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          {submitting ? 'Enviando...' : 'Enviar avaliação'}
        </Button>
      </div>
    </div>
  );
}