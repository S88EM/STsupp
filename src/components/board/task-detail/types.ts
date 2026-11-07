import { ColumnItem } from "../ColumnCard";

export interface TaskDetailModalProps {
  taskId: string | null;
  projectId: string;
  columns: ColumnItem[];
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
  onTaskDeleted: (taskId: string) => void;
}

export interface TaskDetailSubtask {
  id: string;
  title: string;
  isCompleted: boolean;
  orderIndex?: number;
}

export interface TaskDetailAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  createdAt?: string;
}

export interface TaskDetailComment {
  id: string;
  content: string;
  authorType: string;
  authorName?: string | null;
  createdAt: string;
  author?: {
    id: string;
    name: string;
    email?: string;
    role?: string;
    avatarUrl?: string | null;
  } | null;
}
