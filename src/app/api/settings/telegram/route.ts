import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getTelegramConfig, saveTelegramConfig, maskBotToken } from "@/lib/telegram";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Доступ заборонено. Потрібні права адміністратора." },
        { status: 403 }
      );
    }

    const cfg = getTelegramConfig();

    return NextResponse.json({
      isEnabled: cfg.isEnabled,
      chatId: cfg.chatId,
      hasBotToken: Boolean(cfg.botToken),
      maskedBotToken: maskBotToken(cfg.botToken),
      events: cfg.events,
    });
  } catch (error: any) {
    console.error("GET /api/settings/telegram error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
    const { botToken, chatId, isEnabled, events } = body;

    const updated = saveTelegramConfig({
      botToken: typeof botToken === "string" ? botToken : undefined,
      chatId: typeof chatId === "string" ? chatId : undefined,
      isEnabled: typeof isEnabled === "boolean" ? isEnabled : undefined,
      events: typeof events === "object" ? events : undefined,
    });

    return NextResponse.json({
      success: true,
      config: {
        isEnabled: updated.isEnabled,
        chatId: updated.chatId,
        hasBotToken: Boolean(updated.botToken),
        maskedBotToken: maskBotToken(updated.botToken),
        events: updated.events,
      },
    });
  } catch (error: any) {
    console.error("POST /api/settings/telegram error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
