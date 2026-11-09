import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_LOCALES = ["uk", "en"];

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
    }

    const body = await req.json();
    const { locale } = body;

    if (!locale || !VALID_LOCALES.includes(locale)) {
      return NextResponse.json({ error: "Некоректна мова локалізації (підтримуються 'uk' та 'en')" }, { status: 400 });
    }

    try {
      await prisma.user.update({
        where: { id: user.userId },
        data: { locale },
      });
    } catch (dbErr) {
      console.warn("Could not persist locale to DB user record:", dbErr);
    }

    const res = NextResponse.json({ success: true, locale });
    res.cookies.set("stsup_lang", locale, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });

    return res;
  } catch (error: any) {
    console.error("POST /api/users/locale error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
