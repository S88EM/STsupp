"use client";

import React, { useState } from "react";
import { Copy, Check, Clock, X } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { renderPriorityBadge } from "../PortalTicketCard";

interface ClientTicketHeaderProps {
  code?: string;
  column?: { name: string; color?: string } | null;
  priority?: string;
  createdAt?: string;
  onClose: () => void;
}

export const ClientTicketHeader: React.FC<ClientTicketHeaderProps> = ({
  code,
  column,
  priority,
  createdAt,
  onClose,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="px-5 py-3.5 border-b border-border/80 flex items-center justify-between bg-card/60 backdrop-blur-md">
      <div className="flex items-center gap-2.5 flex-wrap">
        {code && (
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary/60 hover:bg-secondary border border-border text-xs font-mono font-bold text-primary transition-colors cursor-pointer"
            title="Копіювати номер звернення"
          >
            <span>{code}</span>
            {copiedCode ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 opacity-60" />
            )}
          </button>
        )}

        {column && (
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white shadow-xs"
            style={{ backgroundColor: column.color || "#3b82f6" }}
          >
            {column.name}
          </span>
        )}

        {priority && renderPriorityBadge(priority)}

        {createdAt && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatTimeAgo(createdAt)}</span>
          </span>
        )}
      </div>

      <button
        onClick={onClose}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};
