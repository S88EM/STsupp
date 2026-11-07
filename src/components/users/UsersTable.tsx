"use client";

import React from "react";
import {
  Shield,
  Wrench,
  UserCheck,
  Trash2,
  Key,
  Pencil,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { UserItem } from "./types";

interface UsersTableProps {
  users: UserItem[];
  loading: boolean;
  error: string | null;
  currentUserId?: string;
  onRoleChange: (userId: string, newRole: string) => void;
  onDeleteUser: (userId: string, name: string) => void;
  onActivateUser: (user: UserItem) => void;
  onEditUser: (user: UserItem) => void;
  onEditPassword: (user: UserItem) => void;
  onEditProjects: (user: UserItem) => void;
}

export function getRoleBadge(role: string) {
  switch (role) {
    case "ADMIN":
      return {
        label: "Адміністратор",
        icon: <Shield className="w-3.5 h-3.5 text-blue-400" />,
        classes: "bg-blue-500/10 text-blue-400 border-blue-500/30",
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
}

export function UsersTable({
  users,
  loading,
  error,
  currentUserId,
  onRoleChange,
  onDeleteUser,
  onActivateUser,
  onEditUser,
  onEditPassword,
  onEditProjects,
}: UsersTableProps) {
  return (
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
                const isSelf = currentUserId === u.id;
                const badge = getRoleBadge(u.role);

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
                        <button
                          type="button"
                          onClick={() => onEditUser(u)}
                          title="Редагувати email та дані користувача"
                          className="p-1 text-muted-foreground/60 hover:text-primary hover:bg-secondary rounded transition-colors inline-flex items-center cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
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
                              onClick={() => onActivateUser(u)}
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
                      <select
                        value={u.role}
                        onChange={(e) => onRoleChange(u.id, e.target.value)}
                        disabled={isSelf}
                        className={`text-xs font-medium py-1 px-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-colors ${badge.classes} disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        <option value="ADMIN" className="bg-card text-foreground">
                          Адміністратор
                        </option>
                        <option value="ENGINEER" className="bg-card text-foreground">
                          Інженер
                        </option>
                        <option value="CLIENT" className="bg-card text-foreground">
                          Клієнт
                        </option>
                      </select>
                    </td>

                    {/* Assigned Projects */}
                    <td className="py-3 px-4">
                      {u.role === "ADMIN" ? (
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

                          <button
                            type="button"
                            onClick={() => onEditProjects(u)}
                            className="text-[11px] text-primary hover:underline font-semibold ml-1.5 transition-colors cursor-pointer"
                          >
                            {u.projectMembers.length > 0 ? "Налаштувати" : "+ Надати доступ"}
                          </button>
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
                          type="button"
                          onClick={() => onEditUser(u)}
                          title={`Редагувати користувача ${u.name}`}
                          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditPassword(u)}
                          title={`Змінити пароль для ${u.name}`}
                          className="p-1.5 text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteUser(u.id, u.name)}
                          disabled={isSelf}
                          title={isSelf ? "Неможливо видалити себе" : "Видалити користувача"}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
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
  );
}
