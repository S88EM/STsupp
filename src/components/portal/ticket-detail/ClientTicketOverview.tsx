"use client";

import React from "react";
import { Pencil, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface ClientTicketOverviewProps {
  title: string;
  description?: string | null;
  canEdit: boolean;
  isTaskClosed: boolean;
  onStartEdit: () => void;
}

export const ClientTicketOverview: React.FC<ClientTicketOverviewProps> = ({
  title,
  description,
  canEdit,
  isTaskClosed,
  onStartEdit,
}) => {
  const { dict } = useI18n();

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-lg font-bold text-foreground leading-snug flex-1">
          {title}
        </h1>
        {canEdit && (
          <button
            type="button"
            onClick={onStartEdit}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-secondary/80 hover:bg-secondary text-foreground border border-border/80 transition-colors shadow-xs flex-shrink-0 cursor-pointer"
            title={dict.portal.editTicketTitle}
          >
            <Pencil className="w-3.5 h-3.5 text-primary" />
            <span>{dict.common.edit}</span>
          </button>
        )}
        {isTaskClosed && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{dict.issue.resolved}</span>
          </span>
        )}
      </div>
      <div className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed p-3.5 rounded-xl bg-secondary/30 border border-border/80">
        {description || dict.issue.noDescriptionHint}
      </div>
    </div>
  );
};
