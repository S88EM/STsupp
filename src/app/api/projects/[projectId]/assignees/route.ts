import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasProjectAccess } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Необхідно авторизуватись" }, { status: 401 });
    }

    // Check project access
    const hasAccess = await hasProjectAccess(currentUser.userId, projectId, currentUser.role);
    if (!hasAccess) {
      return NextResponse.json({ error: "У вас немає доступу до цього проєкту" }, { status: 403 });
    }

    // Clients do not have permission to manage or query assignees
    if (currentUser.role === "CLIENT") {
      return NextResponse.json(
        { error: "Клієнти не мають права призначати виконавців" },
        { status: 403 }
      );
    }

    // 1. Staff: All Admins & Engineers (Internal support & dev team)
    const staff = await prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "ENGINEER"] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
      orderBy: { name: "asc" },
    });

    // 2. Project Members & Owner
    const [project, members] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        select: {
          owner: {
            select: { id: true, name: true, email: true, role: true, avatarUrl: true },
          },
        },
      }),
      prisma.projectMember.findMany({
        where: { projectId },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // 3. Project Clients: ONLY users with role CLIENT that are members or owner of THIS project
    const staffIds = new Set(staff.map((s) => s.id));
    const projectClientsMap = new Map<string, any>();

    if (project?.owner && !staffIds.has(project.owner.id) && project.owner.role === "CLIENT") {
      projectClientsMap.set(project.owner.id, project.owner);
    }

    for (const m of members) {
      if (m.user && !staffIds.has(m.user.id) && m.user.role === "CLIENT") {
        projectClientsMap.set(m.user.id, m.user);
      }
    }

    const projectClients = Array.from(projectClientsMap.values());

    return NextResponse.json({
      staff,
      projectClients,
      all: [...staff, ...projectClients],
    });
  } catch (error: any) {
    console.error("GET /api/projects/[projectId]/assignees error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
