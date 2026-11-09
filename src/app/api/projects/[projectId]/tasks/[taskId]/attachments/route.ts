import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasProjectAccess } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { projectId: string; taskId: string } }
) {
  try {
    const { projectId, taskId } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Необхідно авторизуватися" }, { status: 401 });
    }

    const hasAccess = await hasProjectAccess(currentUser.userId, projectId, currentUser.role);
    if (!hasAccess) {
      return NextResponse.json({ error: "Доступ заборонено" }, { status: 403 });
    }

    const attachments = await prisma.attachment.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(attachments);
  } catch (error: any) {
    console.error("GET attachments error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { projectId: string; taskId: string } }
) {
  try {
    const { projectId, taskId } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Необхідно авторизуватися" }, { status: 401 });
    }

    const hasAccess = await hasProjectAccess(currentUser.userId, projectId, currentUser.role);
    if (!hasAccess) {
      return NextResponse.json({ error: "Доступ заборонено" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Файл не надано" }, { status: 400 });
    }

    // 1. File size limit: 25 MB max to protect memory & storage
    const MAX_FILE_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Розмір файлу перевищує допустимий ліміт 25 МБ" },
        { status: 400 }
      );
    }

    // 2. Security validation: block executable and script extensions
    const ext = (path.extname(file.name) || "").toLowerCase();
    const BLOCKED_EXTENSIONS = new Set([
      ".exe", ".bat", ".cmd", ".sh", ".php", ".cgi", ".dll", ".com", ".vbs", ".ps1", ".msi"
    ]);
    if (BLOCKED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: "Завантаження виконуваних файлів або скриптів заборонено з міркувань безпеки" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/uploads or UPLOAD_DIR
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    await fs.promises.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${uniqueFileName}`;

    const attachment = await prisma.attachment.create({
      data: {
        taskId,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error: any) {
    console.error("POST attachment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { projectId: string; taskId: string } }
) {
  try {
    const { projectId, taskId } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Необхідно авторизуватися" }, { status: 401 });
    }

    const hasAccess = await hasProjectAccess(currentUser.userId, projectId, currentUser.role);
    if (!hasAccess) {
      return NextResponse.json({ error: "Доступ заборонено" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const attachmentId = searchParams.get("attachmentId");

    if (!attachmentId) {
      return NextResponse.json({ error: "Attachment ID обов'язковий" }, { status: 400 });
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId, taskId },
    });

    if (attachment) {
      // Attempt to delete physical file if inside uploads
      try {
        const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
        const baseName = path.basename(attachment.fileUrl);
        const physicalPath = path.join(uploadDir, baseName);
        if (fs.existsSync(physicalPath)) {
          fs.unlinkSync(physicalPath);
        }
      } catch (e) {
        // ignore physical file delete failure
      }

      await prisma.attachment.delete({
        where: { id: attachmentId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE attachment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
