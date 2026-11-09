"use client";

import React from "react";
import { MessageSquare, Bot, Send, Loader2, ArrowRightLeft } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { CommentItem } from "../types";
import { useI18n } from "@/lib/i18n";

interface ClientTicketDialogueProps {
  comments: CommentItem[];
  currentUserId?: string;
  replyText: string;
  onChangeReplyText: (text: string) => void;
  sendingReply: boolean;
  returningToSupport: boolean;
  isWaitingForResponse: boolean;
  onSendReply: (e?: React.FormEvent) => void;
  onReturnToSupport: (includeReply: boolean) => void;
  commentsEndRef?: React.RefObject<HTMLDivElement | null>;
}

export const ClientTicketDialogue: React.FC<ClientTicketDialogueProps> = ({
  comments,
  currentUserId,
  replyText,
  onChangeReplyText,
  sendingReply,
  returningToSupport,
  isWaitingForResponse,
  onSendReply,
  onReturnToSupport,
  commentsEndRef,
}) => {
  const { dict, locale } = useI18n();
  const isEn = locale === "en";

  return (
    <div className="space-y-3 pt-2 border-t border-border/80">
      <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
        <MessageSquare className="w-3.5 h-3.5 text-primary" />
        <span>{dict.portal.dialogueWithSupport} ({comments.length})</span>
      </span>

      <div className="space-y-3">
        {comments.length > 0 ? (
          comments.map((comment) => {
            const isAi = comment.authorType === "AI_ASSISTANT";
            const isClientMe = comment.author?.id === currentUserId;
            const isClientColleague = !isClientMe && comment.author?.role === "CLIENT";
            const isStaff = !isAi && !isClientMe && !isClientColleague;

            return (
              <div
                key={comment.id}
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-colors ${
                  isStaff
                    ? "bg-primary/5 border-primary/20 shadow-xs"
                    : isClientColleague
                    ? "bg-blue-500/[0.04] border-blue-500/20"
                    : isAi
                    ? "bg-purple-500/5 border-purple-500/20"
                    : "bg-secondary/30 border-border"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        isStaff
                          ? "bg-primary text-primary-foreground"
                          : isClientColleague
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : isAi
                          ? "bg-purple-500 text-white"
                          : "bg-secondary text-foreground"
                      }`}
                    >
                      {isAi ? (
                        <Bot className="w-3.5 h-3.5" />
                      ) : (
                        (comment.author?.name || "C").slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <span className="font-semibold text-foreground">
                      {isClientMe
                        ? isEn ? "You (Client)" : "Ви (Клієнт)"
                        : isClientColleague
                        ? comment.author?.name || (isEn ? "Colleague" : "Колега")
                        : isAi
                        ? isEn ? "AI Assistant" : "AI Асистент"
                        : comment.author?.name || (isEn ? "Support Team" : "Служба підтримки")}
                    </span>
                    {isStaff && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/20 text-primary">
                        {isEn ? "Support Team" : "Служба підтримки"}
                      </span>
                    )}
                    {isClientColleague && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                        {isEn ? "Organization" : "Організація"}
                      </span>
                    )}
                    {isClientMe && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-secondary text-muted-foreground border border-border">
                        {isEn ? "You" : "Ви"}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {formatTimeAgo(comment.createdAt)}
                  </span>
                </div>
                <div className="text-foreground/90 whitespace-pre-line leading-relaxed pl-8">
                  {comment.content}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-xs text-muted-foreground/80 italic p-4 rounded-xl bg-secondary/15 border border-border/40 text-center">
            {dict.portal.noCommentsHint}
          </div>
        )}
        {commentsEndRef && <div ref={commentsEndRef as React.RefObject<HTMLDivElement>} />}
      </div>

      {/* Reply Input Form */}
      <form onSubmit={onSendReply} className="space-y-2 pt-2">
        <textarea
          rows={3}
          value={replyText}
          onChange={(e) => onChangeReplyText(e.target.value)}
          placeholder={dict.portal.dialoguePlaceholder}
          className="w-full text-xs p-3 rounded-xl bg-secondary/40 border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary font-normal leading-relaxed resize-y"
          disabled={sendingReply}
        />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <span className="text-[10px] text-muted-foreground">
            {isEn ? (
              <>Press <kbd className="px-1 py-0.5 rounded bg-secondary font-mono text-[9px]">Ctrl+V</kbd> to paste screenshot</>
            ) : (
              <>Натисніть <kbd className="px-1 py-0.5 rounded bg-secondary font-mono text-[9px]">Ctrl+V</kbd> щоб вставити скріншот</>
            )}
          </span>
          <div className="flex items-center justify-end gap-2 flex-wrap">
            {isWaitingForResponse ? (
              <>
                <button
                  type="button"
                  onClick={() => onReturnToSupport(Boolean(replyText.trim()))}
                  disabled={returningToSupport || sendingReply}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
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
                      <span>
                        {replyText.trim()
                          ? dict.portal.replyAndReturnToSupport
                          : dict.portal.returnToSupportBtn}
                      </span>
                    </>
                  )}
                </button>
                {replyText.trim() && (
                  <button
                    type="submit"
                    disabled={sendingReply || returningToSupport}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all disabled:opacity-50 cursor-pointer"
                    title={dict.portal.commentOnly}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{dict.portal.commentOnly}</span>
                  </button>
                )}
              </>
            ) : (
              <button
                type="submit"
                disabled={sendingReply || !replyText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {sendingReply ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{dict.portal.sending}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{dict.portal.sendReply}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
