import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail, isMailConfigured, getAppUrl } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email?.trim()) {
      return NextResponse.json({ error: "Введіть email адресу" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      // Don't leak user existence
      return NextResponse.json({
        success: true,
        message: "Якщо такий акаунт існує та очікує підтвердження, ми надіслали новий лист.",
      });
    }

    if (user.isEmailVerified) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        message: "Цей обліковий запис уже підтверджено. Ви можете увійти до системи.",
      });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExpires,
      },
    });

    const baseUrl = getAppUrl(req);
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

    sendVerificationEmail({
      to: user.email,
      name: user.name,
      verificationUrl,
    }).catch((err) => {
      console.error("[Resend Verification] Error sending email:", err);
    });

    return NextResponse.json({
      success: true,
      message: "Новий лист для підтвердження надіслано на вашу пошту.",
      previewUrl: !isMailConfigured() ? verificationUrl : undefined,
    });
  } catch (error: any) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ error: error.message || "Помилка сервера" }, { status: 500 });
  }
}
