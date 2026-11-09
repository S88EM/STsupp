import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSystemSettings, saveSystemSettings } from "@/lib/system-settings";
import { logAuditEvent, AUDIT_ACTIONS } from "@/lib/audit";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ дозволено лише адміністраторам" }, { status: 403 });
    }

    const settings = getSystemSettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error("GET /api/settings/general error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ дозволено лише адміністраторам" }, { status: 403 });
    }

    const body = await req.json();
    const { maxAttachmentSizeMb, blockedExtensions } = body;

    const previous = getSystemSettings();
    const updated = saveSystemSettings({
      maxAttachmentSizeMb:
        maxAttachmentSizeMb !== undefined ? Number(maxAttachmentSizeMb) : undefined,
      blockedExtensions: Array.isArray(blockedExtensions) ? blockedExtensions : undefined,
    });

    await logAuditEvent({
      actor: currentUser,
      action: AUDIT_ACTIONS.SETTINGS_GENERAL_UPDATE,
      targetType: "SETTINGS",
      targetId: "GENERAL",
      details: {
        previous,
        current: updated,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Загальні налаштування системи збережено",
      settings: updated,
    });
  } catch (error: any) {
    console.error("POST /api/settings/general error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
