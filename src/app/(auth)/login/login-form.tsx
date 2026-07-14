"use client";

import { useState, useTransition } from "react";
import { authenticate } from "@/server/actions/auth";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export function LoginForm({ callbackUrl, error: initialError }: { callbackUrl?: string; error?: string }) {
  const [error, setError] = useState<string | null>(
    initialError ? "E-mail ou senha inválidos." : null,
  );
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await authenticate(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/dashboard"} />

      <Field label="E-mail">
        <Input type="email" name="email" placeholder="voce@exemplo.com" required autoFocus />
      </Field>

      <Field label="Senha">
        <Input type="password" name="password" placeholder="••••••••" required />
      </Field>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-critical-bg px-3 py-2 text-sm text-critical">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
