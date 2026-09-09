import React, { useState } from 'react';
import { Bike, MapPin, Store, DollarSign, Camera, X, Loader2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';

export default function BuscarPecaMotoModal({ isOpen, onSelect, onCancel }) {
  const [pecas, setPecas] = useState('');
  const [loja, setLoja] = useState('');
  const [lojaOutra, setLojaOutra] = useState(false);
  const [valorEstimado, setValorEstimado] = useState('');
  const [fotos, setFotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const lojasSugeridas = [
    'Loja mais próxima (motoboy escolhe)',
    'Loja específica (informar endereço)',
  ];

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const urls = await Promise.all(files.map(f => base44.integrations.Core.UploadFile({ file: f }).then(r => r.file_url)));
    setFotos(prev => [...prev, ...urls]);
    setUploading(false);
  };

  const removePhoto = (idx) => setFotos(prev => prev.filter((_, i) => i !== idx));

  const canConfirm = pecas.trim().length > 3 && fotos.length >= 1;

  const handleConfirm = () => {
    if (!canConfirm) return;
    const lojaFinal = loja === 'Loja específica (informar endereço)' ? lojaOutra : loja;
    const desc = `Busca de peça por moto — Peças: ${pecas}.${lojaFinal ? ` Loja: ${lojaFinal}.` : ''}${valorEstimado ? ` Valor estimado das peças: R$ ${valorEstimado}.` : ''} O motoby busca as peças e entrega no local do cliente.`;
    onSelect({
      description: desc,
      photos: fotos,
      loja: lojaFinal,
      valorEstimado: valorEstimado ? Number(valorEstimado) : null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="bg-card w-full max-w-lg rounded-t-3xl p-5 pb-8 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Bike className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Buscar Peça por Moto</h3>
            <p className="text-xs text-muted-foreground">Um motoby busca as peças e entrega no local</p>
          </div>
        </div>

        {/* Aviso */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 mb-4 flex gap-2">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">
            O motoby vai até a loja, compra as peças e entrega no seu endereço.
            O valor das peças é pago à parte (combinado direto com o motoby).
            Você paga apenas o serviço de busca e entrega.
          </p>
        </div>

        {/* Peças necessárias */}
        <div className="space-y-2 mb-4">
          <label className="text-sm font-semibold text-foreground">Quais peças você precisa? *</label>
          <Textarea
            placeholder="Ex: 2 velas de ignição NGK BPR6ES, 1 filtro de óleo Fram PH3614, correia dentada..."
            value={pecas}
            onChange={e => setPecas(e.target.value)}
            className="min-h-[90px] rounded-xl"
          />
        </div>

        {/* Fotos das peças / referência */}
        <div className="space-y-2 mb-4">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Camera className="w-4 h-4" /> Foto da peça ou referência *
          </label>
          <p className="text-xs text-muted-foreground mb-2">Envie foto da peça antiga, código ou catálogo para o motoby encontrar a correta</p>
          <div className="flex flex-wrap gap-2">
            {fotos.map((url, idx) => (
              <div key={idx} className="relative">
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-border">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
                <button onClick={() => removePhoto(idx)} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {fotos.length < 4 && (
              <label className={cn("cursor-pointer", uploading && "opacity-50 pointer-events-none")}>
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center hover:border-primary/50 transition-colors">
                  {uploading ? <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" /> : <Camera className="w-5 h-5 text-muted-foreground" />}
                </div>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} capture="environment" />
              </label>
            )}
          </div>
          {fotos.length === 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-2 text-xs text-orange-700">
              ⚠️ Foto da peça é obrigatória para o motoby encontrar a correta
            </div>
          )}
        </div>

        {/* Loja */}
        <div className="space-y-2 mb-4">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Store className="w-4 h-4" /> Onde comprar?
          </label>
          <div className="grid grid-cols-1 gap-2">
            {lojasSugeridas.map(opt => (
              <button
                key={opt}
                onClick={() => {
                  setLoja(opt);
                  setLojaOutra(opt === 'Loja específica (informar endereço)' ? '' : false);
                }}
                className={cn(
                  "text-left p-3 rounded-xl border-2 transition-all text-sm",
                  loja === opt ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
          {loja === 'Loja específica (informar endereço)' && (
            <input
              type="text"
              placeholder="Endereço/nome da loja (Ex: Auto Peças São João, Rua X, 123)"
              value={lojaOutra}
              onChange={e => setLojaOutra(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-input bg-transparent text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          )}
        </div>

        {/* Valor estimado das peças */}
        <div className="space-y-2 mb-5">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Valor estimado das peças (opcional)
          </label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="Ex: 150.00"
            value={valorEstimado}
            onChange={e => setValorEstimado(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-input bg-transparent text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground">Para o motoby saber quanto levar para comprar. O pagamento das peças é combinado direto com ele.</p>
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border-2 border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={cn(
              "flex-1 py-3 rounded-2xl text-sm font-bold transition-all",
              canConfirm ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}