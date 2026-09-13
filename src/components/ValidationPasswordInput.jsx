import React, { useRef, memo } from 'react';
import { KeyRound } from 'lucide-react';

/**
 * Campo isolado da senha de validação — INPUT NÃO-CONTROLADO.
 *
 * O valor vive no DOM (ref), não em estado React.
 * O parent só é notificado QUANDO O STATUS MUDA (false→true ou true→false),
 * nunca a cada tecla — assim o ActiveJobCard não re-renderiza durante a digitação
 * e o prestador nunca perde o foco nem o valor digitado.
 */
function ValidationPasswordInput({ expectedPassword, onValidationChange }) {
  const inputRef = useRef(null);
  const errorRef = useRef(null);
  // Guarda o último status notificado ao parent para evitar chamadas repetidas
  const lastNotifiedRef = useRef(false);

  if (!expectedPassword) return null;

  const handleChange = (e) => {
    // Filtra só dígitos, máx 6
    const raw = e.target.value;
    const filtered = raw.replace(/\D/g, '').slice(0, 6);
    if (raw !== filtered) {
      e.target.value = filtered;
    }

    const ok = filtered.length === 6 && filtered === String(expectedPassword);

    // Atualiza mensagem de erro via DOM (sem causar re-render)
    if (errorRef.current) {
      const showError = filtered.length === 6 && !ok;
      errorRef.current.textContent = showError ? 'Senha incorreta. Peça novamente ao cliente.' : '';
      errorRef.current.style.display = showError ? 'block' : 'none';
    }

    // Só notifica o parent quando o status MUDAR — nunca a cada tecla
    if (ok !== lastNotifiedRef.current) {
      lastNotifiedRef.current = ok;
      onValidationChange(ok);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3">
      <p className="text-xs text-blue-700 font-semibold mb-2 flex items-center gap-1">
        <KeyRound className="w-3.5 h-3.5" /> Digite a senha informada pelo cliente
      </p>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        maxLength={6}
        placeholder="000000"
        defaultValue=""
        onChange={handleChange}
        className="flex h-12 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-center font-mono text-xl tracking-widest shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <p
        ref={errorRef}
        className="text-xs text-red-600 mt-1 text-center"
        style={{ display: 'none' }}
      >
      </p>
    </div>
  );
}

export default memo(ValidationPasswordInput);