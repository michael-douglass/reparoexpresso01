import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ShieldCheck, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function MaterialExtraList({ service, onUpdate }) {
  const [items, setItems] = useState([]);
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [sending, setSending] = useState(false);

  // Verifica se já há orçamento extra pendente (via notificação)
  const [hasPending, setHasPending] = useState(false);
  React.useEffect(() => {
    if (!service?.id) return;
    base44.entities.ClientNotification.filter(
      { service_id: service.id, type: 'extra_charges_pending', is_read: false },
      '-created_date', 1
    ).then(notifs => setHasPending(!!notifs[0])).catch(() => {});
  }, [service?.id, onUpdate]);

  const addItem = () => {
    if (!desc.trim() || !price) return;
    setItems(prev => [...prev, { id: Date.now(), description: desc.trim(), price: parseFloat(price) }]);
    setDesc('');
    setPrice('');
  };

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const total = items.reduce((sum, i) => sum + i.price, 0);
  const originalPrice = service?.final_price || service?.estimated_price || 0;
  const newTotal = originalPrice + total;

  const sendApproval = async () => {
    if (items.length === 0) return;
    setSending(true);
    try {
      await base44.functions.invoke('sendExtraChargesRequest', {
        service_id: service.id,
        provider_id: service.provider_id,
        provider_name: service.provider_name,
        client_name: service.client_name,
        original_price: originalPrice,
        material_total: total,
        labor_total: 0,
        extra_charges_total: total,
        new_total: newTotal,
        items: items.map(i => ({ description: i.description, quantity: 1, value: i.price, photos: [] })),
        labor: null,
        photos: [],
      });
      toast.success('Orçamento extra enviado para o cliente!');
      setItems([]);
      setHasPending(true);
      onUpdate?.();
    } catch (err) {
      toast.error('Erro ao enviar orçamento. Verifique seu plano.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
        <Package className="w-4 h-4" /> Material extra
      </h3>

      {hasPending && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-amber-600 animate-pulse" />
          <p className="text-xs font-semibold text-amber-800">Aguardando aprovação do cliente...</p>
        </div>
      )}

      {/* Lista de itens adicionados */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl p-3 border border-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{item.description}</p>
                <p className="text-xs text-muted-foreground">R$ {item.price.toFixed(2)}</p>
              </div>
              <button onClick={() => removeItem(item.id)} className="text-red-500 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulário inline para adicionar */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Ex: Chuveiro Lorenzetti"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          className="flex-1 rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="R$"
          value={price}
          onChange={e => setPrice(e.target.value)}
          className="w-20 rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <Button size="icon" onClick={addItem} disabled={!desc.trim() || !price} className="rounded-xl flex-shrink-0">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Botão Aprovar orçamento extra */}
      {items.length > 0 && !hasPending && (
        <Button
          onClick={sendApproval}
          disabled={sending}
          className="w-full rounded-2xl h-12 bg-[#EF9435] hover:bg-[#d8821f] text-white font-bold text-sm gap-2"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          Aprovar orçamento extra R$ {total.toFixed(2)}
        </Button>
      )}
    </div>
  );
}