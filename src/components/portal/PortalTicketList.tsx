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
  if (loading) {
    return (
      <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <span className="text-xs">Завантаження списку звернень...</span>
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
              ? "Немає вирішених звернень"
              : statusFilter === "in_progress"
              ? "Немає звернень у роботі"
              : statusFilter === "backlog"
              ? "Немає звернень у черзі"
              : statusFilter === "awaiting_response"
              ? "Немає звернень, що очікують відповіді"
              : searchQuery
              ? "Звернень за запитом не знайдено"
              : "Звернень не знайдено"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            {statusFilter === "resolved"
              ? "Тут відображатимуться закриті тікети після завершення робіт нашими інженерами."
              : statusFilter === "in_progress"
              ? "Наразі жодне звернення не перебуває в активній розробці. Тікети очікують у черзі або вже вирішені."
              : statusFilter === "backlog"
              ? "Усі ваші звернення вже взяті інженерами в активну роботу або вирішені."
              : statusFilter === "awaiting_response"
              ? "Чудово! Наразі всі ваші звернення знаходяться в обробці інженерів і не потребують вашої відповіді."
              : searchQuery
              ? `За запитом «${searchQuery}» результатів не виявлено. Спробуйте змінити критерії пошуку.`
              : scopeFilter === "my"
              ? "У вас ще немає створених звернень. Перемкніть фільтр на «Всі звернення організації / проєкту» або створіть нове звернення."
              : "У цьому проєкті ще немає зареєстрованих звернень. Створіть перше звернення, і наша служба підтримки допоможе вам!"}
          </p>
        </div>
        {statusFilter === "all" && !searchQuery && (
          <button
            onClick={onCreateTicketClick}
            className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Створити перше звернення</span>
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
