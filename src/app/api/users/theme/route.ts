import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_THEMES = [
  "default",
  "midnight",
  "oled",
  "aurora",
  "emerald",
  "nebula",
  "charcoal",
];

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
    }

    const body = await req.json();
    const { theme } = body;

    if (!theme || !VALID_THEMES.includes(theme)) {
      return NextResponse.json({ error: "Некоректна тема" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.userId },
      data: { theme },
    });

    const res = NextResponse.json({ success: true, theme });
    res.cookies.set("stsup_theme", theme, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });

    return res;
  } catch (error: any) {
    console.error("POST /api/users/theme error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
