"use client";

import React from "react";
import Link from "next/link";
import { LifeBuoy, Users, Settings } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface NavbarServicesMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  currentProjectId?: string;
  isAdmin: boolean;
}

export const NavbarServicesMenu: React.FC<NavbarServicesMenuProps> = ({
  isOpen,
  onToggle,
  onClose,
  currentProjectId,
  isAdmin,
}) => {
  const { dict } = useI18n();

  return (
    <div className="relative">
      {/* Service Switcher (9-dots Atlassian grid icon) */}
      <button
        onClick={onToggle}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
        title={dict.nav.servicesSwitcher}
      >
        <div className="grid grid-cols-3 gap-0.5 w-4 h-4 p-0.5">
          {[...Array(9)].map((_, i) => (
            <span key={i} className="w-1 h-1 rounded-full bg-current" />
          ))}
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-12 w-64 rounded-xl bg-card border border-border shadow-2xl p-3 z-50 animate-in fade-in-50 zoom-in-95">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
            {dict.nav.servicesTitle}
          </span>
          <div className="space-y-1">
            <Link
              href={currentProjectId ? `/projects/${currentProjectId}` : "/"}
              onClick={onClose}
              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-secondary text-xs font-medium text-foreground transition-colors"
            >
              <div className="w-6 h-6 rounded bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                ST
              </div>
              <div>
                <div className="font-semibold">STsup Tracker</div>
                <span className="text-[10px] text-muted-foreground">
                  {dict.nav.trackerSubtitle}
                </span>
              </div>
            </Link>

            <Link
              href="/portal"
              onClick={onClose}
              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-secondary text-xs font-medium text-foreground transition-colors"
            >
              <div className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                <LifeBuoy className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-semibold">{dict.nav.portalTitle}</div>
                <span className="text-[10px] text-muted-foreground">
                  {dict.nav.portalSubtitle}
                </span>
              </div>
            </Link>

            {isAdmin && (
              <>
                <Link
                  href="/users"
                  onClick={onClose}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-secondary text-xs font-medium text-foreground transition-colors"
                >
                  <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold">{dict.nav.usersAndRoles}</div>
                    <span className="text-[10px] text-muted-foreground">
                      {dict.nav.usersSubtitle}
                    </span>
                  </div>
                </Link>

                <Link
                  href="/settings"
                  onClick={onClose}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-secondary text-xs font-medium text-foreground transition-colors"
                >
                  <div className="w-6 h-6 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Settings className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold">{dict.nav.settings}</div>
                    <span className="text-[10px] text-muted-foreground">
                      {dict.nav.settingsSubtitle}
                    </span>
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
