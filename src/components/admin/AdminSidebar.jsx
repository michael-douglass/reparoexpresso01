import React from 'react';
import { cn } from '@/lib/utils';
import {
  BarChart3, Calendar, ClipboardList, CheckSquare, Users,
  LayoutDashboard, DollarSign, Tag, UserCog, Route, Headphones,
  Shield, X
} from 'lucide-react';

export const SIDEBAR_ITEMS = [
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'calendario', label: 'Calendário', icon: Calendar, badge: true },
  { key: 'chamados', label: 'Chamados', icon: ClipboardList },
  { key: 'checklists', label: 'Checklists', icon: CheckSquare },
  { key: 'clientes', label: 'Clientes', icon: Users },
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'financeiro', label: 'Financeiro', icon: DollarSign },
  { key: 'precos', label: 'Preços', icon: Tag },
  { key: 'prestadores', label: 'Prestadores', icon: UserCog },
  { key: 'rotas', label: 'Rotas', icon: Route },
];

const BOTTOM_ITEMS = [
  { key: 'suporte', label: 'Suporte / Central de Ajuda', icon: Headphones },
];

export default function AdminSidebar({ active, onChange, calendarBadge = 0, mobileOpen, onCloseMobile }) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-60 bg-sidebar border-r border-sidebar-border flex flex-col h-full transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-foreground leading-tight text-sm">REPARO EXPRESSO</p>
              <p className="text-[10px] text-muted-foreground leading-tight">desde 2011</p>
            </div>
          </div>
          <button onClick={onCloseMobile} className="lg:hidden p-1 hover:bg-sidebar-accent rounded-lg">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Nav — ordem alfabética */}
        <nav className="flex-1 overflow-y-auto py-2">
          {SIDEBAR_ITEMS.map(item => {
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { onChange(item.key); onCloseMobile?.(); }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && calendarBadge > 0 && (
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full font-bold",
                    isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary text-primary-foreground"
                  )}>
                    {calendarBadge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom — Suporte */}
        <div className="py-2 border-t border-sidebar-border">
          {BOTTOM_ITEMS.map(item => {
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { onChange(item.key); onCloseMobile?.(); }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}