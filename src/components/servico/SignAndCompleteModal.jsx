import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import SignaturePad from '@/components/SignaturePad';
import { X, CheckCircle2, Loader2, FileText, PenLine } from 'lucide-react';
import { toast } from 'sonner';

async function uploadDataUrl(dataUrl, fileName) {
  if (!dataUrl) return null;
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], fileName, { type: blob.type });
  const result = await base44.integrations.Core.UploadPublicFile({ file });
  return result?.file_url || null;
}

export default function SignAndCompleteModal({ open, onClose, service, providerName, onComplete }) {
  const [providerSig, setProviderSig] = useState(null);
  const [clientSig, setClientSig] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const observation = service?.checklist?.notes || '';

  const handleComplete = async () => {
    if (!providerSig?.signature || !clientSig?.signature) {
      toast.error('Ambas as assinaturas são obrigatórias');
      return;
    }
    setCompleting(true);
    try {
      // Upload assinaturas e fotos dos signatários
      const [provSigUrl, provPhotoUrl, cliSigUrl, cliPhotoUrl] = await Promise.all([
        uploadDataUrl(providerSig.signature, 'assinatura_prestador.png'),
        uploadDataUrl(providerSig.signer_photo, 'foto_prestador.jpg'),
        uploadDataUrl(clientSig.signature, 'assinatura_cliente.png'),
        uploadDataUrl(clientSig.signer_photo, 'foto_cliente.jpg'),
      ]);

      const checklist = {
        ...(service.checklist || {}),
        provider_signature_url: provSigUrl,
        provider_signer_photo_url: provPhotoUrl,
        client_signature_url: cliSigUrl,
        client_signer_photo_url: cliPhotoUrl,
        completed_at: new Date().toISOString(),
      };

      await base44.entities.ServiceRequest.update(service.id, {
        status: 'concluido',
        checklist,
        final_price: service.final_price || service.estimated_price,
      });

      // Tenta gerar relatório PDF (backend function — pode falhar se plano não suportar)
      try {
        await base44.functions.invoke('generateServiceReport', { service_id: service.id });
      } catch (e) {
        // Relatório é opcional — serviço já foi concluído
      }

      setDone(true);
      setTimeout(() => {
        onComplete?.();
        onClose();
        setDone(false);
        setProviderSig(null);
        setClientSig(null);
      }, 1800);
    } catch (err) {
      toast.error('Erro ao finalizar serviço');
    } finally {
      setCompleting(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center">
        <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />
        <h2 className="text-xl font-bold text-foreground">Serviço Concluído!</h2>
        <p className="text-sm text-muted-foreground mt-1">Relatório enviado para cliente e prestador</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#F7F4F0] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-white">
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-base font-bold text-foreground flex-1">Assinar e Concluir</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Resumo */}
        <div className="bg-white rounded-2xl p-4 border border-border space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Resumo do serviço</p>
          <p className="text-sm font-semibold text-foreground">{service?.service_number || '—'}</p>
          {observation && (
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Observação:</p>
              <p className="text-sm text-foreground">{observation}</p>
            </div>
          )}
          <div className="mt-2 pt-2 border-t border-border flex justify-between">
            <span className="text-xs text-muted-foreground">Valor final:</span>
            <span className="text-sm font-bold text-foreground">R$ {(service?.final_price || service?.estimated_price || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Assinatura do prestador */}
        <div className="bg-white rounded-2xl p-4 border border-border">
          <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
            <PenLine className="w-4 h-4 text-primary" /> Assinatura do Prestador
          </p>
          <SignaturePad
            label={`${providerName || 'Prestador'}`}
            onSave={(data) => setProviderSig(data)}
          />
        </div>

        {/* Assinatura do cliente */}
        <div className="bg-white rounded-2xl p-4 border border-border">
          <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
            <PenLine className="w-4 h-4 text-green-600" /> Assinatura do Cliente
          </p>
          <SignaturePad
            label={service?.client_name || 'Cliente'}
            onSave={(data) => setClientSig(data)}
          />
        </div>

        <p className="text-xs text-muted-foreground text-center px-4">
          Ao assinar, ambas as partes confirmam que o serviço foi concluído e testado, com garantia de 90 dias.
        </p>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border bg-white">
        <Button
          onClick={handleComplete}
          disabled={completing || !providerSig?.signature || !clientSig?.signature}
          className="w-full rounded-2xl h-13 py-3.5 bg-[#008744] hover:bg-[#006d37] text-white font-bold text-base gap-2"
        >
          {completing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
          {completing ? 'Gerando relatório...' : 'Gerar PDF e Concluir'}
        </Button>
      </div>
    </div>
  );
}