import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Calendar, Save, Search, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { differenceInDays, format } from "date-fns";
import { logAdminAction } from '@/lib/adminLog';

const SERVICE_LABELS = {
  eletrica: "Elétrica", hidraulica: "Hidráulica", pintura: "Pintura",
  reparo_geral: "Reparo Geral", montagem: "Montagem", alvenaria: "Alvenaria",
  fechadura: "Fechadura", ar_condicionado: "Ar Condicionado",
  limpeza_caixa_dagua: "Limpeza Caixa D'água", desentupimento: "Desentupimento",
  outros: "Outros",
};

export default function WarrantyAdmin({ adminUser }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [daysPerService, setDaysPerService] = useState({});
  const [savingId, setSavingId] = useState(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['warranty-requests'],
    queryFn: () => base44.entities.ServiceRequest.filter({ status: 'concluido' }, '-updated_date', 200),
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return requests;
    const q = search.toLowerCase();
    return requests.filter(r =>
      (r.client_name || '').toLowerCase().includes(q) ||
      (r.provider_name || '').toLowerCase().includes(q) ||
      (r.service_type || '').toLowerCase().includes(q) ||
      (r.service_number || '').toLowerCase().includes(q)
    );
  }, [requests, search]);

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
          <h2 className="text-lg font-bold text-foreground">Garantia por Serviço</h2>
          <p className="text-xs text-muted-foreground">Defina quantos dias de garantia cada serviço concluído terá</p>
        </div>
      </div>

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
        <p className="text-center text-muted-foreground py-10">Nenhum serviço concluído encontrado</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const dias = req.updated_date ? differenceInDays(new Date(), new Date(req.updated_date)) : 0;
            const warrantyEnd = req.warranty_end_date ? new Date(req.warranty_end_date) : null;
            const expired = warrantyEnd && warrantyEnd < new Date();
            const diasRestantes = warrantyEnd ? differenceInDays(warrantyEnd, new Date()) : null;
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
                            {expired ? 'Garantia expirada' : `Garantia ativa`}
                          </Badge>
                        ) : (
                          <Badge className="bg-muted text-muted-foreground text-xs border-0">Sem garantia</Badge>
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
                      {[30, 60, 90, 180].map(d => (
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