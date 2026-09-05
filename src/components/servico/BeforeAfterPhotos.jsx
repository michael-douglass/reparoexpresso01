import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Camera, Plus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BeforeAfterPhotos({ service, onUpdate }) {
  const [uploading, setUploading] = useState(null); // 'before' | 'after' | null

  const beforePhotos = service?.checklist?.before_photos || [];
  const afterPhotos = service?.checklist?.after_photos || [];

  const handleUpload = async (e, type) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(type);
    try {
      const uploaded = [];
      for (const file of files) {
        const result = await base44.integrations.Core.UploadFile({ file });
        if (result?.file_url) uploaded.push(result.file_url);
      }
      const checklist = { ...(service.checklist || {}) };
      const key = type === 'before' ? 'before_photos' : 'after_photos';
      checklist[key] = [...(checklist[key] || []), ...uploaded];
      await base44.entities.ServiceRequest.update(service.id, { checklist });
      onUpdate?.();
      toast.success(`${uploaded.length} foto(s) adicionada(s)`);
    } catch (err) {
      toast.error('Erro ao enviar foto');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const removePhoto = async (type, idx) => {
    const checklist = { ...(service.checklist || {}) };
    const key = type === 'before' ? 'before_photos' : 'after_photos';
    checklist[key] = (checklist[key] || []).filter((_, i) => i !== idx);
    await base44.entities.ServiceRequest.update(service.id, { checklist });
    onUpdate?.();
  };

  const photoTimestamp = (url) => {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-foreground">Fotos do serviço</h3>

      {/* Antes */}
      <div className="bg-white rounded-2xl p-3 border border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground">Antes</span>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => handleUpload(e, 'before')} disabled={uploading === 'before'} />
            <span className="text-xs font-bold text-primary flex items-center gap-1">
              {uploading === 'before' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
              {beforePhotos.length > 0 ? 'Adicionar' : 'Tirar foto'}
            </span>
          </label>
        </div>
        {beforePhotos.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {beforePhotos.map((url, i) => (
              <div key={i} className="relative group">
                <img src={url} alt={`Antes ${i + 1}`} className="w-full h-28 object-cover rounded-xl" />
                <button onClick={() => removePhoto('before', i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
                <p className="text-[10px] text-muted-foreground mt-1">Registrado {photoTimestamp(url)}</p>
              </div>
            ))}
          </div>
        ) : (
          <label className="block cursor-pointer">
            <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => handleUpload(e, 'before')} disabled={uploading === 'before'} />
            <div className="border-2 border-dashed border-border rounded-xl h-28 flex flex-col items-center justify-center text-muted-foreground">
              {uploading === 'before' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-6 h-6 mb-1" />}
              <span className="text-xs">Tirar foto de chegada</span>
            </div>
          </label>
        )}
      </div>

      {/* Depois */}
      <div className="bg-white rounded-2xl p-3 border border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground">Depois</span>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => handleUpload(e, 'after')} disabled={uploading === 'after'} />
            <span className="text-xs font-bold text-primary flex items-center gap-1">
              {uploading === 'after' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
              {afterPhotos.length > 0 ? 'Adicionar' : 'Tirar foto'}
            </span>
          </label>
        </div>
        {afterPhotos.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {afterPhotos.map((url, i) => (
              <div key={i} className="relative group">
                <img src={url} alt={`Depois ${i + 1}`} className="w-full h-28 object-cover rounded-xl" />
                <button onClick={() => removePhoto('after', i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
                <p className="text-[10px] text-muted-foreground mt-1">Registrado {photoTimestamp(url)}</p>
              </div>
            ))}
          </div>
        ) : (
          <label className="block cursor-pointer">
            <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => handleUpload(e, 'after')} disabled={uploading === 'after'} />
            <div className="border-2 border-dashed border-border rounded-xl h-28 flex flex-col items-center justify-center text-muted-foreground">
              {uploading === 'after' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6 mb-1" />}
              <span className="text-xs font-semibold">Adicionar foto</span>
              <span className="text-[10px]">Toque para adicionar</span>
            </div>
          </label>
        )}
      </div>
    </div>
  );
}