import React from 'react';
import { CheckCircle, Bike, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { key: 'aceito', label: 'Aceito', icon: CheckCircle },
  { key: 'a_caminho', label: 'Em deslocamento', icon: Bike },
  { key: 'em_andamento', label: 'No local', icon: MapPin },
];

const STATUS_ORDER = ['aceito', 'a_caminho', 'em_andamento', 'concluido'];

export default function ServiceProgressStepper({ status }) {
  const currentIdx = STATUS_ORDER.indexOf(status);
  // If concluido, all steps done
  const completedIdx = status === 'concluido' ? STEPS.length : currentIdx;

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <p className="font-bold text-foreground text-sm mb-4">Progresso do serviço</p>
      <div className="flex items-center">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < completedIdx || (idx === completedIdx && status === 'concluido');
          const isCurrent = idx === completedIdx && status !== 'concluido';
          const isLast = idx === STEPS.length - 1;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center flex-shrink-0" style={{ width: 72 }}>
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                    isCompleted && 'bg-green-500 text-white',
                    isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className={cn('w-5 h-5', isCurrent && 'animate-pulse')} />
                  )}
                </div>
                <p
                  className={cn(
                    'text-[11px] font-semibold mt-2 text-center leading-tight',
                    isCompleted ? 'text-green-400' : isCurrent ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </p>
              </div>
              {!isLast && (
                <div className="flex-1 h-0.5 mx-1 -mt-5 rounded-full transition-all"
                  style={{ background: idx < completedIdx ? 'hsl(var(--primary))' : 'hsl(var(--muted))' }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-4 text-center">
        {status === 'aguardando' && 'Aguardando um prestador aceitar seu serviço...'}
        {status === 'aceito' && 'O prestador confirmou e está se preparando para sair.'}
        {status === 'a_caminho' && 'O prestador está a caminho e deve chegar em poucos minutos.'}
        {status === 'em_andamento' && 'O prestador chegou no local e está executando o serviço.'}
        {status === 'concluido' && 'Serviço concluído! Avalie o prestador para liberar a garantia.'}
      </p>
    </div>
  );
}