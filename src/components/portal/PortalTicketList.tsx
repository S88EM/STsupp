"use client";

import React from "react";
import {
  LifeBuoy,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  Inbox,
  UserCheck,
} from "lucide-react";
import { TicketItem, PortalStatusFilter } from "./types";
import { PortalTicketCard } from "./PortalTicketCard";
import { useI18n } from "@/lib/i18n";

interface PortalTicketListProps {
  tickets: TicketItem[];
  loading: boolean;
  statusFilter: PortalStatusFilter;
  searchQuery: string;
  scopeFilter: "all" | "my";
  currentUserId?: string;
  onSelectTicket: (ticket: TicketItem) => void;
  onCreateTicketClick: () => void;
}

export const PortalTicketList: React.FC<PortalTicketListProps> = ({
  tickets,
  loading,
  statusFilter,
  searchQuery,
  scopeFilter,
  currentUserId,
  onSelectTicket,
  onCreateTicketClick,
}) => {
  const { dict, locale } = useI18n();

  if (loading) {
    return (
      <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <span className="text-xs">{dict.portal.loadingTickets}</span>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="p-16 text-center rounded-2xl border border-border bg-card flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-secondary/60 text-muted-foreground flex items-center justify-center">
          {statusFilter === "resolved" ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          ) : statusFilter === "in_progress" ? (
            <Clock className="w-6 h-6 text-blue-400" />
          ) : statusFilter === "backlog" ? (
            <Inbox className="w-6 h-6 text-amber-400" />
          ) : statusFilter === "awaiting_response" ? (
            <UserCheck className="w-6 h-6 text-purple-400" />
          ) : (
            <LifeBuoy className="w-6 h-6" />
          )}
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground">
            {statusFilter === "resolved"
              ? dict.portal.noResolvedTickets
              : statusFilter === "in_progress"
              ? dict.portal.noInProgressTickets
              : statusFilter === "backlog"
              ? dict.portal.noBacklogTickets
              : statusFilter === "awaiting_response"
              ? dict.portal.noAwaitingTickets
              : searchQuery
              ? dict.portal.noSearchResults
              : dict.portal.noTickets}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            {statusFilter === "resolved"
              ? dict.portal.noResolvedDesc
              : statusFilter === "in_progress"
              ? dict.portal.noInProgressDesc
              : statusFilter === "backlog"
              ? dict.portal.noBacklogDesc
              : statusFilter === "awaiting_response"
              ? dict.portal.noAwaitingDesc
              : searchQuery
              ? locale === "en"
                ? `No results found for "${searchQuery}". Try modifying your search criteria.`
                : `За запитом «${searchQuery}» результатів не виявлено. Спробуйте змінити критерії пошуку.`
              : scopeFilter === "my"
              ? dict.portal.noMyTicketsDesc
              : dict.portal.noProjectTicketsDesc}
          </p>
        </div>
        {statusFilter === "all" && !searchQuery && (
          <button
            onClick={onCreateTicketClick}
            className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{dict.portal.createFirstTicket}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tickets.map((ticket) => (
        <PortalTicketCard
          key={ticket.id}
          ticket={ticket}
          currentUserId={currentUserId}
          onSelect={() => onSelectTicket(ticket)}
        />
      ))}
    </div>
  );
};
