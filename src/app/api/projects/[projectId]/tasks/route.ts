import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasProjectAccess } from "@/lib/auth";
import { notifyTaskAssignment } from "@/lib/notifications";
import { notifyTelegramTaskCreated } from "@/lib/telegram";

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const currentUser = await getCurrentUser();

    if (currentUser) {
      const hasAccess = await hasProjectAccess(currentUser.userId, projectId, currentUser.role);
      if (!hasAccess) {
        return NextResponse.json({ error: "У вас немає доступу до створення задач у цьому проекті" }, { status: 403 });
      }
    }

    const body = await req.json();
    const { title, description, columnId, priority = "MEDIUM", dueDate, assigneeId, aiContext } = body;

    let safePriority = priority;
    if (safePriority === "CRITICAL") safePriority = "URGENT";
    if (!["LOW", "MEDIUM", "HIGH", "URGENT"].includes(safePriority)) {
      safePriority = "MEDIUM";
    }

    if (!title?.trim()) {
      return NextResponse.json({ error: "Назва задачі обов'язкова" }, { status: 400 });
    }

    if (assigneeId) {
      if (currentUser?.role === "CLIENT") {
        return NextResponse.json(
          { error: "Клієнти не мають права призначати виконавця задачі" },
          { status: 403 }
        );
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: assigneeId },
        select: { id: true, role: true, email: true },
      });

      if (!targetUser) {
        return NextResponse.json({ error: "Призначеного користувача не знайдено" }, { status: 400 });
      }

      if (targetUser.role === "CLIENT" || targetUser.role === "MEMBER" || targetUser.role === "VIEWER") {
        const hasAccess = await hasProjectAccess(targetUser.id, projectId, targetUser.role, targetUser.email);
        if (!hasAccess) {
          return NextResponse.json(
            { error: "Користувач (клієнт) не має доступу до цього проєкту і не може бути призначений виконавцем" },
            { status: 400 }
          );
        }
      }
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        columns: { orderBy: { orderIndex: "asc" } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Проект не знайдено" }, { status: 404 });
    }

    let targetColumnId = columnId || project.columns[0]?.id;
    if (currentUser?.role === "CLIENT") {
      // Clients can only submit tasks into the initial column (Backlog)
      targetColumnId = project.columns[0]?.id;
    }
    if (!targetColumnId) {
      return NextResponse.json({ error: "У проекті немає колонок" }, { status: 400 });
    }

    // Determine next task number for this project
    const lastTask = await prisma.task.findFirst({
      where: { projectId },
      orderBy: { taskNumber: "desc" },
    });
    const nextNumber = lastTask ? lastTask.taskNumber + 1 : 1;
    const code = `${project.key}-${nextNumber}`;

    // Determine next orderIndex in this column
    const lastInColumn = await prisma.task.findFirst({
      where: { columnId: targetColumnId },
      orderBy: { orderIndex: "desc" },
    });
    const nextOrder = lastInColumn ? lastInColumn.orderIndex + 1 : 0;

    // Use current authenticated user or fallback to first user
    let creatorId = currentUser?.userId;
    if (!creatorId) {
      const fallbackUser = await prisma.user.findFirst();
      creatorId = fallbackUser?.id;
    }

    if (!creatorId) {
      return NextResponse.json({ error: "Користувача не знайдено" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        columnId: targetColumnId,
        taskNumber: nextNumber,
        code,
        title: title.trim(),
        description: description?.trim() || null,
        priority: safePriority,
        orderIndex: nextOrder,
        dueDate: dueDate ? new Date(dueDate) : null,
        creatorId,
        assigneeId: assigneeId || null,
        aiContext: aiContext || undefined,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, email: true } },
        subtasks: true,
        _count: {
          select: { comments: true, attachments: true, subtasks: true },
        },
      },
    });

    if (assigneeId) {
      notifyTaskAssignment({
        taskId: task.id,
        oldAssigneeId: null,
        newAssigneeId: assigneeId,
        assignedByUserId: currentUser?.userId || creatorId,
        origin: req.headers.get("origin") || undefined,
      }).catch((err) => console.error("notifyTaskAssignment error on create:", err));
    }

    // Trigger Telegram notification asynchronously
    notifyTelegramTaskCreated({
      task: {
        id: task.id,
        code: task.code,
        title: task.title,
        priority: task.priority,
        aiContext: task.aiContext,
      },
      project: {
        id: project.id,
        name: project.name,
        key: project.key,
      },
      creator: {
        name: task.creator?.name || currentUser?.email || "Користувач",
      },
      origin: req.headers.get("origin") || undefined,
    }).catch((err) => console.error("[Telegram] notifyTelegramTaskCreated error on create:", err));

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/projects/[id]/tasks error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
