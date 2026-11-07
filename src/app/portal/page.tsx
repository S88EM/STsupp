"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ClientCreateTicketModal } from "@/components/portal/ClientCreateTicketModal";
import { ClientTicketDetailModal } from "@/components/portal/ClientTicketDetailModal";
import {
  ProjectItem,
  TicketItem,
  PortalStatusFilter,
  PortalCurrentUser,
  isTaskResolved,
  isTaskBacklog,
  isTaskInProgress,
  isAwaitingClientResponse,
} from "@/components/portal/types";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { PortalHero } from "@/components/portal/PortalHero";
import { PortalKpiCards } from "@/components/portal/PortalKpiCards";
import { PortalFilters } from "@/components/portal/PortalFilters";
import { PortalTicketList } from "@/components/portal/PortalTicketList";

export default function ClientPortalPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<PortalCurrentUser | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [allTickets, setAllTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<PortalStatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [scopeFilter, setScopeFilter] = useState<"all" | "my">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicketProjectId, setSelectedTicketProjectId] = useState<string>("");

  // Load user data
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.replace("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  // Load projects
  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0 && !selectedProjectId) {
          if (data.length === 1) {
            setSelectedProjectId(data[0].id);
          }
        }
      }
    } catch (err) {
      console.error("Error loading projects:", err);
    }
  }, [selectedProjectId]);

  // Load tickets for current project and scope
  const loadTickets = useCallback(
    async (showLoadingSpinner = false) => {
      if (showLoadingSpinner) setLoading(true);
      else setRefreshing(true);

      try {
        const queryParams = new URLSearchParams();
        if (selectedProjectId) queryParams.set("projectId", selectedProjectId);
        if (scopeFilter === "my") queryParams.set("scope", "my");

        const res = await fetch(`/api/tasks?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setAllTickets(data.tasks || []);
        }
      } catch (err) {
        console.error("Error loading tickets:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedProjectId, scopeFilter]
  );

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadTickets(true);
  }, [loadTickets]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      window.location.replace("/login");
    }
  };

  // Metrics computation across all tickets in current scope/project
  const metrics = useMemo(() => {
    let inProgress = 0;
    let resolved = 0;
    let backlog = 0;
    let awaitingResponse = 0;

    for (const t of allTickets) {
      if (isTaskResolved(t)) {
        resolved++;
      } else {
        if (isAwaitingClientResponse(t, currentUser?.id)) {
          awaitingResponse++;
        }
        if (isTaskInProgress(t)) {
          inProgress++;
        } else if (isTaskBacklog(t)) {
          backlog++;
        }
      }
    }

    return {
      total: allTickets.length,
      inProgress,
      resolved,
      backlog,
      awaitingResponse,
    };
  }, [allTickets, currentUser?.id]);

  // Displayed tickets filtered strictly according to active status, priority, and search query
  const displayedTickets = useMemo(() => {
    let list = allTickets;

    // 1. Status Filter
    if (statusFilter === "in_progress") {
      list = list.filter(isTaskInProgress);
    } else if (statusFilter === "resolved") {
      list = list.filter(isTaskResolved);
    } else if (statusFilter === "backlog") {
      list = list.filter(isTaskBacklog);
    } else if (statusFilter === "awaiting_response") {
      list = list.filter((t) => isAwaitingClientResponse(t, currentUser?.id));
    }

    // 2. Priority Filter
    if (priorityFilter !== "all") {
      list = list.filter((t) => t.priority === priorityFilter);
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allTickets, statusFilter, priorityFilter, searchQuery, currentUser?.id]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col select-none">
      {/* Top Navigation */}
      <PortalHeader
        currentUser={currentUser}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        onCreateTicketClick={() => setIsCreateModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Hero Section */}
        <PortalHero
          userName={currentUser?.name}
          onCreateTicketClick={() => setIsCreateModalOpen(true)}
          onRefreshClick={() => loadTickets(false)}
          refreshing={refreshing}
        />

        {/* Metric / KPI Cards */}
        <PortalKpiCards
          metrics={metrics}
          statusFilter={statusFilter}
          onSelectFilter={setStatusFilter}
        />

        {/* Toolbar: Search & Filters */}
        <PortalFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          scopeFilter={scopeFilter}
          onScopeFilterChange={setScopeFilter}
          metrics={metrics}
          totalFound={displayedTickets.length}
        />

        {/* Tickets List View */}
        <PortalTicketList
          tickets={displayedTickets}
          loading={loading}
          statusFilter={statusFilter}
          searchQuery={searchQuery}
          scopeFilter={scopeFilter}
          currentUserId={currentUser?.id}
          onSelectTicket={(ticket) => {
            setSelectedTicketId(ticket.id);
            setSelectedTicketProjectId(ticket.projectId);
          }}
          onCreateTicketClick={() => setIsCreateModalOpen(true)}
        />
      </main>

      {/* Modals */}
      <ClientCreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projects={projects}
        defaultProjectId={selectedProjectId || undefined}
        onTicketCreated={(created) => {
          loadTickets(false);
          setSelectedTicketId(created.id);
          setSelectedTicketProjectId(created.projectId);
        }}
      />

      <ClientTicketDetailModal
        taskId={selectedTicketId}
        projectId={selectedTicketProjectId}
        isOpen={Boolean(selectedTicketId)}
        onClose={() => setSelectedTicketId(null)}
        onTicketUpdated={() => loadTickets(false)}
        currentUser={currentUser}
      />
    </div>
  );
}
