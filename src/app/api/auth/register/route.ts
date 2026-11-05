import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword, createToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { sendVerificationEmail, isMailConfigured } from "@/lib/email";
import { ensureDefaultAdmin } from "@/lib/init-admin";

export async function POST(req: Request) {
  try {
    // Ensure default admin exists if configured
    await ensureDefaultAdmin();

    const body = await req.json();
    const { name, email, password } = body;

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "Всі поля обов'язкові для заповнення" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Пароль має містити щонайменше 6 символів" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json({ error: "Користувач із таким email уже зареєстрований" }, { status: 400 });
    }

    const userCount = await prisma.user.count();
    // If absolutely first user in database, grant ADMIN role and auto-verify
    const isFirstUser = userCount === 0;
    const role = isFirstUser ? "ADMIN" : "CLIENT";
    const isEmailVerified = isFirstUser;

    const passwordHash = await hashPassword(password);

    // If verification is needed, generate secure token with 24h validity
    const verificationToken = !isEmailVerified ? crypto.randomBytes(32).toString("hex") : null;
    const verificationTokenExpires = !isEmailVerified
      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
      : null;

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: name.trim(),
        passwordHash,
        role,
        isEmailVerified,
        verificationToken,
        verificationTokenExpires,
      },
    });

    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";

    if (!isEmailVerified && verificationToken) {
      const verificationUrl = `${origin}/verify-email?token=${verificationToken}`;

      // Send verification email in background
      sendVerificationEmail({
        to: user.email,
        name: user.name,
        verificationUrl,
      }).catch((err) => {
        console.error("[Auth Register] Failed to send verification email:", err);
      });

      return NextResponse.json({
        success: true,
        needVerification: true,
        message: "Реєстрація успішна! Ми надіслали лист для підтвердження на вашу пошту. Будь ласка, перейдіть за посиланням у листі для активації акаунту.",
        previewUrl: !isMailConfigured() ? verificationUrl : undefined,
      });
    }

    // Auto-login only if first user (Admin)
    const token = createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      needVerification: false,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json({ error: error.message || "Помилка при реєстрації" }, { status: 500 });
  }
}
