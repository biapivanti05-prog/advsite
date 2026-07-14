"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X, LayoutDashboard, ListChecks, CalendarRange, Users, Wallet, Settings, Heart } from "lucide-react";

const mainNav = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/tarefas", label: "Tarefas", icon: ListChecks },
  { href: "/cronograma", label: "Cronograma", icon: CalendarRange },
  { href: "/convidados", label: "Convidados", icon: Users },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function MobileNav({ coupleNames }: { coupleNames: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-secondary hover:bg-black/[0.04]"
      >
        <Menu size={19} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative flex w-72 max-w-[85vw] flex-col bg-surface p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white">
                  <Heart size={14} fill="currentColor" />
                </div>
                <span className="font-display text-sm font-semibold text-ink">{coupleNames}</span>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Fechar menu">
                <X size={19} className="text-ink-secondary" />
              </button>
            </div>
            <nav>
              <ul className="space-y-0.5">
                {mainNav.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium",
                          active ? "bg-brand-50 text-brand-700" : "text-ink-secondary",
                        )}
                      >
                        <Icon size={17} />
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
