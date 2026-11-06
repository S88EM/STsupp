import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createToken, AUTH_COOKIE_NAME, isPrimaryAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token || !token.trim()) {
      return NextResponse.json(
        { valid: false, error: "Токен відновлення пароля відсутній" },
        { status: 400 }
      );
    }

    const cleanToken = token.trim();
    const user = await prisma.user.findFirst({
      where: {
        resetToken: cleanToken,
        resetTokenExpires: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          valid: false,
          error: "Посилання для зміни пароля недійсне або термін його дії закінчився (посилання дійсне 1 годину). Замовте новий лист відновлення.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: user.email,
      name: user.name,
      isPrimaryAdmin: isPrimaryAdmin(user.email),
    });
  } catch (error: any) {
    console.error("GET /api/auth/reset-password error:", error);
    return NextResponse.json({ error: error.message || "Помилка сервера" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, newPassword, email } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Токен та новий пароль обов'язкові для заповнення" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Пароль має містити щонайменше 6 символів" },
        { status: 400 }
      );
    }

    const cleanToken = token.trim();
    const user = await prisma.user.findFirst({
      where: {
        resetToken: cleanToken,
        resetTokenExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Посилання для зміни пароля недійсне або термін його дії закінчився. Замовте нове скидання.",
        },
        { status: 400 }
      );
    }

    // Optional email / login update
    let cleanEmail: string | undefined = undefined;
    if (email && typeof email === "string" && email.trim()) {
      cleanEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return NextResponse.json(
          { error: "Вкажіть коректну email адресу (логін)" },
          { status: 400 }
        );
      }

      if (cleanEmail !== user.email.toLowerCase().trim()) {
        if (isPrimaryAdmin(user.email)) {
          return NextResponse.json(
            { error: "Email Головного адміністратора задається у конфігурації Home Assistant або змінних середовища" },
            { status: 400 }
          );
        }

        const existing = await prisma.user.findFirst({
          where: {
            email: cleanEmail,
            NOT: { id: user.id },
          },
        });

        if (existing) {
          return NextResponse.json(
            { error: `Користувач із логіном (поштою) ${cleanEmail} вже зареєстрований у системі` },
            { status: 400 }
          );
        }
      }
    }

    const passwordHash = await hashPassword(newPassword.trim());
    const finalEmail = cleanEmail || user.email;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        email: finalEmail,
        resetToken: null,
        resetTokenExpires: null,
        isEmailVerified: true,
      },
    });

    // Auto-login session cookie with updated credentials
    const sessionToken = createToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
    });

    const response = NextResponse.json({
      success: true,
      message: "Облікові дані успішно оновлено! Вхід виконано.",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.COOKIE_SECURE === "true",
    });

    return response;
  } catch (error: any) {
    console.error("POST /api/auth/reset-password error:", error);
    return NextResponse.json({ error: error.message || "Помилка сервера" }, { status: 500 });
  }
}
