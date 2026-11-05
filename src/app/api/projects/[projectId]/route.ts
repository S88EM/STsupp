import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasProjectAccess, canManageProjects } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const currentUser = await getCurrentUser();

    if (currentUser) {
      const hasAccess = await hasProjectAccess(currentUser.userId, projectId, currentUser.role);
      if (!hasAccess) {
        return NextResponse.json({ error: "У вас немає доступу до цього проекту" }, { status: 403 });
      }
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        columns: {
          orderBy: { orderIndex: "asc" },
          include: {
            tasks: {
              orderBy: { orderIndex: "asc" },
              include: {
                assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
                creator: { select: { id: true, name: true, email: true } },
                subtasks: { orderBy: { orderIndex: "asc" } },
                _count: {
                  select: {
                    comments: true,
                    attachments: true,
                    subtasks: true,
                  },
                },
              },
            },
          },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Проект не знайдено" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error: any) {
    console.error("GET /api/projects/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !canManageProjects(currentUser.role)) {
      return NextResponse.json({ error: "Тільки адміністратор може змінювати проект" }, { status: 403 });
    }

    const { projectId } = params;
    const body = await req.json();
    const { name, description } = body;

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        description: description !== undefined ? description.trim() : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/projects/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !canManageProjects(currentUser.role)) {
      return NextResponse.json({ error: "Тільки адміністратор може видалити проект" }, { status: 403 });
    }

    const { projectId } = params;

    const existing = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, key: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Проект не знайдено" }, { status: 404 });
    }

    // Cascade delete in transaction to guarantee foreign key integrity
    await prisma.$transaction(async (tx) => {
      // 1. Find all tasks in this project
      const tasks = await tx.task.findMany({
        where: { projectId },
        select: { id: true },
      });
      const taskIds = tasks.map((t) => t.id);

      if (taskIds.length > 0) {
        await tx.subtask.deleteMany({ where: { taskId: { in: taskIds } } });
        await tx.comment.deleteMany({ where: { taskId: { in: taskIds } } });
        await tx.attachment.deleteMany({ where: { taskId: { in: taskIds } } });
        await tx.aiRecommendation.deleteMany({ where: { taskId: { in: taskIds } } });
        await tx.task.deleteMany({ where: { projectId } });
      }

      // 2. Delete columns
      await tx.column.deleteMany({ where: { projectId } });

      // 3. Delete members
      await tx.projectMember.deleteMany({ where: { projectId } });

      // 4. Delete project
      await tx.project.delete({ where: { id: projectId } });
    });

    return NextResponse.json({ success: true, message: `Проект [${existing.key}] "${existing.name}" успішно видалено` });
  } catch (error: any) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
