import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canManageProjects } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser || !canManageProjects(currentUser.role)) {
      return NextResponse.json(
        { error: "Тільки адміністратори можуть створювати колонки" },
        { status: 403 }
      );
    }
    const body = await req.json();
    const { name, color = "#64748b", isDoneColumn = false } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Назва колонки обов'язкова" }, { status: 400 });
    }

    // Determine next orderIndex
    const lastCol = await prisma.column.findFirst({
      where: { projectId },
      orderBy: { orderIndex: "desc" },
    });
    const nextOrder = lastCol ? lastCol.orderIndex + 1 : 0;

    const column = await prisma.column.create({
      data: {
        projectId,
        name: name.trim(),
        color,
        isDoneColumn: Boolean(isDoneColumn),
        orderIndex: nextOrder,
      },
    });

    return NextResponse.json(column, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/projects/[id]/columns error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser || !canManageProjects(currentUser.role)) {
      return NextResponse.json(
        { error: "Тільки адміністратори можуть змінювати порядок колонок" },
        { status: 403 }
      );
    }
    const body = await req.json();
    const { columns } = body as { columns: { id: string; orderIndex: number }[] };

    if (!Array.isArray(columns)) {
      return NextResponse.json({ error: "Масив колонок обов'язковий" }, { status: 400 });
    }

    // Update in transaction
    await prisma.$transaction(
      columns.map((c) =>
        prisma.column.update({
          where: { id: c.id },
          data: { orderIndex: c.orderIndex },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT /api/projects/[id]/columns error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
