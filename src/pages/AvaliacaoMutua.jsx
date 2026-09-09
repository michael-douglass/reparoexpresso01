import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { ArrowLeft, CheckCircle2, Shield, Check, Loader2, User, Star, Wrench, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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

function StarRatingInput({ value, onChange, size = 'w-9 h-9', readOnly = false }) {
  return (
    <div className="flex gap-2 justify-center">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          className={cn('transition-transform', !readOnly && 'hover:scale-125 active:scale-95')}
        >
          <Star
            className={cn(
              size,
              n <= value
                ? 'text-yellow-400 fill-yellow-400 drop-shadow-sm'
                : 'text-gray-300 fill-gray-200'
            )}
          />
        </button>
      ))}
    </div>
  );
}

export default function AvaliacaoMutua() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [clientRating, setClientRating] = useState(0);
  const [clientTags, setClientTags] = useState([]);
  const [clientComment, setClientComment] = useState('');
  const [clientRecomendaria, setClientRecomendaria] = useState(null);

  const [providerRating, setProviderRating] = useState(0);
  const [providerTags, setProviderTags] = useState([]);
  const [providerComment, setProviderComment] = useState('');
  const [providerRecomendaria, setProviderRecomendaria] = useState(null);

  const [existingClientReview, setExistingClientReview] = useState(null);
  const [existingProviderReview, setExistingProviderReview] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
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
    fetchData();
    const unsub = base44.entities.ServiceRequest.subscribe((event) => {
      if (event.id === id && event.type === 'update') setService(event.data);
    });
    return unsub;
  }, [id]);

  useEffect(() => {
    if (!service?.id) return;
    base44.entities.Review.filter({ service_request_id: id, client_id: user?.id })
      .then(list => setExistingClientReview(list[0] || null))
      .catch(() => {});
    base44.entities.ClientReview.filter({ service_request_id: id })
      .then(list => setExistingProviderReview(list[0] || null))
      .catch(() => {});
  }, [service?.id, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!service) return null;

  const isClient = service.created_by === user?.email || !user?.role || user?.role === 'user';
  const isProvider = !isClient;

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
    if (isClient && clientRecomendaria === null) {
      toast.error('Informe se recomendaria este serviço');
      return;
    }
    if (isProvider && providerRating === 0) {
      toast.error('Selecione uma nota para o cliente');
      return;
    }
    if (isProvider && providerRecomendaria === null) {
      toast.error('Informe se recomendaria este cliente');
      return;
    }
    setSubmitting(true);
    try {
      if (isClient) {
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
          recomendaria: clientRecomendaria,
        });
        await base44.entities.ServiceRequest.update(id, { rating_client: clientRating });
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
        await base44.entities.ClientReview.create({
          client_id: service.client_id || user.id,
          client_name: service.client_name,
          provider_id: service.provider_id,
          provider_name: service.provider_name,
          service_request_id: id,
          overall_rating: providerRating,
          comment: providerComment || `Tags: ${providerTags.map(t => PROVIDER_TAGS.find(c => c.key === t)?.label).join(', ')}`,
          tags: providerTags,
          recomendaria: providerRecomendaria,
        });
      }

      setDone(true);
      setTimeout(() => navigate(-1), 2500);
    } catch (err) {
      toast.error('Erro ao enviar avaliação');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="w-14 h-14 text-green-600" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-foreground"
        >
          Avaliação enviada!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm text-muted-foreground mt-2 text-center"
        >
          Obrigado pelo seu feedback.<br />Sua garantia de 90 dias está ativa.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full"
        >
          <Shield className="w-4 h-4 text-green-600" />
          <span className="text-xs font-bold text-green-700">Garantia ativa até {formatDate(warrantyEnd)}</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] max-w-lg mx-auto pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-base font-bold text-gray-900 flex-1 text-center">Avaliação Mútua</h1>
        <div className="w-7" />
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Status & Warranty Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-gray-900">{service.service_number || 'Serviço concluído'}</p>
              <p className="text-xs text-gray-500">{SERVICE_LABELS[service.service_type] || service.service_type} · Concluído</p>
            </div>
          </div>

          {/* Selo de Garantia 90 dias */}
          <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-green-800">Garantia de 90 dias</p>
              <p className="text-xs text-green-600">Válida até {formatDate(warrantyEnd)}</p>
            </div>
            <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-lg">ATIVA</span>
          </div>
        </motion.div>

        {/* Client evaluates Provider */}
        {isClient && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-5"
          >
            <div>
              <h2 className="text-base font-bold text-gray-900">Avalie o prestador</h2>
              <p className="text-xs text-gray-500 mt-0.5">Sua opinião ajuda outros clientes</p>
            </div>

            {/* Stars */}
            <div className="py-2">
              <StarRatingInput value={clientRating} onChange={setClientRating} size="w-10 h-10" />
              <p className="text-sm text-gray-500 text-center mt-3">
                {clientRating === 0 && 'Toque nas estrelas para avaliar'}
                {clientRating === 1 && 'Muito ruim'}
                {clientRating === 2 && 'Ruim'}
                {clientRating === 3 && 'Razoável'}
                {clientRating === 4 && 'Bom'}
                {clientRating === 5 && 'Excelente!'}
              </p>
            </div>

            {/* Recomendaria este serviço? */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2.5">Recomendaria este serviço?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setClientRecomendaria(true)}
                  className={cn(
                    'flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 text-sm font-bold transition-all active:scale-[0.98]',
                    clientRecomendaria === true
                      ? 'bg-green-50 border-green-500 text-green-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-green-300'
                  )}
                >
                  <Check className="w-4 h-4" /> Sim
                </button>
                <button
                  onClick={() => setClientRecomendaria(false)}
                  className={cn(
                    'flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 text-sm font-bold transition-all active:scale-[0.98]',
                    clientRecomendaria === false
                      ? 'bg-red-50 border-red-400 text-red-600'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-red-300'
                  )}
                >
                  <X className="w-4 h-4" /> Não
                </button>
              </div>
            </div>

            {/* Tags rápidas */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2.5">O que foi bom?</p>
              <div className="flex flex-col gap-2">
                {CLIENT_TAGS.map(tag => {
                  const selected = clientTags.includes(tag.key);
                  return (
                    <button
                      key={tag.key}
                      onClick={() => toggleTag(tag.key, clientTags, setClientTags)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all active:scale-[0.98]',
                        selected
                          ? 'bg-green-50 border-green-400 text-green-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-green-200'
                      )}
                    >
                      <span className="text-xl">{tag.icon}</span>
                      <span className="flex-1 text-left">{tag.label}</span>
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                        selected ? 'bg-green-500 border-green-500' : 'border-gray-300'
                      )}>
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comentário */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Comentário <span className="text-gray-400 font-normal">(opcional)</span></p>
              <Textarea
                value={clientComment}
                onChange={e => setClientComment(e.target.value)}
                placeholder="Conte como foi a experiência..."
                className="rounded-xl min-h-[80px] resize-none text-sm border-gray-200 focus:border-green-400"
              />
            </div>
          </motion.div>
        )}

        {/* Provider evaluates Client */}
        {isProvider && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-5"
          >
            <div>
              <h2 className="text-base font-bold text-gray-900">Avalie o cliente</h2>
              <p className="text-xs text-gray-500 mt-0.5">Sua avaliação ajuda outros prestadores</p>
            </div>

            <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{service.client_name || 'Cliente'}</p>
                <p className="text-xs text-gray-500">Cliente</p>
              </div>
            </div>

            <div className="py-2">
              <StarRatingInput value={providerRating} onChange={setProviderRating} size="w-10 h-10" />
              <p className="text-sm text-gray-500 text-center mt-3">
                {providerRating === 0 && 'Toque nas estrelas para avaliar'}
                {providerRating === 1 && 'Muito ruim'}
                {providerRating === 2 && 'Ruim'}
                {providerRating === 3 && 'Razoável'}
                {providerRating === 4 && 'Bom'}
                {providerRating === 5 && 'Excelente!'}
              </p>
            </div>

            {/* Recomendaria este cliente? */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2.5">Recomendaria este cliente?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setProviderRecomendaria(true)}
                  className={cn(
                    'flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 text-sm font-bold transition-all active:scale-[0.98]',
                    providerRecomendaria === true
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                  )}
                >
                  <Check className="w-4 h-4" /> Sim
                </button>
                <button
                  onClick={() => setProviderRecomendaria(false)}
                  className={cn(
                    'flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 text-sm font-bold transition-all active:scale-[0.98]',
                    providerRecomendaria === false
                      ? 'bg-red-50 border-red-400 text-red-600'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-red-300'
                  )}
                >
                  <X className="w-4 h-4" /> Não
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2.5">O que foi bom?</p>
              <div className="flex flex-col gap-2">
                {PROVIDER_TAGS.map(tag => {
                  const selected = providerTags.includes(tag.key);
                  return (
                    <button
                      key={tag.key}
                      onClick={() => toggleTag(tag.key, providerTags, setProviderTags)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all active:scale-[0.98]',
                        selected
                          ? 'bg-blue-50 border-blue-400 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-blue-200'
                      )}
                    >
                      <span className="text-xl">{tag.icon}</span>
                      <span className="flex-1 text-left">{tag.label}</span>
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                        selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                      )}>
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <Textarea
              value={providerComment}
              onChange={e => setProviderComment(e.target.value)}
              placeholder="Comentário sobre o cliente..."
              className="rounded-xl min-h-[80px] resize-none text-sm border-gray-200 focus:border-blue-400"
            />
          </motion.div>
        )}

      </div>

      {/* Footer — Enviar avaliação */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 py-3 bg-white border-t border-gray-100">
        <Button
          onClick={handleSubmit}
          disabled={submitting || (isClient ? (clientRating === 0 || clientRecomendaria === null) : (providerRating === 0 || providerRecomendaria === null))}
          className="w-full rounded-2xl h-14 bg-[#0066FF] hover:bg-[#0055CC] text-white font-bold text-base gap-2 shadow-lg shadow-[#0066FF]/20 disabled:opacity-40 disabled:shadow-none"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          {submitting ? 'Enviando...' : 'Enviar avaliação'}
        </Button>
      </div>
    </div>
  );
}