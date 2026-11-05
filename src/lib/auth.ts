import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
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

export function isPrimaryAdmin(email?: string | null): boolean {
  if (!email) return false;
  const primaryEmail = (process.env.ADMIN_EMAIL || "admin@stsup.local").toLowerCase().trim();
  return email.toLowerCase().trim() === primaryEmail;
}

/**
 * Check if the user has access to a specific project.
 * ONLY the Primary Administrator (admin@stsup.local) has automatic global access to all projects.
 * Created Administrators, Engineers, and Clients must be explicitly assigned as members or own the project.
 */
export async function hasProjectAccess(
  userId: string,
  projectId: string,
  role?: string,
  email?: string
): Promise<boolean> {
  let userEmail = email;
  let userRole = role;

  if (!userEmail || !userRole) {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, role: true },
    });
    if (u) {
      userEmail = u.email;
      userRole = u.role;
    }
  }

  // Primary Admin has automatic global access to all projects
  if (userRole === "ADMIN" && isPrimaryAdmin(userEmail)) {
    return true;
  }

  // All others (Created Admins, Engineers, Clients) must be assigned to the project or be the owner
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

export function canManageUsers(role: string): boolean {
  return role === "ADMIN";
}

export function canManageProjects(role: string): boolean {
  return role === "ADMIN";
}
