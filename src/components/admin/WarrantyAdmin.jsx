import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Calendar, Search, Clock, Package, AlertTriangle, TrendingUp, Wrench, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { differenceInDays, format } from "date-fns";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const SERVICE_LABELS = {
  eletrica: "Elétrica", hidraulica: "Hidráulica", pintura: "Pintura",
  reparo_geral: "Reparo Geral", montagem: "Montagem", alvenaria: "Alvenaria",
  fechadura: "Fechadura", ar_condicionado: "Ar Condicionado",
  limpeza_caixa_dagua: "Limpeza Caixa D'água", desentupimento: "Desentupimento",
  outros: "Outros",
};

const PRAZO_PECA = 15;
const PRAZO_GARANTIA = 90;

export default function WarrantyAdmin({ adminUser }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | peca | garantia | expiring
  const [daysPerService, setDaysPerService] = useState({});
  const [savingId, setSavingId] = useState(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['warranty-requests'],
    queryFn: () => base44.entities.ServiceRequest.filter({ status: 'concluido' }, '-updated_date', 200),
  });

  // Apenas OS dentro do prazo de garantia (≤90 dias da conclusão)
  const inWarranty = useMemo(() => {
    const now = new Date();
    return requests.filter(r => {
      if (!r.updated_date) return false;
      const dias = differenceInDays(now, new Date(r.updated_date));
      return dias <= PRAZO_GARANTIA;
    });
  }, [requests]);

  // Classifica cada OS em peça (≤15d) ou garantia (16-90d)
  const classified = useMemo(() => {
    return inWarranty.map(r => {
      const dias = differenceInDays(new Date(), new Date(r.updated_date));
      return { ...r, _dias: dias, _isPeca: dias <= PRAZO_PECA };
    });
  }, [inWarranty]);

  const pecaCount = classified.filter(r => r._isPeca).length;
  const garantiaCount = classified.filter(r => !r._isPeca).length;
  const expiringSoon = classified.filter(r => {
    const warrantyEnd = r.warranty_end_date ? new Date(r.warranty_end_date) : null;
    if (!warrantyEnd) return false;
    const restantes = differenceInDays(warrantyEnd, new Date());
    return restantes >= 0 && restantes <= 7;
  }).length;

  // Dados para o gráfico de pizza
  const pieData = [
    { name: 'Garantia de Peça', value: pecaCount, color: '#3b82f6' },
    { name: 'Garantia de Serviço', value: garantiaCount, color: '#f97316' },
  ];

  // Dados para o gráfico de barras: por tipo de serviço, split peça vs garantia
  const barData = useMemo(() => {
    const map = {};
    classified.forEach(r => {
      const label = SERVICE_LABELS[r.service_type] || r.service_type || 'Outros';
      if (!map[label]) map[label] = { name: label, peca: 0, garantia: 0 };
      if (r._isPeca) map[label].peca++;
      else map[label].garantia++;
    });
    return Object.values(map).sort((a, b) => (b.peca + b.garantia) - (a.peca + a.garantia));
  }, [classified]);

  // Filtro + busca
  const filtered = useMemo(() => {
    let list = classified;
    if (filter === 'peca') list = list.filter(r => r._isPeca);
    else if (filter === 'garantia') list = list.filter(r => !r._isPeca);
    else if (filter === 'expiring') {
      list = list.filter(r => {
        const we = r.warranty_end_date ? new Date(r.warranty_end_date) : null;
        if (!we) return false;
        const restantes = differenceInDays(we, new Date());
        return restantes >= 0 && restantes <= 7;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        (r.client_name || '').toLowerCase().includes(q) ||
        (r.provider_name || '').toLowerCase().includes(q) ||
        (r.service_type || '').toLowerCase().includes(q) ||
        (r.service_number || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [classified, filter, search]);

  const setWarranty = useMutation({
    mutationFn: async ({ serviceId, days }) => {
      setSavingId(serviceId);
      const res = await fetch('/functions/setWarrantyPeriod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceRequestId: serviceId, days, force: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao definir garantia');
      return data;
    },
    onSuccess: (data, { serviceId, days }) => {
      queryClient.invalidateQueries({ queryKey: ['warranty-requests'] });
      toast.success(`Garantia de ${days} dias definida com sucesso`);
      setDaysPerService(prev => { const c = { ...prev }; delete c[serviceId]; return c; });
      const req = requests.find(r => r.id === serviceId);
      if (adminUser) {
        import('@/lib/adminLog').then(({ logAdminAction }) =>
          logAdminAction({
            action: 'warranty_period_set',
            actorName: adminUser?.full_name || 'Admin',
            actorEmail: adminUser?.email || '',
            entityType: 'ServiceRequest',
            entityId: serviceId,
            entityLabel: req ? `${req.service_type} - ${req.client_name}` : serviceId,
            newValue: `${days} dias`,
          })
        );
      }
    },
    onError: (err) => toast.error(err.message),
    onSettled: () => setSavingId(null),
  });

  const getDays = (serviceId) => {
    if (daysPerService[serviceId] !== undefined) return daysPerService[serviceId];
    const req = requests.find(r => r.id === serviceId);
    if (req?.warranty_end_date && req?.updated_date) {
      return differenceInDays(new Date(req.warranty_end_date), new Date(req.updated_date));
    }
    return 90;
  };

  const stats = [
    { label: 'Total em Garantia', value: classified.length, icon: ShieldCheck, color: 'text-foreground', bg: 'bg-muted' },
    { label: 'Garantia de Peça', value: pecaCount, icon: Package, color: 'text-blue-700', bg: 'bg-blue-50 border border-blue-200', sub: '≤ 15 dias' },
    { label: 'Garantia de Serviço', value: garantiaCount, icon: Wrench, color: 'text-orange-700', bg: 'bg-orange-50 border border-orange-200', sub: '16–90 dias' },
    { label: 'Expirando em ≤7d', value: expiringSoon, icon: AlertTriangle, color: 'text-red-700', bg: 'bg-red-50 border border-red-200', sub: 'Urgente' },
  ];

  const filterTabs = [
    { id: 'all', label: 'Todas' },
    { id: 'peca', label: 'Peça' },
    { id: 'garantia', label: 'Serviço' },
    { id: 'expiring', label: 'Expirando' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-lg font-bold text-foreground">Dashboard de Garantias</h2>
          <p className="text-xs text-muted-foreground">Ordens de serviço finalizadas dentro do prazo de garantia</p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2 text-xs text-primary">
        <ShieldCheck className="w-4 h-4 flex-shrink-0" />
        <span>O tempo de garantia por categoria é definido na aba <strong>Preços → Precificação por Categoria</strong>.</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={cn("border-0", s.bg)}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0">
                  <Icon className={cn("w-5 h-5", s.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide truncate">{s.label}</p>
                  <p className={cn("text-2xl font-black leading-none", s.color)}>{s.value}</p>
                  {s.sub && <p className="text-[9px] text-muted-foreground mt-0.5">{s.sub}</p>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pizza */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              Distribuição por Tipo
            </h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Barras por tipo de serviço */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1">
              <Wrench className="w-4 h-4 text-primary" />
              Por Tipo de Serviço
            </h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="peca" name="Peça" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="garantia" name="Serviço" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros + Busca */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex gap-1 flex-wrap">
          {filterTabs.map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                filter === t.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40"
              )}
            >
              {t.label}
              {t.id === 'peca' && pecaCount > 0 && ` (${pecaCount})`}
              {t.id === 'garantia' && garantiaCount > 0 && ` (${garantiaCount})`}
              {t.id === 'expiring' && expiringSoon > 0 && ` (${expiringSoon})`}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por cliente, prestador, serviço ou nº..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Lista de OS */}
      {isLoading ? (
        <p className="text-center text-muted-foreground py-10">Carregando serviços...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">
          {classified.length === 0 ? 'Nenhum serviço em garantia no momento' : 'Nenhum resultado para o filtro selecionado'}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const dias = req._dias;
            const warrantyEnd = req.warranty_end_date ? new Date(req.warranty_end_date) : null;
            const expired = warrantyEnd && warrantyEnd < new Date();
            const diasRestantes = warrantyEnd ? differenceInDays(warrantyEnd, new Date()) : null;
            const isPeca = req._isPeca;
            const currentDays = getDays(req.id);
            const isSaving = savingId === req.id;

            return (
              <Card key={req.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">
                          {SERVICE_LABELS[req.service_type] || req.service_type}
                        </span>
                        {req.service_number && (
                          <span className="text-xs font-mono text-primary/70 bg-primary/10 px-2 py-0.5 rounded">
                            {req.service_number}
                          </span>
                        )}
                        {warrantyEnd ? (
                          <Badge className={cn(
                            "text-xs border-0",
                            expired ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                          )}>
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            {expired ? 'Expirada' : 'Ativa'}
                          </Badge>
                        ) : (
                          <Badge className="bg-muted text-muted-foreground text-xs border-0">Sem garantia</Badge>
                        )}
                        {isPeca && !expired && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs border-0">
                            <Package className="w-3 h-3 mr-1" />Peça
                          </Badge>
                        )}
                        {!isPeca && !expired && (
                          <Badge className="bg-orange-100 text-orange-800 text-xs border-0">
                            <Wrench className="w-3 h-3 mr-1" />Serviço
                          </Badge>
                        )}
                        {diasRestantes !== null && diasRestantes >= 0 && diasRestantes <= 7 && !expired && (
                          <Badge className="bg-red-100 text-red-800 text-xs border-0 animate-pulse">
                            <AlertTriangle className="w-3 h-3 mr-1" />Expira em {diasRestantes}d
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        👤 {req.client_name} · 🔧 {req.provider_name || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Concluído há {dias} dia{dias !== 1 ? 's' : ''}
                        {warrantyEnd && (
                          <> · <Calendar className="w-3 h-3 inline mr-1" />Vence em {format(warrantyEnd, 'dd/MM/yyyy')}
                          {diasRestantes !== null && !expired && ` (${diasRestantes}d restantes)`}
                          {expired && ` (expirou há ${Math.abs(diasRestantes)}d)`}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Editor de dias de garantia */}
                  <div className="flex items-end gap-2 pt-2 border-t border-border">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground block mb-1">
                        Dias de garantia
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={3650}
                        value={currentDays}
                        onChange={e => setDaysPerService(prev => ({ ...prev, [req.id]: e.target.value }))}
                        className="h-9"
                      />
                    </div>
                    <div className="flex gap-1">
                      {[15, 30, 60, 90, 180].map(d => (
                        <button
                          key={d}
                          onClick={() => setDaysPerService(prev => ({ ...prev, [req.id]: d }))}
                          className={cn(
                            "px-2 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                            Number(currentDays) === d
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card text-muted-foreground border-border hover:border-primary/40"
                          )}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      disabled={isSaving || !currentDays || Number(currentDays) <= 0}
                      onClick={() => setWarranty.mutate({ serviceId: req.id, days: Number(currentDays) })}
                    >
                      <Save className="w-3.5 h-3.5 mr-1" />
                      {isSaving ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}