import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getTaskDictionaries, saveTaskDictionaries, DEFAULT_TASK_DICTIONARIES } from "@/lib/dictionaries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Необхідно авторизуватись" }, { status: 401 });
    }

    const dict = getTaskDictionaries();
    return NextResponse.json(dict);
  } catch (error: any) {
    console.error("GET /api/settings/dictionaries error:", error);
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
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Некоректні дані" }, { status: 400 });
    }

    const isReset = body.reset === true;
    const targetDict = isReset
      ? DEFAULT_TASK_DICTIONARIES
      : {
          componentsByType: body.componentsByType || {},
          labels: Array.isArray(body.labels) ? body.labels : [],
        };

    const saved = saveTaskDictionaries(targetDict);

    return NextResponse.json({
      success: true,
      message: isReset ? "Довідники скинуто до початкових значень" : "Довідники успішно оновлено",
      dictionaries: saved,
    });
  } catch (error: any) {
    console.error("POST /api/settings/dictionaries error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
