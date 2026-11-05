import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canManageProjects } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(members);
  } catch (error: any) {
    console.error("GET project members error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !canManageProjects(currentUser.role)) {
      return NextResponse.json({ error: "Доступ заборонено" }, { status: 403 });
    }

    const { projectId } = params;
    const body = await req.json();
    const { userId, role } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID обов'язковий" }, { status: 400 });
    }

    const member = await prisma.projectMember.upsert({
      where: {
        projectId_userId: { projectId, userId },
      },
      update: {
        role: role ? (role as any) : undefined,
      },
      create: {
        projectId,
        userId,
        role: role ? (role as any) : "CLIENT",
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json(member);
  } catch (error: any) {
    console.error("POST project member error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !canManageProjects(currentUser.role)) {
      return NextResponse.json({ error: "Доступ заборонено" }, { status: 403 });
    }

    const { projectId } = params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID обов'язковий" }, { status: 400 });
    }

    await prisma.projectMember.deleteMany({
      where: { projectId, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE project member error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
