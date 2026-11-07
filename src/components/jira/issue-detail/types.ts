import { ColumnItem } from "@/components/board/ColumnCard";

export interface IssueDetailPaneProps {
  taskId: string | null;
  projectId: string;
  projectName: string;
  projectKey: string;
  columns: ColumnItem[];
  onTaskUpdated: () => void;
  onTaskDeleted: (taskId: string) => void;
  currentUser?: any;
}

export interface DictionariesData {
  componentsByType: Record<string, string[]>;
  componentsByProject: Record<string, Record<string, string[]>>;
  labels: string[];
}

export const getUserInitials = (name?: string, email?: string) => {
  if (name?.trim()) {
    const parts = name.trim().split(" ");
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  return email ? email.slice(0, 2).toUpperCase() : "U";
};

export const getUserRoleBadge = (role: string) => {
  switch (role) {
    case "ADMIN":
      return { label: "Адмін", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
    case "ENGINEER":
      return { label: "Інженер", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
    case "CLIENT":
      return { label: "Клієнт", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
    default:
      return { label: "Користувач", color: "bg-secondary text-foreground border-border" };
  }
};
