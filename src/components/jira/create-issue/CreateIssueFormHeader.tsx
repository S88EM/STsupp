"use client";

import React from "react";
import { CheckSquare, X } from "lucide-react";

interface CreateIssueFormHeaderProps {
  onClose: () => void;
}

export const CreateIssueFormHeader: React.FC<CreateIssueFormHeaderProps> = ({
  onClose,
}) => {
  return (
    <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-secondary/30">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <CheckSquare className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-semibold text-sm text-foreground">
            Створення задачі
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Введіть інформацію про задачу, оберіть тип та виконавця
          </p>
        </div>
      </div>

      <button
        onClick={onClose}
        className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
