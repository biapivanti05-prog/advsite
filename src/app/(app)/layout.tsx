import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getCurrentMembership } from "@/server/permissions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const membership = await getCurrentMembership();
  const { wedding } = membership;
  const coupleNames = `${wedding.partner1Name} & ${wedding.partner2Name}`;

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar coupleNames={coupleNames} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar weddingDate={wedding.weddingDate} userName={membership.user?.name ?? ""} coupleNames={coupleNames} />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
