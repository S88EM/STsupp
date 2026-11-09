import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasProjectAccess } from "@/lib/auth";
import { notifyStatusChange, notifyTaskAssignment, notifyNewComment } from "@/lib/notifications";
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

    const hasAccess = await hasProjectAccess(currentUser.userId, projectId, currentUser.role);
    if (!hasAccess) {
      return NextResponse.json({ error: "У вас немає доступу до цієї задачі" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { comment } = body;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        column: true,
        assignee: { select: { id: true, name: true, email: true, role: true } },
        creator: { select: { id: true, name: true, email: true, role: true } },
        project: {
          include: {
            columns: { orderBy: { orderIndex: "asc" } },
            members: {
              include: {
                user: { select: { id: true, name: true, email: true, role: true } },
              },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Задачу не знайдено" }, { status: 404 });
    }

    // Role check: If CLIENT, verify they have project access (already verified above)
    // Clients can return any task of their project/organization to support after providing feedback

    // Protection: closed / done tasks cannot be returned without reopening
    if (task.column.isDoneColumn) {
      return NextResponse.json(
        { error: "Завершене звернення не можна повернути до підтримки." },
        { status: 400 }
      );
    }

    const aiCtx = (task.aiContext || {}) as Record<string, any>;
    if (aiCtx.isClosed) {
      return NextResponse.json(
        { error: "Ця задача повністю закрита в системі." },
        { status: 400 }
      );
    }

    // 1. Determine Target Staff Assignee
    let targetAssigneeId: string | null = null;

    // Check candidate 1: aiContext.lastStaffAssigneeId
    if (aiCtx.lastStaffAssigneeId) {
      const candUser = await prisma.user.findUnique({
        where: { id: aiCtx.lastStaffAssigneeId },
        select: { id: true, role: true },
      });
      if (candUser && (candUser.role === "ENGINEER" || candUser.role === "ADMIN")) {
        targetAssigneeId = candUser.id;
      }
    }

    // Check candidate 2: latest comment author who is staff (ENGINEER or ADMIN)
    if (!targetAssigneeId) {
      const lastStaffComment = await prisma.comment.findFirst({
        where: {
          taskId,
          authorType: "USER",
          author: {
            role: { in: ["ENGINEER", "ADMIN"] },
          },
        },
        orderBy: { createdAt: "desc" },
        select: { authorId: true },
      });
      if (lastStaffComment?.authorId) {
        targetAssigneeId = lastStaffComment.authorId;
      }
    }

    // Check candidate 3: any project member with role ENGINEER or ADMIN
    if (!targetAssigneeId) {
      const staffMember = task.project.members.find(
        (m) => m.user && (m.user.role === "ENGINEER" || m.user.role === "ADMIN")
      );
      if (staffMember?.user?.id) {
        targetAssigneeId = staffMember.user.id;
      }
    }

    // Check candidate 4: system-wide first active ENGINEER or ADMIN
    if (!targetAssigneeId) {
      const systemStaff = await prisma.user.findFirst({
        where: { role: { in: ["ENGINEER", "ADMIN"] } },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      if (systemStaff?.id) {
        targetAssigneeId = systemStaff.id;
      }
    }

    // 2. Determine Target Working Column
    // Priority:
    // a) Column containing "в роботі" or "in progress" or "робота" or "очікує підтримку" (case-insensitive)
    // b) First non-done column with orderIndex > 0 (e.g. index 1)
    // c) First non-done column not named "беклог"
    // d) Current column
    const cols = task.project.columns || [];
    let targetColumn = cols.find((c) => {
      const n = c.name.toLowerCase();
      return (
        !c.isDoneColumn &&
        (n.includes("в роботі") ||
          n.includes("in progress") ||
          n.includes("робота") ||
          n.includes("підтримк") ||
          n.includes("support"))
      );
    });

    if (!targetColumn) {
      targetColumn = cols.find(
        (c) =>
          !c.isDoneColumn &&
          !c.name.toLowerCase().includes("беклог") &&
          !c.name.toLowerCase().includes("backlog") &&
          !c.name.toLowerCase().includes("новий") &&
          !c.name.toLowerCase().includes("new") &&
          !c.name.toLowerCase().includes("очікує") &&
          !c.name.toLowerCase().includes("waiting")
      );
    }

    if (!targetColumn) {
      targetColumn = cols.find((c) => !c.isDoneColumn && c.orderIndex > 0);
    }

    if (!targetColumn) {
      targetColumn = cols.find((c) => !c.isDoneColumn) || task.column;
    }

    const targetColumnId = targetColumn.id;

    // 3. Post comment if provided
    let createdComment: any = null;
    if (comment && typeof comment === "string" && comment.trim()) {
      createdComment = await prisma.comment.create({
        data: {
          taskId,
          content: comment.trim(),
          authorType: "USER",
          authorId: currentUser.userId,
        },
        include: {
          author: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      });

      notifyNewComment({
        taskId,
        commentId: createdComment.id,
        authorId: currentUser.userId,
        origin: req.headers.get("origin") || undefined,
      }).catch((err) => console.error("notifyNewComment error:", err));
    }

    // 4. Update Task in Database
    const mergedAiContext = {
      ...aiCtx,
      awaitingClient: false,
      returnedToSupportAt: new Date().toISOString(),
      returnedByUserId: currentUser.userId,
    };

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        columnId: targetColumnId,
        assigneeId: targetAssigneeId,
        aiContext: mergedAiContext,
      },
      include: {
        column: true,
        assignee: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, email: true, role: true } },
        subtasks: { orderBy: { orderIndex: "asc" } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        attachments: { orderBy: { createdAt: "desc" } },
      },
    });

    // 5. Audit Log
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

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
        taskCode: task.code,
        taskTitle: task.title,
        actionNote: "Клієнт надав відповідь та повернув задачу до служби підтримки",
        changes: {
          columnId: { old: task.column.name, new: targetColumn.name },
          assigneeId: {
            old: task.assignee?.name || "Клієнт",
            new: updatedTask.assignee?.name || "Черга підтримки",
          },
        },
      },
      ipAddress,
    });

    // 6. Notifications
    if (task.columnId !== targetColumnId) {
      notifyStatusChange({
        taskId,
        oldColumnId: task.columnId,
        newColumnId: targetColumnId,
        updatedByUserId: currentUser.userId,
        origin: req.headers.get("origin") || undefined,
      }).catch((err) => console.error("notifyStatusChange error:", err));
    }

    if (targetAssigneeId && targetAssigneeId !== task.assigneeId) {
      notifyTaskAssignment({
        taskId,
        oldAssigneeId: task.assigneeId,
        newAssigneeId: targetAssigneeId,
        assignedByUserId: currentUser.userId,
        origin: req.headers.get("origin") || undefined,
      }).catch((err) => console.error("notifyTaskAssignment error:", err));
    }

    return NextResponse.json({
      success: true,
      task: updatedTask,
      comment: createdComment,
      message: "Звернення успішно повернуто до служби підтримки",
    });
  } catch (error: any) {
    console.error("POST return-to-support error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
