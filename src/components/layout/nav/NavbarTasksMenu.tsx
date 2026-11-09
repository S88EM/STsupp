"use client";

import React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface NavbarTasksMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export const NavbarTasksMenu: React.FC<NavbarTasksMenuProps> = ({
  isOpen,
  onToggle,
  onClose,
}) => {
  const { dict, locale } = useI18n();

  return (
    <div className="relative hidden sm:block">
      <button
        onClick={onToggle}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
          isOpen
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
        }`}
      >
        <span>{dict.nav.issues}</span>
        <ChevronDown className="w-3 h-3 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-11 w-56 rounded-xl bg-card border border-border shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1 block">
            {locale === "en" ? "Issue Filters" : "Фільтри задач"}
          </span>
          <div className="space-y-0.5">
            <Link
              href="/issues?filter=all"
              onClick={onClose}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-foreground hover:bg-secondary transition-colors"
            >
              <span>{dict.nav.allTasks}</span>
            </Link>
            <Link
              href="/issues?filter=my"
              onClick={onClose}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-foreground hover:bg-secondary transition-colors"
            >
              <span>{dict.nav.myTasks}</span>
            </Link>
            <Link
              href="/issues?filter=open"
              onClick={onClose}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-foreground hover:bg-secondary transition-colors"
            >
              <span>{locale === "en" ? "Open issues" : "Відкриті задачі"}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
