import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasProjectAccess, canDeleteTasks, canChangeTaskStatus } from "@/lib/auth";
import { notifyStatusChange, notifyTaskAssignment } from "@/lib/notifications";

export async function GET(
  req: Request,
  { params }: { params: { projectId: string; taskId: string } }
) {
  try {
    const { projectId, taskId } = params;
    const currentUser = await getCurrentUser();

    if (currentUser) {
      const hasAccess = await hasProjectAccess(currentUser.userId, projectId, currentUser.role);
      if (!hasAccess) {
        return NextResponse.json({ error: "У вас немає доступу до цієї задачі" }, { status: 403 });
      }
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId, projectId },
      include: {
        column: true,
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, email: true } },
        subtasks: { orderBy: { orderIndex: "asc" } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        attachments: { orderBy: { createdAt: "desc" } },
        aiRecommendations: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Задачу не знайдено" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error: any) {
    console.error("GET /api/projects/[id]/tasks/[taskId] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { projectId: string; taskId: string } }
) {
  try {
    const { projectId, taskId } = params;
    const currentUser = await getCurrentUser();

    if (currentUser) {
      const hasAccess = await hasProjectAccess(currentUser.userId, projectId, currentUser.role);
      if (!hasAccess) {
        return NextResponse.json({ error: "У вас немає доступу до цієї задачі" }, { status: 403 });
      }
    }

    const body = await req.json();
    const { title, description, priority, columnId, dueDate, assigneeId, aiContext } = body;

    const existingTask = await prisma.task.findUnique({
      where: { id: taskId, projectId },
      select: { columnId: true, assigneeId: true, aiContext: true },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Задачу не знайдено" }, { status: 404 });
    }

    // Protection for permanently closed tasks
    const existingAiContext = (existingTask.aiContext || {}) as Record<string, any>;
    const isAlreadyClosed = Boolean(existingAiContext.isClosed);

    if (isAlreadyClosed) {
      // Forbid moving out of Done or reopening
      if (columnId !== undefined && columnId !== existingTask.columnId) {
        return NextResponse.json(
          { error: "Ця задача повністю закрита. Перевідкриття або переміщення в іншу колонку заблоковано." },
          { status: 400 }
        );
      }
      if (aiContext !== undefined) {
        if (aiContext.isClosed === false) {
          return NextResponse.json(
            { error: "Неможливо повторно відкрити повністю закриту задачу." },
            { status: 400 }
          );
        }
        if (aiContext.resolution && aiContext.resolution !== "Вирішено") {
          return NextResponse.json(
            { error: "Рішення закритої задачі зафіксовано як «Вирішено»." },
            { status: 400 }
          );
        }
      }
    }

    // If closing now, enforce resolution = "Вирішено"
    let mergedAiContext = aiContext;
    if (aiContext !== undefined && aiContext.isClosed === true) {
      mergedAiContext = {
        ...existingAiContext,
        ...aiContext,
        isClosed: true,
        resolution: "Вирішено",
      };
    }

    // Only ADMIN and ENGINEER can change task column/status. CLIENT is forbidden.
    if (columnId !== undefined && columnId !== existingTask.columnId) {
      if (!currentUser || !canChangeTaskStatus(currentUser.role)) {
        return NextResponse.json(
          { error: "Клієнти не мають права переводити задачу в інші статуси. Це можуть робити лише адміністратор та інженер." },
          { status: 403 }
        );
      }
    }

    // Only ADMIN and ENGINEER can change assigneeId. CLIENT is forbidden.
    if (assigneeId !== undefined) {
      if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "ENGINEER")) {
        return NextResponse.json(
          { error: "Клієнти не мають права на зміну виконавця задачі" },
          { status: 403 }
        );
      }

      if (assigneeId) {
        const targetUser = await prisma.user.findUnique({
          where: { id: assigneeId },
          select: { id: true, role: true, email: true },
        });

        if (!targetUser) {
          return NextResponse.json(
            { error: "Призначеного користувача не знайдено в системі" },
            { status: 400 }
          );
        }

        // Clients CANNOT be assigned to tasks in a project unless they have explicit access to this project!
        if (targetUser.role === "CLIENT" || targetUser.role === "MEMBER" || targetUser.role === "VIEWER") {
          const hasAccess = await hasProjectAccess(targetUser.id, projectId, targetUser.role, targetUser.email);
          if (!hasAccess) {
            return NextResponse.json(
              { error: "Користувач (клієнт) не має доступу до цього проєкту і не може бути призначений виконавцем." },
              { status: 400 }
            );
          }
        }
      }
    }

    const updated = await prisma.task.update({
      where: { id: taskId, projectId },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        description: description !== undefined ? description : undefined,
        priority: priority !== undefined ? priority : undefined,
        columnId: columnId !== undefined ? columnId : undefined,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
        assigneeId: assigneeId !== undefined ? (assigneeId || null) : undefined,
        aiContext: mergedAiContext !== undefined ? mergedAiContext : undefined,
      },
      include: {
        column: true,
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        subtasks: { orderBy: { orderIndex: "asc" } },
        _count: {
          select: { comments: true, attachments: true, subtasks: true },
        },
      },
    });

    // 1. Notify on status change
    if (existingTask && columnId && columnId !== existingTask.columnId) {
      notifyStatusChange({
        taskId,
        oldColumnId: existingTask.columnId,
        newColumnId: columnId,
        updatedByUserId: currentUser?.userId,
        origin: req.headers.get("origin") || undefined,
      }).catch((err) => console.error("notifyStatusChange error:", err));
    }

    // 2. Notify on assignee assignment/reassignment
    const targetAssigneeId = assigneeId !== undefined ? (assigneeId || null) : existingTask?.assigneeId;
    if (existingTask && targetAssigneeId && targetAssigneeId !== existingTask.assigneeId) {
      notifyTaskAssignment({
        taskId,
        oldAssigneeId: existingTask.assigneeId,
        newAssigneeId: targetAssigneeId,
        assignedByUserId: currentUser?.userId,
        origin: req.headers.get("origin") || undefined,
      }).catch((err) => console.error("notifyTaskAssignment error:", err));
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH task error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { projectId: string; taskId: string } }
) {
  try {
    const { projectId, taskId } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser || !canDeleteTasks(currentUser.role)) {
      return NextResponse.json(
        { error: "Тільки адміністратор має право видаляти задачі" },
        { status: 403 }
      );
    }

    await prisma.task.delete({ where: { id: taskId, projectId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE task error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
