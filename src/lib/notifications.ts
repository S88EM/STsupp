import { prisma } from "@/lib/prisma";
import {
  sendStatusChangedEmail,
  sendTaskAssignedEmail,
  sendCommentAddedEmail,
  getAppUrl,
} from "@/lib/email";
import {
  notifyTelegramStatusChanged,
  notifyTelegramCommentAdded,
  notifyTelegramTaskAssignment,
} from "@/lib/telegram";
import { getCanonicalTaskUrl } from "@/lib/taskUrl";

function getBaseUrl(origin?: string): string {
  if (origin && origin.startsWith("http") && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
    return origin.replace(/\/+$/, "");
  }
  return getAppUrl();
}

/**
 * Dispatches notification when a task changes status (moves to another column)
 */
export async function notifyStatusChange({
  taskId,
  oldColumnId,
  newColumnId,
  updatedByUserId,
  origin,
}: {
  taskId: string;
  oldColumnId: string;
  newColumnId: string;
  updatedByUserId?: string | null;
  origin?: string;
}): Promise<void> {
  if (!taskId || !oldColumnId || !newColumnId || oldColumnId === newColumnId) {
    return;
  }

  try {
    const [task, oldColumn, newColumn, updater] = await Promise.all([
      prisma.task.findUnique({
        where: { id: taskId },
        include: {
          creator: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
          watchers: { include: { user: { select: { id: true, name: true, email: true } } } },
          project: { select: { id: true, key: true, name: true } },
        },
      }),
      prisma.column.findUnique({ where: { id: oldColumnId }, select: { name: true } }),
      prisma.column.findUnique({ where: { id: newColumnId }, select: { name: true } }),
      updatedByUserId
        ? prisma.user.findUnique({ where: { id: updatedByUserId }, select: { name: true, email: true } })
        : null,
    ]);

    if (!task || !oldColumn || !newColumn) return;

    const updatedByName = updater?.name || "Користувач системи";
    const baseUrl = getBaseUrl(origin);
    const taskUrl = task.code
      ? getCanonicalTaskUrl(task.code, baseUrl)
      : `${baseUrl}/projects/${task.projectId}?taskId=${task.id}`;

    // Collect distinct recipients (excluding the person who made the change)
    const recipientMap = new Map<string, { name: string; email: string }>();

    if (task.assignee && task.assignee.id !== updatedByUserId && task.assignee.email) {
      recipientMap.set(task.assignee.email.toLowerCase(), task.assignee);
    }
    if (task.creator && task.creator.id !== updatedByUserId && task.creator.email) {
      recipientMap.set(task.creator.email.toLowerCase(), task.creator);
    }
    for (const w of task.watchers) {
      if (w.user && w.user.id !== updatedByUserId && w.user.email) {
        recipientMap.set(w.user.email.toLowerCase(), w.user);
      }
    }

    // Send emails in background
    for (const recipient of Array.from(recipientMap.values())) {
      sendStatusChangedEmail({
        to: recipient.email,
        recipientName: recipient.name,
        taskCode: task.code,
        taskTitle: task.title,
        oldStatus: oldColumn.name,
        newStatus: newColumn.name,
        updatedByName,
        taskUrl,
      }).catch((err) => console.error(`[Notification Error] Status change to ${recipient.email}:`, err));
    }

    // Send Telegram notification
    notifyTelegramStatusChanged({
      task: { id: task.id, code: task.code, title: task.title },
      project: { id: task.project.id, name: task.project.name, key: task.project.key },
      oldStatus: oldColumn.name,
      newStatus: newColumn.name,
      updatedByName,
      origin,
    }).catch((err) => console.error("[Telegram Error] notifyTelegramStatusChanged:", err));
  } catch (error) {
    console.error("[Notification Error] notifyStatusChange failed:", error);
  }
}

/**
 * Dispatches notification when a task is assigned or reassigned to a user
 */
export async function notifyTaskAssignment({
  taskId,
  oldAssigneeId,
  newAssigneeId,
  assignedByUserId,
  origin,
}: {
  taskId: string;
  oldAssigneeId?: string | null;
  newAssigneeId?: string | null;
  assignedByUserId?: string | null;
  origin?: string;
}): Promise<void> {
  if (!taskId || !newAssigneeId || newAssigneeId === oldAssigneeId) {
    return;
  }

  // Do not notify if user assigns task to themselves
  if (assignedByUserId && newAssigneeId === assignedByUserId) {
    return;
  }

  try {
    const [task, newAssignee, assigner] = await Promise.all([
      prisma.task.findUnique({
        where: { id: taskId },
        select: { id: true, code: true, title: true, priority: true, projectId: true },
      }),
      prisma.user.findUnique({
        where: { id: newAssigneeId },
        select: { id: true, name: true, email: true },
      }),
      assignedByUserId
        ? prisma.user.findUnique({ where: { id: assignedByUserId }, select: { name: true } })
        : null,
    ]);

    if (!task || !newAssignee || !newAssignee.email) return;

    const assignedByName = assigner?.name || "Користувач системи";
    const baseUrl = getBaseUrl(origin);
    const taskUrl = task.code
      ? getCanonicalTaskUrl(task.code, baseUrl)
      : `${baseUrl}/projects/${task.projectId}?taskId=${task.id}`;

    sendTaskAssignedEmail({
      to: newAssignee.email,
      recipientName: newAssignee.name,
      taskCode: task.code,
      taskTitle: task.title,
      assignedByName,
      priority: task.priority,
      taskUrl,
    }).catch((err) => console.error(`[Notification Error] Task assignment to ${newAssignee.email}:`, err));

    // Send Telegram notification
    const project = await prisma.project.findUnique({
      where: { id: task.projectId },
      select: { id: true, name: true, key: true },
    });

    notifyTelegramTaskAssignment({
      task: { id: task.id, code: task.code, title: task.title },
      project: { id: task.projectId, name: project?.name, key: project?.key },
      assigneeName: newAssignee.name,
      assignedByName,
      priority: task.priority,
      origin,
    }).catch((err) => console.error("[Telegram Error] notifyTelegramTaskAssignment:", err));
  } catch (error) {
    console.error("[Notification Error] notifyTaskAssignment failed:", error);
  }
}

/**
 * Dispatches notification when a new comment is added to a task
 */
export async function notifyNewComment({
  taskId,
  commentId,
  authorId,
  origin,
}: {
  taskId: string;
  commentId: string;
  authorId?: string | null;
  origin?: string;
}): Promise<void> {
  if (!taskId || !commentId) return;

  try {
    const [task, comment, previousComments] = await Promise.all([
      prisma.task.findUnique({
        where: { id: taskId },
        include: {
          creator: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
          watchers: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
      }),
      prisma.comment.findUnique({
        where: { id: commentId },
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.comment.findMany({
        where: { taskId, id: { not: commentId } },
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    if (!task || !comment) return;

    const commentAuthorName = comment.author?.name || comment.authorName || "AI Асистент";
    const baseUrl = getBaseUrl(origin);
    const taskUrl = task.code
      ? getCanonicalTaskUrl(task.code, baseUrl)
      : `${baseUrl}/projects/${task.projectId}?taskId=${task.id}`;

    // Collect distinct recipients (author, assignee, past commenters, watchers) excluding current author
    const recipientMap = new Map<string, { name: string; email: string }>();

    if (task.assignee && task.assignee.id !== authorId && task.assignee.email) {
      recipientMap.set(task.assignee.email.toLowerCase(), task.assignee);
    }
    if (task.creator && task.creator.id !== authorId && task.creator.email) {
      recipientMap.set(task.creator.email.toLowerCase(), task.creator);
    }
    for (const w of task.watchers) {
      if (w.user && w.user.id !== authorId && w.user.email) {
        recipientMap.set(w.user.email.toLowerCase(), w.user);
      }
    }
    for (const prev of previousComments) {
      if (prev.author && prev.author.id !== authorId && prev.author.email) {
        recipientMap.set(prev.author.email.toLowerCase(), prev.author);
      }
    }

    // Format snippet for preview
    const snippet = comment.content.length > 200
      ? comment.content.substring(0, 197) + "..."
      : comment.content;

    for (const recipient of Array.from(recipientMap.values())) {
      sendCommentAddedEmail({
        to: recipient.email,
        recipientName: recipient.name,
        taskCode: task.code,
        taskTitle: task.title,
        commentAuthorName,
        commentSnippet: snippet,
        taskUrl,
      }).catch((err) => console.error(`[Notification Error] New comment to ${recipient.email}:`, err));
    }

    // Send Telegram notification
    const project = await prisma.project.findUnique({
      where: { id: task.projectId },
      select: { id: true, name: true, key: true },
    });

    notifyTelegramCommentAdded({
      task: { id: task.id, code: task.code, title: task.title },
      project: { id: task.projectId, name: project?.name, key: project?.key },
      commentAuthorName,
      commentText: comment.content,
      origin,
    }).catch((err) => console.error("[Telegram Error] notifyTelegramCommentAdded:", err));
  } catch (error) {
    console.error("[Notification Error] notifyNewComment failed:", error);
  }
}
