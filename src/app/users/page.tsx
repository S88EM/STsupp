"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  UserPlus,
  Shield,
  Wrench,
  UserCheck,
  Trash2,
  Lock,
  Mail,
  Check,
  AlertCircle,
  FolderGit2,
  X,
  ExternalLink,
  Key,
  Pencil,
  Search,
  MapPin,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

interface ProjectItem {
  id: string;
  name: string;
  key: string;
}

interface UserItem {
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

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create User Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createCity, setCreateCity] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<"ADMIN" | "ENGINEER" | "CLIENT">("CLIENT");
  const [createProjectIds, setCreateProjectIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createProjectSearch, setCreateProjectSearch] = useState("");

  // Edit Projects Modal State
  const [editProjectsUser, setEditProjectsUser] = useState<UserItem | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [projectSearch, setProjectSearch] = useState("");
  const [savingProjects, setSavingProjects] = useState(false);

  // Change Password Modal State
  const [editPasswordUser, setEditPasswordUser] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Edit Name Modal State
  const [editNameUser, setEditNameUser] = useState<UserItem | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || !createEmail.trim() || !createCity.trim() || !createPassword) return;

    try {
      setCreating(true);
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName.trim(),
          email: createEmail.trim(),
          city: createCity.trim(),
          password: createPassword,
          role: createRole,
          projectIds: createProjectIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Не вдалося створити користувача");
        return;
      }

      setIsCreateOpen(false);
      setCreateName("");
      setCreateEmail("");
      setCreateCity("");
      setCreatePassword("");
      setCreateRole("CLIENT");
      setCreateProjectIds([]);
      await loadData();
      showSuccess("Нового користувача успішно створено!");
    } catch (err: any) {
      alert(err.message || "Помилка створення користувача");
    } finally {
      setCreating(false);
    }
  };

  const openProjectsModal = (user: UserItem) => {
    const isTargetAdmin = user.role === "ADMIN";
    const isCurrentPrimary = !!(currentUser?.isPrimaryAdmin || currentUser?.email === "admin@stsup.local");
    if (isTargetAdmin && !isCurrentPrimary) {
      alert("Тільки Головний адміністратор має право призначати проєкти створеним адміністраторам.");
      return;
    }
    setEditProjectsUser(user);
    setSelectedProjectIds(user.projectMembers.map((m) => m.project.id));
    setProjectSearch("");
  };

  const handleSaveProjects = async () => {
    if (!editProjectsUser) return;

    try {
      setSavingProjects(true);
      const res = await fetch(`/api/users/${editProjectsUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectIds: selectedProjectIds }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Не вдалося зберегти доступи");
        return;
      }

      setEditProjectsUser(null);
      await loadData();
      showSuccess("Доступи до проектів успішно оновлено");
    } catch (err: any) {
      alert(err.message || "Помилка при збереженні");
    } finally {
      setSavingProjects(false);
    }
  };

  const openPasswordModal = (user: UserItem) => {
    setEditPasswordUser(user);
    setNewPassword("");
  };

  const handleGenerateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let gen = "";
    for (let i = 0; i < 10; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(gen);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPasswordUser || !newPassword) return;

    if (newPassword.length < 6) {
      alert("Пароль має містити щонайменше 6 символів");
      return;
    }

    try {
      setChangingPassword(true);
      const res = await fetch(`/api/users/${editPasswordUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Не вдалося змінити пароль");
        return;
      }

      const userName = editPasswordUser.name;
      setEditPasswordUser(null);
      setNewPassword("");
      showSuccess(`Пароль для користувача "${userName}" успішно оновлено!`);
    } catch (err: any) {
      alert(err.message || "Помилка при зміні пароля");
    } finally {
      setChangingPassword(false);
    }
  };

  const openEditNameModal = (user: UserItem) => {
    setEditNameUser(user);
    setEditNameValue(user.name);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNameUser || !editNameValue.trim()) return;

    try {
      setSavingName(true);
      const res = await fetch(`/api/users/${editNameUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editNameValue.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Не вдалося оновити ім'я");
        return;
      }

      const updatedName = editNameValue.trim();
      setUsers((prev) =>
        prev.map((u) => (u.id === editNameUser.id ? { ...u, name: updatedName } : u))
      );
      setEditNameUser(null);
      showSuccess("Ім'я користувача успішно оновлено!");
    } catch (err: any) {
      alert(err.message || "Помилка при оновленні імені");
    } finally {
      setSavingName(false);
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

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const getRoleBadge = (role: string, isPrimary = false) => {
    switch (role) {
      case "ADMIN":
        if (isPrimary) {
          return {
            label: "Головний адмін",
            icon: <Shield className="w-3.5 h-3.5 text-blue-400" />,
            classes: "bg-blue-500/10 text-blue-400 border-blue-500/30",
          };
        }
        return {
          label: "Адміністратор",
          icon: <Shield className="w-3.5 h-3.5 text-amber-400" />,
          classes: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        };
      case "ENGINEER":
        return {
          label: "Інженер",
          icon: <Wrench className="w-3.5 h-3.5 text-emerald-400" />,
          classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        };
      case "CLIENT":
      default:
        return {
          label: "Клієнт",
          icon: <UserCheck className="w-3.5 h-3.5 text-cyan-400" />,
          classes: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
        };
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar projects={projects} />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Breadcrumb & Action */}
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
              Призначайте ролі та надавайте права доступу до окремих проектів
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all shadow-primary/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Створити користувача</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2 animate-in fade-in-50">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Roles Policy Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-card border border-border/80 space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
              <Shield className="w-4 h-4" />
              <span>Роль: Адміністратор</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Головний адміністратор має повний доступ до всіх проєктів. Створені адміністратори (виділені жовтим) мають доступ лише до призначених їм проєктів.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-card border border-border/80 space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Wrench className="w-4 h-4" />
              <span>Роль: Інженер</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Доступ виключно до тих проєктів, які призначив адміністратор. Робота з задачами, зміна статусів (дошка), відповіді в коментарях, вкладення скріншотів і відео.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-card border border-border/80 space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <UserCheck className="w-4 h-4" />
              <span>Роль: Клієнт</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Доступ виключно до тих проєктів, які призначив адміністратор. Створення задач, опис проблем, додавання скріншотів та коментарів.
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              Завантаження списку користувачів...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-destructive text-xs space-y-2">
              <AlertCircle className="w-5 h-5 mx-auto" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/40 border-b border-border text-muted-foreground font-medium">
                  <tr>
                    <th className="py-3 px-4">Користувач</th>
                    <th className="py-3 px-4">Місто</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Системна роль</th>
                    <th className="py-3 px-4">Доступні проекти</th>
                    <th className="py-3 px-4 text-center">Задач</th>
                    <th className="py-3 px-4 text-right">Дії</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {users.map((u) => {
                    const isSelf = currentUser?.userId === u.id;
                    const isTargetPrimaryAdmin = !!(u.isPrimaryAdmin || u.email === "admin@stsup.local");
                    const isCurrentPrimaryAdmin = !!(currentUser?.isPrimaryAdmin || currentUser?.email === "admin@stsup.local");
                    const badge = getRoleBadge(u.role, isTargetPrimaryAdmin);
                    const canConfigureProjects = !isTargetPrimaryAdmin && (u.role === "ADMIN" ? isCurrentPrimaryAdmin : true);

                    return (
                      <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                        {/* User Identity */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs border border-border text-foreground">
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {isSelf && (
                                  <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-primary/20 text-primary border border-primary/30">
                                    Ви
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                Зареєстровано {new Date(u.createdAt).toLocaleDateString("uk-UA")}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* City */}
                        <td className="py-3 px-4 text-xs font-medium text-foreground">
                          {u.city ? (
                            <div className="flex items-center gap-1 text-foreground">
                              <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                              <span>{u.city}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/50 italic text-[11px]">—</span>
                          )}
                        </td>

                        {/* Email */}
                        <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{u.email}</span>
                            {u.isEmailVerified === false && (
                              <div className="flex items-center gap-1">
                                <span
                                  className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-sans"
                                  title="Користувач зареєструвався самостійно та ще не підтвердив свою електронну пошту"
                                >
                                  Не активовано
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleActivateUser(u)}
                                  className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 font-sans font-medium transition-colors cursor-pointer"
                                  title="Активувати акаунт користувача без підтвердження пошти"
                                >
                                  Активувати
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Role selector */}
                        <td className="py-3 px-4">
                          {isTargetPrimaryAdmin ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs font-semibold">
                              <Shield className="w-3.5 h-3.5 text-blue-400" />
                              <span>Головний адмін</span>
                            </span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              disabled={isSelf || (!isCurrentPrimaryAdmin && u.role === "ADMIN")}
                              className={`text-xs font-medium py-1 px-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-colors ${badge.classes} disabled:opacity-60 disabled:cursor-not-allowed`}
                            >
                              {isCurrentPrimaryAdmin && (
                                <option value="ADMIN" className="bg-card text-foreground">
                                  Адміністратор
                                </option>
                              )}
                              <option value="ENGINEER" className="bg-card text-foreground">
                                Інженер
                              </option>
                              <option value="CLIENT" className="bg-card text-foreground">
                                Клієнт
                              </option>
                            </select>
                          )}
                        </td>

                        {/* Assigned Projects */}
                        <td className="py-3 px-4">
                          {isTargetPrimaryAdmin ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-medium shadow-sm">
                              <Shield className="w-3.5 h-3.5 text-blue-400" />
                              <span>Всі проекти (Адмін)</span>
                            </span>
                          ) : (
                            <div className="flex flex-wrap items-center gap-1.5 max-w-sm">
                              {u.projectMembers.length > 0 ? (
                                <>
                                  {u.projectMembers.slice(0, 3).map((m) => (
                                    <span
                                      key={m.id}
                                      className="px-2 py-0.5 rounded-md bg-secondary/80 border border-border text-[11px] text-foreground font-mono"
                                      title={m.project.name}
                                    >
                                      [{m.project.key}] {m.project.name}
                                    </span>
                                  ))}
                                  {u.projectMembers.length > 3 && (
                                    <span className="px-1.5 py-0.5 rounded bg-secondary text-[10px] text-muted-foreground font-medium">
                                      + ще {u.projectMembers.length - 3}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-[11px] text-amber-400/90 italic font-medium">
                                  Немає доступів
                                </span>
                              )}

                              {canConfigureProjects ? (
                                <button
                                  onClick={() => openProjectsModal(u)}
                                  className="text-[11px] text-primary hover:underline font-semibold ml-1.5 transition-colors"
                                >
                                  {u.projectMembers.length > 0 ? "Налаштувати" : "+ Надати доступ"}
                                </button>
                              ) : u.role === "ADMIN" ? (
                                <span
                                  className="text-[10px] text-muted-foreground ml-1.5 italic"
                                  title="Тільки Головний адміністратор може призначати проекти створеним адміністраторам"
                                >
                                  (тільки Головний адмін)
                                </span>
                              ) : null}
                            </div>
                          )}
                        </td>

                        {/* Created Tasks count */}
                        <td className="py-3 px-4 text-center font-mono text-xs text-muted-foreground">
                          {u._count?.createdTasks || 0}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditNameModal(u)}
                              title={`Редагувати ім'я ${u.name}`}
                              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openPasswordModal(u)}
                              title={`Змінити пароль для ${u.name}`}
                              className="p-1.5 text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              disabled={isSelf || isTargetPrimaryAdmin || (!isCurrentPrimaryAdmin && u.role === "ADMIN")}
                              title={
                                isTargetPrimaryAdmin
                                  ? "Неможливо видалити Головного адміністратора"
                                  : isSelf
                                  ? "Неможливо видалити себе"
                                  : !isCurrentPrimaryAdmin && u.role === "ADMIN"
                                  ? "Тільки Головний адміністратор може видаляти інших адміністраторів"
                                  : "Видалити користувача"
                              }
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: Create User */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                <span>Створити нового користувача</span>
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] flex items-center gap-2">
                <Check className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  Акаунт активується автоматично — користувачу не потрібне підтвердження пошти.
                </span>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Повне ім'я
                </label>
                <input
                  type="text"
                  placeholder="Олександр Коваль"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  required
                  autoFocus
                  className="w-full text-xs py-2 px-3 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Email адреса
                </label>
                <input
                  type="email"
                  placeholder="user@company.com"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  required
                  className="w-full text-xs py-2 px-3 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Місто <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="напр. Вінниця, Київ, Львів"
                  value={createCity}
                  onChange={(e) => setCreateCity(e.target.value)}
                  required
                  className="w-full text-xs py-2 px-3 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Початковий пароль (мінімум 6 символів)
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  required
                  className="w-full text-xs py-2 px-3 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Призначена роль
                </label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as any)}
                  className="w-full text-xs py-2 px-3 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground cursor-pointer"
                >
                  <option value="CLIENT">Клієнт (створення задач, додавання матеріалів)</option>
                  <option value="ENGINEER">Інженер (виконання задач, зміна статусів, коментарі)</option>
                  {(currentUser?.isPrimaryAdmin || currentUser?.email === "admin@stsup.local") && (
                    <option value="ADMIN">Адміністратор (керування користувачами та призначеними проєктами)</option>
                  )}
                </select>
              </div>

              {/* Projects Assignment for all roles */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground block">
                    Дозволити доступ до проєктів:
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    Обрано: <strong className="text-foreground">{createProjectIds.length}</strong> з {projects.length}
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  {createRole === "ADMIN"
                    ? "Створений адміністратор матиме доступ до задач та налаштувань лише обраних проєктів."
                    : createRole === "ENGINEER"
                    ? "Інженер зможе переглядати дошку, брати задачі в роботу та додавати коментарі в обраних проєктах."
                    : "Клієнт зможе створювати задачі та відстежувати їх виконання в обраних проєктах."}
                </p>

                {projects.length > 4 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Швидкий пошук проєктів..."
                      value={createProjectSearch}
                      onChange={(e) => setCreateProjectSearch(e.target.value)}
                      className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => setCreateProjectIds(projects.map((p) => p.id))}
                    className="text-primary hover:underline"
                  >
                    Обрати всі ({projects.length})
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setCreateProjectIds([])}
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Зняти всі
                  </button>
                </div>

                <div className="space-y-1 max-h-40 overflow-y-auto p-1.5 rounded-lg bg-secondary/20 border border-border/80">
                  {projects
                    .filter(
                      (p) =>
                        !createProjectSearch.trim() ||
                        p.name.toLowerCase().includes(createProjectSearch.toLowerCase()) ||
                        p.key.toLowerCase().includes(createProjectSearch.toLowerCase())
                    )
                    .map((p) => {
                      const isChecked = createProjectIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-center gap-2 text-xs p-1.5 rounded cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-primary/10 border border-primary/20 text-foreground"
                              : "hover:bg-secondary/40 text-muted-foreground"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCreateProjectIds([...createProjectIds, p.id]);
                              } else {
                                setCreateProjectIds(createProjectIds.filter((id) => id !== p.id));
                              }
                            }}
                            className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                          />
                          <span className="font-mono text-xs font-bold text-primary">[{p.key}]</span>
                          <span className="truncate font-medium">{p.name}</span>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {creating ? "Створення..." : "Створити користувача"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit User Projects */}
      {editProjectsUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Призначення проектів
                </h2>
                <p className="text-xs text-muted-foreground">
                  Для користувача: <strong className="text-foreground">{editProjectsUser.name}</strong> ({editProjectsUser.email})
                </p>
              </div>
              <button
                onClick={() => setEditProjectsUser(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground block">
                  Виберіть проекти, до яких користувач матиме доступ:
                </label>
                <span className="text-[10px] text-muted-foreground">
                  Обрано: <strong className="text-foreground">{selectedProjectIds.length}</strong> з {projects.length}
                </span>
              </div>

              {projects.length > 4 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Швидкий пошук за назвою чи ключем..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60"
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setSelectedProjectIds(projects.map((p) => p.id))}
                  className="text-primary hover:underline font-medium text-[11px]"
                >
                  Обрати всі ({projects.length})
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setSelectedProjectIds([])}
                  className="text-muted-foreground hover:text-foreground hover:underline text-[11px]"
                >
                  Зняти всі
                </button>
              </div>

              <div className="space-y-1 max-h-64 overflow-y-auto p-1.5 rounded-lg bg-secondary/20 border border-border/80">
                {projects
                  .filter(
                    (p) =>
                      !projectSearch.trim() ||
                      p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
                      p.key.toLowerCase().includes(projectSearch.toLowerCase())
                  )
                  .map((p) => {
                    const isChecked = selectedProjectIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2.5 text-xs cursor-pointer p-1.5 rounded-lg transition-colors ${
                          isChecked
                            ? "bg-primary/10 border border-primary/20 text-foreground"
                            : "hover:bg-secondary/40 text-muted-foreground"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProjectIds([...selectedProjectIds, p.id]);
                            } else {
                              setSelectedProjectIds(selectedProjectIds.filter((id) => id !== p.id));
                            }
                          }}
                          className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                        />
                        <span className="font-mono text-xs font-bold text-primary">[{p.key}]</span>
                        <span className="truncate font-medium">{p.name}</span>
                      </label>
                    );
                  })}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditProjectsUser(null)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary transition-colors"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={handleSaveProjects}
                disabled={savingProjects}
                className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {savingProjects ? "Збереження..." : "Зберегти доступи"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Change User Password */}
      {editPasswordUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Зміна пароля користувача
                  </h2>
                  <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                    {editPasswordUser.name} ({editPasswordUser.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditPasswordUser(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Новий пароль
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Введіть новий пароль"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoFocus
                    className="w-full text-xs font-mono pl-9 pr-3 py-2 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-muted-foreground">
                    Мінімум 6 символів
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPassword}
                    className="text-[10px] text-primary hover:underline font-medium"
                  >
                    🎲 Згенерувати пароль
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] leading-relaxed">
                ⚠️ Після збереження старий пароль буде анульовано. Користувач зможе увійти лише з цим новим паролем.
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditPasswordUser(null)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={changingPassword || newPassword.length < 6}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-600/90 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {changingPassword ? "Збереження..." : "Встановити пароль"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit User Name */}
      {editNameUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Pencil className="w-4 h-4 text-primary" />
                <span>Зміна імені користувача</span>
              </h2>
              <button
                onClick={() => setEditNameUser(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveName} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Повне ім'я
                </label>
                <input
                  type="text"
                  placeholder="Введіть нове ім'я"
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  required
                  autoFocus
                  className="w-full text-xs py-2 px-3 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditNameUser(null)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={savingName || !editNameValue.trim()}
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {savingName ? "Збереження..." : "Зберегти"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
