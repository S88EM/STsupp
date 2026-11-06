import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canManageProjects, isPrimaryAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    const isSuperAdmin = currentUser?.role === "ADMIN";

    // All Administrators see all projects unconditionally.
    // Engineers, Clients, and Members see assigned projects (or projects they own).
    const whereClause = isSuperAdmin || !currentUser
      ? {}
      : {
          OR: [
            { ownerId: currentUser.userId },
            { members: { some: { userId: currentUser.userId } } },
          ],
        };

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        columns: {
          orderBy: { orderIndex: "asc" },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
          },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch (error: any) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !canManageProjects(currentUser.role)) {
      return NextResponse.json(
        { error: "Тільки адміністратор має право створювати нові проекти" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, key, description, memberIds } = body;

    if (!name || !key) {
      return NextResponse.json({ error: "Назва та ключ обов'язкові" }, { status: 400 });
    }

    const cleanKey = key.trim().toUpperCase();
    const existing = await prisma.project.findUnique({
      where: { key: cleanKey },
    });

    if (existing) {
      return NextResponse.json({ error: `Проект з ключем "${cleanKey}" вже існує` }, { status: 400 });
    }

    // Initial project members: creator admin + any selected users
    const membersToCreate: Array<{ userId: string; role: any }> = [
      { userId: currentUser.userId, role: "ADMIN" },
    ];

    if (Array.isArray(memberIds) && memberIds.length > 0) {
      const selectedUsers = await prisma.user.findMany({
        where: { id: { in: memberIds.filter((id: string) => id !== currentUser.userId) } },
        select: { id: true, role: true, email: true },
      });

      for (const u of selectedUsers) {
        membersToCreate.push({
          userId: u.id,
          role: u.role,
        });
      }
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        key: cleanKey,
        description: description?.trim() || null,
        ownerId: currentUser.userId,
        columns: {
          create: [
            { name: "Беклог", color: "#64748b", orderIndex: 0, isDoneColumn: false },
            { name: "В роботі", color: "#3b82f6", orderIndex: 1, isDoneColumn: false },
            { name: "Тестування", color: "#eab308", orderIndex: 2, isDoneColumn: false },
            { name: "Готово", color: "#22c55e", orderIndex: 3, isDoneColumn: true },
          ],
        },
        members: {
          create: membersToCreate,
        },
      },
      include: {
        columns: true,
        members: true,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
