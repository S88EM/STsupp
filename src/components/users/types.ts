export interface ProjectItem {
  id: string;
  name: string;
  key: string;
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
  city?: string | null;
  role: "ADMIN" | "ENGINEER" | "CLIENT" | string;
  avatarUrl: string | null;
  createdAt: string;
  isPrimaryAdmin?: boolean;
  isEmailVerified?: boolean;
  projectMembers: Array<{
    id: string;
    role: string;
    project: ProjectItem;
  }>;
  _count?: {
    createdTasks: number;
    assignedTasks: number;
  };
}

export type UserRole = "ADMIN" | "ENGINEER" | "CLIENT";
