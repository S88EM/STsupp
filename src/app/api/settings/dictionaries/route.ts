import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getTaskDictionaries, saveTaskDictionaries, DEFAULT_TASK_DICTIONARIES } from "@/lib/dictionaries";
import { logAuditEvent, AUDIT_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Необхідно авторизуватись" }, { status: 401 });
    }

    const dict = getTaskDictionaries();
    const projects = await prisma.project.findMany({
      select: { id: true, name: true, key: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      ...dict,
      projects,
    });
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
          componentsByProject: body.componentsByProject || {},
          labels: Array.isArray(body.labels) ? body.labels : [],
        };

    const saved = saveTaskDictionaries(targetDict);

    // Apply component renames to existing tasks in database
    if (Array.isArray(body.renames) && body.renames.length > 0) {
      for (const rename of body.renames) {
        const { projectId, oldName, newName } = rename;
        if (!oldName || !newName || oldName === newName) continue;

        const whereClause: any = {};
        if (projectId) {
          whereClause.projectId = projectId;
        }

        const tasks = await prisma.task.findMany({
          where: whereClause,
          select: { id: true, aiContext: true },
        });

        for (const t of tasks) {
          const ctx = (t.aiContext || {}) as any;
          if (Array.isArray(ctx.components) && ctx.components.includes(oldName)) {
            const updatedComponents = ctx.components.map((c: string) => (c === oldName ? newName : c));
            await prisma.task.update({
              where: { id: t.id },
              data: {
                aiContext: {
                  ...ctx,
                  components: updatedComponents,
                },
              },
            });
          }
        }
      }
    }

    await logAuditEvent({
      actor: currentUser,
      action: AUDIT_ACTIONS.SETTINGS_DICTIONARY_UPDATE,
      targetType: "SETTINGS",
      targetId: "DICTIONARIES",
      details: {
        isReset,
        labelsCount: Array.isArray(saved.labels) ? saved.labels.length : 0,
        renamesCount: Array.isArray(body.renames) ? body.renames.length : 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: isReset
        ? "Довідники скинуто до початкових значень"
        : "Довідники успішно оновлено, а зміни застосовано до задач",
      dictionaries: saved,
    });
  } catch (error: any) {
    console.error("POST /api/settings/dictionaries error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
