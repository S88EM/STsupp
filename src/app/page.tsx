import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isPrimaryAdmin } from "@/lib/auth";
import { CreateFirstProjectForm } from "@/components/project/CreateFirstProjectForm";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  const isSuperAdmin = currentUser.role === "ADMIN" && isPrimaryAdmin(currentUser.email);
  const whereClause = isSuperAdmin
    ? {}
    : {
        OR: [
          { ownerId: currentUser.userId },
          { members: { some: { userId: currentUser.userId } } },
        ],
      };

  const firstProject = await prisma.project.findFirst({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  // If user already has access to a project, redirect instantly on the server (0 visual flash!)
  if (firstProject) {
    redirect(`/projects/${firstProject.id}`);
  }

  // Only reached if there are genuinely zero projects in the database for this user
  return <CreateFirstProjectForm currentUser={currentUser} />;
}
