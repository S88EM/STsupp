"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Users, UserPlus, Shield, Check } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import {
  UserItem,
  ProjectItem,
  RolesOverviewCards,
  UsersTable,
  CreateUserModal,
  EditUserProjectsModal,
  ChangeUserPasswordModal,
  EditUserModal,
} from "@/components/users";

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editProjectsUser, setEditProjectsUser] = useState<UserItem | null>(null);
  const [editPasswordUser, setEditPasswordUser] = useState<UserItem | null>(null);
  const [editUser, setEditUser] = useState<UserItem | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check current user
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser(meData.user);
        if (meData.user?.role !== "ADMIN") {
          setError("Доступ заборонено: ця сторінка доступна лише для Адміністраторів.");
          setLoading(false);
          return;
        }
      }

      // Fetch users and projects
      const [usersRes, projectsRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/projects"),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      } else {
        const err = await usersRes.json();
        setError(err.error || "Не вдалося завантажити користувачів");
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData);
      }
    } catch (err: any) {
      setError(err.message || "Помилка зв'язку із сервером");
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Не вдалося змінити роль");
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      showSuccess("Роль успішно оновлено");
    } catch (err: any) {
      alert(err.message || "Помилка при оновленні ролі");
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`Ви дійсно бажаєте видалити користувача "${name}"?`)) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Не вдалося видалити користувача");
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      showSuccess(`Користувача "${name}" видалено`);
    } catch (err: any) {
      alert(err.message || "Помилка при видаленні користувача");
    }
  };

  const handleActivateUser = async (user: UserItem) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEmailVerified: true }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isEmailVerified: true } : u))
        );
        showSuccess(`Акаунт користувача "${user.name}" успішно активовано!`);
      }
    } catch (err: any) {
      alert(err.message || "Помилка активації");
    }
  };

  const handleUserSaved = (updated: { id: string; name: string; email: string; city: string | null }) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u))
    );
    if (currentUser?.userId === updated.id) {
      setCurrentUser((prev: any) =>
        prev ? { ...prev, name: updated.name, email: updated.email } : prev
      );
    }
    showSuccess("Дані користувача (включно з email) успішно оновлено!");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar projects={projects} />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href={projects.length > 0 ? `/projects/${projects[0].id}` : "/"}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Повернутися до дошки</span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              <span>Керування користувачами та правами</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Повний пул адміністративних прав: редагування даних, зміна паролів, ролей та аудит
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/settings?tab=audit"
              className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Shield className="w-4 h-4 text-primary" />
              <span>Журнал аудиту</span>
            </Link>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all shadow-primary/20 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Створити користувача</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2 animate-in fade-in-50">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Roles Policy Overview Cards */}
        <RolesOverviewCards />

        {/* Users Table */}
        <UsersTable
          users={users}
          loading={loading}
          error={error}
          currentUserId={currentUser?.userId}
          onRoleChange={handleRoleChange}
          onDeleteUser={handleDeleteUser}
          onActivateUser={handleActivateUser}
          onEditUser={(u) => setEditUser(u)}
          onEditPassword={(u) => setEditPasswordUser(u)}
          onEditProjects={(u) => setEditProjectsUser(u)}
        />
      </main>

      {/* Modals */}
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        projects={projects}
        onUserCreated={async () => {
          await loadData();
          showSuccess("Нового користувача успішно створено!");
        }}
      />

      <EditUserProjectsModal
        user={editProjectsUser}
        projects={projects}
        onClose={() => setEditProjectsUser(null)}
        onProjectsSaved={async () => {
          await loadData();
          showSuccess("Доступи до проектів успішно оновлено");
        }}
      />

      <ChangeUserPasswordModal
        user={editPasswordUser}
        onClose={() => setEditPasswordUser(null)}
        onPasswordChanged={(name) => {
          showSuccess(`Пароль для користувача "${name}" успішно оновлено!`);
        }}
      />

      <EditUserModal
        user={editUser}
        onClose={() => setEditUser(null)}
        onUserSaved={handleUserSaved}
      />
    </div>
  );
}
