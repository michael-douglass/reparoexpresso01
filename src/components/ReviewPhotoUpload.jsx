import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, X, Loader2, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ReviewPhotoUpload({ photos = [], onPhotosChange, max = 4 }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, max - photos.length);
    if (!files.length) return;

    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const result = await base44.integrations.Core.UploadFile({ file });
        uploaded.push(result.file_url);
      }
      onPhotosChange([...photos, ...uploaded]);
      toast.success(`${uploaded.length} foto(s) adicionada(s)`);
    } catch (err) {
      toast.error('Erro ao enviar fotos');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (idx) => {
    onPhotosChange(photos.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
        <Camera className="w-3.5 h-3.5" />
        Fotos da avaliação {photos.length > 0 && `(${photos.length}/${max})`}
        <span className="text-green-600 font-bold ml-1">+50 pts</span>
      </p>

      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-2">
          {photos.map((photo, idx) => (
            <div key={idx} className="relative group">
              <img
                src={photo}
                alt={`Foto ${idx + 1}`}
                className="w-full h-16 object-cover rounded-lg border border-border"
              />
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length < max && (
        <label className={cn(
          'flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-3 cursor-pointer transition-all',
          uploading ? 'opacity-50' : 'hover:border-primary/50 hover:bg-primary/5'
        )}>
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Enviando...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Adicionar fotos</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
}