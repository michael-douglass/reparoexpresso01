import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle2, ThumbsUp, Sparkles, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from 'sonner';
import ReviewPhotoUpload from './ReviewPhotoUpload';

const RATING_LABELS = {
  1: "Muito ruim 😞",
  2: "Ruim 😕",
  3: "Regular 😐",
  4: "Bom 😊",
  5: "Excelente! 🤩",
};

// Pontos por tipo de avaliação
const PONTOS_AVALIACAO = {
  basica: 10,      // Apenas estrelas
  com_texto: 25,   // Estrelas + comentário
  detalhada: 50,   // Estrelas + comentário + fotos (Avaliador de Elite)
};

export default function RatingModal({ requestId, onClose }) {
  const [overallRating, setOverallRating] = useState(5);
  const [punctualityRating, setPunctualityRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [behaviorRating, setBehaviorRating] = useState(5);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);
  const [done, setDone] = useState(false);
  const [pontosGanhos, setPontosGanhos] = useState(0);
  const [isDetailed, setIsDetailed] = useState(false);
  const queryClient = useQueryClient();

  const { data: request } = useQuery({
    queryKey: ['service-request', requestId],
    queryFn: async () => {
      const list = await base44.entities.ServiceRequest.filter({ id: requestId });
      return list[0];
    },
  });

  // Determinar tipo de avaliação e pontos
  const getTipoAvaliacao = () => {
    if (comment.trim().length >= 10 && photos.length > 0) return 'detalhada';
    if (comment.trim().length >= 10) return 'com_texto';
    return 'basica';
  };

  const submitRating = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      const tipo = getTipoAvaliacao();
      const isDetailedReview = tipo === 'detalhada';
      const pontos = PONTOS_AVALIACAO[tipo];

      // Criar registro de avaliação detalhada
      await base44.entities.Review.create({
        professional_id: request?.provider_id,
        provider_id: request?.provider_id,
        service_request_id: requestId,
        client_id: user?.id,
        client_name: request?.client_name,
        overall_rating: overallRating,
        punctuality_rating: punctualityRating,
        quality_rating: qualityRating,
        behavior_rating: behaviorRating,
        comment: comment,
        photos: photos,
        is_detailed: isDetailedReview,
        service_description: request?.service_type,
      });

      // Atualizar ServiceRequest com nota geral
      await base44.entities.ServiceRequest.update(requestId, {
        rating_client: overallRating,
        rating_comment: comment,
      });

      // Conceder pontos de fidelidade
      if (user?.id) {
        try {
          // Buscar ou criar registro de CustomerLoyalty
          const existing = await base44.entities.CustomerLoyalty.filter({ client_id: user.id });
          let loyalty = existing[0];

          if (loyalty) {
            const newTotal = (loyalty.total_points || 0) + pontos;
            const newAvailable = (loyalty.available_points || 0) + pontos;
            await base44.entities.CustomerLoyalty.update(loyalty.id, {
              total_points: newTotal,
              available_points: newAvailable,
            });
          } else {
            loyalty = await base44.entities.CustomerLoyalty.create({
              client_id: user.id,
              client_email: user.email,
              total_points: pontos,
              available_points: pontos,
              total_services: 1,
              tier: 'bronze',
            });
          }

          // Registrar transação de pontos
          await base44.entities.LoyaltyTransaction.create({
            client_id: user.id,
            type: 'earned',
            points: pontos,
            description: isDetailedReview
              ? 'Avaliação detalhada com fotos (Avaliador de Elite)'
              : tipo === 'com_texto'
                ? 'Avaliação com comentário'
                : 'Avaliação do serviço',
            request_id: requestId,
            reference_type: 'service_completion',
            balance_after: (loyalty?.available_points || 0) + pontos,
          });

          // Verificar medalha "Avaliador de Elite" (3+ avaliações detalhadas)
          if (isDetailedReview) {
            const allReviews = await base44.entities.Review.filter({ client_id: user.id });
            const detailedCount = allReviews.filter(r => r.is_detailed).length;
            if (detailedCount >= 3) {
              // Verificar se já tem a conquista
              const existingAchievements = await base44.entities.ProviderAchievement.filter({
                provider_id: user.id,
                achievement_id: 'avaliador_elite',
              });
              if (existingAchievements.length === 0) {
                await base44.entities.ProviderAchievement.create({
                  provider_id: user.id,
                  achievement_id: 'avaliador_elite',
                  progress: detailedCount,
                  unlocked: true,
                  unlocked_at: new Date().toISOString(),
                });
                toast.success('🏆 Medalha desbloqueada: Avaliador de Elite!');
              }
            }
          }

          setPontosGanhos(pontos);
          setIsDetailed(isDetailedReview);
        } catch (err) {
          console.error('Erro ao conceder pontos:', err);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-request', requestId] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['customer-loyalty'] });
      setDone(true);
      setTimeout(() => onClose(true), 2500);
    },
  });

  const tipoAtual = getTipoAvaliacao();
  const pontosAtuais = PONTOS_AVALIACAO[tipoAtual];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", damping: 25, stiffness: 400 }}
        className="bg-card rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div key="form" exit={{ opacity: 0 }} className="p-6 overflow-y-auto flex-1">
              {/* Header */}
              <div className="text-center mb-6">
                {request?.provider_name && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring" }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-3"
                  >
                    <span className="text-3xl font-bold text-primary">{request.provider_name.charAt(0)}</span>
                  </motion.div>
                )}
                <h2 className="text-2xl font-bold text-foreground">Serviço concluído! 🎉</h2>
                <p className="text-sm text-muted-foreground mt-2">Como foi a experiência com o prestador?</p>
                {request?.provider_name && (
                  <p className="text-sm font-semibold text-primary mt-1">
                    {request.provider_name}
                  </p>
                )}
              </div>

              {/* Nota Geral */}
              <div className="mb-5">
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((s, idx) => (
                    <motion.button
                      key={s}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setOverallRating(s)}
                      className="focus:outline-none cursor-pointer"
                    >
                      <Star className={cn(
                        "w-10 h-10 transition-all duration-150",
                        s <= overallRating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-muted-foreground/30"
                      )} />
                    </motion.button>
                  ))}
                </div>
                <motion.p
                  key={overallRating}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-sm font-bold text-primary mt-2"
                >
                  {RATING_LABELS[overallRating]}
                </motion.p>
              </div>

              {/* Critérios específicos */}
              <div className="space-y-3 mb-4 pb-4 border-b border-border">
                {[
                  { key: 'punctuality', label: '⏰ Pontualidade', rating: punctualityRating, setRating: setPunctualityRating },
                  { key: 'quality', label: '✨ Qualidade do Trabalho', rating: qualityRating, setRating: setQualityRating },
                  { key: 'behavior', label: '😊 Comportamento', rating: behaviorRating, setRating: setBehaviorRating },
                ].map(criterion => (
                  <div key={criterion.key} className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground font-semibold">{criterion.label}</p>
                    <div className="flex gap-1 items-center">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} onClick={() => criterion.setRating(s)} className="focus:outline-none">
                          <Star className={cn("w-5 h-5 transition-all", s <= criterion.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/20")} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Comentário */}
              <div className="mb-4">
                <Textarea
                  placeholder="Deixe um comentário detalhado (mín. 10 caracteres para pontos extras)..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  className="rounded-2xl min-h-[60px] resize-none"
                  maxLength={300}
                />
                {comment.trim().length >= 10 && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> +15 pts por comentário!
                  </p>
                )}
              </div>

              {/* Upload de Fotos */}
              <div className="mb-4">
                <ReviewPhotoUpload photos={photos} onPhotosChange={setPhotos} max={4} />
                {photos.length > 0 && comment.trim().length >= 10 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-2.5 flex items-center gap-2"
                  >
                    <Award className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <p className="text-xs text-amber-700 font-semibold">
                      Avaliação Detalhada! +50 pts e progresso para a medalha "Avaliador de Elite" 🏆
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Indicador de pontos */}
              <div className="bg-primary/5 rounded-xl p-3 mb-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Pontos que você ganhará:</p>
                <p className="text-lg font-bold text-primary">+{pontosAtuais} pts</p>
              </div>

              <Button
                className="w-full rounded-2xl bg-primary text-primary-foreground font-bold h-12"
                onClick={() => submitRating.mutate()}
                disabled={submitRating.isPending}
              >
                {submitRating.isPending ? "Enviando..." : "Enviar avaliação"}
              </Button>

            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Avaliação enviada!</h2>
              <p className="text-sm text-muted-foreground mb-2">
                Obrigado pelo feedback. Isso ajuda a manter a qualidade dos nossos prestadores.
              </p>
              <div className="flex justify-center gap-1 mb-4">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={cn("w-6 h-6", s <= overallRating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30")} />
                ))}
              </div>

              {/* Pontos ganhos */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 rounded-2xl p-4 mb-3"
              >
                <p className="text-sm font-bold text-primary flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  +{pontosGanhos} pontos de fidelidade!
                </p>
              </motion.div>

              {/* Medalha de Avaliador de Elite */}
              {isDetailed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-300 rounded-2xl p-4 mb-4"
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-2xl">🏆</span>
                    <p className="text-sm font-bold text-amber-700">Avaliador de Elite</p>
                  </div>
                  <p className="text-xs text-amber-600">
                    Avaliação detalhada registrada! Faça 3 avaliações com fotos para desbloquear a medalha especial no seu perfil.
                  </p>
                </motion.div>
              )}

              {comment && (
                <p className="text-sm text-muted-foreground mb-4 italic">"{comment}"</p>
              )}
              <Button className="w-full rounded-2xl bg-primary text-primary-foreground font-bold" onClick={onClose}>
                <ThumbsUp className="w-4 h-4 mr-2" /> Fechar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}