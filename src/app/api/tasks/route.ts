import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Необхідно авторизуватись" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all"; // "all" | "my" | "open" | "resolved"
    const search = searchParams.get("search")?.trim() || "";
    const projectId = searchParams.get("projectId")?.trim() || "";
    const component = searchParams.get("component")?.trim() || "";
    const label = searchParams.get("label")?.trim() || "";
    const scope = searchParams.get("scope")?.trim() || ""; // "my" | "all"
    const priority = searchParams.get("priority")?.trim() || ""; // "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

    // 1. Determine projects permitted to the user (All Admins see all projects)
    const isSuperAdmin = currentUser.role === "ADMIN";
    const projectWhere = isSuperAdmin
      ? {}
      : {
          OR: [
            { ownerId: currentUser.userId },
            { members: { some: { userId: currentUser.userId } } },
          ],
        };

    const accessibleProjects = await prisma.project.findMany({
      where: projectWhere,
      select: {
        id: true,
        name: true,
        key: true,
        columns: { orderBy: { orderIndex: "asc" } },
      },
      orderBy: { name: "asc" },
    });

    const projectIds = accessibleProjects.map((p) => p.id);

    if (projectIds.length === 0) {
      return NextResponse.json({ tasks: [], projects: [] });
    }

    // 2. Build task filter
    const taskWhere: any = {
      projectId: { in: projectIds },
    };

    if (projectId && projectIds.includes(projectId)) {
      taskWhere.projectId = projectId;
    }

    // Filter modes:
    // - "all": Всі задачі в рамках проектів, які дозволені користувачу правами
    // - "my": Задачі призначені на поточного користувача або створені ним (для клієнта - створені ним)
    // - "open": Всі задачі не в статусі завершено
    // - "resolved": Завершені або вирішені задачі
    if (filter === "my" || scope === "my") {
      if (currentUser.role === "CLIENT") {
        taskWhere.creatorId = currentUser.userId;
      } else {
        taskWhere.OR = [
          { assigneeId: currentUser.userId },
          { creatorId: currentUser.userId },
        ];
      }
    } else if (filter === "open") {
      taskWhere.column = {
        isDoneColumn: false,
        NOT: {
          name: { in: ["Готово", "Done", "Resolved", "Вирішено", "Закрито"], mode: "insensitive" },
        },
      };
    } else if (filter === "resolved" || filter === "closed") {
      taskWhere.OR = [
        { column: { isDoneColumn: true } },
        { column: { name: { in: ["Готово", "Done", "Resolved", "Вирішено", "Закрито"], mode: "insensitive" } } },
      ];
    }

    if (priority && ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(priority)) {
      taskWhere.priority = priority;
    }

    if (search) {
      taskWhere.AND = [
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    const tasks = await prisma.task.findMany({
      where: taskWhere,
      orderBy: { updatedAt: "desc" },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
            columns: { orderBy: { orderIndex: "asc" } },
          },
        },
        column: true,
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, email: true } },
        subtasks: { orderBy: { orderIndex: "asc" } },
        attachments: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { comments: true, attachments: true, subtasks: true },
        },
      },
    });

    let resultTasks = tasks;
    if (component) {
      resultTasks = resultTasks.filter((t: any) => {
        const comps = t.aiContext?.components;
        return Array.isArray(comps) && comps.includes(component);
      });
    }
    if (label) {
      resultTasks = resultTasks.filter((t: any) => {
        const lbls = t.aiContext?.labels;
        return Array.isArray(lbls) && lbls.includes(label);
      });
    }

    return NextResponse.json({
      tasks: resultTasks,
      projects: accessibleProjects,
      totalCount: resultTasks.length,
      filter,
    });
  } catch (error: any) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
