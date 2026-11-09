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

export { getUserInitials } from "@/lib/utils";

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

export type StatusSemanticKey = "backlog" | "inprogress" | "testing" | "done";

export interface StatusSemanticStyle {
  key: StatusSemanticKey;
  label: string;
  badgeClass: string;
  dotClass: string;
  activeItemClass: string;
  colorHex: string;
}

/**
 * Returns semantic color styling according to standard workflow rules:
 * - Backlog (Беклог): graphite / neutral gray (#64748b)
 * - In Progress (В роботі): blue (#3b82f6)
 * - Testing (Тестування / Очікування): yellow / amber (#f59e0b)
 * - Done / Closed (Готово / Закрито): green (#10b981)
 */
export const getStatusSemantic = (
  columnName?: string,
  isDoneColumn?: boolean,
  isClosed?: boolean
): StatusSemanticStyle => {
  if (isClosed || isDoneColumn) {
    return {
      key: "done",
      label: "Готово",
      badgeClass:
        "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border-emerald-400/50 dark:border-emerald-500/50 shadow-emerald-500/10",
      dotClass: "bg-emerald-500",
      activeItemClass: "bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-semibold",
      colorHex: "#10b981",
    };
  }

  const name = (columnName || "").toLowerCase().trim();

  // 1. Done / Resolved / Closed
  if (
    name.includes("done") ||
    name.includes("готов") ||
    name.includes("виріш") ||
    name.includes("закрит") ||
    name.includes("closed") ||
    name.includes("resolved")
  ) {
    return {
      key: "done",
      label: "Готово",
      badgeClass:
        "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border-emerald-400/50 dark:border-emerald-500/50 shadow-emerald-500/10",
      dotClass: "bg-emerald-500",
      activeItemClass: "bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-semibold",
      colorHex: "#10b981",
    };
  }

  // 2. Testing / Review / Waiting / QA
  if (
    name.includes("тест") ||
    name.includes("review") ||
    name.includes("перевір") ||
    name.includes("qa") ||
    name.includes("waiting") ||
    name.includes("очікує") ||
    name.includes("очікування")
  ) {
    return {
      key: "testing",
      label: "Тестування",
      badgeClass:
        "bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border-amber-400/50 dark:border-amber-500/50 shadow-amber-500/10",
      dotClass: "bg-amber-500",
      activeItemClass: "bg-amber-500/20 text-amber-800 dark:text-amber-200 font-semibold",
      colorHex: "#f59e0b",
    };
  }

  // 3. In Progress / In Work / Dev
  if (
    name.includes("робот") ||
    name.includes("progress") ||
    name.includes("розроб") ||
    name.includes("dev") ||
    name.includes("in progress")
  ) {
    return {
      key: "inprogress",
      label: "В роботі",
      badgeClass:
        "bg-blue-500/15 hover:bg-blue-500/25 text-blue-700 dark:text-blue-300 border-blue-400/50 dark:border-blue-500/50 shadow-blue-500/10",
      dotClass: "bg-blue-500",
      activeItemClass: "bg-blue-500/20 text-blue-800 dark:text-blue-200 font-semibold",
      colorHex: "#3b82f6",
    };
  }

  // 4. Backlog / Default / Graphite / Neutral gray
  return {
    key: "backlog",
    label: "Беклог",
    badgeClass:
      "bg-slate-500/15 hover:bg-slate-500/25 text-slate-700 dark:text-slate-300 border-slate-400/50 dark:border-slate-500/50 shadow-slate-500/10",
    dotClass: "bg-slate-400 dark:bg-slate-400",
    activeItemClass: "bg-slate-500/20 text-slate-800 dark:text-slate-200 font-semibold",
    colorHex: "#64748b",
  };
};
