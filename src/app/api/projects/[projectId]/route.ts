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

    if (!currentUser) {
      return NextResponse.json({ error: "Необхідно авторизуватися" }, { status: 401 });
    }

    if (projectId !== "all") {
      const hasAccess = await hasProjectAccess(currentUser.userId, projectId, currentUser.role);
      if (!hasAccess) {
        return NextResponse.json({ error: "У вас немає доступу до цього проекту" }, { status: 403 });
      }
    }

    // Support global context "all"
    if (projectId === "all") {
      const isSuperAdmin = currentUser?.role === "ADMIN";
      const whereClause = isSuperAdmin
        ? {}
        : {
            OR: [
              { ownerId: currentUser?.userId },
              { members: { some: { userId: currentUser?.userId } } },
            ],
          };

      const projects = await prisma.project.findMany({
        where: whereClause,
        include: {
          columns: {
            orderBy: { orderIndex: "asc" },
            include: {
              tasks: {
                orderBy: { orderIndex: "asc" },
                include: {
                  assignee: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
                  creator: { select: { id: true, name: true, email: true, role: true } },
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
        orderBy: { name: "asc" },
      });

      const standardStages = [
        { id: "all-backlog", name: "Беклог", color: "#64748b", orderIndex: 0, isDoneColumn: false, tasks: [] as any[] },
        { id: "all-inprogress", name: "В роботі", color: "#3b82f6", orderIndex: 1, isDoneColumn: false, tasks: [] as any[] },
        { id: "all-testing", name: "Тестування", color: "#eab308", orderIndex: 2, isDoneColumn: false, tasks: [] as any[] },
        { id: "all-done", name: "Готово", color: "#22c55e", orderIndex: 3, isDoneColumn: true, tasks: [] as any[] },
      ];

      const mapColumnToStageIndex = (colName?: string, isDone?: boolean) => {
        if (isDone) return 3;
        const name = (colName || "").toLowerCase();
        if (name.includes("done") || name.includes("готов") || name.includes("виріш")) return 3;
        if (name.includes("тест") || name.includes("review") || name.includes("перевір")) return 2;
        if (name.includes("робот") || name.includes("progress") || name.includes("розроб")) return 1;
        return 0;
      }

      const allMembersMap = new Map<string, any>();

      projects.forEach((proj) => {
        proj.members.forEach((m) => {
          if (!allMembersMap.has(m.userId)) {
            allMembersMap.set(m.userId, m);
          }
        });

        proj.columns.forEach((col) => {
          const stageIdx = mapColumnToStageIndex(col.name, col.isDoneColumn);
          col.tasks.forEach((t) => {
            standardStages[stageIdx].tasks.push({
              ...t,
              project: {
                id: proj.id,
                name: proj.name,
                key: proj.key,
                columns: proj.columns.map((c) => ({
                  id: c.id,
                  name: c.name,
                  color: c.color,
                  isDoneColumn: c.isDoneColumn,
                })),
              },
              projectName: proj.name,
              projectKey: proj.key,
              actualColumnId: col.id,
              actualColumnName: col.name,
              actualColumnColor: col.color,
            });
          });
        });
      });

      return NextResponse.json({
        id: "all",
        name: "Всі проєкти",
        key: "ALL",
        description: "Агрегований вигляд задач з усіх доступних проєктів",
        columns: standardStages,
        members: Array.from(allMembersMap.values()),
        isGlobalView: true,
      });
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
                assignee: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
                creator: { select: { id: true, name: true, email: true, role: true } },
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
    if (projectId === "all") {
      return NextResponse.json({ error: "Неможливо змінити глобальний контекст" }, { status: 400 });
    }
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
    if (projectId === "all") {
      return NextResponse.json({ error: "Неможливо змінити глобальний контекст" }, { status: 400 });
    }

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
