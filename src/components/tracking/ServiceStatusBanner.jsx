import React from 'react';
import { cn } from '@/lib/utils';

const BANNER_CONFIG = {
  aguardando: {
    bg: 'bg-blue-500/10 border-blue-500/20',
    text: 'text-blue-400',
    icon: '🔍',
    title: 'Procurando prestador',
    subtitle: 'Buscando o profissional mais próximo...',
  },
  aceito: {
    bg: 'bg-blue-500/10 border-blue-500/20',
    text: 'text-blue-400',
    icon: '✅',
    title: 'Prestador confirmado',
    subtitle: 'Preparando para iniciar o deslocamento',
  },
  a_caminho: {
    bg: 'bg-blue-500/10 border-blue-500/20',
    text: 'text-blue-400',
    icon: '🛵',
    title: 'Prestador a caminho',
    subtitle: 'Seguindo até você agora',
  },
  em_andamento: {
    bg: 'bg-amber-500/10 border-amber-500/20',
    text: 'text-amber-400',
    icon: '🔧',
    title: 'Prestador no local',
    subtitle: 'Serviço em andamento',
  },
  concluido: {
    bg: 'bg-green-500/10 border-green-500/20',
    text: 'text-green-400',
    icon: '✅',
    title: 'Serviço concluído',
    subtitle: 'Aguardando sua avaliação',
  },
  em_espera: {
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    text: 'text-yellow-400',
    icon: '⏸️',
    title: 'Serviço pausado',
    subtitle: 'Aguardando retorno do cliente',
  },
  cancelado: {
    bg: 'bg-red-500/10 border-red-500/20',
    text: 'text-red-400',
    icon: '✕',
    title: 'Serviço cancelado',
    subtitle: 'Este atendimento foi cancelado',
  },
};

export default function ServiceStatusBanner({ status }) {
  const config = BANNER_CONFIG[status] || BANNER_CONFIG.aguardando;
  return (
    <div className={cn('rounded-2xl border p-4 flex items-center gap-3', config.bg)}>
      <div className="text-2xl flex-shrink-0">{config.icon}</div>
      <div className="flex-1 min-w-0">
        <p className={cn('font-bold text-sm', config.text)}>{config.title}</p>
        <p className={cn('text-xs mt-0.5', config.text, 'opacity-80')}>{config.subtitle}</p>
      </div>
    </div>
  );
}