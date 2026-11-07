import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createSystemBackup } from "@/lib/backup";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Необхідно авторизуватися" }, { status: 401 });
    }
    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Створення резервної копії доступне виключно адміністраторам" },
        { status: 403 }
      );
    }

    const { buffer, filename, summary } = await createSystemBackup({
      userId: currentUser.userId,
      email: currentUser.email,
      name: currentUser.name,
      role: currentUser.role,
    });

    const response = new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
        "X-Backup-Users": summary.usersCount.toString(),
        "X-Backup-Projects": summary.projectsCount.toString(),
        "X-Backup-Tasks": summary.tasksCount.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });

    return response;
  } catch (error: any) {
    console.error("GET /api/settings/backup/export error:", error);
    return NextResponse.json({ error: error.message || "Помилка експорту бекапу" }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
