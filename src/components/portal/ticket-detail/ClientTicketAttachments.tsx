"use client";

import React, { useRef } from "react";
import { Paperclip, Plus, Loader2, FileText, Download } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { AttachmentItem, formatFileSize, isImageFile } from "../types";
import { useI18n } from "@/lib/i18n";

interface ClientTicketAttachmentsProps {
  attachments?: AttachmentItem[];
  uploading: boolean;
  onUploadFile: (file: File) => void;
}

export const ClientTicketAttachments: React.FC<ClientTicketAttachmentsProps> = ({
  attachments = [],
  uploading,
  onUploadFile,
}) => {
  const { dict } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-primary" />
          <span>{dict.portal.attachmentsAndScreenshots} ({attachments.length})</span>
        </span>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-3 h-3 animate-spin text-primary" />
          ) : (
            <Plus className="w-3 h-3" />
          )}
          <span>{dict.portal.addFile}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onUploadFile(e.target.files[0]);
            }
          }}
        />
      </div>

      {attachments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {attachments.map((att) => {
            const isImg = isImageFile(att.fileUrl, att.mimeType);
            return (
              <a
                key={att.id}
                href={att.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2 rounded-xl bg-secondary/40 hover:bg-secondary/70 border border-border transition-colors group"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  {isImg ? (
                    <img
                      src={att.fileUrl}
                      alt={att.fileName}
                      className="w-8 h-8 rounded-lg object-cover border border-border flex-shrink-0"
                    />
                  ) : (
                    <FileText className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="truncate">
                    <span className="font-semibold text-xs text-foreground block truncate group-hover:text-primary transition-colors">
                      {att.fileName}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatFileSize(att.fileSize)} • {formatTimeAgo(att.createdAt)}
                    </span>
                  </div>
                </div>
                <Download className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
              </a>
            );
          })}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground/80 italic p-3 rounded-xl bg-secondary/15 border border-border/40 text-center">
          {dict.portal.noAttachmentsHint}
        </div>
      )}
    </div>
  );
};
