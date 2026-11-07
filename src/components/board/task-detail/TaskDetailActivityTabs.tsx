"use client";

import React, { useState } from "react";
import { MessageSquare, History, Bot, Send } from "lucide-react";
import { TaskHistoryTimeline } from "@/components/common/TaskHistoryTimeline";
import { formatTimeAgo } from "@/lib/utils";
import { TaskDetailComment } from "./types";

interface TaskDetailActivityTabsProps {
  comments?: TaskDetailComment[];
  auditLogs?: any[];
  taskCreatedAt?: string;
  taskCreator?: any;
  currentUser?: any;
  newComment: string;
  onChangeNewComment: (val: string) => void;
  onAddComment: (e: React.FormEvent) => void;
  commentsEndRef?: React.RefObject<HTMLDivElement | null>;
}

export const TaskDetailActivityTabs: React.FC<TaskDetailActivityTabsProps> = ({
  comments = [],
  auditLogs = [],
  taskCreatedAt,
  taskCreator,
  currentUser,
  newComment,
  onChangeNewComment,
  onAddComment,
  commentsEndRef,
}) => {
  const [activeBottomTab, setActiveBottomTab] = useState<"comments" | "history">("comments");

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-4 border-b border-border/60 pb-2">
        <button
          type="button"
          onClick={() => setActiveBottomTab("comments")}
          className={`flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
            activeBottomTab === "comments"
              ? "text-primary border-b-2 border-primary -mb-2.5 pb-2"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Коментарі ({comments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBottomTab("history")}
          className={`flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
            activeBottomTab === "history"
              ? "text-primary border-b-2 border-primary -mb-2.5 pb-2"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Історія активності ({auditLogs.length})</span>
        </button>
      </div>

      {activeBottomTab === "history" ? (
        <div className="pt-2">
          <TaskHistoryTimeline
            auditLogs={auditLogs}
            taskCreatedAt={taskCreatedAt}
            taskCreator={taskCreator}
            currentUser={currentUser}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Comment List */}
          <div className="space-y-2 pt-1">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                    comment.authorType === "AI_ASSISTANT"
                      ? "bg-indigo-950/20 border-indigo-500/30"
                      : "bg-secondary/20 border-border/60"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      {comment.authorType === "AI_ASSISTANT" ? (
                        <>
                          <Bot className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-indigo-400">
                            {comment.authorName || "Confluence AI"}
                          </span>
                        </>
                      ) : (
                        <span>{comment.author?.name || "Користувач"}</span>
                      )}
                    </div>
                    <span className="text-muted-foreground">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <div className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {comment.content}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-xs text-muted-foreground/80 italic rounded-lg bg-secondary/10 border border-border/40">
                Коментарів поки немає. Залиште перший коментар нижче.
              </div>
            )}
            {commentsEndRef && <div ref={commentsEndRef as React.RefObject<HTMLDivElement>} />}
          </div>

          {/* Comment Input */}
          <form onSubmit={onAddComment} className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="Написати коментар..."
              value={newComment}
              onChange={(e) => onChangeNewComment(e.target.value)}
              className="flex-1 text-xs bg-secondary/40 border border-border/80 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Надіслати</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
