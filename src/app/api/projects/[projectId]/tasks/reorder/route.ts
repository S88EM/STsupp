import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const body = await req.json();
    const {
      taskId,
      destinationColumnId,
      updatedTasks, // array of { id: string; columnId: string; orderIndex: number }
    } = body;

    if (!Array.isArray(updatedTasks)) {
      return NextResponse.json({ error: "updatedTasks array is required" }, { status: 400 });
    }

    // Run updates in a single Prisma transaction
    await prisma.$transaction(
      updatedTasks.map((t) =>
        prisma.task.update({
          where: { id: t.id, projectId },
          data: {
            columnId: t.columnId,
            orderIndex: t.orderIndex,
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/projects/[id]/tasks/reorder error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
