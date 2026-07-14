"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      aria-label="Sair"
      className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-critical-bg hover:text-critical"
    >
      <LogOut size={17} />
    </button>
  );
}
