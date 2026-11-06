import { NextResponse } from "next/server";
import { getCurrentUser, isPrimaryAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  let dbUser = null;
  try {
    dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        city: true,
        role: true,
        theme: true,
      },
    });
  } catch (e) {
    // ignore
  }

  return NextResponse.json({
    user: {
      ...user,
      ...(dbUser || {}),
      isPrimaryAdmin: user.role === "ADMIN" && isPrimaryAdmin(user.email),
    },
  });
}
