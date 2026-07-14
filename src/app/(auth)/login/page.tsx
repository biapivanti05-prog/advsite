import { LoginForm } from "./login-form";
import { Heart } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white">
            <Heart size={22} fill="currentColor" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink">Casório</h1>
          <p className="mt-1 text-sm text-ink-muted">Central de planejamento do casamento</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <LoginForm callbackUrl={params.callbackUrl} error={params.error} />
        </div>

        <p className="mt-6 text-center text-xs text-ink-muted">
          Acesso restrito aos noivos e colaboradores autorizados.
        </p>
      </div>
    </div>
  );
}
