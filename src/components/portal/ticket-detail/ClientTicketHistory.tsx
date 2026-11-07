"use client";

import React, { useState } from "react";
import { History, ChevronDown } from "lucide-react";
import { TaskHistoryTimeline } from "@/components/common/TaskHistoryTimeline";
import { AuditLogItem } from "../types";

interface ClientTicketHistoryProps {
  auditLogs?: AuditLogItem[];
  taskCreatedAt?: string;
  taskCreator?: any;
  currentUser?: any;
}

export const ClientTicketHistory: React.FC<ClientTicketHistoryProps> = ({
  auditLogs = [],
  taskCreatedAt,
  taskCreator,
  currentUser,
}) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border/70 bg-secondary/15 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-secondary/30 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-foreground">
            Історія активності та змін ({auditLogs.length})
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${
            isHistoryOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isHistoryOpen && (
        <div className="p-3 pt-2 border-t border-border/50">
          <TaskHistoryTimeline
            auditLogs={auditLogs}
            taskCreatedAt={taskCreatedAt}
            taskCreator={taskCreator}
            currentUser={currentUser}
            compact
          />
        </div>
      )}
    </div>
  );
};
