import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail, isMailConfigured, getAppUrl } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email?.trim()) {
      return NextResponse.json({ error: "Введіть ваш email" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    // Even if user not found, don't expose security details
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Якщо такий email зареєстровано, ми надіслали інструкції для відновлення.",
      });
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpires: expires,
      },
    });

    const baseUrl = getAppUrl(req);
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const mailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });

    return NextResponse.json({
      success: true,
      message: "Інструкцію для відновлення пароля надіслано на вашу пошту.",
      // Include direct link in response if SMTP is not configured yet (for easy local testing)
      previewUrl: !isMailConfigured() ? resetUrl : undefined,
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: error.message || "Помилка сервера" }, { status: 500 });
  }
}
