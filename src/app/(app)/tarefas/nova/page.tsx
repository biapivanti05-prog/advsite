import { getCurrentMembership } from "@/server/permissions";
import { db } from "@/server/db";
import { createTask } from "@/server/actions/tasks";
import { TaskForm } from "../task-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ parentTaskId?: string }>;
}) {
  const membership = await getCurrentMembership();
  const { parentTaskId } = await searchParams;

  const [members, categories] = await Promise.all([
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

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Nova tarefa</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm
            members={members}
            categories={categories.map((c) => c.category!).filter(Boolean)}
            action={createTask}
            parentTaskId={parentTaskId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
