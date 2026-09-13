import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Calendar, Save, Search, Clock, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { differenceInDays, format } from "date-fns";
import { logAdminAction } from '@/lib/adminLog';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
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

  // Dados para o gráfico: garantia de peça (≤15d) vs garantia (16-90d)
  const chartData = useMemo(() => {
    let peca = 0;
    let garantia = 0;
    inWarranty.forEach(r => {
      const dias = differenceInDays(new Date(), new Date(r.updated_date));
      if (dias <= PRAZO_PECA) peca++;
      else garantia++;
    });
    return [
      { name: 'Garantia de Peça', value: peca, color: '#3b82f6' },
      { name: 'Garantia', value: garantia, color: '#f97316' },
    ];
  }, [inWarranty]);

  const filtered = useMemo(() => {
    if (!search.trim()) return inWarranty;
    const q = search.toLowerCase();
    return inWarranty.filter(r =>
      (r.client_name || '').toLowerCase().includes(q) ||
      (r.provider_name || '').toLowerCase().includes(q) ||
      (r.service_type || '').toLowerCase().includes(q) ||
      (r.service_number || '').toLowerCase().includes(q)
    );
  }, [inWarranty, search]);

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
      logAdminAction({
        action: 'warranty_period_set',
        actorName: adminUser?.full_name || 'Admin',
        actorEmail: adminUser?.email || '',
        entityType: 'ServiceRequest',
        entityId: serviceId,
        entityLabel: req ? `${req.service_type} - ${req.client_name}` : serviceId,
        newValue: `${days} dias`,
      });
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-lg font-bold text-foreground">Garantias Ativas</h2>
          <p className="text-xs text-muted-foreground">Serviços concluídos dentro do prazo de garantia (até 90 dias)</p>
        </div>
      </div>

      {/* Gráfico */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-1/2 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={(entry) => entry.value}
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2 w-full">
              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800">Garantia de Peça</span>
                </div>
                <span className="text-lg font-bold text-blue-700">{chartData[0].value}</span>
              </div>
              <p className="text-[10px] text-muted-foreground pl-2">Serviços concluídos há até 15 dias (direito a retorno por peça)</p>
              <div className="flex items-center justify-between p-2 rounded-lg bg-orange-50 border border-orange-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-semibold text-orange-800">Garantia</span>
                </div>
                <span className="text-lg font-bold text-orange-700">{chartData[1].value}</span>
              </div>
              <p className="text-[10px] text-muted-foreground pl-2">Serviços concluídos entre 16 e 90 dias (apenas retorno em garantia)</p>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted mt-2">
                <span className="text-sm font-semibold text-foreground">Total em garantia</span>
                <span className="text-lg font-bold text-foreground">{inWarranty.length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Busca */}
      <div className="relative">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          placeholder="Buscar por cliente, prestador, serviço ou nº..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-10">Carregando serviços...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">
          {inWarranty.length === 0 ? 'Nenhum serviço em garantia no momento' : 'Nenhum resultado para a busca'}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const dias = req.updated_date ? differenceInDays(new Date(), new Date(req.updated_date)) : 0;
            const warrantyEnd = req.warranty_end_date ? new Date(req.warranty_end_date) : null;
            const expired = warrantyEnd && warrantyEnd < new Date();
            const diasRestantes = warrantyEnd ? differenceInDays(warrantyEnd, new Date()) : null;
            const currentDays = getDays(req.id);
            const isSaving = savingId === req.id;
            const isPeca = dias <= PRAZO_PECA;

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
                            {expired ? 'Garantia expirada' : 'Garantia ativa'}
                          </Badge>
                        ) : (
                          <Badge className="bg-muted text-muted-foreground text-xs border-0">Sem garantia</Badge>
                        )}
                        {isPeca && !expired && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs border-0">
                            <Package className="w-3 h-3 mr-1" />Peça
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