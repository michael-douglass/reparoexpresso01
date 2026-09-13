import React, { useState, useEffect, useCallback, memo } from 'react';
import { KeyRound } from 'lucide-react';

/**
 * Campo isolado da senha de validação.
 * O estado do input fica neste componente, isolado dos re-renders do ActiveJobCard
 * (que acontecem a cada atualização de GPS), garantindo que o prestador consiga digitar.
 */
function ValidationPasswordInput({ expectedPassword, onValidationChange }) {
  const [value, setValue] = useState('');

  const notify = useCallback(onValidationChange, [onValidationChange]);

  useEffect(() => {
    const ok = !expectedPassword || value === String(expectedPassword);
    notify(ok);
  }, [value, expectedPassword, notify]);

  if (!expectedPassword) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3">
      <p className="text-xs text-blue-700 font-semibold mb-2 flex items-center gap-1">
        <KeyRound className="w-3.5 h-3.5" /> Digite a senha informada pelo cliente
      </p>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        maxLength={6}
        placeholder="000000"
        value={value}
        onChange={e => setValue(e.target.value.replace(/\D/g, ''))}
        className="flex h-12 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-center font-mono text-xl tracking-widest shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {value.length === 6 && value !== String(expectedPassword) && (
        <p className="text-xs text-red-600 mt-1 text-center">Senha incorreta. Peça novamente ao cliente.</p>
      )}
    </div>
  );
}

export default memo(ValidationPasswordInput);