import React, { useState } from 'react';
import { Bike, MapPin, Store, DollarSign, Camera, X, Loader2, Info, Search, Phone, User, Wrench, MapPinned } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';

export default function BuscarPecaMotoModal({ isOpen, onSelect, onCancel }) {
  const [osNumber, setOsNumber] = useState('');
  const [osData, setOsData] = useState(null);
  const [osLoading, setOsLoading] = useState(false);
  const [osError, setOsError] = useState('');
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

  const normalizeOs = (val) => val.trim().toUpperCase().replace(/\s/g, '');

  const handleOsLookup = async () => {
    const norm = normalizeOs(osNumber);
    if (norm.length < 4) {
      setOsError('Digite o número da OS (ex: ATD-000123)');
      setOsData(null);
      return;
    }
    setOsLoading(true);
    setOsError('');
    setOsData(null);
    try {
      const results = await base44.entities.ServiceRequest.filter({ service_number: norm });
      if (results && results.length > 0) {
        setOsData(results[0]);
      } else {
        setOsError('OS não encontrada. Verifique o número informado.');
      }
    } catch (e) {
      setOsError('Erro ao buscar a OS. Tente novamente.');
    } finally {
      setOsLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const urls = await Promise.all(files.map(f => base44.integrations.Core.UploadFile({ file: f }).then(r => r.file_url)));
    setFotos(prev => [...prev, ...urls]);
    setUploading(false);
  };

  const removePhoto = (idx) => setFotos(prev => prev.filter((_, i) => i !== idx));

  const canConfirm = pecas.trim().length > 3 && fotos.length >= 1 && osData;

  const handleConfirm = () => {
    if (!canConfirm) return;
    const lojaFinal = loja === 'Loja específica (informar endereço)' ? lojaOutra : loja;
    const osRef = osData.service_number || osData.id;
    const desc = `Busca de peça por moto — OS de origem: ${osRef}. Peças: ${pecas}.${lojaFinal ? ` Loja: ${lojaFinal}.` : ''}${valorEstimado ? ` Valor estimado das peças: R$ ${valorEstimado}.` : ''} O motoby busca as peças e entrega no local do cliente. Prestador da OS: ${osData.provider_name || 'N/A'} (tel: ${osData.provider_phone || 'N/A'}).`;
    onSelect({
      description: desc,
      photos: fotos,
      loja: lojaFinal,
      valorEstimado: valorEstimado ? Number(valorEstimado) : null,
      os_number: osRef,
      os_id: osData.id,
      provider_name: osData.provider_name,
      provider_phone: osData.provider_phone,
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

        {/* Número da OS de origem */}
        <div className="space-y-2 mb-4">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Search className="w-4 h-4" /> Número da OS do prestador *
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            Informe o número da OS (ex: ATD-000123) do prestador que esteve no local e solicitou a peça. O motoby poderá contatá-lo em caso de dúvidas.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="ATD-000123"
              value={osNumber}
              onChange={e => { setOsNumber(e.target.value); setOsData(null); setOsError(''); }}
              className="flex-1 h-11 px-3 rounded-xl border border-input bg-transparent text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring uppercase"
            />
            <button
              onClick={handleOsLookup}
              disabled={osLoading || normalizeOs(osNumber).length < 4}
              className={cn(
                "px-4 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5",
                osLoading || normalizeOs(osNumber).length < 4
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground"
              )}
            >
              {osLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Buscar
            </button>
          </div>
          {osError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-2 text-xs text-red-700">
              {osError}
            </div>
          )}

          {/* Dados da OS encontrada */}
          {osData && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 mt-2 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-emerald-800">OS encontrada: {osData.service_number}</p>
              </div>

              {/* Prestador */}
              <div className="bg-white/60 rounded-xl p-2.5 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Prestador da OS</p>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <User className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="font-semibold">{osData.provider_name || 'Não informado'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>{osData.provider_phone || 'Telefone não disponível'}</span>
                </div>
              </div>

              {/* Serviço */}
              <div className="bg-white/60 rounded-xl p-2.5 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Serviço</p>
                <div className="flex items-start gap-2 text-xs text-foreground">
                  <Wrench className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{osData.description || 'Sem descrição'}</span>
                </div>
              </div>

              {/* Endereço */}
              <div className="bg-white/60 rounded-xl p-2.5 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Endereço</p>
                <div className="flex items-start gap-2 text-xs text-foreground">
                  <MapPinned className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>
                    {osData.address || '—'}{osData.number ? `, ${osData.number}` : ''}
                    {osData.neighborhood ? ` — ${osData.neighborhood}` : ''}
                    {osData.city ? `, ${osData.city}` : ''}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-emerald-700 pt-1">
                ✓ O motoby usará estes dados para contato em caso de dúvidas sobre as peças.
              </p>
            </div>
          )}
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