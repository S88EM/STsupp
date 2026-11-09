"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Sparkles, Send } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { TaskHistoryTimeline } from "@/components/common/TaskHistoryTimeline";
import { FEATURE_FLAGS } from "@/config/features";
import { useI18n } from "@/lib/i18n";

interface CommentItem {
  id: string;
  createdAt: string;
  content: string;
  authorType?: string;
  authorName?: string;
  author?: {
    name?: string;
    email?: string;
  };
}

interface IssueActivityTabsProps {
  comments: CommentItem[] | undefined;
  auditLogs: any[] | undefined;
  taskCreatedAt: string;
  taskCreator: any;
  currentUser?: any;
  aiRecommendation: string | null;
  aiLoading: boolean;
  commentInputRef: React.RefObject<HTMLTextAreaElement>;
  onAddComment: (content: string) => Promise<void>;
  onGetAiRecommendation: () => Promise<void>;
}

export function IssueActivityTabs({
  comments,
  auditLogs,
  taskCreatedAt,
  taskCreator,
  currentUser,
  aiRecommendation,
  aiLoading,
  commentInputRef,
  onAddComment,
  onGetAiRecommendation,
}: IssueActivityTabsProps) {
  const { dict, locale } = useI18n();
  const [activeTab, setActiveTab] = useState<"comments" | "ai" | "history">("comments");
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const sortedComments = useMemo(() => {
    if (!comments || !Array.isArray(comments)) return [];
    return [...comments].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [comments]);

  useEffect(() => {
    if (activeTab === "comments" && sortedComments.length > 0) {
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
  }, [activeTab, sortedComments.length]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || postingComment) return;

    try {
      setPostingComment(true);
      await onAddComment(newComment.trim());
      setNewComment("");
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } finally {
      setPostingComment(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card/60 p-4 space-y-4">
      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-border/80 pb-2">
        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("comments")}
            className={`pb-1 font-semibold transition-colors relative cursor-pointer ${
              activeTab === "comments"
                ? "text-primary border-b-2 border-primary -mb-2.5"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {dict.issue.comments} ({sortedComments.length})
          </button>

          {FEATURE_FLAGS.ENABLE_AI_ASSISTANT && (
            <button
              type="button"
              onClick={() => setActiveTab("ai")}
              className={`pb-1 font-semibold flex items-center gap-1 transition-colors relative cursor-pointer ${
                activeTab === "ai"
                  ? "text-primary border-b-2 border-primary -mb-2.5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>ШІ-Асистент</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`pb-1 font-semibold transition-colors relative cursor-pointer ${
              activeTab === "history"
                ? "text-primary border-b-2 border-primary -mb-2.5"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {dict.issue.activity} ({auditLogs?.length || 0})
          </button>
        </div>

        {FEATURE_FLAGS.ENABLE_AI_ASSISTANT && activeTab === "comments" && (
          <button
            type="button"
            onClick={onGetAiRecommendation}
            disabled={aiLoading}
            className="flex items-center gap-1 text-[11px] text-primary hover:underline font-medium cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3" />
            <span>{aiLoading ? "Генерація..." : "AI Рекомендація"}</span>
          </button>
        )}
      </div>

      {/* Tab: Comments */}
      {activeTab === "comments" && (
        <div className="space-y-4">
          {/* Comments List */}
          <div className="space-y-3 pt-1 divide-y divide-border/50">
            {sortedComments.length > 0 ? (
              sortedComments.map((comment) => (
                <div key={comment.id} className="pt-3 first:pt-0 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">
                      {comment.author?.name || comment.authorName || "Користувач"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatTimeAgo(comment.createdAt, locale)}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground">
                {dict.issue.noComments}
              </div>
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* New Comment Input */}
          <form onSubmit={handleSubmitComment} className="pt-2 space-y-2">
            <textarea
              ref={commentInputRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={dict.issue.commentPlaceholder}
              rows={3}
              className="w-full text-xs p-3 rounded-xl bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground resize-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="submit"
                disabled={!newComment.trim() || postingComment}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{postingComment ? dict.common.loading : dict.issue.sendComment}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: AI Assistant */}
      {FEATURE_FLAGS.ENABLE_AI_ASSISTANT && activeTab === "ai" && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/25 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Аналіз задачі за допомогою ШІ</span>
              </span>
              <button
                type="button"
                onClick={onGetAiRecommendation}
                disabled={aiLoading}
                className="px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
              >
                {aiLoading ? "Аналіз..." : "Оновити аналіз"}
              </button>
            </div>
            <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {aiRecommendation ||
                "ШІ-асистент може проаналізувати контекст задачі, помилку або код та надати план вирішення."}
            </p>
          </div>
        </div>
      )}

      {/* Tab: History */}
      {activeTab === "history" && (
        <div className="pt-2">
          <TaskHistoryTimeline
            auditLogs={auditLogs || []}
            taskCreatedAt={taskCreatedAt}
            taskCreator={taskCreator}
            currentUser={currentUser}
          />
        </div>
      )}
    </div>
  );
}
