"use client";

import React, { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface IssueDescriptionCardProps {
  description: string | null;
  onSaveDescription: (newDesc: string) => void;
}

export function IssueDescriptionCard({
  description,
  onSaveDescription,
}: IssueDescriptionCardProps) {
  const { dict } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [descValue, setDescValue] = useState(description || "");

  useEffect(() => {
    setDescValue(description || "");
  }, [description]);

  const handleSave = () => {
    onSaveDescription(descValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDescValue(description || "");
    setIsEditing(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card/60 p-4 space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-primary" />
          <span>{dict.issue.description}</span>
        </h3>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs text-primary hover:underline font-medium cursor-pointer"
          >
            {dict.common.edit}
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            rows={6}
            value={descValue}
            onChange={(e) => setDescValue(e.target.value)}
            placeholder={dict.issue.descriptionPlaceholder}
            className="w-full text-xs p-3 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-y leading-relaxed font-sans"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1 rounded text-xs border border-border text-muted-foreground hover:bg-secondary cursor-pointer"
            >
              {dict.common.cancel}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-3.5 py-1 rounded text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer"
            >
              {dict.issue.saveDescription}
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap p-2 -m-2 rounded-lg hover:bg-secondary/30 cursor-pointer min-h-[4rem]"
          title={dict.issue.editDescription}
        >
          {description ? (
            description
          ) : (
            <span className="italic text-muted-foreground/60">
              {dict.issue.noDescriptionHint}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
