"use client";

import React, { useState } from "react";
import { Paperclip, Film, FileText } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface AttachmentItem {
  id: string;
  fileUrl: string;
  fileName: string;
  mimeType?: string;
}

interface IssueAttachmentsCardProps {
  attachments: AttachmentItem[] | undefined;
  uploadingFile: boolean;
  onUploadFile: (file: File) => void;
}

export function IssueAttachmentsCard({
  attachments,
  uploadingFile,
  onUploadFile,
}: IssueAttachmentsCardProps) {
  const { dict } = useI18n();
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Paperclip className="w-3.5 h-3.5 text-primary" />
          <span>{dict.issue.attachments} ({attachments?.length || 0})</span>
        </h3>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer ${
          isDragging
            ? "border-primary bg-primary/10"
            : "border-border/80 hover:border-primary/60 bg-secondary/10"
        }`}
      >
        <input
          type="file"
          id="file-upload-input"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onUploadFile(e.target.files[0]);
            }
          }}
        />
        <label
          htmlFor="file-upload-input"
          className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
        >
          <Paperclip className="w-5 h-5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">
            {uploadingFile ? dict.issue.uploadingFile : dict.issue.dropAttachments}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {dict.issue.attachmentsFormatHint}
          </span>
        </label>
      </div>

      {/* Attachments list */}
      {attachments && attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          {attachments.map((att) => {
            const isImage = att.mimeType?.startsWith("image/");
            const isVideo = att.mimeType?.startsWith("video/");

            return (
              <a
                key={att.id}
                href={att.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2 rounded-lg bg-secondary/30 border border-border/80 hover:border-primary/50 transition-all flex flex-col gap-1.5 overflow-hidden"
              >
                <div className="h-20 w-full rounded bg-secondary flex items-center justify-center overflow-hidden">
                  {isImage ? (
                    <img
                      src={att.fileUrl}
                      alt={att.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : isVideo ? (
                    <Film className="w-6 h-6 text-primary" />
                  ) : (
                    <FileText className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <span className="text-[11px] font-medium text-foreground truncate block">
                  {att.fileName}
                </span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
