"use client";

import React, { useState, useEffect } from "react";
import { Pencil, X, Mail, MapPin, AlertCircle } from "lucide-react";
import { UserItem } from "./types";

interface EditUserModalProps {
  user: UserItem | null;
  onClose: () => void;
  onUserSaved: (updatedUser: { id: string; name: string; email: string; city: string | null }) => void;
}

export function EditUserModal({ user, onClose, onUserSaved }: EditUserModalProps) {
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserCity, setEditUserCity] = useState("");
  const [savingUser, setSavingUser] = useState(false);
  const [editUserError, setEditUserError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setEditUserName(user.name);
      setEditUserEmail(user.email);
      setEditUserCity(user.city || "");
      setEditUserError(null);
    }
  }, [user]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserName.trim() || !editUserEmail.trim()) return;

    try {
      setSavingUser(true);
      setEditUserError(null);
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editUserName.trim(),
          email: editUserEmail.trim().toLowerCase(),
          city: editUserCity.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setEditUserError(data.error || "Не вдалося оновити дані користувача");
        return;
      }

      onUserSaved({
        id: user.id,
        name: editUserName.trim(),
        email: editUserEmail.trim().toLowerCase(),
        city: editUserCity.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setEditUserError(err.message || "Помилка при оновленні користувача");
    } finally {
      setSavingUser(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Pencil className="w-4 h-4 text-primary" />
            <span>Редагування користувача</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {editUserError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{editUserError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Повне ім&apos;я <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder="Введіть повне ім'я"
              value={editUserName}
              onChange={(e) => setEditUserName(e.target.value)}
              required
              autoFocus
              className="w-full text-xs py-2 px-3 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Email адреса <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                placeholder="email@example.com"
                value={editUserEmail}
                onChange={(e) => setEditUserEmail(e.target.value)}
                required
                className="w-full text-xs font-mono pl-9 pr-3 py-2 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Зміна email оновить логін користувача для входу в систему STsup.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Місто
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Введіть місто (наприклад, Вінниця)"
                value={editUserCity}
                onChange={(e) => setEditUserCity(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={savingUser || !editUserName.trim() || !editUserEmail.trim()}
              className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {savingUser ? "Збереження..." : "Зберегти зміни"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
