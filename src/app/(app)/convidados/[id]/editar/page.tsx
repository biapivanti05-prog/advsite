import { getCurrentMembership } from "@/server/permissions";
import { db } from "@/server/db";
import { notFound } from "next/navigation";
import { updateGuest } from "@/server/actions/guests";
import { GuestForm } from "../../guest-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditGuestPage({ params }: { params: Promise<{ id: string }> }) {
  const membership = await getCurrentMembership();
  const { id } = await params;

  const [guest, allTags] = await Promise.all([
    db.guest.findFirst({ where: { id, weddingId: membership.weddingId }, include: { tags: { include: { tag: true } } } }),
    db.tag.findMany({ where: { weddingId: membership.weddingId, kind: "guest" }, orderBy: { name: "asc" } }),
  ]);
  if (!guest) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader><CardTitle>Editar convidado</CardTitle></CardHeader>
        <CardContent>
          <GuestForm guest={guest} allTags={allTags} action={updateGuest.bind(null, guest.id)} />
        </CardContent>
      </Card>
    </div>
  );
}
