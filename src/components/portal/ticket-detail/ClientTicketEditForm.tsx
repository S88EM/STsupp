"use client";

import React from "react";
import { Pencil, Loader2, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface ClientTicketEditFormProps {
  title: string;
  onChangeTitle: (title: string) => void;
  description: string;
  onChangeDescription: (desc: string) => void;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  onChangePriority: (priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT") => void;
  saving: boolean;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const ClientTicketEditForm: React.FC<ClientTicketEditFormProps> = ({
  title,
  onChangeTitle,
  description,
  onChangeDescription,
  priority,
  onChangePriority,
  saving,
  onSave,
  onCancel,
}) => {
  const { dict } = useI18n();

  const priorityOptions = [
    { id: "LOW" as const, label: `🟢 ${dict.priorities.low}`, desc: dict.portal.priorityMinorDesc },
    { id: "MEDIUM" as const, label: `🔵 ${dict.priorities.medium}`, desc: dict.portal.priorityStandardDesc },
    { id: "HIGH" as const, label: `🟠 ${dict.priorities.high}`, desc: dict.portal.priorityDisruptedDesc },
    { id: "URGENT" as const, label: `🔴 ${dict.priorities.urgent}`, desc: dict.portal.priorityOutageDesc },
  ];

  return (
    <form onSubmit={onSave} className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-4">
      <div className="flex items-center justify-between border-b border-primary/20 pb-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Pencil className="w-4 h-4 text-primary" />
          <span>{dict.portal.editTicketHeader}</span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {dict.portal.editTicketSubtitle}
        </span>
      </div>

      {/* Title Input */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1">
          <span>{dict.portal.ticketSubject}</span>
          <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder={dict.portal.subjectPlaceholder}
          className="w-full text-sm font-medium px-3 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          required
        />
      </div>

      {/* Priority Selection */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          {dict.portal.urgencyLabel}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {priorityOptions.map((p) => {
            const isSelected = priority === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onChangePriority(p.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary/15 border-primary text-foreground font-semibold ring-1 ring-primary shadow-xs"
                    : "bg-card/70 border-border/80 text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                }`}
              >
                <div className="text-xs font-bold">{p.label}</div>
                <div className="text-[10px] opacity-75">{p.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Description Textarea */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          {dict.portal.detailedDescription}
        </label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => onChangeDescription(e.target.value)}
          placeholder={dict.portal.detailedDescriptionPlaceholder}
          className="w-full text-xs p-3 rounded-lg bg-card border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-y leading-relaxed"
        />
      </div>

      {/* Actions: Save & Cancel */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-primary/20">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-3 py-1.5 rounded-lg border border-border hover:bg-secondary text-xs font-medium text-foreground transition-colors cursor-pointer"
        >
          {dict.common.cancel}
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
        >
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{dict.common.saving}</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>{dict.common.saveChanges}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
