"use client";

import React, { useState } from "react";
import { Copy, Check, Clock, X, Link2 } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { renderPriorityBadge } from "../PortalTicketCard";
import { getCanonicalTaskUrl } from "@/lib/taskUrl";
import { useI18n } from "@/lib/i18n";
import { getLocalizedStatusName } from "@/lib/constants/task";

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
  const { dict, locale } = useI18n();
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    if (!code) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const canonicalUrl = getCanonicalTaskUrl(code, origin);
    navigator.clipboard.writeText(canonicalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="px-5 py-3.5 border-b border-border/80 flex items-center justify-between bg-card/60 backdrop-blur-md relative">
      <div className="flex items-center gap-2.5 flex-wrap">
        {code && (
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/60 hover:bg-secondary border border-border text-xs font-mono font-bold text-primary transition-colors cursor-pointer group"
            title={dict.portal.copyLinkTitle}
          >
            <Link2 className="w-3 h-3 opacity-60 group-hover:opacity-100" />
            <span>{code}</span>
            {copiedLink ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
            )}
          </button>
        )}

        {column && (
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white shadow-xs"
            style={{ backgroundColor: column.color || "#3b82f6" }}
          >
            {getLocalizedStatusName(column.name, dict, locale)}
          </span>
        )}

        {priority && renderPriorityBadge(priority, dict, locale)}

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

      {/* Floating Toast notification */}
      {copiedLink && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-popover text-foreground shadow-2xl border border-border text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {locale === "en" ? (
              <>Link to <strong>{code}</strong> copied!</>
            ) : (
              <>Посилання на <strong>{code}</strong> скопійовано!</>
            )}
          </span>
        </div>
      )}
    </div>
  );
};
