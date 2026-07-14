import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { getCountdown } from "@/lib/countdown";
import { CalendarHeart } from "lucide-react";

export function Topbar({
  weddingDate,
  userName,
  coupleNames,
}: {
  weddingDate: Date;
  userName: string;
  coupleNames: string;
}) {
  const { totalDays, isPast } = getCountdown(weddingDate);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-2">
        <MobileNav coupleNames={coupleNames} />
        <div className="hidden items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 sm:flex">
          <CalendarHeart size={15} />
          {isPast ? "O grande dia chegou!" : `${totalDays} dias para o casamento`}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
        <span className="hidden text-sm text-ink-secondary sm:inline">{userName}</span>
        <SignOutButton />
      </div>
    </header>
  );
}
