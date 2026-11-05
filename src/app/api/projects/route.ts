import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper to ensure at least one default user exists for the self-hosted instance
async function getOrCreateDefaultUser() {
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "admin@stsup.local",
        name: "Admin User",
        role: "ADMIN",
      },
    });
  }
  return user;
}

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        columns: {
          orderBy: { orderIndex: "asc" },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch (error: any) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, key, description } = body;

    if (!name || !key) {
      return NextResponse.json({ error: "Name and Key are required" }, { status: 400 });
    }

    const cleanKey = key.trim().toUpperCase();
    const existing = await prisma.project.findUnique({
      where: { key: cleanKey },
    });

    if (existing) {
      return NextResponse.json({ error: `Проект з ключем "${cleanKey}" вже існує` }, { status: 400 });
    }

    const user = await getOrCreateDefaultUser();

    // Create project with default workflow columns
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        key: cleanKey,
        description: description?.trim() || null,
        ownerId: user.id,
        columns: {
          create: [
            { name: "Беклог", color: "#64748b", orderIndex: 0, isDoneColumn: false },
            { name: "В роботі", color: "#3b82f6", orderIndex: 1, isDoneColumn: false },
            { name: "Тестування", color: "#eab308", orderIndex: 2, isDoneColumn: false },
            { name: "Готово", color: "#22c55e", orderIndex: 3, isDoneColumn: true },
          ],
        },
        members: {
          create: {
            userId: user.id,
            role: "ADMIN",
          },
        },
      },
      include: {
        columns: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
