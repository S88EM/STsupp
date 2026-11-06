import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword, canManageUsers, createToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { logAuditEvent, AUDIT_ACTIONS } from "@/lib/audit";

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

    // 1. Check role change safety (prevent removing admin from sole remaining admin)
    if (role && role !== targetUser.role) {
      if (currentUser.userId === userId && role !== "ADMIN") {
        const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
        if (adminCount <= 1) {
          return NextResponse.json(
            { error: "Неможливо зняти права адміністратора з єдиного адміна системи" },
            { status: 400 }
          );
        }
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

    // 3. Password update & validation
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

    // Perform database transaction
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
        await tx.projectMember.deleteMany({
          where: { userId },
        });

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

    // --- Record granular Audit Logs ---
    if (passwordHash) {
      await logAuditEvent({
        actor: currentUser,
        action: AUDIT_ACTIONS.USER_PASSWORD_RESET,
        targetType: "USER",
        targetId: targetUser.id,
        details: {
          targetUserEmail: targetUser.email,
          targetUserName: targetUser.name,
          resetBySelf: currentUser.userId === targetUser.id,
        },
      });
    }

    if (cleanEmail && cleanEmail !== targetUser.email.toLowerCase().trim()) {
      await logAuditEvent({
        actor: currentUser,
        action: AUDIT_ACTIONS.USER_EMAIL_UPDATE,
        targetType: "USER",
        targetId: targetUser.id,
        details: {
          previousEmail: targetUser.email,
          newEmail: cleanEmail,
          targetUserName: targetUser.name,
        },
      });
    }

    if (role && role !== targetUser.role) {
      await logAuditEvent({
        actor: currentUser,
        action: AUDIT_ACTIONS.USER_ROLE_CHANGE,
        targetType: "USER",
        targetId: targetUser.id,
        details: {
          targetUserEmail: cleanEmail || targetUser.email,
          targetUserName: targetUser.name,
          previousRole: targetUser.role,
          newRole: role,
        },
      });
    }

    if ((name && name.trim() !== targetUser.name) || (city !== undefined && city !== targetUser.city)) {
      await logAuditEvent({
        actor: currentUser,
        action: AUDIT_ACTIONS.USER_PROFILE_UPDATE,
        targetType: "USER",
        targetId: targetUser.id,
        details: {
          targetUserEmail: cleanEmail || targetUser.email,
          updatedFields: {
            name: name?.trim() !== targetUser.name ? name?.trim() : undefined,
            city: city !== targetUser.city ? city : undefined,
          },
        },
      });
    }

    if (typeof isEmailVerified === "boolean" && isEmailVerified !== targetUser.isEmailVerified) {
      await logAuditEvent({
        actor: currentUser,
        action: AUDIT_ACTIONS.USER_STATUS_CHANGE,
        targetType: "USER",
        targetId: targetUser.id,
        details: {
          targetUserEmail: cleanEmail || targetUser.email,
          previousVerified: targetUser.isEmailVerified,
          newVerified: isEmailVerified,
        },
      });
    }

    if (Array.isArray(projectIds)) {
      await logAuditEvent({
        actor: currentUser,
        action: AUDIT_ACTIONS.USER_PROJECTS_ASSIGN,
        targetType: "USER",
        targetId: targetUser.id,
        details: {
          targetUserEmail: cleanEmail || targetUser.email,
          assignedProjectCount: projectIds.length,
          projectIds,
        },
      });
    }

    const response = NextResponse.json({ success: true, email: cleanEmail || targetUser.email });

    // If current logged-in admin updated their own email or name or role, refresh session cookie
    if (currentUser.userId === userId && (cleanEmail || name || role)) {
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
      select: { id: true, email: true, name: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Користувача не знайдено" }, { status: 404 });
    }

    // Safety: cannot delete the sole remaining administrator
    if (targetUser.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Неможливо видалити єдиного адміністратора системи" },
          { status: 400 }
        );
      }
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    // Record audit event
    await logAuditEvent({
      actor: currentUser,
      action: AUDIT_ACTIONS.USER_DELETE,
      targetType: "USER",
      targetId: targetUser.id,
      details: {
        deletedUserId: targetUser.id,
        deletedUserEmail: targetUser.email,
        deletedUserName: targetUser.name,
        role: targetUser.role,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/users/[userId] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
