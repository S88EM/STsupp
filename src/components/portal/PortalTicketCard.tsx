"use client";

import React from "react";
import {
  User,
  AlertCircle,
  MessageSquare,
  Paperclip,
} from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { TicketItem, isAwaitingClientResponse } from "./types";
import { useI18n } from "@/lib/i18n";
import { getLocalizedStatusName } from "@/lib/constants/task";

interface PortalTicketCardProps {
  ticket: TicketItem;
  currentUserId?: string;
  onSelect: () => void;
}

export function renderPriorityBadge(priority: string, dict?: any, locale?: string) {
  const isEn = locale === "en";
  switch (priority) {
    case "CRITICAL":
    case "URGENT":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          {dict?.portal?.priorityCritical || (isEn ? "🔴 Urgent" : "🔴 Критична")}
        </span>
      );
    case "HIGH":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          {dict?.portal?.priorityHigh || (isEn ? "🟠 High" : "🟠 Висока")}
        </span>
      );
    case "LOW":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          {dict?.portal?.priorityLow || (isEn ? "🟢 Low" : "🟢 Низька")}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
          {dict?.portal?.priorityMedium || (isEn ? "🔵 Medium" : "🔵 Звичайна")}
        </span>
      );
  }
}

export const PortalTicketCard: React.FC<PortalTicketCardProps> = ({
  ticket,
  currentUserId,
  onSelect,
}) => {
  const { dict, locale } = useI18n();
  const isWaitingForClient = isAwaitingClientResponse(ticket, currentUserId);

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-2xl bg-card hover:bg-secondary/30 border transition-all cursor-pointer group hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isWaitingForClient
          ? "border-amber-500/50 bg-amber-500/[0.03]"
          : "border-border hover:border-primary/30"
      }`}
    >
      {/* Left: Code, Title, Project */}
      <div className="space-y-1.5 flex-1 pr-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded-lg bg-secondary/80 font-mono text-[11px] font-bold text-primary border border-border group-hover:border-primary/40 transition-colors">
            {ticket.code}
          </span>

          {ticket.project && (
            <span className="text-[11px] text-muted-foreground font-medium">
              {ticket.project.name}
            </span>
          )}

          {ticket.creator && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                ticket.creatorId === currentUserId
                  ? "bg-primary/10 text-primary border-primary/25"
                  : "bg-secondary text-muted-foreground border-border/80"
              }`}
              title={
                locale === "en"
                  ? `Created by: ${ticket.creator.name} (${ticket.creator.email})`
                  : `Створив(-ла): ${ticket.creator.name} (${ticket.creator.email})`
              }
            >
              <User className="w-3 h-3" />
              <span>
                {ticket.creatorId === currentUserId
                  ? locale === "en"
                    ? "You (Author)"
                    : "Ви (Автор)"
                  : ticket.creator.name}
              </span>
            </span>
          )}

          {renderPriorityBadge(ticket.priority, dict, locale)}

          {/* Distinctive pill if awaiting client reply */}
          {isWaitingForClient && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30 shadow-xs animate-pulse">
              <AlertCircle className="w-3 h-3" />
              <span>{dict.portal.awaitingClient}</span>
            </span>
          )}
        </div>

        <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
          {ticket.title}
        </h3>

        {ticket.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
            {ticket.description}
          </p>
        )}
      </div>

      {/* Right: Status badge, Assignee, Stats & Date */}
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
        {/* Status Pill */}
        {ticket.column && (
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold text-white shadow-xs"
            style={{ backgroundColor: ticket.column.color || "#3b82f6" }}
          >
            {getLocalizedStatusName(ticket.column.name, dict, locale)}
          </span>
        )}

        {/* Assigned Engineer / Person */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] ${
              isWaitingForClient
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                : "bg-primary/20 text-primary"
            }`}
          >
            {ticket.assignee ? ticket.assignee.name.slice(0, 2).toUpperCase() : "?"}
          </div>
          <span className="truncate max-w-[130px]">
            {isWaitingForClient
              ? locale === "en"
                ? "You (Responsible)"
                : "Ви (Відповідальний)"
              : ticket.assignee
              ? ticket.assignee.name
              : dict.common.notAssigned}
          </span>
        </div>

        {/* Counters: Comments & Attachments */}
        <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
          {(ticket._count?.comments || 0) > 0 && (
            <span
              className="flex items-center gap-1"
              title={locale === "en" ? "Comments count" : "Кількість коментарів"}
            >
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
              <span>{ticket._count?.comments}</span>
            </span>
          )}

          {(ticket._count?.attachments || 0) > 0 && (
            <span
              className="flex items-center gap-1"
              title={locale === "en" ? "Attachments count" : "Кількість файлів"}
            >
              <Paperclip className="w-3.5 h-3.5 text-primary" />
              <span>{ticket._count?.attachments}</span>
            </span>
          )}
        </div>

        {/* Timeago */}
        <span className="text-[11px] text-muted-foreground whitespace-nowrap min-w-[70px] text-right">
          {formatTimeAgo(ticket.updatedAt || ticket.createdAt)}
        </span>
      </div>
    </div>
  );
};
