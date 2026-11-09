"use client";

import React from "react";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface ClientTicketAlertBannerProps {
  isWaitingForResponse: boolean;
  returningToSupport: boolean;
  sendingReply: boolean;
  onReturnToSupport: () => void;
}

export const ClientTicketAlertBanner: React.FC<ClientTicketAlertBannerProps> = ({
  isWaitingForResponse,
  returningToSupport,
  sendingReply,
  onReturnToSupport,
}) => {
  const { dict } = useI18n();

  if (!isWaitingForResponse) return null;

  return (
    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0 font-bold">
          <ArrowRightLeft className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-foreground">
            {dict.portal.supportWaitingReply}
          </div>
          <div className="text-muted-foreground text-[11px] leading-relaxed">
            {dict.portal.supportWaitingReplyDesc}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onReturnToSupport}
        disabled={returningToSupport || sendingReply}
        className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all flex-shrink-0 disabled:opacity-50 cursor-pointer"
        title={dict.portal.returnToSupportBtn}
      >
        {returningToSupport ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{dict.portal.returning}</span>
          </>
        ) : (
          <>
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>{dict.portal.returnToSupportBtn}</span>
          </>
        )}
      </button>
    </div>
  );
};
