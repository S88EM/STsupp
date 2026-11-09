import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasProjectAccess } from "@/lib/auth";
import { normalizeTaskCode, isValidTaskCode } from "@/lib/taskUrl";

export async function GET(
  req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const rawCode = params.code;
    const normalizedCode = normalizeTaskCode(rawCode);

    if (!isValidTaskCode(normalizedCode)) {
      return NextResponse.json(
        { error: "Некоректний формат коду задачі", code: normalizedCode },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Необхідно авторизуватися для перегляду задачі", code: normalizedCode },
        { status: 401 }
      );
    }

    const task = await prisma.task.findFirst({
      where: { code: normalizedCode },
      select: {
        id: true,
        code: true,
        title: true,
        projectId: true,
        project: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: `Задачу з номером ${normalizedCode} не знайдено`, code: normalizedCode },
        { status: 404 }
      );
    }

    const hasAccess = await hasProjectAccess(
      currentUser.userId,
      task.projectId,
      currentUser.role,
      currentUser.email
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "У вас немає доступу до перегляду цієї задачі", code: normalizedCode },
        { status: 403 }
      );
    }

    return NextResponse.json({
      task: {
        id: task.id,
        code: task.code,
        title: task.title,
        projectId: task.projectId,
        projectKey: task.project.key,
        projectName: task.project.name,
      },
      userRole: currentUser.role,
    });
  } catch (error: any) {
    console.error("GET /api/tasks/by-code/[code] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
