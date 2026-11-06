"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Send,
  Paperclip,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  Layers,
} from "lucide-react";

interface ProjectItem {
  id: string;
  name: string;
  key: string;
}

interface ClientCreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectItem[];
  defaultProjectId?: string;
  onTicketCreated: (createdTicket: any) => void;
}

interface FileToUpload {
  file: File;
  id: string;
  previewUrl?: string;
}

export const ClientCreateTicketModal: React.FC<ClientCreateTicketModalProps> = ({
  isOpen,
  onClose,
  projects,
  defaultProjectId,
  onTicketCreated,
}) => {
  const [projectId, setProjectId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [files, setFiles] = useState<FileToUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (defaultProjectId && projects.some((p) => p.id === defaultProjectId)) {
        setProjectId(defaultProjectId);
      } else if (projects.length > 0) {
        setProjectId(projects[0].id);
      }
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setFiles([]);
      setError(null);
    }
  }, [isOpen, defaultProjectId, projects]);

  // Global paste listener for Ctrl+V screenshots
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const ext = blob.type.split("/")[1] || "png";
            const file = new File([blob], `screenshot-${Date.now()}.${ext}`, { type: blob.type });
            const previewUrl = URL.createObjectURL(file);
            setFiles((prev) => [...prev, { file, id: `${Date.now()}-${Math.random()}`, previewUrl }]);
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFilesSelected = (newFileList: FileList | null) => {
    if (!newFileList || newFileList.length === 0) return;
    const added: FileToUpload[] = [];

    for (let i = 0; i < newFileList.length; i++) {
      const file = newFileList[i];
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
      added.push({ file, id: `${Date.now()}-${Math.random()}-${i}`, previewUrl });
    }

    setFiles((prev) => [...prev, ...added]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!projectId) {
      setError("Будь ласка, оберіть проєкт");
      return;
    }

    if (!title.trim()) {
      setError("Вкажіть тему звернення");
      return;
    }

    if (!description.trim()) {
      setError("Опишіть проблему або питання");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Create the task via project API
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          priority,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Не вдалося створити звернення");
      }

      const createdTask = await res.json();

      // 2. Upload any attachments queued
      if (files.length > 0 && createdTask?.id) {
        for (const item of files) {
          try {
            const formData = new FormData();
            formData.append("file", item.file);

            await fetch(`/api/projects/${projectId}/tasks/${createdTask.id}/attachments`, {
              method: "POST",
              body: formData,
            });
          } catch (uploadErr) {
            console.error("Failed to upload attachment:", uploadErr);
          }
        }
      }

      onTicketCreated(createdTask);
      onClose();
    } catch (err: any) {
      console.error("Ticket submission error:", err);
      setError(err.message || "Сталася помилка при надсиланні звернення");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProject = projects.find((p) => p.id === projectId);

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        ref={modalContainerRef}
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-border/80 flex items-center justify-between bg-card/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Нове звернення до підтримки</h2>
              <p className="text-xs text-muted-foreground">
                Опишіть ситуацію, і наша команда оперативно візьме тікет у роботу
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Project Selection */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">
              Проєкт / Сервіс <span className="text-destructive">*</span>
            </label>
            {projects.length > 1 ? (
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={submitting}
                className="w-full text-xs px-3 py-2 rounded-xl bg-secondary/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.key}] {p.name}
                  </option>
                ))}
              </select>
            ) : selectedProject ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground font-medium">
                <span className="font-mono text-primary font-bold">[{selectedProject.key}]</span>
                <span>{selectedProject.name}</span>
              </div>
            ) : (
              <div className="text-xs text-amber-500 font-medium">
                Немає доступних проєктів. Зверніться до адміністратора.
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">
              Тема звернення <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              placeholder="Наприклад: Помилка під час синхронізації або запит на налаштування"
              className="w-full text-xs px-3 py-2.5 rounded-xl bg-secondary/40 border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            />
          </div>

          {/* Urgency / Priority */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">
              Терміновість / Вплив на роботу
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPriority("LOW")}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition-all ${
                  priority === "LOW"
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-400 font-semibold shadow-xs"
                    : "bg-secondary/20 border-border text-muted-foreground hover:bg-secondary/40"
                }`}
              >
                <span className="text-sm">🟢</span>
                <span className="mt-1">Низька</span>
                <span className="text-[10px] text-muted-foreground/70">Консультація</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority("MEDIUM")}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition-all ${
                  priority === "MEDIUM"
                    ? "bg-blue-500/15 border-blue-500 text-blue-400 font-semibold shadow-xs"
                    : "bg-secondary/20 border-border text-muted-foreground hover:bg-secondary/40"
                }`}
              >
                <span className="text-sm">🔵</span>
                <span className="mt-1">Звичайна</span>
                <span className="text-[10px] text-muted-foreground/70">Стандартна</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority("HIGH")}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition-all ${
                  priority === "HIGH"
                    ? "bg-amber-500/15 border-amber-500 text-amber-400 font-semibold shadow-xs"
                    : "bg-secondary/20 border-border text-muted-foreground hover:bg-secondary/40"
                }`}
              >
                <span className="text-sm">🟠</span>
                <span className="mt-1">Висока</span>
                <span className="text-[10px] text-muted-foreground/70">Порушено процес</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority("CRITICAL")}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition-all ${
                  priority === "CRITICAL"
                    ? "bg-rose-500/15 border-rose-500 text-rose-400 font-semibold shadow-xs"
                    : "bg-secondary/20 border-border text-muted-foreground hover:bg-secondary/40"
                }`}
              >
                <span className="text-sm">🔴</span>
                <span className="mt-1">Критична</span>
                <span className="text-[10px] text-muted-foreground/70">Аварійний збій</span>
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">
              Детальний опис <span className="text-destructive">*</span>
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              placeholder="Будь ласка, опишіть якомога детальніше:&#10;1. Що саме сталося або що потрібно зробити?&#10;2. Який очікувався результат?&#10;3. За яких умов виникає проблема?"
              className="w-full text-xs p-3 rounded-xl bg-secondary/40 border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary font-normal leading-relaxed resize-y"
            />
          </div>

          {/* File Attachments Dropzone */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-foreground">
                Вкладення та скріншоти
              </label>
              <span className="text-[11px] text-muted-foreground">
                Підтримується <kbd className="px-1.5 py-0.5 rounded bg-secondary text-primary font-mono text-[10px]">Ctrl+V</kbd>
              </span>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFilesSelected(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-1.5 ${
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-secondary/30"
              }`}
            >
              <UploadCloud className="w-6 h-6 text-muted-foreground" />
              <div className="text-xs font-medium text-foreground">
                Перетягніть файли сюди або <span className="text-primary underline">оберіть на диску</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                Зображення, логи, PDF або скріншот з буфера обміну
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
            </div>

            {/* List of files to upload */}
            {files.length > 0 && (
              <div className="mt-2.5 space-y-1.5">
                {files.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-secondary/50 border border-border text-xs"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      {item.previewUrl ? (
                        <img
                          src={item.previewUrl}
                          alt="preview"
                          className="w-7 h-7 rounded object-cover border border-border"
                        />
                      ) : (
                        <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="truncate">
                        <span className="font-medium text-foreground block truncate">{item.file.name}</span>
                        <span className="text-[10px] text-muted-foreground">{formatFileSize(item.file.size)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(item.id)}
                      className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Видалити"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-border/80 flex items-center justify-between bg-card/60 backdrop-blur-md">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            Скасувати
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !description.trim() || !projectId}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Надсилання звернення...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Надіслати звернення</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
};
