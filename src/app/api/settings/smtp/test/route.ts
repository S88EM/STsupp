import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { testMailConnection } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ дозволено лише адміністраторам" }, { status: 403 });
    }

    const body = await req.json();
    const { to, host, port, secure, user, pass, from } = body;

    const recipient = to?.trim() || currentUser.email;

    await testMailConnection(recipient, {
      host,
      port: port ? Number(port) : undefined,
      secure: secure !== undefined ? Boolean(secure) : undefined,
      user,
      pass,
      from,
    });

    return NextResponse.json({
      success: true,
      message: `Тестовий лист успішно надіслано на адресу ${recipient}! З'єднання з SMTP-сервером перевірено.`,
    });
  } catch (error: any) {
    console.error("POST /api/settings/smtp/test error:", error);
    return NextResponse.json(
      {
        error: error.message || "Не вдалося встановити з'єднання з поштовим сервером",
      },
      { status: 400 }
    );
  }
}
