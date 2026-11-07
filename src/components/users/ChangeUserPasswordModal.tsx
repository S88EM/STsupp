"use client";

import React, { useState, useEffect } from "react";
import { Key, X, Lock } from "lucide-react";
import { UserItem } from "./types";

interface ChangeUserPasswordModalProps {
  user: UserItem | null;
  onClose: () => void;
  onPasswordChanged: (userName: string) => void;
}

export function ChangeUserPasswordModal({
  user,
  onClose,
  onPasswordChanged,
}: ChangeUserPasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setNewPassword("");
    }
  }, [user]);

  if (!user) return null;

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
    if (!newPassword) return;

    if (newPassword.length < 6) {
      alert("Пароль має містити щонайменше 6 символів");
      return;
    }

    try {
      setChangingPassword(true);
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Не вдалося змінити пароль");
        return;
      }

      const userName = user.name;
      setNewPassword("");
      onPasswordChanged(userName);
      onClose();
    } catch (err: any) {
      alert(err.message || "Помилка при зміні пароля");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
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
                {user.name} ({user.email})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
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
                className="text-[10px] text-primary hover:underline font-medium cursor-pointer"
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
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={changingPassword || newPassword.length < 6}
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-600/90 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {changingPassword ? "Збереження..." : "Встановити пароль"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
