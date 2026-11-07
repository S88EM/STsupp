import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canManageProjects } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { projectId: string; columnId: string } }
) {
  try {
    const { projectId, columnId } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser || !canManageProjects(currentUser.role)) {
      return NextResponse.json(
        { error: "Тільки адміністратори можуть редагувати колонки" },
        { status: 403 }
      );
    }
    const body = await req.json();
    const { name, color, isDoneColumn } = body;

    const updated = await prisma.column.update({
      where: { id: columnId, projectId },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        color: color !== undefined ? color : undefined,
        isDoneColumn: isDoneColumn !== undefined ? Boolean(isDoneColumn) : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH column error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { projectId: string; columnId: string } }
) {
  try {
    const { projectId, columnId } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser || !canManageProjects(currentUser.role)) {
      return NextResponse.json(
        { error: "Тільки адміністратори можуть видаляти колонки" },
        { status: 403 }
      );
    }

    // Check if column has tasks
    const taskCount = await prisma.task.count({
      where: { columnId },
    });

    if (taskCount > 0) {
      // Find fallback column
      const fallback = await prisma.column.findFirst({
        where: { projectId, id: { not: columnId } },
        orderBy: { orderIndex: "asc" },
      });

      if (!fallback) {
        return NextResponse.json(
          { error: "Неможливо видалити єдину колонку, в якій є задачі" },
          { status: 400 }
        );
      }

      // Move tasks to fallback column
      await prisma.task.updateMany({
        where: { columnId },
        data: { columnId: fallback.id },
      });
    }

    await prisma.column.delete({
      where: { id: columnId, projectId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE column error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
