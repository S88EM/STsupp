"use client";

import React from "react";
import { User, Shield, AlertCircle, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface ClientTicketMetaCardsProps {
  creator?: { id: string; name: string; email: string; role?: string } | null;
  assignee?: { id: string; name: string; email: string; role?: string; avatarUrl?: string | null } | null;
  isAuthor: boolean;
  isAssigneeClient: boolean;
  isAssigneeMe: boolean;
}

export const ClientTicketMetaCards: React.FC<ClientTicketMetaCardsProps> = ({
  creator,
  assignee,
  isAuthor,
  isAssigneeClient,
  isAssigneeMe,
}) => {
  const { dict, locale } = useI18n();
  const isEn = locale === "en";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
      {/* Creator Card */}
      <div className="p-3 rounded-xl bg-secondary/20 border border-border/60 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 truncate">
          <div className="w-8 h-8 rounded-full bg-secondary text-foreground flex items-center justify-center font-bold text-xs flex-shrink-0">
            {creator ? creator.name.slice(0, 2).toUpperCase() : "C"}
          </div>
          <div className="truncate">
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              {dict.portal.ticketAuthor}
            </div>
            <div className="font-semibold text-foreground truncate">
              {isAuthor ? (isEn ? "You (Author)" : "Ви (Автор)") : creator ? creator.name : dict.roles.client}
            </div>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary text-muted-foreground border border-border flex-shrink-0">
          {isAuthor ? (isEn ? "Yours" : "Ваше") : (isEn ? "Organization" : "Організація")}
        </span>
      </div>

      {/* Assignee / Responsible Card */}
      <div className="p-3 rounded-xl bg-secondary/20 border border-border/60 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 truncate">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
              isAssigneeClient
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : assignee
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-secondary text-muted-foreground border border-border"
            }`}
          >
            {assignee ? (
              assignee.name.slice(0, 2).toUpperCase()
            ) : (
              <User className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div className="truncate">
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              {isAssigneeClient
                ? isEn ? "Awaiting reply from" : "Очікує відповіді від"
                : isEn ? "Support Engineer" : "Відповідальний інженер"}
            </div>
            <div className="font-semibold text-foreground truncate">
              {assignee ? (
                isAssigneeClient ? (
                  isAssigneeMe
                    ? isEn ? "You (Client)" : "Ви (Клієнт)"
                    : `${assignee.name} (${dict.roles.client})`
                ) : (
                  assignee.name
                )
              ) : (
                isEn ? "Awaiting engineer assignment" : "Очікує призначення інженера"
              )}
            </div>
          </div>
        </div>
        {assignee ? (
          <span
            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium flex items-center gap-1 flex-shrink-0 ${
              isAssigneeClient
                ? "bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30"
                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            }`}
          >
            {isAssigneeClient ? (
              <>
                <AlertCircle className="w-3 h-3" />
                <span>{dict.roles.client}</span>
              </>
            ) : (
              <>
                <Shield className="w-3 h-3" />
                <span>{isEn ? "Support Engineer" : "Інженер підтримки"}</span>
              </>
            )}
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-secondary text-muted-foreground border border-border flex items-center gap-1 flex-shrink-0">
            <Clock className="w-3 h-3" />
            <span>{isEn ? "In Queue" : "В черзі"}</span>
          </span>
        )}
      </div>
    </div>
  );
};
