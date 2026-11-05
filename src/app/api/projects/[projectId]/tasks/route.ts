import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const body = await req.json();
    const { title, description, columnId, priority = "MEDIUM", dueDate, assigneeId } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Назва задачі обов'язкова" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        columns: { orderBy: { orderIndex: "asc" } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Проект не знайдено" }, { status: 404 });
    }

    const targetColumnId = columnId || project.columns[0]?.id;
    if (!targetColumnId) {
      return NextResponse.json({ error: "У проекті немає колонок" }, { status: 400 });
    }

    // Determine next task number for this project
    const lastTask = await prisma.task.findFirst({
      where: { projectId },
      orderBy: { taskNumber: "desc" },
    });
    const nextNumber = lastTask ? lastTask.taskNumber + 1 : 1;
    const code = `${project.key}-${nextNumber}`;

    // Determine next orderIndex in this column
    const lastInColumn = await prisma.task.findFirst({
      where: { columnId: targetColumnId },
      orderBy: { orderIndex: "desc" },
    });
    const nextOrder = lastInColumn ? lastInColumn.orderIndex + 1 : 0;

    // Get default creator
    const creator = await prisma.user.findFirst();

    const task = await prisma.task.create({
      data: {
        projectId,
        columnId: targetColumnId,
        taskNumber: nextNumber,
        code,
        title: title.trim(),
        description: description?.trim() || null,
        priority,
        orderIndex: nextOrder,
        dueDate: dueDate ? new Date(dueDate) : null,
        creatorId: creator!.id,
        assigneeId: assigneeId || null,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, email: true } },
        subtasks: true,
        _count: {
          select: {
            comments: true,
            attachments: true,
            subtasks: true,
          },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/projects/[id]/tasks error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
