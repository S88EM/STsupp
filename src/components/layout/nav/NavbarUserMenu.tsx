"use client";

import React from "react";
import { Palette, LogOut } from "lucide-react";
import { THEMES, applyTheme } from "@/components/theme/ThemeSwitcher";
import { getUserInitials } from "@/lib/utils";

interface NavbarUserMenuProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  isOpen: boolean;
  onToggle: () => void;
  onLogout: (e?: React.MouseEvent) => void;
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case "ADMIN":
      return "Адміністратор";
    case "ENGINEER":
      return "Інженер";
    case "CLIENT":
      return "Клієнт";
    default:
      return "Користувач";
  }
}

export const NavbarUserMenu: React.FC<NavbarUserMenuProps> = ({
  user,
  isOpen,
  onToggle,
  onLogout,
}) => {
  return (
    <div className="relative pl-1 border-l border-border/80">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
      >
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] border shadow-xs ${
            user.role === "ADMIN"
              ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
              : user.role === "ENGINEER"
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
              : "bg-cyan-500/20 text-cyan-400 border-cyan-500/40"
          }`}
        >
          {getUserInitials(user.name, user.email)}
        </div>
        <div className="hidden xl:flex flex-col text-left">
          <span className="text-xs font-semibold text-foreground leading-none">
            {user.name}
          </span>
          <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">
            {getRoleLabel(user.role)}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 w-56 rounded-xl bg-card border border-border shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95">
          <div className="px-3 py-2 border-b border-border/60">
            <span className="text-xs font-bold text-foreground block truncate">{user.name}</span>
            <span className="text-[10px] text-muted-foreground block truncate">{user.email}</span>
            <span className="text-[10px] font-semibold text-primary mt-1 inline-block">
              {getRoleLabel(user.role)}
            </span>
          </div>

          {/* Quick Theme Picker */}
          <div className="px-3 py-2 border-b border-border/60 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <Palette className="w-3 h-3 text-primary" />
                <span>Тема оформлення</span>
              </span>
            </div>

            {/* Dark themes row */}
            <div className="space-y-1">
              <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Темні ({THEMES.filter((t) => t.mode === "dark").length})
              </span>
              <div className="grid grid-cols-7 gap-1">
                {THEMES.filter((t) => t.mode === "dark").map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTheme(t.id, true)}
                    className={`w-6 h-6 rounded-md border transition-transform hover:scale-110 cursor-pointer shadow-xs ${t.borderAccent}`}
                    style={{ background: t.gradient }}
                    title={t.name}
                  />
                ))}
              </div>
            </div>

            {/* Light themes row */}
            <div className="space-y-1">
              <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Світлі ({THEMES.filter((t) => t.mode === "light").length})
              </span>
              <div className="grid grid-cols-5 gap-1">
                {THEMES.filter((t) => t.mode === "light").map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTheme(t.id, true)}
                    className={`w-6 h-6 rounded-md border transition-transform hover:scale-110 cursor-pointer shadow-xs ${t.borderAccent}`}
                    style={{ background: t.gradient }}
                    title={t.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="py-1">
            <button
              type="button"
              onClick={onLogout}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-left cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Вийти з системи</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
