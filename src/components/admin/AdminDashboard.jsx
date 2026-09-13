import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, CheckCircle2, Clock, Users, Star, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const SERVICE_LABELS = {
  eletrica: "Elétrica", hidraulica: "Hidráulica", pintura: "Pintura",
  reparo_geral: "Reparo Geral", montagem: "Montagem", alvenaria: "Alvenaria",
  fechadura: "Fechadura", ar_condicionado: "Ar Condicionado", outros: "Outros",
  desentupimento: "Desentupimento", reboque: "Reboque", troca_pneu: "Troca de Pneu",
  recarga_bateria: "Recarga de Bateria", conserto_pneu: "Conserto de Pneu",
  veiculo_outros: "Veículo Outros", caca_vazamento: "Caça Vazamento",
  checkup: "Check-up", portao_eletronico: "Portão Eletrônico", interfone: "Interfone",
  rejunte: "Rejunte", pressurizador: "Pressurizador",
  valvula_transferidora_pressao: "Válvula Transferidora",
  alarme_cerca_eletrica: "Alarme / Cerca Elétrica", concertina: "Concertina",
  camera_cftv: "Câmera / CFTV", instalacao_suporte_tv: "Suporte TV",
  fixacoes_diversas: "Fixações Diversas", chaveiro_veiculo: "Chaveiro Veículo",
  buscar_peca_moto: "Buscar Peça Moto",
  limpeza_caixa_dagua: "Limpeza Caixa d'Água", limpeza_calha: "Limpeza de Calha",
  substituicao_telha: "Substituição de Telha", limpeza_telhado: "Limpeza de Telhado",
  instalacao_coifa_parede: "Coifa de Parede", instalacao_coifa_ilha: "Coifa Ilha",
  conversao_vaso_coplado: "Conversão Vaso Coplado",
  instalacao_vaso_monobloco: "Vaso Monobloco", reparo_forro_gesso: "Reparo Forro Gesso",
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

export default function AdminDashboard({ stats, requests, providers }) {
  const cards = [
    { label: "Total", value: stats.total, icon: Briefcase, color: "text-foreground" },
    { label: "Concluídos", value: stats.completed, icon: CheckCircle2, color: "text-green-400" },
    { label: "Ativos", value: stats.active, icon: Clock, color: "text-yellow-400" },
    { label: "Online", value: stats.providers_online, icon: Users, color: "text-primary" },
    { label: "Prestadores", value: stats.providers_approved, icon: Star, color: "text-blue-400" },
    { label: "Receita", value: `R$ ${Math.floor(stats.revenue).toLocaleString('pt-BR')}`, icon: TrendingUp, color: "text-primary" },
  ];

  // Category breakdown — sempre mostra as categorias principais mesmo sem chamados
  const MAIN_CATEGORIES = ['Elétrica', 'Hidráulica', 'Fechadura', 'Reboque'];
  const categoryCounts = {};
  MAIN_CATEGORIES.forEach(c => { categoryCounts[c] = 0; });
  requests.forEach(r => {
    if (r.status === 'cancelado') return;
    const label = SERVICE_LABELS[r.service_type] || r.service_type || 'Outros';
    categoryCounts[label] = (categoryCounts[label] || 0) + 1;
  });
  const categoryEntries = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(...categoryEntries.map(([, v]) => v), 1);

  // Recent activity — last 8 requests + online providers
  const recentRequests = [...requests]
    .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(card => (
          <Card key={card.label} className="bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <card.icon className={cn("w-4 h-4", card.color)} />
                <span className="text-xs text-muted-foreground">{card.label}</span>
              </div>
              <p className={cn("text-2xl font-bold", card.color)}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lower section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Serviços por categoria */}
        <Card className="bg-card">
          <CardContent className="p-5">
            <h3 className="font-semibold text-foreground mb-4">Serviços por Categoria</h3>
            <div className="space-y-4">
              {categoryEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum serviço registrado</p>
              ) : categoryEntries.map(([label, count]) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">{label}</span>
                    <span className="text-muted-foreground font-medium">{count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Atividade recente */}
        <Card className="bg-card">
          <CardContent className="p-5">
            <h3 className="font-semibold text-foreground mb-4">Atividade Recente</h3>
            <div className="space-y-3">
              {recentRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
              ) : recentRequests.map(req => {
                const label = SERVICE_LABELS[req.service_type] || req.service_type || 'Serviço';
                const isConcluido = req.status === 'concluido';
                const isNovo = req.status === 'aguardando';
                return (
                  <div key={req.id} className="flex items-start gap-3 text-sm">
                    <span className={cn(
                      "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                      isConcluido ? "bg-green-400" : isNovo ? "bg-yellow-400" : "bg-primary"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate">
                        {isConcluido ? 'Chamado concluído' : isNovo ? 'Novo chamado criado' : 'Chamado atualizado'} — {label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {timeAgo(req.created_date)}
                        {req.client_name ? ` · ${req.client_name}` : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}