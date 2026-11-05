import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== "string" || !token.trim()) {
      return NextResponse.json(
        { error: "Токен підтвердження відсутній" },
        { status: 400 }
      );
    }

    const cleanToken = token.trim();

    // 1. Search for user by verification token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: cleanToken,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Посилання для підтвердження недійсне або термін його дії закінчився. Замовте новий лист підтвердження.",
        },
        { status: 400 }
      );
    }

    // 2. If already verified, return success and ensure session cookie is present
    if (user.isEmailVerified) {
      const sessionToken = createToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      const response = NextResponse.json({
        success: true,
        alreadyVerified: true,
        message: "Вашу електронну пошту вже успішно підтверджено! Вхід виконано.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
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
    }

    // 3. Check expiration (24h)
    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
      return NextResponse.json(
        {
          error: "Термін дії посилання для підтвердження закінчився (посилання дійсне 24 години). Замовте новий лист підтвердження.",
        },
        { status: 400 }
      );
    }

    // 4. Mark verified, keeping verificationToken so repeat requests/refreshes/antivirus scans still return success
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationTokenExpires: null,
      },
    });

    // 5. Automatically log the user in with a 30-day session cookie
    const sessionToken = createToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
    });

    const response = NextResponse.json({
      success: true,
      message: "Електронну пошту успішно підтверджено! Вхід виконано.",
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
    console.error("Verify email error:", error);
    return NextResponse.json({ error: error.message || "Помилка сервера" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token || !token.trim()) {
      return NextResponse.redirect(new URL("/verify-email", req.url));
    }

    const cleanToken = token.trim();
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: cleanToken,
      },
    });

    if (!user) {
      return NextResponse.redirect(new URL("/verify-email?error=invalid_token", req.url));
    }

    let targetUser = user;
    if (!user.isEmailVerified) {
      if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
        return NextResponse.redirect(new URL("/verify-email?error=expired", req.url));
      }
      targetUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          verificationTokenExpires: null,
        },
      });
    }

    // Auto-login session cookie and redirect to main dashboard
    const sessionToken = createToken({
      userId: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
    });

    const response = NextResponse.redirect(new URL("/?verified=true", req.url));
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
    console.error("Verify email GET error:", error);
    return NextResponse.redirect(new URL("/verify-email?error=server_error", req.url));
  }
}
