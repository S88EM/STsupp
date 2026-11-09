import fs from "fs";
import { prisma } from "@/lib/prisma";
import { hashPassword, comparePassword } from "@/lib/auth";

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
    let adminUser = await prisma.user.findUnique({
      where: { email: cfg.email },
    });

    if (!adminUser) {
      const passwordHash = await hashPassword(cfg.password);
      adminUser = await prisma.user.create({
        data: {
          email: cfg.email,
          name: cfg.name,
          passwordHash,
          role: "ADMIN",
          isEmailVerified: true,
        },
      });
      console.log(`[STsup Auth] Initialized default admin: ${cfg.email}`);
    } else {
      // If admin exists, only update role and email verification if missing.
      // NEVER overwrite the user's password unless explicitly requested via FORCE_ADMIN_PASSWORD_RESET=true.
      const forceReset = process.env.FORCE_ADMIN_PASSWORD_RESET === "true";
      let newHash = adminUser.passwordHash;
      let shouldUpdatePassword = false;

      if (!adminUser.passwordHash || forceReset) {
        newHash = await hashPassword(cfg.password);
        shouldUpdatePassword = true;
      }

      if (!adminUser.isEmailVerified || adminUser.role !== "ADMIN" || shouldUpdatePassword) {
        adminUser = await prisma.user.update({
          where: { id: adminUser.id },
          data: {
            isEmailVerified: true,
            role: "ADMIN",
            passwordHash: newHash,
          },
        });
        console.log(`[STsup Auth] Synchronized default admin: ${cfg.email}`);
      }
    }

    // Ensure all existing unassigned projects are accessible by this primary admin
    const defaultProject = await prisma.project.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (defaultProject && adminUser) {
      const isMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: defaultProject.id,
            userId: adminUser.id,
          },
        },
      });
      if (!isMember && defaultProject.ownerId !== adminUser.id) {
        await prisma.projectMember.create({
          data: {
            projectId: defaultProject.id,
            userId: adminUser.id,
            role: "ADMIN",
          },
        }).catch(() => {});
      }
    }

    hasCheckedAdmin = true;
  } catch (err) {
    console.error("[STsup Auth] Failed to ensure default admin:", err);
  }
}
