import { NextResponse } from "next/server";
import fs from "fs";
import { prisma } from "@/lib/prisma";
import { comparePassword, createToken, hashPassword, AUTH_COOKIE_NAME, isPrimaryAdmin } from "@/lib/auth";
import { ensureDefaultAdmin, getSystemAdminConfig } from "@/lib/init-admin";

export async function POST(req: Request) {
  try {
    // Ensure default admin exists
    await ensureDefaultAdmin();

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Введіть email та пароль" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    const adminCfg = getSystemAdminConfig();

    // Auto-initialize default admin if logging in with config credentials
    if (!user && cleanEmail === adminCfg.email) {
      const initialHash = await hashPassword(adminCfg.password);
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: adminCfg.name,
          passwordHash: initialHash,
          role: "ADMIN",
          isEmailVerified: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "Невірний email або пароль" }, { status: 401 });
    }

    // If user has no password yet (e.g. created by seed) and matches config password
    let isPasswordValid = false;
    if (user.passwordHash) {
      isPasswordValid = await comparePassword(password, user.passwordHash);
    } else if (cleanEmail === adminCfg.email && password === adminCfg.password) {
      // Set initial password hash
      const newHash = await hashPassword(adminCfg.password);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash, isEmailVerified: true },
      });
      isPasswordValid = true;
    }

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Невірний email або пароль" }, { status: 401 });
    }

    // Check email verification (primary admin is always exempt)
    const isSuperAdmin = user.role === "ADMIN" && isPrimaryAdmin(user.email);
    if (!user.isEmailVerified && !isSuperAdmin) {
      return NextResponse.json(
        {
          error: "Обліковий запис не активовано. Будь ласка, підтвердіть вашу email адресу через посилання у листі.",
          needVerification: true,
          email: user.email,
        },
        { status: 403 }
      );
    }

    const token = createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isPrimaryAdmin: isSuperAdmin,
      },
    });

    // Set 30-day session cookie (secure=false by default so local HTTP/Home Assistant works cleanly)
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      secure: process.env.COOKIE_SECURE === "true",
    });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: error.message || "Помилка сервера" }, { status: 500 });
  }
}
