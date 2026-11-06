import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { testTelegramConnection } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Доступ заборонено. Потрібні права адміністратора." },
        { status: 403 }
      );
    }

    const body = await req.json();
    let botToken = body.botToken;
    if (typeof botToken === "string" && (botToken.includes("•") || !botToken.trim())) {
      botToken = undefined;
    }

    const result = await testTelegramConnection({
      botToken,
      chatId: body.chatId,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.description || "Помилка перевірки з'єднання з Telegram" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Тестове повідомлення успішно доставлено в Telegram!",
    });
  } catch (error: any) {
    console.error("POST /api/settings/telegram/test error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
