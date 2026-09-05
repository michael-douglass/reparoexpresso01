import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

// AudioContext compartilhado — desbloqueado na primeira interação do usuário
let sharedCtx = null;

function getAudioContext() {
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return sharedCtx;
}

// Desbloqueia o AudioContext na primeira interação do usuário
if (typeof window !== 'undefined') {
  const unlock = () => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    } catch (e) {}
  };
  ['touchstart', 'touchend', 'mousedown', 'click', 'keydown'].forEach(evt =>
    document.addEventListener(evt, unlock, { once: false, passive: true })
  );
}

// Toca uma buzina de caminhão (grave, potente) e retorna função para parar
export function startHornLoop() {
  let stopped = false;
  let intervalId = null;

  const playTruckHorn = () => {
    try {
      const ctx = getAudioContext();
      if (stopped || ctx.state === 'closed') return;

      // Se ainda suspenso, tenta resumir e agendá-lo
      if (ctx.state === 'suspended') {
        ctx.resume().then(playTruckHorn);
        return;
      }

      const now = ctx.currentTime;
      const frequencies = [100, 120, 135];
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.9, now + 0.1);
      masterGain.gain.setValueAtTime(0.9, now + 1.8);
      masterGain.gain.linearRampToValueAtTime(0, now + 2.0);

      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.linearRampToValueAtTime(freq * 0.98, now + 0.3);
        osc.frequency.linearRampToValueAtTime(freq * 1.02, now + 0.6);
        osc.frequency.linearRampToValueAtTime(freq, now + 1.8);
        oscGain.gain.value = i === 0 ? 0.6 : 0.3;
        osc.connect(oscGain);
        oscGain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 2.0);
      });
    } catch (e) {
      console.error('Erro ao tocar buzina:', e);
    }
  };

  // Toca imediatamente
  playTruckHorn();
  intervalId = setInterval(playTruckHorn, 2500);

  return () => {
    stopped = true;
    clearInterval(intervalId);
  };
}

// === Expansão gradual do raio de busca ===
// A cada 2 minutos o raio aumenta, alcançando prestadores mais distantes.
// Raio baseado na idade do chamado (created_date), não em um timer global.
const RADIUS_STEPS = [
  { maxAgeMin: 2,       radiusKm: 5  },  // 0–2 min: 5 km
  { maxAgeMin: 4,       radiusKm: 10 },  // 2–4 min: 10 km
  { maxAgeMin: 6,       radiusKm: 15 },  // 4–6 min: 15 km
  { maxAgeMin: 8,       radiusKm: 20 },  // 6–8 min: 20 km
  { maxAgeMin: 10,      radiusKm: 30 },  // 8–10 min: 30 km
  { maxAgeMin: Infinity, radiusKm: 50 }, // 10+ min: 50 km
];

function getRadiusForAge(ageMin) {
  for (const step of RADIUS_STEPS) {
    if (ageMin <= step.maxAgeMin) return step.radiusKm;
  }
  return 50;
}

function getDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function getJobAgeMinutes(job) {
  if (!job.created_date) return 0;
  return (Date.now() - new Date(job.created_date).getTime()) / 60000;
}

/**
 * Verifica se o prestador está dentro do raio de busca atual para o chamado.
 * Sem coordenadas do prestador ou do chamado → sempre true (fallback: notifica).
 */
function isWithinSearchRadius(job, providerLat, providerLng) {
  if (!providerLat || !providerLng) return true; // sem coords do prestador → notifica
  const jobLat = job.client_latitude || job.latitude;
  const jobLng = job.client_longitude || job.longitude;
  if (!jobLat || !jobLng) return true; // sem coords do chamado → notifica
  const dist = getDistanceKm(providerLat, providerLng, jobLat, jobLng);
  if (dist == null) return true;
  const ageMin = getJobAgeMinutes(job);
  const radius = getRadiusForAge(ageMin);
  return dist <= radius;
}

/**
 * Monitora novos chamados via subscribe em tempo real.
 * Dispara a buzina quando:
 * - status='aguardando' (chamado livre) OU
 * - status='aceito' com provider_id === providerId (chamado atribuído automaticamente ao prestador)
 *
 * Raio de busca gradual: o chamado só é notificado se o prestador estiver dentro do
 * raio atual (baseado na idade do chamado). Caso contrário, fica pendente e é
 * re-avaliado a cada 30s conforme o raio expande.
 */
// Persistência dos IDs vistos no sessionStorage para sobreviver à remontagem
function loadSeenIds() {
  try {
    const raw = sessionStorage.getItem('__seenJobIds');
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}
function saveSeenIds(set) {
  try {
    sessionStorage.setItem('__seenJobIds', JSON.stringify([...set]));
  } catch {}
}

export function useNewJobAlert({ enabled, onNewJob, providerId, providerLat, providerLng }) {
  const enabledRef = useRef(enabled);
  const providerIdRef = useRef(providerId);
  const providerLatRef = useRef(providerLat);
  const providerLngRef = useRef(providerLng);
  const seenIds = useRef(loadSeenIds()); // carrega do sessionStorage ao montar
  const onNewJobRef = useRef(onNewJob);
  const stopHornRef = useRef(null);
  // Chamados que chegaram mas estavam fora do raio — re-avaliados conforme o raio expande
  const pendingJobsRef = useRef(new Map()); // id -> job data

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { providerIdRef.current = providerId; }, [providerId]);
  useEffect(() => { providerLatRef.current = providerLat; }, [providerLat]);
  useEffect(() => { providerLngRef.current = providerLng; }, [providerLng]);
  useEffect(() => { onNewJobRef.current = onNewJob; }, [onNewJob]);

  // Expõe funções globais para parar a buzina e limpar IDs vistos
  useEffect(() => {
    window.__stopProviderHorn = () => {
      stopHornRef.current?.();
      stopHornRef.current = null;
    };
    window.__clearSeenJobIds = () => {
      seenIds.current.clear();
      saveSeenIds(seenIds.current);
      pendingJobsRef.current.clear();
    };
    window.__markJobSeen = (id) => {
      seenIds.current.add(id);
      saveSeenIds(seenIds.current);
      pendingJobsRef.current.delete(id);
    };
    return () => {
      delete window.__stopProviderHorn;
      delete window.__clearSeenJobIds;
      delete window.__markJobSeen;
    };
  }, []);

  // Dispara a notificação de um job (buzina + callback) e marca como visto
  const notifyJob = (data) => {
    seenIds.current.add(data.id);
    saveSeenIds(seenIds.current);
    pendingJobsRef.current.delete(data.id);
    stopHornRef.current?.();
    stopHornRef.current = startHornLoop();
    onNewJobRef.current?.(data);
  };

  useEffect(() => {
    if (!enabled) {
      stopHornRef.current?.();
      stopHornRef.current = null;
      return;
    }

    const unsubscribe = base44.entities.ServiceRequest.subscribe((event) => {
      if (!enabledRef.current) return;

      const data = event.data;
      if (!data) return;

      // Chamado livre — APENAS em 'create' para evitar duplicação quando outro prestador recusa
      const isOpenJob =
        event.type === 'create' &&
        data.status === 'aguardando' &&
        data.modality !== 'agendado';

      // Chamado atribuído automaticamente a este prestador pelo backend (assignServiceToProvider)
      // Não re-notifica se o próprio prestador já aceitou manualmente (estará em seenIds)
      const isAssignedToMe =
        event.type === 'update' &&
        data.status === 'aceito' &&
        providerIdRef.current &&
        data.provider_id === providerIdRef.current &&
        !seenIds.current.has(event.id);

      const isNewJob = isOpenJob || isAssignedToMe;

      // Limpa seenIds APENAS quando job é finalizado (não quando volta p/ aguardando por recusa)
      const isFinalizado = event.type === 'update' && ['cancelado', 'concluido'].includes(data.status);
      if (isFinalizado) {
        seenIds.current.delete(event.id);
        saveSeenIds(seenIds.current);
        pendingJobsRef.current.delete(event.id);
      }

      // Garante que job recusado (voltou a aguardando) não re-notifica quem já viu
      const isRejectedBack = event.type === 'update' && data.status === 'aguardando';
      if (isRejectedBack) {
        // Prestadores que já viram o chamado (seenIds) não são re-notificados.
        // Prestadores que estavam fora do raio (pending) continuam em pending
        // e serão re-avaliados pelo intervalo de 30s conforme o raio expande.
        return;
      }

      if (isNewJob && !seenIds.current.has(event.id)) {
        // Verifica raio de busca gradual
        if (isWithinSearchRadius(data, providerLatRef.current, providerLngRef.current)) {
          notifyJob(data);
        } else {
          // Fora do raio atual — guarda como pendente para re-avaliar quando o raio expandir
          pendingJobsRef.current.set(event.id, data);
        }
      }
    });

    return unsubscribe;
  }, [enabled]);

  // Re-avalia chamados pendentes a cada 30s — o raio expande com a idade do chamado
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      if (pendingJobsRef.current.size === 0) return;
      for (const [id, job] of pendingJobsRef.current) {
        // Se já foi visto ou finalizado, remove
        if (seenIds.current.has(id)) {
          pendingJobsRef.current.delete(id);
          continue;
        }
        // Re-avalia com o raio expandido
        if (isWithinSearchRadius(job, providerLatRef.current, providerLngRef.current)) {
          notifyJob(job);
        }
      }
    }, 30000); // a cada 30s
    return () => clearInterval(interval);
  }, [enabled]);
}