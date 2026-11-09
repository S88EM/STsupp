"use client";

import React, { Suspense } from "react";
import { ClientPortalContent } from "@/components/portal/ClientPortalContent";

export default function ClientPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-xs text-muted-foreground">
          Завантаження порталу клієнта...
        </div>
      }
    >
      <ClientPortalContent />
    </Suspense>
  );
}
