import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasProjectAccess } from "@/lib/auth";
import { notifyNewComment } from "@/lib/notifications";

export async function POST(
  req: Request,
  { params }: { params: { projectId: string; taskId: string } }
) {
  try {
    const { projectId, taskId } = params;
    const currentUser = await getCurrentUser();

    if (currentUser) {
      const hasAccess = await hasProjectAccess(currentUser.userId, projectId, currentUser.role);
      if (!hasAccess) {
        return NextResponse.json({ error: "У вас немає доступу до цієї задачі" }, { status: 403 });
      }
    }

    const body = await req.json();
    const { content, authorType = "USER", authorName } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Текст коментаря обов'язковий" }, { status: 400 });
    }

    let authorId: string | null = null;
    if (authorType === "USER") {
      authorId = currentUser?.userId || null;
      if (!authorId) {
        const fallback = await prisma.user.findFirst();
        authorId = fallback?.id || null;
      }
    }

    const comment = await prisma.comment.create({
      data: {
        taskId,
        content: content.trim(),
        authorType,
        authorName: authorType === "AI_ASSISTANT" ? (authorName || "AI Асистент (Confluence)") : null,
        authorId,
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    notifyNewComment({
      taskId,
      commentId: comment.id,
      authorId,
      origin: req.headers.get("origin") || undefined,
    }).catch((err) => console.error("notifyNewComment error:", err));

    return NextResponse.json(comment, { status: 201 });
  } catch (error: any) {
    console.error("POST comment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
