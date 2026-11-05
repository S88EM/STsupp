import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMailConfig, saveMailConfig, isMailConfigured } from "@/lib/email";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ дозволено лише адміністраторам" }, { status: 403 });
    }

    const cfg = getMailConfig();

    return NextResponse.json({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      user: cfg.user,
      hasPass: Boolean(cfg.pass),
      from: cfg.from,
      appUrl: cfg.appUrl || "",
      isConfigured: isMailConfigured(),
    });
  } catch (error: any) {
    console.error("GET /api/settings/smtp error:", error);
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
    const { host, port, secure, user, pass, from, appUrl } = body;

    const saved = saveMailConfig({
      host: host !== undefined ? String(host).trim() : undefined,
      port: port !== undefined ? Number(port) : undefined,
      secure: secure !== undefined ? Boolean(secure) : undefined,
      user: user !== undefined ? String(user).trim() : undefined,
      pass: pass !== undefined && pass !== "" ? String(pass) : undefined,
      from: from !== undefined ? String(from).trim() : undefined,
      appUrl: appUrl !== undefined ? String(appUrl).trim() : undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Налаштування поштового сервера та адреси системи успішно збережено",
      config: {
        host: saved.host,
        port: saved.port,
        secure: saved.secure,
        user: saved.user,
        hasPass: Boolean(saved.pass),
        from: saved.from,
        appUrl: saved.appUrl || "",
        isConfigured: isMailConfigured(),
      },
    });
  } catch (error: any) {
    console.error("POST /api/settings/smtp error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
