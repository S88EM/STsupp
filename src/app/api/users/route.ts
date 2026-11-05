import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword, canManageUsers, isPrimaryAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "ENGINEER")) {
      return NextResponse.json({ error: "Доступ заборонено." }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEmailVerified: true,
        avatarUrl: true,
        createdAt: true,
        projectMembers: {
          select: {
            id: true,
            role: true,
            project: {
              select: {
                id: true,
                name: true,
                key: true,
              },
            },
          },
        },
        _count: {
          select: {
            createdTasks: true,
            assignedTasks: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const result = users.map((u) => ({
      ...u,
      isPrimaryAdmin: u.role === "ADMIN" && isPrimaryAdmin(u.email),
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !canManageUsers(currentUser.role)) {
      return NextResponse.json({ error: "Доступ заборонено. Тільки для адміністраторів." }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role = "CLIENT", projectIds = [] } = body;

    // Only Primary Admin can create another user with ADMIN role
    if (role === "ADMIN" && !isPrimaryAdmin(currentUser.email)) {
      return NextResponse.json(
        { error: "Тільки Головний адміністратор може створювати нових адміністраторів" },
        { status: 403 }
      );
    }

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "Ім'я, email та пароль обов'язкові" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Пароль має містити щонайменше 6 символів" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json({ error: "Користувач із таким email уже існує" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    // Create user and link selected projects in transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          passwordHash,
          role: role as any,
          isEmailVerified: true,
        },
      });

      if (Array.isArray(projectIds) && projectIds.length > 0) {
        await tx.projectMember.createMany({
          data: projectIds.map((projectId: string) => ({
            projectId,
            userId: user.id,
            role: role as any,
          })),
          skipDuplicates: true,
        });
      }

      return user;
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
