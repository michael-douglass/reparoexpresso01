import React, { useState } from 'react';
import { BellRing, Clock, DoorOpen, Package, AlertTriangle, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';

const ALERT_TYPES = [
  {
    key: 'atraso',
    label: 'Estou atrasado',
    icon: Clock,
    color: 'border-orange-400 text-orange-700 hover:bg-orange-50',
    title: 'Aviso de atraso',
    message: 'O prestador está com atraso e chegará um pouco mais tarde. Aguarde, por favor.',
  },
  {
    key: 'acesso',
    label: 'Preciso de acesso',
    icon: DoorOpen,
    color: 'border-blue-400 text-blue-700 hover:bg-blue-50',
    title: 'Necessário acesso ao local',
    message: 'O prestador precisa que você libere o acesso ao local do serviço.',
  },
  {
    key: 'peca_extra',
    label: 'Peça/material extra',
    icon: Package,
    color: 'border-purple-400 text-purple-700 hover:bg-purple-50',
    title: 'Peça/material adicional',
    message: 'O prestador identificou a necessidade de uma peça ou material adicional não previsto.',
  },
  {
    key: 'imprevisto',
    label: 'Imprevisto no serviço',
    icon: AlertTriangle,
    color: 'border-red-400 text-red-700 hover:bg-red-50',
    title: 'Imprevisto no serviço',
    message: 'O prestador encontrou um imprevisto e entrará em contato para detalhes.',
  },
];

export default function ClientAlertTab({ job, providerName }) {
  const [sendingKey, setSendingKey] = useState(null);
  const [sentKeys, setSentKeys] = useState([]);
  const [customMessage, setCustomMessage] = useState('');
  const [sendingCustom, setSendingCustom] = useState(false);
  const [customSent, setCustomSent] = useState(false);

  const sendAlert = async (alert) => {
    setSendingKey(alert.key);
    try {
      const fullMessage = `🔔 ${alert.title}: ${alert.message}`;
      await Promise.all([
        base44.entities.ChatMessage.create({
          request_id: job.id,
          sender_role: 'prestador',
          sender_name: providerName || job.provider_name || 'Prestador',
          text: fullMessage,
        }),
        base44.entities.ClientNotification.create({
          client_id: job.client_id,
          type: 'warning',
          title: alert.title,
          message: alert.message,
          service_id: job.id,
          service_number: job.service_number,
          provider_name: providerName || job.provider_name,
          action_url: `/acompanhar/${job.id}`,
          is_read: false,
        }).catch(() => {}),
      ]);
      setSentKeys(prev => [...prev, alert.key]);
    } catch (e) {
      // silencia — erro já tratado pelo fluxo
    } finally {
      setSendingKey(null);
    }
  };

  const sendCustom = async () => {
    if (!customMessage.trim()) return;
    setSendingCustom(true);
    try {
      await Promise.all([
        base44.entities.ChatMessage.create({
          request_id: job.id,
          sender_role: 'prestador',
          sender_name: providerName || job.provider_name || 'Prestador',
          text: `🔔 ${customMessage.trim()}`,
        }),
        base44.entities.ClientNotification.create({
          client_id: job.client_id,
          type: 'warning',
          title: 'Aviso do prestador',
          message: customMessage.trim(),
          service_id: job.id,
          service_number: job.service_number,
          provider_name: providerName || job.provider_name,
          action_url: `/acompanhar/${job.id}`,
          is_read: false,
        }).catch(() => {}),
      ]);
      setCustomMessage('');
      setCustomSent(true);
      setTimeout(() => setCustomSent(false), 3000);
    } catch (e) {
      // silencia
    } finally {
      setSendingCustom(false);
    }
  };

  return (
    <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <BellRing className="w-4 h-4 text-amber-700" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Alertar o cliente</p>
          <p className="text-xs text-muted-foreground">Envie um aviso rápido — chega como mensagem e notificação</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {ALERT_TYPES.map(alert => {
          const Icon = alert.icon;
          const isSending = sendingKey === alert.key;
          const wasSent = sentKeys.includes(alert.key);
          return (
            <button
              key={alert.key}
              onClick={() => sendAlert(alert)}
              disabled={isSending}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center active:scale-95 disabled:opacity-60",
                wasSent ? "border-green-400 bg-green-50 text-green-700" : alert.color
              )}
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : wasSent ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Icon className="w-5 h-5" />
              )}
              <span className="text-xs font-semibold leading-tight">{alert.label}</span>
            </button>
          );
        })}
      </div>

      <div className="border-t border-amber-200 pt-3 space-y-2">
        <p className="text-xs font-semibold text-foreground">Mensagem personalizada</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={customMessage}
            onChange={e => setCustomMessage(e.target.value)}
            placeholder="Digite seu aviso..."
            disabled={sendingCustom}
            className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <button
            onClick={sendCustom}
            disabled={!customMessage.trim() || sendingCustom}
            className="px-3 h-9 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold flex items-center gap-1 disabled:opacity-50 transition-colors"
          >
            {sendingCustom ? <Loader2 className="w-4 h-4 animate-spin" /> : customSent ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        {customSent && (
          <p className="text-xs text-green-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Mensagem enviada ao cliente
          </p>
        )}
      </div>
    </div>
  );
}