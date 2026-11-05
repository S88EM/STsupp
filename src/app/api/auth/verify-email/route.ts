import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // 2. If already verified, return success immediately (prevents duplicate request/refresh errors)
    if (user.isEmailVerified) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        message: "Вашу електронну пошту вже успішно підтверджено! Тепер ви можете увійти до системи.",
      });
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
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationTokenExpires: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Електронну пошту успішно підтверджено! Тепер ви можете увійти до системи.",
    });
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

    if (!user.isEmailVerified) {
      if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
        return NextResponse.redirect(new URL("/verify-email?error=expired", req.url));
      }
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          verificationTokenExpires: null,
        },
      });
    }

    // Redirect to login page with verified notice
    return NextResponse.redirect(new URL("/login?verified=true", req.url));
  } catch (error: any) {
    console.error("Verify email GET error:", error);
    return NextResponse.redirect(new URL("/verify-email?error=server_error", req.url));
  }
}
