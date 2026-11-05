import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasProjectAccess, canChangeTaskStatus } from "@/lib/auth";
import { notifyStatusChange } from "@/lib/notifications";

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Необхідно авторизуватись" }, { status: 401 });
    }

    const hasAccess = await hasProjectAccess(currentUser.userId, projectId, currentUser.role);
    if (!hasAccess) {
      return NextResponse.json({ error: "У вас немає доступу до цього проєкту" }, { status: 403 });
    }

    // CLIENT role is forbidden from reordering or moving tasks between statuses/columns
    if (!canChangeTaskStatus(currentUser.role)) {
      return NextResponse.json(
        { error: "Клієнти не мають права переводити задачу в інші статуси" },
        { status: 403 }
      );
    }
    const body = await req.json();
    const {
      taskId,
      destinationColumnId,
      updatedTasks, // array of { id: string; columnId: string; orderIndex: number }
    } = body;

    if (!Array.isArray(updatedTasks)) {
      return NextResponse.json({ error: "updatedTasks array is required" }, { status: 400 });
    }

    let oldColumnId: string | null = null;
    if (taskId && destinationColumnId) {
      const currentTask = await prisma.task.findUnique({
        where: { id: taskId, projectId },
        select: { columnId: true },
      });
      if (currentTask && currentTask.columnId !== destinationColumnId) {
        oldColumnId = currentTask.columnId;
      }
    }

    // Run updates in a single Prisma transaction
    await prisma.$transaction(
      updatedTasks.map((t) =>
        prisma.task.update({
          where: { id: t.id, projectId },
          data: {
            columnId: t.columnId,
            orderIndex: t.orderIndex,
          },
        })
      )
    );

    // Notify status change if task moved between columns
    if (taskId && destinationColumnId && oldColumnId) {
      notifyStatusChange({
        taskId,
        oldColumnId,
        newColumnId: destinationColumnId,
        updatedByUserId: currentUser?.userId,
        origin: req.headers.get("origin") || undefined,
      }).catch((err) => console.error("notifyStatusChange on reorder error:", err));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/projects/[id]/tasks/reorder error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
