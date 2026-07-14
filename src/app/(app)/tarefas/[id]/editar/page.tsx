import { getCurrentMembership } from "@/server/permissions";
import { db } from "@/server/db";
import { notFound } from "next/navigation";
import { updateTask } from "@/server/actions/tasks";
import { TaskForm } from "../../task-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const membership = await getCurrentMembership();
  const { id } = await params;

  const [task, members, categories] = await Promise.all([
    db.task.findFirst({ where: { id, weddingId: membership.weddingId } }),
    db.user.findMany({
      where: { memberships: { some: { weddingId: membership.weddingId } } },
      select: { id: true, name: true },
    }),
    db.task.findMany({
      where: { weddingId: membership.weddingId, category: { not: null } },
      distinct: ["category"],
      select: { category: true },
    }),
  ]);
  if (!task) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader><CardTitle>Editar tarefa</CardTitle></CardHeader>
        <CardContent>
          <TaskForm
            task={task}
            members={members}
            categories={categories.map((c) => c.category!).filter(Boolean)}
            action={updateTask.bind(null, task.id)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
