"use client";

import React from "react";
import { Paperclip, Plus, Film, FileText, Trash2 } from "lucide-react";
import { TaskDetailAttachment } from "./types";

interface TaskDetailAttachmentsProps {
  attachments?: TaskDetailAttachment[];
  uploading: boolean;
  canDelete: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: (attachmentId: string) => void;
}

export const TaskDetailAttachments: React.FC<TaskDetailAttachmentsProps> = ({
  attachments = [],
  uploading,
  canDelete,
  onUpload,
  onDelete,
}) => {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Paperclip className="w-4 h-4 text-primary" />
          <span>Матеріали та скріншоти ({attachments.length})</span>
        </div>

        <label className="text-xs px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-medium border border-border cursor-pointer transition-colors flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          <span>{uploading ? "Завантаження..." : "Додати файл / скріншот"}</span>
          <input
            type="file"
            onChange={onUpload}
            disabled={uploading}
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx,.zip,.txt"
          />
        </label>
      </div>

      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          {attachments.map((att) => {
            const isImage = att.mimeType?.startsWith("image/");
            const isVideo = att.mimeType?.startsWith("video/");

            return (
              <div
                key={att.id}
                className="group relative p-2 rounded-xl bg-secondary/30 border border-border/60 hover:border-border transition-all flex flex-col justify-between"
              >
                <a
                  href={att.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="space-y-1.5 block"
                >
                  {isImage ? (
                    <div className="w-full h-24 rounded-lg bg-black/40 overflow-hidden flex items-center justify-center">
                      <img
                        src={att.fileUrl}
                        alt={att.fileName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ) : isVideo ? (
                    <div className="w-full h-24 rounded-lg bg-black/40 overflow-hidden flex flex-col items-center justify-center text-primary">
                      <Film className="w-6 h-6 mb-1" />
                      <span className="text-[10px] text-muted-foreground">Відеофайл</span>
                    </div>
                  ) : (
                    <div className="w-full h-24 rounded-lg bg-secondary/50 flex flex-col items-center justify-center text-muted-foreground">
                      <FileText className="w-6 h-6 mb-1" />
                      <span className="text-[10px]">Документ</span>
                    </div>
                  )}
                  <span
                    className="text-[11px] font-medium text-foreground truncate block"
                    title={att.fileName}
                  >
                    {att.fileName}
                  </span>
                </a>

                {canDelete && (
                  <button
                    onClick={() => onDelete(att.id)}
                    className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 rounded-md bg-background/80 text-muted-foreground hover:text-destructive shadow-sm transition-opacity cursor-pointer"
                    title="Видалити вкладення"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
