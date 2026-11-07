"use client";

import React, { useState, useEffect } from "react";
import { Check, X } from "lucide-react";

interface IssueTitleProps {
  title: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveTitle: (newTitle: string) => void;
}

export function IssueTitle({
  title,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSaveTitle,
}: IssueTitleProps) {
  const [titleValue, setTitleValue] = useState(title);

  useEffect(() => {
    setTitleValue(title);
  }, [title]);

  const handleSave = () => {
    if (!titleValue.trim() || titleValue === title) {
      onCancelEdit();
      return;
    }
    onSaveTitle(titleValue.trim());
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          autoFocus
          className="flex-1 text-xl font-bold bg-secondary/50 px-3 py-1.5 rounded-lg border border-primary focus:outline-none text-foreground"
        />
        <button
          type="button"
          onClick={handleSave}
          className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setTitleValue(title);
            onCancelEdit();
          }}
          className="p-2 rounded-lg border border-border text-muted-foreground hover:bg-secondary cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <h1
      onClick={onStartEdit}
      className="text-xl font-bold text-foreground tracking-tight hover:bg-secondary/40 px-2 py-1 -mx-2 rounded-lg cursor-pointer transition-colors"
      title="Натисніть для редагування назви"
    >
      {title}
    </h1>
  );
}
