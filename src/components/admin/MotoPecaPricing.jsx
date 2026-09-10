import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Check, X, Bike } from "lucide-react";
import { toast } from "sonner";

export default function MotoPecaPricing() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ exit: '', perKm: '' });

  const { data: config } = useQuery({
    queryKey: ['moto-peca-pricing'],
    queryFn: async () => {
      const list = await base44.entities.ServicePricing.filter({ service_type: 'buscar_peca_moto' });
      return list.find(p => !p.city);
    },
  });

  useEffect(() => {
    if (editing && config) {
      setFormData({
        exit: config.price_min?.toString() || '',
        perKm: config.price_max?.toString() || '',
      });
    } else if (editing && !config) {
      setFormData({ exit: '', perKm: '' });
    }
  }, [editing, config]);

  const saveConfig = useMutation({
    mutationFn: async () => {
      const exit = parseFloat(formData.exit);
      const perKm = parseFloat(formData.perKm);
      if (isNaN(exit) && isNaN(perKm)) throw new Error('Preencha ao menos um valor');

      const data = {
        service_type: 'buscar_peca_moto',
        price_min: isNaN(exit) ? 0 : exit,
        price_max: isNaN(perKm) ? 0 : perKm,
        note: 'Moto Peça — taxa de saída + preço por km',
      };

      if (config?.id) {
        await base44.entities.ServicePricing.update(config.id, data).catch(() =>
          base44.entities.ServicePricing.create(data)
        );
      } else {
        await base44.entities.ServicePricing.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moto-peca-pricing'] });
      toast.success('Preços do Moto Peça atualizados!');
      setEditing(false);
    },
    onError: (error) => {
      toast.error('Erro ao salvar: ' + (error.message || 'Tente novamente'));
    },
  });

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
          <Bike className="w-5 h-5 text-amber-600" /> Preços do Moto Peça
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure a taxa de saída e o preço por km para o serviço de busca de peça por moto.
          A distância cobre o trajeto cliente → loja → cliente (ida e volta).
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          {editing ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Taxa Saída (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 25"
                    value={formData.exit}
                    onChange={(e) => setFormData(prev => ({ ...prev, exit: e.target.value }))}
                    className="rounded-lg text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Cobre os primeiros km</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Preço/km (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 1.50"
                    value={formData.perKm}
                    onChange={(e) => setFormData(prev => ({ ...prev, perKm: e.target.value }))}
                    className="rounded-lg text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Km excedentes além da saída</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => saveConfig.mutate()}
                  disabled={saveConfig.isPending}
                  className="flex-1 rounded-lg bg-green-600 text-white hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" /> Salvar
                </Button>
                <Button
                  onClick={() => setEditing(false)}
                  variant="outline"
                  className="flex-1 rounded-lg"
                >
                  <X className="w-4 h-4 mr-2" /> Cancelar
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="border border-border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Bike className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">Moto Peça</p>
                    {config ? (
                      <p className="text-xs text-green-600">
                        R$ {config.price_min?.toFixed(2)} saída + R$ {config.price_max?.toFixed(2)}/km
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Não configurado</p>
                    )}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setEditing(true)}
                className="w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Pencil className="w-4 h-4 mr-2" /> Editar Preços
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}