import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Wallet as WalletIcon, Clock, Gift, ArrowDownCircle, ArrowUpCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const formatCurrency = (v) => `R$ ${(v || 0).toFixed(2)}`;

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export default function ProviderFinancialPanel({ providerId, providerName }) {
  // Busca a carteira do prestador
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['provider-wallet', providerId],
    queryFn: async () => {
      const list = await base44.entities.Wallet.filter({
        owner_id: providerId,
        owner_type: 'prestador',
      });
      return list[0] || null;
    },
    enabled: !!providerId,
  });

  // Busca transações de bônus e cashback
  const { data: bonusTransactions = [], isLoading: bonusLoading } = useQuery({
    queryKey: ['provider-bonus-history', providerId],
    queryFn: async () => {
      const all = await base44.entities.WalletTransaction.filter({
        owner_id: providerId,
        owner_type: 'prestador',
      }, '-created_date', 200);
      return all.filter(t => ['bonus', 'cashback'].includes(t.type));
    },
    enabled: !!providerId,
  });

  // Busca todos os serviços concluídos para calcular total ganho real
  const { data: completedServices = [] } = useQuery({
    queryKey: ['provider-completed-services-financial', providerId],
    queryFn: () => base44.entities.ServiceRequest.filter({
      provider_id: providerId,
      status: 'concluido',
    }, '-created_date', 200),
    enabled: !!providerId,
  });

  // Busca preços para calcular repasse
  const { data: pricings = [] } = useQuery({
    queryKey: ['service-pricings-financial'],
    queryFn: () => base44.entities.ServicePricing.list(),
  });

  const totalEarned = useMemo(() => {
    if (wallet?.total_earned) return wallet.total_earned;
    // Fallback: calcula a partir dos serviços concluídos
    return completedServices.reduce((sum, service) => {
      const pricing = pricings.find(p => p.service_type === service.service_type);
      let earning = 0;
      if (pricing?.repasse_value) {
        earning = pricing.repasse_value;
      } else if (pricing?.repasse_percent && service.final_price) {
        earning = (service.final_price * pricing.repasse_percent) / 100;
      } else if (service.final_price) {
        earning = service.final_price * 0.7;
      }
      return sum + earning;
    }, 0);
  }, [wallet, completedServices, pricings]);

  const availableBalance = wallet?.balance || 0;
  const pendingBalance = wallet?.pending_balance || 0;
  const totalWithdrawn = wallet?.total_withdrawn || 0;
  const totalBonus = bonusTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  const isLoading = walletLoading || bonusLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Ganho */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Total Ganho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{formatCurrency(totalEarned)}</p>
              <p className="text-xs text-muted-foreground mt-1">{completedServices.length} serviços concluídos</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Saldo Disponível */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="bg-gradient-to-br from-green-50 to-green-50/50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-green-900 flex items-center gap-2">
                <WalletIcon className="w-4 h-4 text-green-600" /> Saldo Disponível
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(availableBalance)}</p>
              <p className="text-xs text-green-700 mt-1">Pronto para saque via PIX</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Saldo Pendente */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-50/50 border-yellow-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-yellow-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" /> Saldo Pendente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">{formatCurrency(pendingBalance)}</p>
              <p className="text-xs text-yellow-700 mt-1">Aguardando liberação</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Resumo secundário */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <ArrowUpCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Total Sacado</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(totalWithdrawn)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Gift className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Total em Bônus</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(totalBonus)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Bônus */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Histórico de Bônus Recebidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bonusTransactions.length === 0 ? (
            <div className="py-8 text-center">
              <Gift className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum bônus recebido ainda.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Complete serviços e suba de nível para receber bônus!
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {bonusTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <ArrowDownCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {tx.description || (tx.type === 'cashback' ? 'Cashback de serviço' : 'Bônus')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(tx.created_date)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-green-600">
                      +{formatCurrency(tx.amount)}
                    </p>
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      tx.status === 'completed' && "bg-green-100 text-green-700",
                      tx.status === 'pending' && "bg-yellow-100 text-yellow-700",
                      tx.status === 'failed' && "bg-red-100 text-red-700",
                    )}>
                      {tx.status === 'completed' && 'Confirmado'}
                      {tx.status === 'pending' && 'Pendente'}
                      {tx.status === 'failed' && 'Falhou'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}