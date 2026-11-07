import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { validateSystemBackup, restoreSystemBackup } from "@/lib/backup";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Необхідно авторизуватися" }, { status: 401 });
    }
    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Відновлення системи доступне виключно адміністраторам" },
        { status: 403 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let buffer: Buffer;
    let confirmed = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const confirmVal = formData.get("confirm");
      confirmed = confirmVal === "true" || confirmVal === "1";

      if (!file) {
        return NextResponse.json({ error: "Файл резервної копії не надано" }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      const arrayBuffer = await req.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      confirmed = true;
    }

    if (!confirmed) {
      return NextResponse.json(
        { error: "Необхідне явне підтвердження для перезапису поточної бази даних" },
        { status: 400 }
      );
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json({ error: "Файл резервної копії порожній" }, { status: 400 });
    }

    // 1. Validate structure & integrity
    const validation = validateSystemBackup(buffer);
    if (!validation.isValid || !validation.package) {
      return NextResponse.json(
        { error: validation.error || "Невалідний архів резервної копії" },
        { status: 400 }
      );
    }

    // 2. Perform restore
    const actor = {
      userId: currentUser.userId,
      email: currentUser.email,
      name: currentUser.name,
      role: currentUser.role,
    };

    const restoreResult = await restoreSystemBackup(validation.package, actor);

    return NextResponse.json({
      success: true,
      message: "Систему успішно відновлено з резервної копії",
      summary: restoreResult.summary,
      backupCreatedAt: validation.createdAt,
    });
  } catch (error: any) {
    console.error("POST /api/settings/backup/restore error:", error);
    return NextResponse.json(
      { error: error.message || "Помилка відновлення системи з резервної копії" },
      { status: 500 }
    );
  }
}
