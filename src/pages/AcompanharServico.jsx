import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, User, Phone, Star, MapPin, Wrench, AlertCircle, Plus } from "lucide-react";
import FavoriteButton from '../components/FavoriteButton';
import { cn } from "@/lib/utils";
import RatingModal from '../components/RatingModal';
import RetornoModal from '../components/RetornoModal';
import LocationTracker from '../components/LocationTracker';
import ServiceChat from '../components/ServiceChat';
import PaymentModal from '../components/PaymentModal';
import PixPaymentModal from '../components/PixPaymentModal';
import NotificationPermissionBanner from '../components/NotificationPermissionBanner';
import SatisfactionSurveyModal from '../components/SatisfactionSurveyModal';
import TipRequestModal from '../components/TipRequestModal';
import WarrantyBadge from '../components/WarrantyBadge';
import SearchingProviderActions from '../components/SearchingProviderActions';

import BatchProvidersPanel from '../components/BatchProvidersPanel';
import BatchProviderChat from '../components/BatchProviderChat';
import ClientTicketForm from '../components/ClientTicketForm';
import CouponInput from '../components/CouponInput';
import useClientNotifications from '../hooks/useClientNotifications';
import ServiceStatusBanner from '../components/tracking/ServiceStatusBanner';
import ServiceTrackingMap from '../components/tracking/ServiceTrackingMap';
import ProviderTrackingCard from '../components/tracking/ProviderTrackingCard';
import ServiceProgressStepper from '../components/tracking/ServiceProgressStepper';
import { ArrowLeft } from "lucide-react";

const STATUS_STEPS = [
  { key: "aguardando", label: "Aguardando prestador", icon: Clock },
  { key: "aceito", label: "Prestador confirmado", icon: User },
  { key: "a_caminho", label: "Prestador a caminho!", icon: User },
  { key: "em_andamento", label: "Serviço em execução", icon: Wrench },
  { key: "concluido", label: "Serviço concluído!", icon: CheckCircle2 },
];

const SERVICE_LABELS = {
  eletrica: "Elétrica", hidraulica: "Hidráulica", pintura: "Pintura",
  reparo_geral: "Reparo Geral", montagem: "Montagem", alvenaria: "Alvenaria",
  fechadura: "Fechadura", ar_condicionado: "Ar Condicionado", outros: "Outros",
};

export default function AcompanharServico() {
  const { id } = useParams();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const [showRating, setShowRating] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showPixPayment, setShowPixPayment] = useState(false);
  const [showRetorno, setShowRetorno] = useState(urlParams.get('retorno') === '1');
  const [showSatisfactionSurvey, setShowSatisfactionSurvey] = useState(false);
  const [showTipRequest, setShowTipRequest] = useState(false);
  const [previousStatus, setPreviousStatus] = useState(null);
  const previousStatusRef = useRef(null);
  const [user, setUser] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [providerPhotos, setProviderPhotos] = useState({});
  const [providerData, setProviderData] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Monitora notificações de orçamento extra em tempo real
  useClientNotifications(user?.email);

  const [allRequests, setAllRequests] = useState([]);
  const [request, setRequest] = useState(null);

  // useEffect unificado: carrega request atual + allRequests + uma única subscription
  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const loadInitial = async () => {
      try {
        // 1. Busca o request atual (get é mais leve que filter)
        const current = await base44.entities.ServiceRequest.get(id);
        if (cancelled) return;
        if (!current) { navigate('/'); return; }
        setRequest(current);

        // 2. Busca allRequests para detecção de lote (apenas se logado)
        if (user?.email) {
          const all = await base44.entities.ServiceRequest.filter({ created_by: user.email }, '-created_date', 50);
          if (cancelled) return;
          setAllRequests(all);
        }
      } catch {
        if (!cancelled) navigate('/');
      }
    };
    loadInitial();

    // Subscription única — atualiza request E allRequests
    const unsub = base44.entities.ServiceRequest.subscribe((event) => {
      if (event.id === id && (event.type === 'update' || event.type === 'create')) {
        setRequest(event.data);
      }
      if (event.type === 'update') {
        setAllRequests(prev => prev.map(r => r.id === event.id ? event.data : r));
      } else if (event.type === 'create' && event.data?.created_by === user?.email) {
        setAllRequests(prev => [event.data, ...prev]);
      }
    });
    return () => { cancelled = true; unsub(); };
  }, [id, navigate, user?.email]);

  const handleRatingClose = (didRate = false) => {
    setShowRating(false);
    if (didRate) {
      setTimeout(() => setShowSatisfactionSurvey(true), 400);
    } else {
      setTimeout(() => setShowTipRequest(true), 300);
    }
  };

  // Busca dados do prestador principal + fotos de prestadores do lote (uma chamada por prestador, com cache)
  useEffect(() => {
    if (!request?.provider_id) return;
    // Prestador principal
    base44.entities.Provider.filter({ id: request.provider_id }).then(list => {
      if (list[0]) {
        setProviderData(list[0]);
        setProviderPhotos(prev => ({ ...prev, [request.provider_id]: list[0].photo_url || null }));
      }
    }).catch(() => {});

    // Fotos dos outros prestadores do lote — busca em sequência para evitar rate limit
    const batchProviderIds = [...new Set(
      allRequests
        .filter(r => r.provider_id && r.provider_id !== request.provider_id)
        .map(r => r.provider_id)
    )];
    // Busca sequencialmente (não paralelo) para evitar rate limit
    batchProviderIds.reduce(async (promise, pid) => {
      await promise;
      if (providerPhotos[pid] !== undefined) return;
      try {
        const list = await base44.entities.Provider.filter({ id: pid });
        if (list[0]) setProviderPhotos(prev => ({ ...prev, [pid]: list[0].photo_url || null }));
      } catch {}
    }, Promise.resolve());
  }, [request?.provider_id, allRequests.length]);



  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  // Track status changes and play sound when provider accepts
  useEffect(() => {
    if (!request?.status) return;
    if (previousStatusRef.current === null) {
      // Primeira carga: inicializa sem tocar som
      previousStatusRef.current = request.status;
      setPreviousStatus(request.status);
      return;
    }
    if (request.status !== previousStatusRef.current) {
      const prev = previousStatusRef.current;
      previousStatusRef.current = request.status;
      setPreviousStatus(request.status);
      if (request.status === 'aceito' && prev === 'aguardando') {
        playNotificationSound();
      }
    }
  }, [request?.status]);

  // Scroll para o final quando mostrar modal de gratificação
  useEffect(() => {
    if (showTipRequest) {
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  }, [showTipRequest]);

  const cancelRequest = useMutation({
    mutationFn: () => base44.entities.ServiceRequest.update(id, { status: 'cancelado' }),
    onSuccess: () => navigate('/'),
  });

  useEffect(() => {
    if (request?.status === 'concluido' && !request?.rating_client && !showSatisfactionSurvey) {
      // Delay modal appearance slightly to ensure smooth UX
      const timer = setTimeout(() => setShowRating(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [request?.status, request?.rating_client, showSatisfactionSurvey]);



  if (!id) {
    navigate('/');
    return null;
  }

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // OS do mesmo lote: criadas com menos de 5 minutos de diferença pela mesma pessoa, exceto canceladas
  const batchRequests = allRequests.filter(r => {
    if (!request?.created_date) return false;
    const diffMs = Math.abs(new Date(r.created_date) - new Date(request.created_date));
    const diffMin = diffMs / 60000;
    return diffMin <= 5 && r.status !== 'cancelado';
  });
  const otherBatchRequests = batchRequests.filter(r => r.id !== id);

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === request.status);

  const statusColor = {
    aguardando: "text-yellow-600 bg-yellow-100",
    aceito: "text-blue-600 bg-blue-100",
    a_caminho: "text-orange-600 bg-orange-100",
    em_andamento: "text-primary bg-primary/10",
    concluido: "text-green-600 bg-green-100",
    cancelado: "text-red-600 bg-red-100",
  }[request.status] || "text-muted-foreground bg-muted";

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-4 py-4 pb-20">
      <NotificationPermissionBanner />
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-accent rounded-xl transition-colors flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1 text-center">Acompanhar Serviço</h1>
        <div className="w-9 flex-shrink-0" />
      </div>

      {/* ID + Concluído button */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {request.service_number && (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-card border border-border text-xs font-mono font-bold text-foreground">
            {request.service_number}
          </span>
        )}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/garantia')}
            className="rounded-full text-xs border-primary/30 text-primary hover:bg-primary/10"
          >
            🛡️ Garantia
          </Button>
          {request.status === 'concluido' && !request.rating_client && (
            <Button
              size="sm"
              onClick={() => navigate(`/avaliacao/${id}`)}
              className="rounded-full text-xs bg-green-600 hover:bg-green-700 text-white font-bold gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Concluído?
            </Button>
          )}
        </div>
      </div>

      {/* Service type + scheduled */}
      <div className="text-center mb-3">
        <h2 className="text-xl font-bold text-foreground">{SERVICE_LABELS[request.service_type] || request.service_type}</h2>
        {request.cliente_tem_peca && (
          <span className="inline-block mt-1.5 text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-700 border border-green-400">
            🔧 Peças no local — só mão de obra
          </span>
        )}
        {request.modality === 'agendado' && request.scheduled_date && (
          <div className="inline-flex items-center gap-2 mt-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-semibold">
            <span>📅</span>
            {new Date(request.scheduled_date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            {request.scheduled_time && <><span>·</span><span>🕐 {request.scheduled_time}</span></>}
          </div>
        )}
      </div>

      {/* Status Banner */}
      <div className="mb-3">
        <ServiceStatusBanner status={request.status} />
      </div>

      {/* Map — only when provider is on the way or at location */}
      {['aceito', 'a_caminho', 'em_andamento'].includes(request.status) && (
        <div className="mb-3">
          <ServiceTrackingMap request={request} />
        </div>
      )}

      {/* Provider Card */}
      {request.provider_name && (
        <div className="mb-3">
          <ProviderTrackingCard
            request={request}
            provider={providerData}
            onCall={() => {
              if (request.provider_phone) {
                window.open(`tel:${request.provider_phone.replace(/\D/g, '')}`);
              }
            }}
            onChat={() => document.getElementById('chat-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          />
        </div>
      )}

      {/* Opções do cliente quando prestador é encontrado (aceito) */}
      {request.status === 'aceito' && request.provider_name && (
        <div className="mb-4">
          <SearchingProviderActions
            request={request}
            providerPhoto={request.provider_id ? providerPhotos[request.provider_id] : null}
            providerName={request.provider_name}
            onCancel={() => cancelRequest.mutate()}
          />
        </div>
      )}

      {/* Progress Stepper */}
      {request.status !== 'cancelado' && request.status !== 'aguardando' && (
        <div className="mb-3">
          <ServiceProgressStepper status={request.status} />
        </div>
      )}

      {/* Painel de múltiplos prestadores */}
      <BatchProvidersPanel batchRequests={batchRequests} currentId={id} />

      {/* Chat entre prestadores do lote — visível para o cliente acompanhar */}
      {batchRequests.length >= 2 && (
        <BatchProviderChat
          batchRequests={batchRequests}
          senderRole="cliente"
          senderName={request.client_name}
        />
      )}

      {/* Senhas de segurança — mostra para todas as OS do lote */}
      {batchRequests.every(r => !r.security_password) && request.status === 'aguardando' && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 mb-5 flex items-center gap-3">
          <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin flex-shrink-0" style={{borderWidth: '3px'}} />
          <div>
            <p className="text-xs font-bold text-amber-800">🔐 Gerando senhas de segurança...</p>
            <p className="text-xs text-amber-600 mt-0.5">Aguarde alguns instantes</p>
          </div>
        </div>
      )}
      {batchRequests.some(r => r.security_password) && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 mb-5 space-y-3">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">🔐 Senhas de segurança</p>
          {batchRequests.filter(r => r.security_password).map((r, idx) => (
            <div key={r.id} className="space-y-2">
              {batchRequests.filter(x => x.security_password).length > 1 && (
                <p className="text-xs font-semibold text-amber-700">Prestador {idx + 1}{r.provider_name ? ` — ${r.provider_name}` : ''}</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl p-3 border border-amber-100 text-center">
                  <p className="text-xs text-amber-700 font-semibold mb-1">Senha do prestador</p>
                  <p className="text-2xl font-mono font-black text-amber-900 tracking-widest">{r.security_password}</p>
                  <p className="text-xs text-amber-600 mt-1">Peça ao prestador esta senha antes de autorizar a entrada</p>
                </div>
                <div className="bg-white rounded-2xl p-3 border border-amber-100 text-center">
                  <p className="text-xs text-amber-700 font-semibold mb-1">Sua senha de validação</p>
                  <p className="text-2xl font-mono font-black text-amber-900 tracking-widest">{r.validation_password}</p>
                  <p className="text-xs text-amber-600 mt-1">Informe ao prestador ao chegar</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Badge de Garantia */}
      {request.status === 'concluido' && (
        <WarrantyBadge request={request} />
      )}

      {/* Prestador(es) info */}
      {(() => {
        const providers = batchRequests.length >= 2
          ? batchRequests.filter(r => r.provider_name)
          : request.provider_name ? [request] : [];
        if (providers.length === 0) return null;
        return (
          <div className="bg-card rounded-3xl p-5 border border-border mb-5">
            <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-semibold">
              {providers.length > 1 ? `Seus prestadores (${providers.length})` : 'Seu prestador'}
            </p>
            <div className="space-y-4">
              {providers.map((r, idx) => (
                <div key={r.id} className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {r.provider_id && providerPhotos[r.provider_id]
                      ? <img src={providerPhotos[r.provider_id]} alt={r.provider_name} className="w-full h-full object-cover" />
                      : <span className="text-2xl font-bold text-primary">{r.provider_name.charAt(0)}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground">{r.provider_name}</p>
                    {providers.length > 1 && (
                      <p className="text-xs text-primary font-semibold">Prestador {idx + 1}</p>
                    )}
                    {r.provider_phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {r.provider_phone}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {r.provider_phone && (
                      <a href={`https://wa.me/55${r.provider_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline" className="rounded-xl">WhatsApp</Button>
                      </a>
                    )}
                    {r.provider_id && (
                      <FavoriteButton
                        providerId={r.provider_id}
                        providerName={r.provider_name}
                        providerData={{ name: r.provider_name, photo_url: null, rating: null, city: r.city, state: r.state }}
                        size="md"
                        variant="outline"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Falar com atendente */}
      <ClientTicketForm 
        clientId={request.client_id}
        clientName={request.client_name}
        clientEmail={user?.email || request.created_by}
      />

      {/* Aguardando animation */}
      {request.status === 'aguardando' && (
        <div className="bg-primary/5 rounded-3xl p-6 text-center border border-primary/20 mb-5">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            <div className="relative w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Wrench className="w-7 h-7 text-primary" />
            </div>
          </div>
          <p className="font-semibold text-foreground">Procurando prestadores próximos...</p>
          <p className="text-sm text-muted-foreground mt-1">Normalmente leva menos de 5 minutos</p>
          {request.estimated_arrival_minutes != null && (
            <div className="mt-4 inline-flex items-center gap-2 bg-primary/10 text-primary font-bold px-4 py-2 rounded-2xl text-sm">
              🚗 Prestador a ~{request.estimated_arrival_minutes} min de você
            </div>
          )}
          {/* Opções do cliente durante a busca */}
          <div className="mt-5 text-left">
            <SearchingProviderActions request={request} onCancel={() => cancelRequest.mutate()} />
          </div>
        </div>
      )}

      {/* Previsão de chegada quando aceito */}
      {request.status === 'aceito' && request.estimated_arrival_minutes != null && (
        <div className="bg-blue-50 border border-blue-200 rounded-3xl p-4 mb-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl">🚗</div>
          <div>
            <p className="font-bold text-blue-800 text-sm">Prestador a ~{request.estimated_arrival_minutes} min de você</p>
            <p className="text-xs text-blue-600">Baseado na localização no momento da aceitação</p>
          </div>
        </div>
      )}





      {/* Chat */}
      {['aceito','a_caminho','em_andamento','concluido'].includes(request.status) && (
        <div id="chat-section" className="mb-5">
          <ServiceChat
            requestId={id}
            senderRole="cliente"
            senderName={request.client_name}
          />
        </div>
      )}

      {/* Preço estimado ou final */}
      {(request.final_price || request.estimated_price || request.client_suggested_price) && (
        <div className="bg-card rounded-3xl p-5 border border-border mb-5 space-y-4">
          {/* Cupom de desconto */}
          <CouponInput
            serviceAmount={request.final_price || request.estimated_price || request.client_suggested_price}
            serviceType={request.service_type}
            providerId={request.provider_id}
            onCouponApplied={(coupon) => setAppliedCoupon(coupon)}
            onCouponRemoved={() => setAppliedCoupon(null)}
          />

          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">
              {request.final_price ? 'Valor do serviço' : 'Valor estimado'}
            </span>
            <span className="text-2xl font-bold text-primary">
              R$ {(request.final_price || request.estimated_price || request.client_suggested_price)?.toFixed(2)}
            </span>
          </div>

          {/* Desconto aplicado */}
          {appliedCoupon && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-800 font-semibold">Desconto:</span>
                <span className="text-green-800 font-bold">-R$ {appliedCoupon.discount_amount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-bold border-t border-green-200 pt-2">
                <span className="text-green-800">Total:</span>
                <span className="text-green-700">R$ {appliedCoupon.final_amount.toFixed(2)}</span>
              </div>
            </div>
          )}
          {request.estimated_price && !request.final_price && (
            <p className="text-xs text-muted-foreground text-center">
              ℹ️ Este é um valor estimado. O valor final será confirmado após o atendimento.
            </p>
          )}
          {/* Payment Status */}
          {request.payment_status && (
            <div className={cn(
              "text-sm p-3 rounded-xl text-center font-semibold",
              request.payment_status === 'paid'
                ? 'bg-green-100 text-green-700'
                : request.payment_status === 'pending'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            )}>
              {request.payment_status === 'paid' && '✓ Pagamento confirmado'}
              {request.payment_status === 'pending' && '⏳ Aguardando pagamento'}
              {request.payment_status === 'expired' && '✕ Sessão de pagamento expirada'}
            </div>
          )}
          {request.status === 'concluido' && request.payment_status !== 'paid' && (
           <div className="space-y-2">
             <Button
               onClick={() => setShowPixPayment(true)}
               className="w-full rounded-2xl bg-primary text-primary-foreground font-semibold h-11"
             >
               🔐 PIX
             </Button>
             <Button
               onClick={() => setShowPayment(true)}
               variant="outline"
               className="w-full rounded-2xl font-semibold h-11"
             >
               💳 Cartão de Crédito
             </Button>
           </div>
          )}
        </div>
      )}

      {/* Avaliação */}
      {request.status === 'concluido' && request.rating_client && (
        <div className="bg-card rounded-3xl p-5 border border-border mb-5 text-center">
          <div className="flex justify-center gap-1 mb-2">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className={cn("w-6 h-6", s <= request.rating_client ? "text-yellow-400 fill-yellow-400" : "text-muted")} />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Obrigado pela avaliação!</p>
        </div>
      )}

      {request.status === 'a_caminho' && (() => {
        // Para serviços agendados, só permite cancelar até 30 min antes do horário
        if (request.modality === 'agendado' && request.scheduled_date && request.scheduled_time) {
          const scheduledDateTime = new Date(`${request.scheduled_date}T${request.scheduled_time}`);
          const minutesUntilStart = (scheduledDateTime - new Date()) / 60000;
          const canCancel = minutesUntilStart > 30;
          return (
            <div>
              <Button
                variant="outline"
                className="w-full rounded-2xl text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => cancelRequest.mutate()}
                disabled={cancelRequest.isPending || !canCancel}
              >
                Cancelar agendamento
              </Button>
              {!canCancel && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  ⚠️ Cancelamentos só são permitidos até 30 minutos antes do horário agendado.
                </p>
              )}
            </div>
          );
        }

        // Para serviços imediatos com prestador a caminho, bloqueia se faltam ≤ 30 min para chegada
        if (['aceito', 'a_caminho'].includes(request.status) && request.estimated_arrival_minutes != null) {
          const canCancel = request.estimated_arrival_minutes > 30;
          return (
            <div className="mt-4">
              <Button
                variant="outline"
                className="w-full rounded-2xl text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => cancelRequest.mutate()}
                disabled={cancelRequest.isPending || !canCancel}
              >
                Cancelar atendimento
              </Button>
              {!canCancel && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  ⚠️ Cancelamento não permitido — o prestador chegará em menos de 30 minutos.
                </p>
              )}
            </div>
          );
        }

        // Serviço imediato ainda aguardando ou aceito sem previsão: cancela livremente
        return (
          <div className="mt-4">
            <Button
              variant="outline"
              className="w-full rounded-2xl text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => cancelRequest.mutate()}
              disabled={cancelRequest.isPending}
            >
              Cancelar pedido
            </Button>
          </div>
        );
      })()}

      {request.status === 'em_espera' && (() => {
        // Mostra prazo de 15 dias para retorno por peça
        const createdAt = request.created_date ? new Date(request.created_date) : null;
        const daysLeft = createdAt ? Math.ceil((createdAt.getTime() + 15 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000)) : null;
        const isPastDeadline = daysLeft != null && daysLeft <= 0;

        return (
          <div className={`rounded-3xl p-5 border-2 mb-5 ${isPastDeadline ? 'bg-red-50 border-red-300' : daysLeft <= 3 ? 'bg-amber-50 border-amber-300' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{isPastDeadline ? '❌' : '⏰'}</span>
              <div className="flex-1">
                <p className={`font-bold ${isPastDeadline ? 'text-red-800' : daysLeft <= 3 ? 'text-amber-800' : 'text-blue-800'}`}>
                  {isPastDeadline ? 'Prazo expirado' : `${daysLeft} dia${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}`}
                </p>
                <p className={`text-xs mt-1 ${isPastDeadline ? 'text-red-700' : daysLeft <= 3 ? 'text-amber-700' : 'text-blue-700'}`}>
                  Cliente tem até 15 dias corridos para comprar a peça e solicitar retorno
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {request.status === 'concluido' && request.provider_id && (
        <div className="space-y-3">
          <Button 
            className="w-full rounded-2xl bg-amber-500 text-white font-semibold h-11 hover:bg-amber-600"
            onClick={() => setShowTipRequest(true)}
          >
            🎁 Gratificar Prestador
          </Button>
          <Button 
            className="w-full rounded-2xl bg-primary text-primary-foreground font-semibold h-11"
            onClick={() => setShowRetorno(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Solicitar Retorno
          </Button>
          <Button 
            variant="outline"
            className="w-full rounded-2xl"
            onClick={() => navigate('/')}
          >
            Voltar ao início
          </Button>
        </div>
      )}

      <LocationTracker
        requestId={id}
        active={['aguardando','aceito','a_caminho','em_andamento'].includes(request?.status)}
      />
      {showRating && <RatingModal requestId={id} onClose={handleRatingClose} />}
      {showRetorno && <RetornoModal request={request} onClose={() => setShowRetorno(false)} />}
      {showSatisfactionSurvey && user && (
        <SatisfactionSurveyModal
          job={request}
          respondentType="cliente"
          respondentId={user.id}
          respondentName={user.full_name}
          onClose={() => {
            setShowSatisfactionSurvey(false);
            setTimeout(() => setShowTipRequest(true), 300);
          }}
        />
      )}
      {showTipRequest && request.provider_id && (
        <TipRequestModal
          request={request}
          provider={{ name: request.provider_name, id: request.provider_id }}
          onClose={() => setShowTipRequest(false)}
          onSuccess={() => {}}
        />
      )}
      {request.final_price && (
        <>
          <PaymentModal
            isOpen={showPayment}
            onClose={() => setShowPayment(false)}
            requestId={id}
            finalPrice={request.final_price}
            serviceName={SERVICE_LABELS[request.service_type] || request.service_type}
          />
          <PixPaymentModal
            isOpen={showPixPayment}
            onClose={() => setShowPixPayment(false)}
            requestId={id}
            finalPrice={request.final_price}
            serviceName={SERVICE_LABELS[request.service_type] || request.service_type}
            onPaymentConfirmed={() => base44.entities.ServiceRequest.filter({ id }).then(list => { if (list[0]) setRequest(list[0]); })}
          />
        </>
      )}
    </div>
  );
}