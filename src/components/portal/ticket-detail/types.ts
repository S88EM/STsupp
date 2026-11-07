import { AttachmentItem, CommentItem, AuditLogItem } from "../types";

export interface ClientTicketDetailModalProps {
  taskId: string | null;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onTicketUpdated?: () => void;
  currentUser?: any;
}

export function isTicketAwaitingResponse(task: any, currentUserId?: string): boolean {
  if (!task) return false;
  if (task.column?.isDoneColumn) return false;
  const colName = (task.column?.name || "").toLowerCase();
  if (
    colName.includes("готова") ||
    colName.includes("done") ||
    colName.includes("resolved") ||
    colName.includes("вирішено") ||
    colName.includes("закрито") ||
    colName.includes("closed")
  ) {
    return false;
  }
  if (task.aiContext?.isClosed) return false;

  // 1. Explicit flag in aiContext
  if (task.aiContext?.awaitingClient === true) return true;

  // 2. Assigned to current client or someone with role CLIENT
  if (currentUserId && (task.assigneeId === currentUserId || task.assignee?.id === currentUserId)) {
    return true;
  }
  if (task.assignee && task.assignee.role === "CLIENT") {
    return true;
  }

  // 3. Column name indicates awaiting client
  if (
    colName.includes("очікує відповіді") ||
    colName.includes("очікує клієнт") ||
    colName.includes("waiting")
  ) {
    return true;
  }

  return false;
}

export function renderAuditLogMessage(log: AuditLogItem): { title: string; subtitle?: string } {
  const details = log.details || {};
  const changes = details.changes || {};

  if (changes.action === "RETURNED_TO_SUPPORT_BY_CLIENT") {
    return {
      title: "Повернуто до служби підтримки",
      subtitle: details.replyCommentAdded
        ? "Надано відповідь та передано інженеру"
        : "Передано в активну чергу підтримки",
    };
  }

  const items: string[] = [];
  if (changes.priority) {
    const pMap: Record<string, string> = {
      LOW: "Низький",
      MEDIUM: "Середній",
      HIGH: "Високий",
      URGENT: "Терміновий",
      CRITICAL: "Терміновий",
    };
    const oldP = pMap[changes.priority.old] || changes.priority.old;
    const newP = pMap[changes.priority.new] || changes.priority.new;
    items.push(`Змінено критичність: ${oldP} ➔ ${newP}`);
  }
  if (changes.title) {
    items.push(`Змінено назву: «${changes.title.new}»`);
  }
  if (changes.description) {
    items.push("Оновлено опис звернення");
  }
  if (changes.status) {
    items.push(`Змінено статус: ${changes.status.old} ➔ ${changes.status.new}`);
  }

  if (items.length > 0) {
    return {
      title: items[0],
      subtitle: items.length > 1 ? items.slice(1).join(" • ") : undefined,
    };
  }

  return { title: "Оновлено параметри задачі" };
}
