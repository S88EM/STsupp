import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { projectId: string; taskId: string } }
) {
  try {
    const { projectId, taskId } = params;

    const task = await prisma.task.findUnique({
      where: { id: taskId, projectId },
      include: {
        column: true,
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, email: true } },
        subtasks: { orderBy: { orderIndex: "asc" } },
        comments: {
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        attachments: { orderBy: { createdAt: "desc" } },
        aiRecommendations: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Задачу не знайдено" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error: any) {
    console.error("GET /api/projects/[id]/tasks/[taskId] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { projectId: string; taskId: string } }
) {
  try {
    const { projectId, taskId } = params;
    const body = await req.json();
    const { title, description, priority, columnId, dueDate, assigneeId } = body;

    const updated = await prisma.task.update({
      where: { id: taskId, projectId },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        description: description !== undefined ? description : undefined,
        priority: priority !== undefined ? priority : undefined,
        columnId: columnId !== undefined ? columnId : undefined,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
        assigneeId: assigneeId !== undefined ? (assigneeId || null) : undefined,
      },
      include: {
        column: true,
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        subtasks: { orderBy: { orderIndex: "asc" } },
        _count: {
          select: { comments: true, attachments: true, subtasks: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH task error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { projectId: string; taskId: string } }
) {
  try {
    const { projectId, taskId } = params;
    await prisma.task.delete({ where: { id: taskId, projectId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE task error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
