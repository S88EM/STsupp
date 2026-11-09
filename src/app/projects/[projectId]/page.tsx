"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import { ProjectWorkspace } from "@/components/jira/ProjectWorkspace";

function ProjectPageWrapper() {
  const params = useParams();
  const projectId = params?.projectId as string;

  return <ProjectWorkspace initialProjectId={projectId} />;
}

export default function ProjectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
          Завантаження проєкту Jira...
        </div>
      }
    >
      <ProjectPageWrapper />
    </Suspense>
  );
}
