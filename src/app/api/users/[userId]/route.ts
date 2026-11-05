import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword, canManageUsers, isPrimaryAdmin, createToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !canManageUsers(currentUser.role)) {
      return NextResponse.json({ error: "Доступ заборонено" }, { status: 403 });
    }

    const { userId } = params;
    const body = await req.json();
    const { name, email, role, projectIds, password, isEmailVerified, city } = body;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Користувача не знайдено" }, { status: 404 });
    }

    const isCurrentUserSuperAdmin = isPrimaryAdmin(currentUser.email);

    // 1. Check role change permissions
    if (role && role !== targetUser.role) {
      if (isPrimaryAdmin(targetUser.email)) {
        return NextResponse.json(
          { error: "Неможливо змінити роль Головного адміністратора" },
          { status: 400 }
        );
      }
      if ((targetUser.role === "ADMIN" || role === "ADMIN") && !isCurrentUserSuperAdmin) {
        return NextResponse.json(
          { error: "Тільки Головний адміністратор може призначати або змінювати роль адміністратора" },
          { status: 403 }
        );
      }
    }

    // 2. Validate and handle email update
    let cleanEmail: string | undefined = undefined;
    if (email !== undefined) {
      if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase())) {
        return NextResponse.json(
          { error: "Вкажіть коректну email адресу" },
          { status: 400 }
        );
      }
      cleanEmail = email.trim().toLowerCase();

      if (cleanEmail !== targetUser.email.toLowerCase().trim()) {
        if (isPrimaryAdmin(targetUser.email)) {
          return NextResponse.json(
            { error: "Email Головного адміністратора задається у конфігурації Home Assistant або змінних середовища" },
            { status: 400 }
          );
        }

        // Only Primary Admin can change another Admin's email
        if (targetUser.role === "ADMIN" && !isCurrentUserSuperAdmin && targetUser.id !== currentUser.userId) {
          return NextResponse.json(
            { error: "Тільки Головний адміністратор може змінювати email інших адміністраторів" },
            { status: 403 }
          );
        }

        const existing = await prisma.user.findFirst({
          where: {
            email: cleanEmail,
            NOT: { id: userId },
          },
        });

        if (existing) {
          return NextResponse.json(
            { error: `Користувач із поштою ${cleanEmail} вже існує в системі` },
            { status: 400 }
          );
        }
      }
    }

    // 3. Check project assignment permissions
    if (Array.isArray(projectIds)) {
      const isTargetAdmin = targetUser.role === "ADMIN" || role === "ADMIN";
      if (isTargetAdmin && !isCurrentUserSuperAdmin) {
        return NextResponse.json(
          { error: "Тільки Головний адміністратор може конфігурувати проекти для створених адміністраторів" },
          { status: 403 }
        );
      }
    }

    // Safety: prevent demoting the currently logged in admin if it would leave no admins
    if (currentUser.userId === userId && role && role !== "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Неможливо зняти права адміністратора з єдиного адміна" }, { status: 400 });
      }
    }

    let passwordHash: string | undefined = undefined;
    if (password !== undefined) {
      if (!password || password.trim().length < 6) {
        return NextResponse.json(
          { error: "Пароль має містити щонайменше 6 символів" },
          { status: 400 }
        );
      }
      passwordHash = await hashPassword(password.trim());
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update user fields
      await tx.user.update({
        where: { id: userId },
        data: {
          name: name?.trim() ? name.trim() : undefined,
          email: cleanEmail || undefined,
          city: city !== undefined ? (city?.trim() || null) : undefined,
          role: role ? (role as any) : undefined,
          passwordHash: passwordHash || undefined,
          isEmailVerified: typeof isEmailVerified === "boolean" ? isEmailVerified : undefined,
        },
      });

      // 2. If projectIds array is provided, sync project memberships
      if (Array.isArray(projectIds)) {
        // Delete old memberships
        await tx.projectMember.deleteMany({
          where: { userId },
        });

        // Insert new memberships
        if (projectIds.length > 0) {
          const effectiveRole = role || targetUser.role;
          await tx.projectMember.createMany({
            data: projectIds.map((projectId: string) => ({
              projectId,
              userId,
              role: effectiveRole as any,
            })),
            skipDuplicates: true,
          });
        }
      }
    });

    const response = NextResponse.json({ success: true, email: cleanEmail || targetUser.email });

    // If current logged-in admin updated their own email or name, refresh session cookie
    if (currentUser.userId === userId && (cleanEmail || name)) {
      const token = createToken({
        userId: currentUser.userId,
        email: cleanEmail || currentUser.email,
        name: name?.trim() || currentUser.name,
        role: role || currentUser.role,
      });
      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: token,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        secure: process.env.COOKIE_SECURE === "true",
      });
    }

    return response;
  } catch (error: any) {
    console.error("PATCH /api/users/[userId] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !canManageUsers(currentUser.role)) {
      return NextResponse.json({ error: "Доступ заборонено" }, { status: 403 });
    }

    const { userId } = params;

    // Safety: cannot delete oneself
    if (currentUser.userId === userId) {
      return NextResponse.json({ error: "Ви не можете видалити власний обліковий запис" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Користувача не знайдено" }, { status: 404 });
    }

    // Safety: cannot delete the primary system administrator
    if (isPrimaryAdmin(targetUser.email)) {
      return NextResponse.json(
        { error: "Неможливо видалити Головного адміністратора системи" },
        { status: 400 }
      );
    }

    // Safety: created admins cannot delete another admin
    if (targetUser.role === "ADMIN" && !isPrimaryAdmin(currentUser.email)) {
      return NextResponse.json(
        { error: "Тільки Головний адміністратор може видаляти інших адміністраторів" },
        { status: 403 }
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/users/[userId] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
