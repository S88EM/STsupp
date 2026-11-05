import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { projectId: string; taskId: string } }
) {
  try {
    const { taskId } = params;
    const body = await req.json();
    const { content, authorType = "USER", authorName } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Текст коментаря обов'язковий" }, { status: 400 });
    }

    const defaultUser = await prisma.user.findFirst();

    const comment = await prisma.comment.create({
      data: {
        taskId,
        content: content.trim(),
        authorType,
        authorName: authorType === "AI_ASSISTANT" ? (authorName || "AI Асистент (Confluence)") : null,
        authorId: authorType === "USER" ? defaultUser?.id : null,
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error: any) {
    console.error("POST comment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
