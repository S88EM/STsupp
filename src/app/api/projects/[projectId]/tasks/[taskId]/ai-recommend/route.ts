import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confluenceMcpService } from "@/lib/mcp-client";

export async function POST(
  req: Request,
  { params }: { params: { projectId: string; taskId: string } }
) {
  try {
    const { taskId } = params;
    const body = await req.json().catch(() => ({}));
    const { postAsComment = false } = body;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Задачу не знайдено" }, { status: 404 });
    }

    // Call Confluence MCP Service
    const recommendations = await confluenceMcpService.getRecommendationsForTask({
      title: task.title,
      description: task.description,
      projectKey: task.project.key,
    });

    // Save recommendation to database
    const recRecord = await prisma.aiRecommendation.create({
      data: {
        taskId,
        query: `${task.title} ${task.description || ""}`.trim(),
        confluencePages: recommendations.confluencePages as any,
        summary: recommendations.summary,
        confidence: recommendations.confidence,
      },
    });

    // Optionally post as an AI Comment
    if (postAsComment) {
      const linksMarkdown = recommendations.confluencePages
        .map((p) => `- [${p.title}](${p.url}): ${p.snippet}`)
        .join("\n");

      await prisma.comment.create({
        data: {
          taskId,
          authorType: "AI_ASSISTANT",
          authorName: "Confluence AI Guide",
          content: `💡 **AI Рекомендація на основі Confluence:**\n\n${recommendations.summary}\n\n**Пов'язана документація:**\n${linksMarkdown}`,
        },
      });
    }

    return NextResponse.json({
      recommendation: recRecord,
      details: recommendations,
    });
  } catch (error: any) {
    console.error("POST /ai-recommend error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
