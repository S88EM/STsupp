import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;
    const body = await req.json();
    const { title } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Назва підзадачі обов'язкова" }, { status: 400 });
    }

    const lastSubtask = await prisma.subtask.findFirst({
      where: { taskId },
      orderBy: { orderIndex: "desc" },
    });
    const nextOrder = lastSubtask ? lastSubtask.orderIndex + 1 : 0;

    const subtask = await prisma.subtask.create({
      data: {
        taskId,
        title: title.trim(),
        orderIndex: nextOrder,
      },
    });

    return NextResponse.json(subtask, { status: 201 });
  } catch (error: any) {
    console.error("POST subtask error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const subtaskId = body.subtaskId || searchParams.get("subtaskId");
    const { isCompleted, title } = body;

    if (!subtaskId) {
      return NextResponse.json({ error: "subtaskId is required" }, { status: 400 });
    }

    const updated = await prisma.subtask.update({
      where: { id: subtaskId },
      data: {
        isCompleted: isCompleted !== undefined ? Boolean(isCompleted) : undefined,
        title: title !== undefined ? title.trim() : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH subtask error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let subtaskId = searchParams.get("subtaskId");
    if (!subtaskId) {
      const body = await req.json().catch(() => ({}));
      subtaskId = body.subtaskId;
    }

    if (!subtaskId) {
      return NextResponse.json({ error: "subtaskId is required" }, { status: 400 });
    }

    await prisma.subtask.delete({ where: { id: subtaskId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE subtask error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
