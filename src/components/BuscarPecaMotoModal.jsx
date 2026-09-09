import React, { useState, useEffect, useMemo } from 'react';
import { Bike, Store, DollarSign, Camera, X, Loader2, Info, Search, Phone, User, Wrench, MapPinned, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';

export default function BuscarPecaMotoModal({ isOpen, onSelect, onCancel }) {
  const [osList, setOsList] = useState([]);
  const [osLoading, setOsLoading] = useState(false);
  const [osError, setOsError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOs, setSelectedOs] = useState(null);
  const [showOsPicker, setShowOsPicker] = useState(false);
  const [pecas, setPecas] = useState('');
  const [loja, setLoja] = useState('');
  const [lojaOutra, setLojaOutra] = useState(false);
  const [valorEstimado, setValorEstimado] = useState('');
  const [fotos, setFotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const loadOs = async () => {
      setOsLoading(true);
      setOsError('');
      try {
        const me = await base44.auth.me();
        const results = await base44.entities.ServiceRequest.filter({
          created_by: me.email,
          status: 'em_espera',
        }, '-updated_date', 50);
        if (cancelled) return;
        const now = new Date();
        const valid = (results || []).filter(os => {
          if (!os.parts_return_deadline) return true;
          return new Date(os.parts_return_deadline) >= now;
        });
        setOsList(valid);
      } catch (e) {
        if (!cancelled) setOsError('Erro ao carregar atendimentos. Tente novamente.');
      } finally {
        if (!cancelled) setOsLoading(false);
      }
    };
    loadOs();
    return () => { cancelled = true; };
  }, [isOpen]);

  const lojasSugeridas = [
    'Loja mais próxima (motoboy escolhe)',
    'Loja específica (informar endereço)',
  ];

  const filteredOs = useMemo(() => {
    if (!searchTerm.trim()) return osList;
    const term = searchTerm.trim().toLowerCase();
    return osList.filter(os =>
      (os.service_number || '').toLowerCase().includes(term) ||
      (os.provider_name || '').toLowerCase().includes(term) ||
      (os.description || '').toLowerCase().includes(term) ||
      (os.service_type || '').toLowerCase().includes(term)
    );
  }, [osList, searchTerm]);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const urls = await Promise.all(files.map(f => base44.integrations.Core.UploadFile({ file: f }).then(r => r.file_url)));
    setFotos(prev => [...prev, ...urls]);
    setUploading(false);
  };

  const removePhoto = (idx) => setFotos(prev => prev.filter((_, i) => i !== idx));

  const canConfirm = pecas.trim().length > 3 && fotos.length >= 1 && selectedOs;

  const formatDeadline = (deadline) => {
    if (!deadline) return 'Sem prazo';
    const diff = new Date(deadline) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Vence hoje';
    if (days === 1) return 'Vence amanhã';
    return `Faltam ${days} dias`;
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    const lojaFinal = loja === 'Loja específica (informar endereço)' ? lojaOutra : loja;
    const osRef = selectedOs.service_number || selectedOs.id;
    const desc = `Busca de peça por moto — OS de origem: ${osRef}. Peças: ${pecas}.${lojaFinal ? ` Loja: ${lojaFinal}.` : ''}${valorEstimado ? ` Valor estimado das peças: R$ ${valorEstimado}.` : ''} O motoby busca as peças e entrega no local do cliente. Prestador da OS: ${selectedOs.provider_name || 'N/A'} (tel: ${selectedOs.provider_phone || 'N/A'}).`;
    onSelect({
      description: desc,
      photos: fotos,
      loja: lojaFinal,
      valorEstimado: valorEstimado ? Number(valorEstimado) : null,
      os_number: osRef,
      os_id: selectedOs.id,
      provider_name: selectedOs.provider_name,
      provider_phone: selectedOs.provider_phone,
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

        {/* Seleção da OS de origem */}
        <div className="space-y-2 mb-4">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Search className="w-4 h-4" /> Atendimento com prazo para compra de peça *
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            Selecione o atendimento em que o prestador solicitou a peça. O motoby poderá contatá-lo em caso de dúvidas.
          </p>

          {/* Botão para abrir a janela de seleção */}
          {!selectedOs && (
            <button
              onClick={() => setShowOsPicker(true)}
              disabled={osLoading}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-2xl border-2 border-dashed transition-all",
                "border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary",
                osLoading && "opacity-60 pointer-events-none"
              )}
            >
              <div className="flex items-center gap-3">
                {osLoading ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Search className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground">
                    {osLoading ? 'Carregando...' : 'Selecionar atendimento'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {osLoading
                      ? 'Buscando serviços pendentes de peça...'
                      : `${osList.length} serviço(s) pendente(s) de peça — toque para ver`}
                  </p>
                </div>
              </div>
              {!osLoading && <ChevronRight className="w-5 h-5 text-primary flex-shrink-0" />}
            </button>
          )}

          {osError && !showOsPicker && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-2 text-xs text-red-700">
              {osError}
            </div>
          )}

          {/* Janela dedicada de seleção de OS */}
          {showOsPicker && (
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center sm:justify-center bg-black/60" onClick={() => setShowOsPicker(false)}>
              <div
                className="bg-card w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div>
                    <h4 className="text-base font-bold text-foreground">Atendimentos pendentes de peça</h4>
                    <p className="text-xs text-muted-foreground">Selecione o atendimento de origem</p>
                  </div>
                  <button onClick={() => setShowOsPicker(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Busca */}
                <div className="p-4 pb-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Buscar por número, prestador ou serviço..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full h-11 pl-9 pr-3 rounded-xl border border-input bg-transparent text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                {/* Lista */}
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                  {osLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      <span className="text-sm text-muted-foreground ml-2">Carregando atendimentos...</span>
                    </div>
                  ) : osError ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 text-center">
                      {osError}
                    </div>
                  ) : filteredOs.length === 0 ? (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-700 text-center">
                      {osList.length === 0
                        ? 'Nenhum atendimento com prazo ativo para compra de peça no momento.'
                        : 'Nenhum atendimento encontrado para a busca.'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredOs.map(os => (
                        <button
                          key={os.id}
                          onClick={() => { setSelectedOs(os); setShowOsPicker(false); setSearchTerm(''); }}
                          className={cn(
                            "w-full text-left p-3 rounded-xl border-2 transition-all",
                            "border-border hover:border-primary/40 hover:bg-primary/5"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-bold text-foreground">{os.service_number || 'Sem número'}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-1 bg-amber-100 text-amber-700">
                                  <Clock className="w-2.5 h-2.5" />
                                  {formatDeadline(os.parts_return_deadline)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                                <User className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{os.provider_name || 'Prestador não informado'}</span>
                              </div>
                              <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                <Wrench className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{os.description || 'Sem descrição'}</span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Dados da OS selecionada */}
          {selectedOs && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 mt-2 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-emerald-800">OS selecionada: {selectedOs.service_number}</p>
                </div>
                <button onClick={() => setSelectedOs(null)} className="text-emerald-600 hover:text-emerald-800">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Prestador */}
              <div className="bg-white/60 rounded-xl p-2.5 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Prestador da OS</p>
                <div className="flex items-center gap-2 text-xs text-black">
                  <User className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="font-semibold">{selectedOs.provider_name || 'Não informado'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-black">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>{selectedOs.provider_phone || 'Telefone não disponível'}</span>
                </div>
              </div>

              {/* Serviço */}
              <div className="bg-white/60 rounded-xl p-2.5 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Serviço</p>
                <div className="flex items-start gap-2 text-xs text-black">
                  <Wrench className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{selectedOs.description || 'Sem descrição'}</span>
                </div>
              </div>

              {/* Endereço */}
              <div className="bg-white/60 rounded-xl p-2.5 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Endereço</p>
                <div className="flex items-start gap-2 text-xs text-black">
                  <MapPinned className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>
                    {selectedOs.address || '—'}{selectedOs.number ? `, ${selectedOs.number}` : ''}
                    {selectedOs.neighborhood ? ` — ${selectedOs.neighborhood}` : ''}
                    {selectedOs.city ? `, ${selectedOs.city}` : ''}
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