import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasProjectAccess, canDeleteTasks, canChangeTaskStatus } from "@/lib/auth";
import { notifyStatusChange, notifyTaskAssignment } from "@/lib/notifications";
import { logAuditEvent, AUDIT_ACTIONS } from "@/lib/audit";

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

    if (!currentUser) {
      return NextResponse.json({ error: "Необхідно авторизуватися для редагування задачі" }, { status: 401 });
    }

    const hasAccess = await hasProjectAccess(currentUser.userId, projectId, currentUser.role);
    if (!hasAccess) {
      return NextResponse.json({ error: "У вас немає доступу до цієї задачі" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, priority, columnId, dueDate, assigneeId, aiContext } = body;

    const existingTask = await prisma.task.findUnique({
      where: { id: taskId, projectId },
      select: {
        id: true,
        creatorId: true,
        columnId: true,
        assigneeId: true,
        aiContext: true,
        title: true,
        description: true,
        priority: true,
        taskNumber: true,
        project: { select: { key: true } },
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Задачу не знайдено" }, { status: 404 });
    }

    // Role-based restrictions for CLIENT:
    // Clients can ONLY edit their own tasks (created under their account) and only title, description, priority.
    if (currentUser.role === "CLIENT") {
      if (existingTask.creatorId !== currentUser.userId) {
        return NextResponse.json(
          { error: "Клієнти мають право редагувати виключно власні звернення (створені під своїм обліковим записом)." },
          { status: 403 }
        );
      }
      if (columnId !== undefined && columnId !== existingTask.columnId) {
        return NextResponse.json(
          { error: "Клієнти не мають права змінювати статус задачі." },
          { status: 403 }
        );
      }
      if (assigneeId !== undefined && assigneeId !== existingTask.assigneeId) {
        return NextResponse.json(
          { error: "Клієнти не мають права змінювати виконавця задачі." },
          { status: 403 }
        );
      }
      if (dueDate !== undefined) {
        return NextResponse.json(
          { error: "Клієнти не мають права змінювати термін виконання задачі." },
          { status: 403 }
        );
      }
      if (aiContext !== undefined) {
        return NextResponse.json(
          { error: "Клієнти не мають права змінювати параметри ШІ для задачі." },
          { status: 403 }
        );
      }
    }

    // Validate Title
    if (title !== undefined && !title.trim()) {
      return NextResponse.json(
        { error: "Назва задачі не може бути порожньою." },
        { status: 400 }
      );
    }

    // Validate and normalize Priority strictly against allowed enum
    let safePriority = priority;
    if (safePriority === "CRITICAL") safePriority = "URGENT";
    const ALLOWED_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
    if (safePriority !== undefined && !ALLOWED_PRIORITIES.includes(safePriority)) {
      return NextResponse.json(
        { error: "Неприпустимий рівень критичності. Доступні: LOW, MEDIUM, HIGH, URGENT (CRITICAL)." },
        { status: 400 }
      );
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

      const targetCol = await prisma.column.findUnique({ where: { id: columnId }, select: { name: true } });
      const targetColName = (targetCol?.name || "").toLowerCase();
      if (targetColName.includes("очікує") || targetColName.includes("waiting")) {
        const staffId =
          existingTask.assigneeId ||
          (currentUser.role === "ADMIN" || currentUser.role === "ENGINEER" ? currentUser.userId : null);
        if (staffId) {
          mergedAiContext = {
            ...existingAiContext,
            ...(mergedAiContext || {}),
            lastStaffAssigneeId: staffId,
            awaitingClient: true,
          };
        }
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

          // Remember previous staff assignee so client can return task back to them
          const staffId =
            existingTask.assigneeId && existingTask.assigneeId !== targetUser.id
              ? existingTask.assigneeId
              : currentUser.role === "ADMIN" || currentUser.role === "ENGINEER"
              ? currentUser.userId
              : null;

          if (staffId) {
            mergedAiContext = {
              ...existingAiContext,
              ...(mergedAiContext || {}),
              lastStaffAssigneeId: staffId,
              awaitingClient: true,
            };
          }
        }
      }
    }

    const updated = await prisma.task.update({
      where: { id: taskId, projectId },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        description: description !== undefined ? description : undefined,
        priority: safePriority !== undefined ? safePriority : undefined,
        columnId: columnId !== undefined ? columnId : undefined,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
        assigneeId: assigneeId !== undefined ? (assigneeId || null) : undefined,
        aiContext: mergedAiContext !== undefined ? mergedAiContext : undefined,
      },
      include: {
        column: true,
        assignee: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, email: true } },
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

    // 3. Record Audit Log for task updates
    const changes: Record<string, { old: any; new: any }> = {};
    if (title !== undefined && title.trim() !== existingTask.title) {
      changes.title = { old: existingTask.title, new: title.trim() };
    }
    if (description !== undefined && (description || "") !== (existingTask.description || "")) {
      changes.description = { old: existingTask.description || "", new: description || "" };
    }
    if (safePriority !== undefined && safePriority !== existingTask.priority) {
      changes.priority = { old: existingTask.priority, new: safePriority };
    }
    if (columnId !== undefined && columnId !== existingTask.columnId) {
      changes.columnId = { old: existingTask.columnId, new: columnId };
    }
    if (assigneeId !== undefined && (assigneeId || null) !== existingTask.assigneeId) {
      changes.assigneeId = { old: existingTask.assigneeId, new: assigneeId || null };
    }

    if (Object.keys(changes).length > 0) {
      const ipAddress =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        null;

      const projectKey = existingTask.project?.key || "ST";
      await logAuditEvent({
        actor: {
          userId: currentUser.userId,
          email: currentUser.email,
          name: currentUser.name,
        },
        action: AUDIT_ACTIONS.TASK_UPDATE,
        targetType: "TASK",
        targetId: taskId,
        details: {
          projectId,
          taskCode: `${projectKey}-${existingTask.taskNumber}`,
          taskTitle: updated.title,
          changes,
        },
        ipAddress,
      });
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
