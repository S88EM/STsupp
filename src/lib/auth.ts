import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import fs from "fs";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "stsup_secret_jwt_key_super_safe_2026";
export const AUTH_COOKIE_NAME = "stsup_session";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string; // "ADMIN" | "ENGINEER" | "CLIENT" | "MEMBER"
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch (err) {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch (err) {
    return null;
  }
}

export function getPrimaryAdminEmail(): string {
  let haOptions: any = {};
  try {
    if (fs.existsSync("/data/options.json")) {
      haOptions = JSON.parse(fs.readFileSync("/data/options.json", "utf8"));
    }
  } catch (e) {}

  return (process.env.ADMIN_EMAIL || haOptions.admin_email || "admin@stsup.local").toLowerCase().trim();
}

/**
 * Legacy helper maintained for backward compatibility.
 * In STsup, all users with role ADMIN are equal, full-privileged Administrators.
 */
export function isPrimaryAdmin(email?: string | null): boolean {
  return true;
}

/**
 * Check if the user has access to a specific project.
 * All Administrators (role: ADMIN) have automatic global access to ALL projects.
 * Engineers, Clients, and Members must be assigned as members or own the project.
 */
export async function hasProjectAccess(
  userId: string,
  projectId: string,
  role?: string,
  email?: string
): Promise<boolean> {
  let userRole = role;

  if (!userRole) {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (u) {
      userRole = u.role;
    }
  }

  // Any Administrator has automatic global access to all projects without restrictions
  if (userRole === "ADMIN") {
    return true;
  }

  // All other roles must be assigned to the project or be the owner
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    select: { id: true },
  });

  return Boolean(project);
}

export function canDeleteTasks(role: string): boolean {
  return role === "ADMIN";
}

export function canChangeTaskStatus(role?: string): boolean {
  return role === "ADMIN" || role === "ENGINEER";
}

export function canManageUsers(role: string): boolean {
  return role === "ADMIN";
}

export function canManageProjects(role: string): boolean {
  return role === "ADMIN";
}
