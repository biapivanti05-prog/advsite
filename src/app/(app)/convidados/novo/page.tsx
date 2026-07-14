import { getCurrentMembership } from "@/server/permissions";
import { db } from "@/server/db";
import { createGuest } from "@/server/actions/guests";
import { GuestForm } from "../guest-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewGuestPage() {
  const membership = await getCurrentMembership();
  const allTags = await db.tag.findMany({ where: { weddingId: membership.weddingId, kind: "guest" }, orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader><CardTitle>Novo convidado</CardTitle></CardHeader>
        <CardContent>
          <GuestForm allTags={allTags} action={createGuest} />
        </CardContent>
      </Card>
    </div>
  );
}
