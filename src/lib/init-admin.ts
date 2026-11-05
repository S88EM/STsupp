import fs from "fs";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export function getSystemAdminConfig() {
  let haOptions: any = {};
  try {
    if (fs.existsSync("/data/options.json")) {
      haOptions = JSON.parse(fs.readFileSync("/data/options.json", "utf8"));
    }
  } catch (e) {
    // ignore
  }

  return {
    email: (process.env.ADMIN_EMAIL || haOptions.admin_email || "admin@stsup.local").toLowerCase().trim(),
    password: process.env.ADMIN_PASSWORD || haOptions.admin_password || "admin123",
    name: process.env.ADMIN_NAME || haOptions.admin_name || "Євген",
  };
}

let hasCheckedAdmin = false;

/**
 * Ensures the initial administrator account is created in the database
 * on system launch or first request.
 */
export async function ensureDefaultAdmin(): Promise<void> {
  if (hasCheckedAdmin) return;

  try {
    const cfg = getSystemAdminConfig();
    const existing = await prisma.user.findUnique({
      where: { email: cfg.email },
    });

    if (!existing) {
      const passwordHash = await hashPassword(cfg.password);
      await prisma.user.create({
        data: {
          email: cfg.email,
          name: cfg.name,
          passwordHash,
          role: "ADMIN",
          isEmailVerified: true,
        },
      });
      console.log(`[STsup Auth] Initialized default admin: ${cfg.email}`);
    } else if (!existing.isEmailVerified) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { isEmailVerified: true, role: "ADMIN" },
      });
    }

    hasCheckedAdmin = true;
  } catch (err) {
    console.error("[STsup Auth] Failed to ensure default admin:", err);
  }
}
