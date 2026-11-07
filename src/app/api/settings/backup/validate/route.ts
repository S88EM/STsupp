import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { validateSystemBackup } from "@/lib/backup";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Необхідно авторизуватися" }, { status: 401 });
    }
    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Перевірка резервної копії доступна виключно адміністраторам" },
        { status: 403 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let buffer: Buffer;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "Файл резервної копії не надано" }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      const arrayBuffer = await req.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json({ error: "Файл резервної копії порожній" }, { status: 400 });
    }

    const result = validateSystemBackup(buffer);
    if (!result.isValid) {
      return NextResponse.json({ isValid: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      isValid: true,
      version: result.version,
      createdAt: result.createdAt,
      exportedBy: result.exportedBy,
      summary: result.summary,
    });
  } catch (error: any) {
    console.error("POST /api/settings/backup/validate error:", error);
    return NextResponse.json(
      { error: error.message || "Помилка перевірки резервної копії" },
      { status: 500 }
    );
  }
}
