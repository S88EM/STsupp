import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        columns: {
          orderBy: { orderIndex: "asc" },
          include: {
            tasks: {
              orderBy: { orderIndex: "asc" },
              include: {
                assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
                creator: { select: { id: true, name: true, email: true } },
                subtasks: { orderBy: { orderIndex: "asc" } },
                _count: {
                  select: {
                    comments: true,
                    attachments: true,
                    subtasks: true,
                  },
                },
              },
            },
          },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Проект не знайдено" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error: any) {
    console.error("GET /api/projects/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const body = await req.json();
    const { name, description } = body;

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        description: description !== undefined ? description.trim() : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/projects/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    await prisma.project.delete({ where: { id: projectId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
