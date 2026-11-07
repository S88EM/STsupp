"use client";

import React, { useState } from "react";

interface TaskDetailTitleDescriptionProps {
  title: string;
  originalTitle: string;
  onChangeTitle: (val: string) => void;
  onSaveTitle: () => void;
  description: string;
  onChangeDescription: (val: string) => void;
  onSaveDescription: () => void;
  onPasteDescription: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
}

export const TaskDetailTitleDescription: React.FC<TaskDetailTitleDescriptionProps> = ({
  title,
  originalTitle,
  onChangeTitle,
  onSaveTitle,
  description,
  onChangeDescription,
  onSaveDescription,
  onPasteDescription,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const handleFinishTitleEdit = () => {
    setIsEditingTitle(false);
    onSaveTitle();
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        {isEditingTitle ? (
          <input
            type="text"
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            onBlur={handleFinishTitleEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleFinishTitleEdit();
              }
            }}
            autoFocus
            className="w-full text-lg font-bold bg-secondary/40 px-2 py-1 rounded border border-primary focus:outline-none text-foreground"
          />
        ) : (
          <h2
            onClick={() => setIsEditingTitle(true)}
            className="text-lg font-bold text-foreground cursor-pointer hover:bg-secondary/30 p-1 -ml-1 rounded transition-colors"
            title="Натисніть для редагування"
          >
            {originalTitle || title}
          </h2>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Опис
        </label>
        <textarea
          value={description}
          onChange={(e) => onChangeDescription(e.target.value)}
          onBlur={onSaveDescription}
          onPaste={onPasteDescription}
          rows={4}
          placeholder="Додайте детальний опис... (підтримується вставка скріншотів через Ctrl+V)"
          className="w-full text-sm bg-secondary/20 rounded-xl p-3 border border-border/70 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/50 resize-y"
        />
      </div>
    </div>
  );
};
