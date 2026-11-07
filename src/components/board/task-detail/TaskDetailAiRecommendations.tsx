"use client";

import React from "react";
import { Sparkles, ExternalLink } from "lucide-react";

interface TaskDetailAiRecommendationsProps {
  recommendations?: any[];
  aiLoading: boolean;
  onTriggerAi: () => void;
}

export const TaskDetailAiRecommendations: React.FC<TaskDetailAiRecommendationsProps> = ({
  recommendations = [],
  aiLoading,
  onTriggerAi,
}) => {
  return (
    <div className="p-4 rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 via-background to-background space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wide">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>AI Рекомендації (Confluence MCP)</span>
        </div>
        <button
          onClick={onTriggerAi}
          disabled={aiLoading}
          className="text-xs px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-medium border border-indigo-500/30 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{aiLoading ? "Аналіз..." : "Запитати базу знань"}</span>
        </button>
      </div>

      {recommendations.length > 0 ? (
        <div className="space-y-3 pt-1">
          {recommendations.map((rec: any) => (
            <div
              key={rec.id}
              className="text-xs space-y-2 bg-indigo-950/10 p-3 rounded-lg border border-indigo-500/20"
            >
              <p className="text-foreground/90 leading-relaxed">{rec.summary}</p>
              {Array.isArray(rec.confluencePages) && rec.confluencePages.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    Знайдена документація у Confluence:
                  </span>
                  {rec.confluencePages.map((page: any, idx: number) => (
                    <a
                      key={idx}
                      href={page.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 hover:underline text-[11px]"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>{page.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground/80">
          Натисніть кнопку вище, щоб штучний інтелект перевірив базу знань Confluence на наявність інструкцій, регламентів та порад для цієї задачі.
        </p>
      )}
    </div>
  );
};
