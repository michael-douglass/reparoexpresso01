import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Star, CheckCircle2, Clock, Users, Search, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatMinutes(mins) {
  if (mins == null) return '—';
  if (mins < 1) return '< 1 min';
  if (mins < 60) return `${Math.round(mins)} min`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

function ratingColor(rating) {
  if (rating >= 4.5) return 'text-green-600';
  if (rating >= 3.5) return 'text-yellow-600';
  if (rating > 0) return 'text-red-600';
  return 'text-muted-foreground';
}

function responseColor(mins) {
  if (mins == null) return 'text-muted-foreground';
  if (mins <= 5) return 'text-green-600';
  if (mins <= 15) return 'text-yellow-600';
  return 'text-red-600';
}

export default function ProviderPerformanceDashboard() {
  const [search, setSearch] = useState('');

  const { data: providers = [], isLoading: loadingProviders } = useQuery({
    queryKey: ['all-providers'],
    queryFn: () => base44.entities.Provider.list(),
  });

  const { data: requests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['all-requests-perf'],
    queryFn: () => base44.entities.ServiceRequest.list('-created_date', 500),
  });

  const isLoading = loadingProviders || loadingRequests;

  const providerStats = useMemo(() => {
    const activeProviders = providers.filter(p => p.is_approved && !p.is_blocked && !p.is_rejected);

    return activeProviders
      .map(provider => {
        const providerRequests = requests.filter(r => r.provider_id === provider.id);
        const completed = providerRequests.filter(r => r.status === 'concluido');

        // Tempo de resposta: tempo entre criação da OS e geração das senhas (proxy de aceitação)
        const responseTimes = providerRequests
          .filter(r => r.passwords_generated_at && r.created_date)
          .map(r => {
            const created = new Date(r.created_date).getTime();
            const accepted = new Date(r.passwords_generated_at).getTime();
            return (accepted - created) / 60000;
          })
          .filter(mins => mins >= 0 && mins < 1440);

        const avgResponseMin = responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : null;

        return {
          id: provider.id,
          name: provider.name,
          city: provider.city,
          is_online: provider.is_online,
          totalCompleted: completed.length,
          totalAssigned: providerRequests.length,
          rating: provider.rating || 0,
          totalReviews: provider.total_reviews || 0,
          avgResponseMin,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [providers, requests]);

  const summary = useMemo(() => {
    if (providerStats.length === 0) return null;
    const totalCompleted = providerStats.reduce((acc, p) => acc + p.totalCompleted, 0);
    const ratedProviders = providerStats.filter(p => p.rating > 0);
    const avgRating = ratedProviders.length > 0
      ? ratedProviders.reduce((acc, p) => acc + p.rating, 0) / ratedProviders.length
      : 0;
    const withResponse = providerStats.filter(p => p.avgResponseMin != null);
    const overallAvgResponse = withResponse.length > 0
      ? withResponse.reduce((acc, p) => acc + p.avgResponseMin, 0) / withResponse.length
      : null;
    return { totalProviders: providerStats.length, totalCompleted, avgRating, overallAvgResponse };
  }, [providerStats]);

  const filtered = providerStats.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.city || '').toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo geral */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold text-foreground">{summary.totalProviders}</p>
              <p className="text-xs text-muted-foreground">Prestadores ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-green-600" />
              <p className="text-xl font-bold text-foreground">{summary.totalCompleted}</p>
              <p className="text-xs text-muted-foreground">Serviços concluídos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Star className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
              <p className="text-xl font-bold text-foreground">{summary.avgRating.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Rating médio geral</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Clock className="w-5 h-5 mx-auto mb-1 text-blue-600" />
              <p className="text-xl font-bold text-foreground">{formatMinutes(summary.overallAvgResponse)}</p>
              <p className="text-xs text-muted-foreground">Tempo de resposta médio</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Busca */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar prestador por nome ou cidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-xl"
        />
      </div>

      {/* Tabela de performance */}
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">Nenhum prestador encontrado</p>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left font-semibold text-muted-foreground px-4 py-3">Prestador</th>
                  <th className="text-center font-semibold text-muted-foreground px-4 py-3">Concluídos</th>
                  <th className="text-center font-semibold text-muted-foreground px-4 py-3">Rating</th>
                  <th className="text-center font-semibold text-muted-foreground px-4 py-3 hidden sm:table-cell">Avaliações</th>
                  <th className="text-center font-semibold text-muted-foreground px-4 py-3">Tempo resposta</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => (
                  <tr key={p.id} className={cn('border-b border-border/50 hover:bg-muted/20', idx % 2 === 1 && 'bg-muted/5')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="font-bold text-primary text-xs">{p.name?.charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {p.city || '—'} {p.is_online && '· 🟢 Online'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center px-4 py-3">
                      <span className="font-bold text-foreground">{p.totalCompleted}</span>
                      <span className="text-xs text-muted-foreground"> / {p.totalAssigned}</span>
                    </td>
                    <td className="text-center px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1 font-bold', ratingColor(p.rating))}>
                        <Star className={cn('w-3.5 h-3.5', p.rating > 0 && 'fill-current')} />
                        {p.rating > 0 ? p.rating.toFixed(1) : '—'}
                      </span>
                    </td>
                    <td className="text-center px-4 py-3 hidden sm:table-cell text-muted-foreground">
                      {p.totalReviews > 0 ? p.totalReviews : '—'}
                    </td>
                    <td className={cn('text-center px-4 py-3 font-semibold', responseColor(p.avgResponseMin))}>
                      {formatMinutes(p.avgResponseMin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center">
        <TrendingUp className="w-3 h-3 inline mr-1" />
        Ordenado alfabeticamente · Tempo de resposta calculado entre criação e aceitação do serviço
      </p>
    </div>
  );
}