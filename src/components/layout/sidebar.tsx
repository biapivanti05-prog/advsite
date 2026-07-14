"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ListChecks,
  CalendarRange,
  Users,
  Wallet,
  Settings,
  Heart,
  Truck,
  Palette,
  UtensilsCrossed,
  Camera,
  Music,
  Gift,
  Plane,
  ShieldAlert,
  Building2,
  FileText,
} from "lucide-react";

const mainNav = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/tarefas", label: "Tarefas", icon: ListChecks },
  { href: "/cronograma", label: "Cronograma", icon: CalendarRange },
  { href: "/convidados", label: "Convidados", icon: Users },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
];

const comingSoon = [
  { label: "Fornecedores", icon: Building2 },
  { label: "Contratos e documentos", icon: FileText },
  { label: "Cerimônia e recepção", icon: Heart },
  { label: "Decoração", icon: Palette },
  { label: "Buffet e bebidas", icon: UtensilsCrossed },
  { label: "Fotografia e música", icon: Camera },
  { label: "Música e entretenimento", icon: Music },
  { label: "Hospedagem e transporte", icon: Truck },
  { label: "Lua de mel", icon: Plane },
  { label: "Presentes", icon: Gift },
  { label: "Riscos e contingência", icon: ShieldAlert },
];

export function Sidebar({ coupleNames }: { coupleNames: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white">
          <Heart size={16} fill="currentColor" />
        </div>
        <div>
          <p className="font-display text-sm font-semibold leading-tight text-ink">{coupleNames}</p>
          <p className="text-[11px] text-ink-muted">Casório</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin">
        <ul className="space-y-0.5">
          {mainNav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-brand-50 text-brand-700" : "text-ink-secondary hover:bg-black/[0.03] hover:text-ink",
                  )}
                >
                  <Icon size={17} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mt-6 mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          Próximas fases
        </p>
        <ul className="space-y-0.5">
          {comingSoon.map(({ label, icon: Icon }) => (
            <li key={label}>
              <span className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-muted/70">
                <Icon size={17} />
                {label}
              </span>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/configuracoes"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/configuracoes"
              ? "bg-brand-50 text-brand-700"
              : "text-ink-secondary hover:bg-black/[0.03] hover:text-ink",
          )}
        >
          <Settings size={17} />
          Configurações
        </Link>
      </div>
    </aside>
  );
}
