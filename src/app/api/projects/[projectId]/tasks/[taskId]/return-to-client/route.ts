import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasProjectAccess } from "@/lib/auth";
import { notifyStatusChange, notifyTaskAssignment } from "@/lib/notifications";
import { logAuditEvent, AUDIT_ACTIONS } from "@/lib/audit";

export async function POST(
  req: Request,
  { params }: { params: { projectId: string; taskId: string } }
) {
  try {
    const { projectId, taskId } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Необхідно авторизуватися" }, { status: 401 });
    }

    // Only staff (ADMIN and ENGINEER) can return tasks to client
    if (currentUser.role !== "ADMIN" && currentUser.role !== "ENGINEER") {
      return NextResponse.json(
        { error: "Тільки співробітники підтримки або адміністратори можуть повертати задачі клієнту" },
        { status: 403 }
      );
    }

    const hasAccess = await hasProjectAccess(currentUser.userId, projectId, currentUser.role);
    if (!hasAccess) {
      return NextResponse.json({ error: "У вас немає доступу до цієї задачі" }, { status: 403 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        column: true,
        assignee: { select: { id: true, name: true, email: true, role: true } },
        creator: { select: { id: true, name: true, email: true, role: true } },
        project: {
          include: {
            columns: { orderBy: { orderIndex: "asc" } },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Задачу не знайдено" }, { status: 404 });
    }

    if (!task.creatorId || !task.creator) {
      return NextResponse.json(
        { error: "У цієї задачі немає зазначеного автора (клієнта) для перепризначення" },
        { status: 400 }
      );
    }

    if (task.assigneeId === task.creatorId) {
      return NextResponse.json(
        { error: "Задача вже призначена на автора (клієнта)" },
        { status: 400 }
      );
    }

    const aiCtx = (task.aiContext || {}) as Record<string, any>;
    if (aiCtx.isClosed) {
      return NextResponse.json(
        { error: "Ця задача повністю закрита в системі" },
        { status: 400 }
      );
    }

    // Determine target column: Look for an "Awaiting client" column if available
    const cols = task.project.columns || [];
    const awaitingCol = cols.find((c) => {
      const n = (c.name || "").toLowerCase();
      return (
        !c.isDoneColumn &&
        (n.includes("очікує клієнт") ||
          n.includes("очікування") ||
          n.includes("очікує") ||
          n.includes("waiting") ||
          n.includes("client"))
      );
    });

    const targetColumnId = awaitingCol ? awaitingCol.id : task.columnId;

    // Remember the previous staff assignee so client can return task back to them
    const staffId =
      task.assigneeId ||
      (currentUser.role === "ADMIN" || currentUser.role === "ENGINEER" ? currentUser.userId : null);

    const mergedAiContext = {
      ...aiCtx,
      lastStaffAssigneeId: staffId,
      awaitingClient: true,
      returnedToClientAt: new Date().toISOString(),
      returnedToClientBy: currentUser.userId,
    };

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        assigneeId: task.creatorId,
        columnId: targetColumnId,
        aiContext: mergedAiContext,
      },
      include: {
        column: true,
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        creator: { select: { id: true, name: true, email: true, role: true } },
        subtasks: { orderBy: { orderIndex: "asc" } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
          },
        },
        attachments: { orderBy: { createdAt: "desc" } },
        aiRecommendations: { orderBy: { createdAt: "desc" } },
      },
    });

    // Notify task assignment
    notifyTaskAssignment({
      taskId,
      newAssigneeId: task.creatorId,
      assignedByUserId: currentUser.userId,
      origin: req.headers.get("origin") || undefined,
    }).catch((err) => console.error("notifyTaskAssignment error on return-to-client:", err));

    // Notify status change if column changed
    if (task.columnId !== targetColumnId) {
      notifyStatusChange({
        taskId,
        oldColumnId: task.columnId,
        newColumnId: targetColumnId,
        updatedByUserId: currentUser.userId,
        origin: req.headers.get("origin") || undefined,
      }).catch((err) => console.error("notifyStatusChange error on return-to-client:", err));
    }

    // Audit Log
    const changes: Record<string, any> = {
      assignee: {
        old: task.assignee?.name || "Не призначено",
        new: task.creator?.name || "Клієнт",
        oldRole: task.assignee?.role || null,
        newRole: task.creator?.role || null,
        oldAssigneeId: task.assigneeId,
        newAssigneeId: task.creatorId,
      },
    };

    if (task.columnId !== targetColumnId && awaitingCol) {
      changes.status = {
        old: task.column.name,
        new: awaitingCol.name,
        oldColumnId: task.columnId,
        newColumnId: awaitingCol.id,
      };
    }

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    const projectKey = task.project?.key || "ST";
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
        taskCode: `${projectKey}-${task.taskNumber}`,
        taskTitle: task.title,
        actorRole: currentUser.role,
        quickAction: "RETURN_TO_CLIENT",
        note: "Швидка дія: Повернено до клієнта (автора звернення)",
        changes,
      },
      ipAddress,
    });

    const latestAuditLogs = await prisma.auditLog.findMany({
      where: { targetType: "TASK", targetId: taskId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      task: { ...updated, auditLogs: latestAuditLogs },
    });
  } catch (error: any) {
    console.error("POST return-to-client error:", error);
    return NextResponse.json({ error: error.message || "Помилка сервера" }, { status: 500 });
  }
}
