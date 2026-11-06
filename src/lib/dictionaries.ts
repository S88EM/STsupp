import fs from "fs";
import path from "path";

export interface TaskDictionaries {
  componentsByType: {
    TASK: string[];
    BUG: string[];
    STORY: string[];
    IMPROVEMENT: string[];
    SUPPORT: string[];
    [key: string]: string[];
  };
  labels: string[];
}

export const DEFAULT_TASK_DICTIONARIES: TaskDictionaries = {
  componentsByType: {
    TASK: ["Модуль підтримки", "Авторизація", "Звіти", "Інтерфейс", "API", "База даних"],
    BUG: ["UI/Frontend", "API/Backend", "База даних", "Авторизація", "Мобільний вигляд", "Інтеграція"],
    STORY: ["Клієнтський кабінет", "Адмінпанель", "Повідомлення", "Аналітика", "Звіти"],
    IMPROVEMENT: ["Швидкодія", "UX/Дизайн", "Рефакторинг", "Безпека", "Документація"],
    SUPPORT: ["Консультація", "Налаштування", "Доступ", "Документація", "Загальні питання"],
  },
  labels: [
    "v1.0",
    "v1.1",
    "urgent",
    "security",
    "design",
    "frontend",
    "backend",
    "qa",
    "support",
    "devops",
    "performance",
  ],
};

function getDictionariesFilePath(): string {
  if (fs.existsSync("/data")) {
    return "/data/task_dictionaries.json";
  }
  return path.join(process.cwd(), "data", "task_dictionaries.json");
}

export function getTaskDictionaries(): TaskDictionaries {
  const filePath = getDictionariesFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(content);
      return {
        componentsByType: {
          ...DEFAULT_TASK_DICTIONARIES.componentsByType,
          ...(parsed.componentsByType || {}),
        },
        labels: Array.isArray(parsed.labels) ? parsed.labels : DEFAULT_TASK_DICTIONARIES.labels,
      };
    }
  } catch (err) {
    console.error("Error reading task dictionaries:", err);
  }

  return DEFAULT_TASK_DICTIONARIES;
}

export function saveTaskDictionaries(dict: TaskDictionaries): TaskDictionaries {
  const filePath = getDictionariesFilePath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const rawByType = dict.componentsByType || {};
  const cleanByType: Record<string, string[]> = { ...rawByType };
  for (const key of ["TASK", "BUG", "STORY", "IMPROVEMENT", "SUPPORT"]) {
    if (!Array.isArray(cleanByType[key])) {
      cleanByType[key] = [];
    }
  }

  const cleanData: TaskDictionaries = {
    componentsByType: cleanByType as any,
    labels: Array.isArray(dict.labels) ? dict.labels : [],
  };

  fs.writeFileSync(filePath, JSON.stringify(cleanData, null, 2), "utf8");
  return cleanData;
}
