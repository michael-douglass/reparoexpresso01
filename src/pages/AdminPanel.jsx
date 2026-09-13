import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, XCircle, Clock, Users, Briefcase, Star, TrendingUp,
  KeyRound, Eye, EyeOff, FileText, Activity, Trophy, Bell, Search,
  Settings, Menu, Shield
} from "lucide-react";
import ServicePricingByRegion from '../components/admin/ServicePricingByRegion';
import ServicePricingByCategory from '../components/admin/ServicePricingByCategory';
import ProviderRepasse from '../components/admin/ProviderRepasse';
import Analytics from '../components/admin/Analytics';
import ScheduledServicesOptimizer from '../components/admin/ScheduledServicesOptimizer';
import ChecklistsAdmin from '../components/admin/ChecklistsAdmin';
import AdditionalPointsAdmin from '../components/admin/AdditionalPointsAdmin';
import ProviderPhotosApproval from '../components/admin/ProviderPhotosApproval';
import ProviderDetailsModal from '../components/admin/ProviderDetailsModal';
import AdminReserveFundDashboard from '../components/AdminReserveFundDashboard';
import InvoicesAdmin from '../components/admin/InvoicesAdmin';
import BiweeklyClosingAdmin from '../components/admin/BiweeklyClosingAdmin';
import ClientConsultaAdmin from '../components/admin/ClientConsultaAdmin';
import ServiceMetrics from '../components/admin/ServiceMetrics';
import ClientBlacklist from '../components/admin/ClientBlacklist';
import TowPricing from '../components/admin/TowPricing';
import MotoPecaPricing from '../components/admin/MotoPecaPricing';
import ProviderDocumentReview from '../components/admin/ProviderDocumentReview';
import ExpiringServicesAlert from '../components/admin/ExpiringServicesAlert';
import ProviderTermsManager from '../components/admin/ProviderTermsManager';
import ClientTermsManager from '../components/admin/ClientTermsManager';
import TicketsAdmin from '../components/admin/TicketsAdmin';
import ScheduledCalendar from '../components/admin/ScheduledCalendar';
import UndoProviderAction from '../components/admin/UndoProviderAction';
import ReembolsosRepasses from '../components/admin/ReembolsosRepasses';
import ActivityLog from '../components/admin/ActivityLog';
import CouponsAdmin from '../components/admin/CouponsAdmin';
import SurchargeRulesAdmin from '../components/admin/SurchargeRulesAdmin';
import CashbackConfigAdmin from '../components/admin/CashbackConfigAdmin';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminDashboard from '../components/admin/AdminDashboard';
import { logAdminAction } from '@/lib/adminLog';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  aguardando: "bg-yellow-100 text-yellow-800",
  aceito: "bg-blue-100 text-blue-800",
  a_caminho: "bg-blue-100 text-blue-800",
  em_andamento: "bg-purple-100 text-purple-800",
  concluido: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
};

const STATUS_LABELS = {
  aguardando: "Aguardando", aceito: "Aceito", a_caminho: "A caminho",
  em_andamento: "Em andamento", concluido: "Concluído", cancelado: "Cancelado",
};

const SERVICE_LABELS = {
  eletrica: "Elétrica", hidraulica: "Hidráulica", pintura: "Pintura",
  reparo_geral: "Reparo Geral", montagem: "Montagem", alvenaria: "Alvenaria",
  fechadura: "Fechadura", ar_condicionado: "Ar Condicionado", outros: "Outros",
};

function SectionWrapper({ title, children }) {
  return (
    <div className="space-y-4">
      {title && <h2 className="text-lg font-bold text-foreground">{title}</h2>}
      {children}
    </div>
  );
}

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setAdminUser(u)).catch(() => {});
  }, []);

  const togglePassword = (reqId) => {
    setRevealedPasswords(prev => ({ ...prev, [reqId]: !prev[reqId] }));
  };

  const cancelRequest = useMutation({
    mutationFn: (id) => base44.entities.ServiceRequest.update(id, { status: 'cancelado' }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['all-requests'] });
      toast.success("Atendimento cancelado.");
      setCancelConfirm(null);
      const req = requests.find(r => r.id === id);
      logAdminAction({
        action: 'service_cancelled',
        actorName: adminUser?.full_name || 'Admin',
        actorEmail: adminUser?.email || '',
        entityType: 'ServiceRequest',
        entityId: id,
        entityLabel: req ? `${req.service_type} - ${req.client_name}` : id,
        oldValue: 'em_andamento',
        newValue: 'cancelado',
      });
    },
  });

  const { data: requests = [] } = useQuery({
    queryKey: ['all-requests'],
    queryFn: () => base44.entities.ServiceRequest.list('-created_date'),
    refetchInterval: 15000,
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['all-providers'],
    queryFn: () => base44.entities.Provider.list(),
  });

  const pendingPhotoProviders = providers.filter(p => p.photos_pending_review);

  const approveProvider = useMutation({
    mutationFn: ({ id, approved }) => base44.entities.Provider.update(id, { is_approved: approved }),
    onSuccess: (_, { id, approved, providerName }) => {
      queryClient.invalidateQueries({ queryKey: ['all-providers'] });
      toast.success(approved ? "Prestador aprovado!" : "Prestador reprovado");
      logAdminAction({
        action: approved ? 'provider_approved' : 'provider_rejected',
        actorName: adminUser?.full_name || 'Admin',
        actorEmail: adminUser?.email || '',
        entityType: 'Provider',
        entityId: id,
        entityLabel: providerName || id,
        newValue: approved ? 'aprovado' : 'reprovado',
      });
    },
  });

  const rejectProvider = useMutation({
    mutationFn: ({ providerId, rejectReason, providerName }) => base44.entities.Provider.update(providerId, {
      is_rejected: true,
      rejection_reason: rejectReason,
      rejected_at: new Date().toISOString(),
      is_approved: false,
      is_archived: true,
    }),
    onSuccess: (_, { providerId, rejectReason, providerName }) => {
      queryClient.invalidateQueries({ queryKey: ['all-providers'] });
      toast.success("Prestador reprovado e arquivado com sucesso");
      setSelectedProvider(null);
      logAdminAction({
        action: 'provider_rejected',
        actorName: adminUser?.full_name || 'Admin',
        actorEmail: adminUser?.email || '',
        entityType: 'Provider',
        entityId: providerId,
        entityLabel: providerName || providerId,
        newValue: 'reprovado',
        details: rejectReason,
      });
    },
  });

  const blockProvider = useMutation({
    mutationFn: ({ providerId, blockReason, providerName }) => base44.entities.Provider.update(providerId, {
      is_blocked: true,
      block_reason: blockReason,
      blocked_at: new Date().toISOString(),
      is_approved: false,
      is_archived: true,
    }),
    onSuccess: (_, { providerId, blockReason, providerName }) => {
      queryClient.invalidateQueries({ queryKey: ['all-providers'] });
      toast.success("Prestador bloqueado e arquivado com sucesso");
      setSelectedProvider(null);
      logAdminAction({
        action: 'provider_blocked',
        actorName: adminUser?.full_name || 'Admin',
        actorEmail: adminUser?.email || '',
        entityType: 'Provider',
        entityId: providerId,
        entityLabel: providerName || providerId,
        newValue: 'bloqueado',
        details: blockReason,
      });
    },
  });

  const stats = {
    total: requests.length,
    active: requests.filter(r => ['aguardando', 'aceito', 'a_caminho', 'em_andamento'].includes(r.status)).length,
    completed: requests.filter(r => r.status === 'concluido').length,
    providers_online: providers.filter(p => p.is_online).length,
    providers_approved: providers.filter(p => p.is_approved).length,
    revenue: requests.filter(r => r.final_price).reduce((acc, r) => acc + (r.final_price || 0), 0),
  };

  const pendingProviders = providers.filter(p => !p.is_approved && !p.is_blocked && !p.is_rejected);
  const scheduledCount = requests.filter(r => r.status === 'agendado').length;

  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboard stats={stats} requests={requests} providers={providers} />;
      case 'analytics':
        return (
          <SectionWrapper>
            <Analytics />
            <div className="border-t border-border pt-4 mt-4">
              <ServiceMetrics />
            </div>
          </SectionWrapper>
        );
      case 'calendario':
        return <ScheduledCalendar />;
      case 'chamados':
        return (
          <div className="space-y-3">
            <ExpiringServicesAlert />
            {pendingProviders.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-2 mb-2 text-xs">
                <p className="font-semibold text-yellow-800">⚠️ {pendingProviders.length} prestador(es) aguardando aprovação</p>
              </div>
            )}
            {pendingPhotoProviders.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-2 mb-3 text-xs">
                <p className="font-semibold text-orange-800">📷 {pendingPhotoProviders.length} fotos aguardando aprovação</p>
              </div>
            )}
            {requests.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">Nenhum chamado ainda</p>
            ) : requests.map(req => (
              <Card key={req.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{SERVICE_LABELS[req.service_type] || req.service_type}</span>
                        {req.service_number && <span className="text-xs font-mono text-primary/70 bg-primary/10 px-2 py-0.5 rounded">{req.service_number}</span>}
                        <Badge className={cn("text-xs border-0", STATUS_COLORS[req.status])}>{STATUS_LABELS[req.status]}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{req.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        👤 {req.client_name} · 📍 {req.city || req.address}
                        {req.provider_name && ` · 🔧 ${req.provider_name}`}
                      </p>
                    </div>
                    {req.final_price && (
                      <span className="font-bold text-primary text-lg shrink-0">R$ {req.final_price}</span>
                    )}
                  </div>

                  {req.validation_password && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                      <KeyRound className="w-4 h-4 text-amber-700 flex-shrink-0" />
                      <span className="text-xs text-amber-700 font-semibold flex-1">Senha de validação:</span>
                      <span className={cn("font-mono font-bold text-amber-900 tracking-widest text-sm", !revealedPasswords[req.id] && "blur-sm select-none")}>
                        {req.validation_password}
                      </span>
                      <button onClick={() => togglePassword(req.id)} className="p-1 hover:bg-amber-100 rounded-lg">
                        {revealedPasswords[req.id]
                          ? <EyeOff className="w-4 h-4 text-amber-700" />
                          : <Eye className="w-4 h-4 text-amber-700" />}
                      </button>
                    </div>
                  )}

                  {!['cancelado', 'concluido', 'aguardando'].includes(req.status) && (
                    <UndoProviderAction request={req} adminUser={adminUser} />
                  )}

                  {!['cancelado', 'concluido'].includes(req.status) && (
                    cancelConfirm === req.id ? (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-2">
                        <p className="text-xs text-red-700 font-semibold flex-1">Confirmar cancelamento?</p>
                        <Button size="sm" variant="outline" className="rounded-lg text-xs h-7 px-2" onClick={() => setCancelConfirm(null)}>Não</Button>
                        <Button size="sm" className="rounded-lg text-xs h-7 px-2 bg-destructive hover:bg-destructive/90 text-white" onClick={() => cancelRequest.mutate(req.id)} disabled={cancelRequest.isPending}>
                          Sim, cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5 text-xs"
                        onClick={() => setCancelConfirm(req.id)}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Cancelar atendimento
                      </Button>
                    )
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        );
      case 'checklists':
        return (
          <SectionWrapper>
            <ChecklistsAdmin />
            <div className="border-t border-border pt-4 mt-4">
              <AdditionalPointsAdmin />
            </div>
          </SectionWrapper>
        );
      case 'clientes':
        return (
          <SectionWrapper>
            <ClientConsultaAdmin />
            <div className="border-t border-border pt-4 mt-4">
              <ClientBlacklist />
            </div>
            <div className="border-t border-border pt-4 mt-4">
              <ClientTermsManager />
            </div>
          </SectionWrapper>
        );
      case 'financeiro':
        return (
          <SectionWrapper>
            <ProviderRepasse />
            <div className="border-t border-border pt-4 mt-4">
              <AdminReserveFundDashboard />
            </div>
            <div className="border-t border-border pt-4 mt-4">
              <InvoicesAdmin />
            </div>
            <div className="border-t border-border pt-4 mt-4">
              <BiweeklyClosingAdmin />
            </div>
            <div className="border-t border-border pt-4 mt-4">
              <ReembolsosRepasses />
            </div>
          </SectionWrapper>
        );
      case 'precos':
        return (
          <SectionWrapper>
            <ServicePricingByRegion />
            <div className="border-t border-border pt-4 mt-4">
              <TowPricing />
            </div>
            <div className="border-t border-border pt-4 mt-4">
              <MotoPecaPricing />
            </div>
            <div className="border-t border-border pt-4 mt-4">
              <ServicePricingByCategory />
            </div>
            <div className="border-t border-border pt-4 mt-4">
              <CouponsAdmin />
            </div>
            <div className="border-t border-border pt-4 mt-4">
              <SurchargeRulesAdmin />
            </div>
            <div className="border-t border-border pt-4 mt-4">
              <CashbackConfigAdmin />
            </div>
          </SectionWrapper>
        );
      case 'prestadores':
        return (
          <div className="space-y-4">
            {pendingProviders.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-2 text-xs">
                <p className="font-semibold text-yellow-800">⚠️ {pendingProviders.length} prestador(es) aguardando aprovação</p>
              </div>
            )}
            {pendingPhotoProviders.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-2 text-xs">
                <p className="font-semibold text-orange-800">📷 {pendingPhotoProviders.length} fotos aguardando aprovação</p>
              </div>
            )}
            <div className="space-y-3">
              {providers.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">Nenhum prestador cadastrado</p>
              ) : providers.filter(p => !p.is_blocked && !p.is_rejected).map(prov => (
                <Card key={prov.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="font-bold text-primary">{prov.name?.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{prov.name}</p>
                          <p className="text-sm text-muted-foreground">{prov.city} · {prov.phone}</p>
                          <div className="flex gap-2 mt-1">
                            {prov.is_approved ? (
                              <Badge className="bg-green-100 text-green-800 border-0 text-xs">Aprovado</Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800 border-0 text-xs">Pendente</Badge>
                            )}
                            {prov.is_online && <Badge className="bg-primary/10 text-primary border-0 text-xs">Online</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setSelectedProvider(prov)}>
                          <FileText className="w-4 h-4 mr-1" /> Ver ficha
                        </Button>
                        {!prov.is_approved && (
                          <>
                            <Button size="sm" className="rounded-xl bg-green-600 text-white hover:bg-green-700" onClick={() => approveProvider.mutate({ id: prov.id, approved: true, providerName: prov.name })}>
                              <CheckCircle2 className="w-4 h-4 mr-1" /> Aprovar
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => setSelectedProvider(prov)}>
                              <XCircle className="w-4 h-4 mr-1" /> Reprovar
                            </Button>
                          </>
                        )}
                        {prov.is_approved && (
                          <Button size="sm" variant="outline" className="rounded-xl text-destructive border-destructive/30" onClick={() => approveProvider.mutate({ id: prov.id, approved: false, providerName: prov.name })}>
                            <XCircle className="w-4 h-4 mr-1" /> Bloquear
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="border-t border-border pt-4 mt-4">
              <ProviderPhotosApproval />
            </div>
            <div className="border-t border-border pt-4 mt-4">
              <ProviderDocumentReview />
            </div>
            <div className="border-t border-border pt-4 mt-4">
              <ProviderTermsManager />
            </div>
          </div>
        );
      case 'rotas':
        return <ScheduledServicesOptimizer />;
      case 'suporte':
        return (
          <SectionWrapper>
            <TicketsAdmin />
            <div className="border-t border-border pt-4 mt-4">
              <ActivityLog />
            </div>
          </SectionWrapper>
        );
      default:
        return <AdminDashboard stats={stats} requests={requests} providers={providers} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar
        active={activeSection}
        onChange={setActiveSection}
        calendarBadge={scheduledCount}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-accent rounded-lg"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <div className="hidden lg:block">
              <p className="font-bold text-foreground leading-tight">Painel Administrativo</p>
              <p className="text-xs text-muted-foreground">
                Visão geral — {today} · Atualizado agora
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/premiacao">
              <Button size="sm" className="gap-2 rounded-xl bg-primary">
                <Trophy className="w-4 h-4" /> Premiação
              </Button>
            </Link>
            <Link to="/dashboard-admin">
              <Button size="sm" variant="outline" className="gap-2 rounded-xl border-primary text-primary hover:bg-primary/10">
                <Activity className="w-4 h-4" /> Dashboard Executivo
              </Button>
            </Link>
            <div className="hidden sm:flex items-center gap-1 ml-2 pl-2 border-l border-border">
              <button className="p-2 hover:bg-accent rounded-lg relative">
                <Bell className="w-4 h-4 text-muted-foreground" />
                {(pendingProviders.length > 0 || pendingPhotoProviders.length > 0) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                )}
              </button>
              <button className="p-2 hover:bg-accent rounded-lg">
                <Search className="w-4 h-4 text-muted-foreground" />
              </button>
              <button className="p-2 hover:bg-accent rounded-lg">
                <Settings className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="flex items-center gap-2 ml-1 pl-2 border-l border-border">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">
                    {(adminUser?.full_name || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground hidden md:block">
                  {adminUser?.full_name || 'Admin'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {/* Mobile title */}
          <div className="lg:hidden mb-4">
            <h1 className="text-xl font-bold text-foreground">Painel Administrativo</h1>
            <p className="text-xs text-muted-foreground">Visão geral — {today}</p>
          </div>
          {renderContent()}
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card px-4 py-2 flex items-center justify-between text-xs text-muted-foreground flex-shrink-0">
          <span>REPARO EXPRESSO v2.1 · Sistema online · Suporte 24/7 (11) 4000-0000</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Todos os sistemas operacionais
          </span>
        </footer>
      </div>

      {selectedProvider && (
        <ProviderDetailsModal
          provider={selectedProvider}
          onClose={() => setSelectedProvider(null)}
          onApprove={(id, approved) => approveProvider.mutate({ id, approved, providerName: selectedProvider.name })}
          onReject={(id, reason) => rejectProvider.mutate({ providerId: id, rejectReason: reason, providerName: selectedProvider.name })}
          onBlock={(id, reason) => blockProvider.mutate({ providerId: id, blockReason: reason, providerName: selectedProvider.name })}
        />
      )}
    </div>
  );
}