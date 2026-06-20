/**
 * lib/api/client.ts — MOCK VERSION
 * All API calls return mock data. No backend required.
 */

import {
  RESOURCES,
  TEAM_MEMBERS,
  PROJECTS,
  ATTACHMENTS,
  AVENANTS,
  SITUATIONS,
  type Attachment,
  type Avenant,
  type Situation,
} from "@/lib/mock/data";

// In-memory id counters for newly created Suivi documents (mock persistence
// lives only for the lifetime of the page — refreshing resets to seed data).
let nextAttachmentId = Math.max(0, ...ATTACHMENTS.map((a) => a.id)) + 1;
let nextAvenantId = Math.max(0, ...AVENANTS.map((a) => a.id)) + 1;
let nextSituationId = Math.max(0, ...SITUATIONS.map((s) => s.id)) + 1;

export async function apiRequest<T>(
  path: string,
  {
    method = "GET",
    body,
  }: {
    method?: string;
    body?: unknown;
    params?: Record<string, string | number | boolean>;
  } = {},
): Promise<T> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 80));

  // Tasks / project tasks
  if (path.match(/\/tasks\/project\/\d+/)) {
    const pid = parseInt(path.split("/").pop()!);
    return [
      {
        id: 1,
        title: "Coulage fondations bloc A",
        status: "done",
        project_id: pid,
        assigned_to: 1,
        start_date: "2025-06-01",
        end_date: "2025-06-05",
        description: "",
      },
      {
        id: 2,
        title: "Ferraillage niveau 1",
        status: "in_progress",
        project_id: pid,
        assigned_to: 2,
        start_date: "2025-06-06",
        end_date: "2025-06-12",
        description: "",
      },
      {
        id: 3,
        title: "Coffrages piliers RDC",
        status: "todo",
        project_id: pid,
        assigned_to: 3,
        start_date: "2025-06-13",
        end_date: "2025-06-18",
        description: "",
      },
      {
        id: 4,
        title: "Réception matériaux lot 3",
        status: "todo",
        project_id: pid,
        assigned_to: 1,
        start_date: "2025-06-15",
        end_date: "2025-06-16",
        description: "",
      },
    ] as unknown as T;
  }

  // Resources
  if (path === "/resources/") {
    return RESOURCES as unknown as T;
  }

  // Human resources / crew
  if (path.match(/\/resources\/human\/\d+/)) {
    const pid = parseInt(path.split("/").pop()!);
    return TEAM_MEMBERS.filter((m) => m.projectId === pid) as unknown as T;
  }

  // Reports
  if (path.match(/\/reports\/project\/\d+/)) {
    const pid = parseInt(path.split("/").pop()!);
    const proj = PROJECTS.find((p) => p.id === pid);
    return [
      {
        id: 1,
        project_id: pid,
        type: "daily",
        title: `PV de chantier — ${proj?.name ?? "Projet"}`,
        created_at: "2025-06-10",
        status: "validated",
      },
      {
        id: 2,
        project_id: pid,
        type: "weekly",
        title: "Rapport hebdomadaire semaine 23",
        created_at: "2025-06-08",
        status: "draft",
      },
    ] as unknown as T;
  }

  // ── Suivi: Attachments ──────────────────────────────────────────────
  if (method === "GET" && /^\/suivi\/attachments\/\d+$/.test(path)) {
    const pid = parseInt(path.split("/").pop()!, 10);
    return ATTACHMENTS.filter((a) => a.project_id === pid) as unknown as T;
  }
  if (method === "POST" && path === "/suivi/attachments") {
    const { is_validated, created_at, ...rest } = body as Omit<
      Attachment,
      "id"
    >;
    const newItem: Attachment = {
      ...rest,
      id: nextAttachmentId++,
      is_validated: false,
      created_at: new Date().toISOString().split("T")[0],
    };
    ATTACHMENTS.unshift(newItem);
    return newItem as unknown as T;
  }
  if (
    method === "PATCH" &&
    /^\/suivi\/attachments\/\d+\/validate$/.test(path)
  ) {
    const id = parseInt(path.split("/")[3], 10);
    const item = ATTACHMENTS.find((a) => a.id === id);
    if (item) item.is_validated = true;
    return { success: true } as unknown as T;
  }
  if (method === "DELETE" && /^\/suivi\/attachments\/\d+$/.test(path)) {
    const id = parseInt(path.split("/").pop()!, 10);
    const idx = ATTACHMENTS.findIndex((a) => a.id === id);
    if (idx >= 0) ATTACHMENTS.splice(idx, 1);
    return { success: true } as unknown as T;
  }

  // ── Suivi: Avenants ─────────────────────────────────────────────────
  if (method === "GET" && /^\/suivi\/avenants\/\d+$/.test(path)) {
    const pid = parseInt(path.split("/").pop()!, 10);
    return AVENANTS.filter((a) => a.project_id === pid) as unknown as T;
  }
  if (method === "POST" && path === "/suivi/avenants") {
    const { created_at, ...rest } = body as Omit<Avenant, "id">;
    const newItem: Avenant = {
      ...rest,
      id: nextAvenantId++,
      created_at: new Date().toISOString().split("T")[0],
    };
    AVENANTS.unshift(newItem);
    return newItem as unknown as T;
  }
  if (method === "DELETE" && /^\/suivi\/avenants\/\d+$/.test(path)) {
    const id = parseInt(path.split("/").pop()!, 10);
    const idx = AVENANTS.findIndex((a) => a.id === id);
    if (idx >= 0) AVENANTS.splice(idx, 1);
    return { success: true } as unknown as T;
  }

  // ── Suivi: Situations ───────────────────────────────────────────────
  if (method === "GET" && /^\/suivi\/situations\/\d+$/.test(path)) {
    const pid = parseInt(path.split("/").pop()!, 10);
    return SITUATIONS.filter((s) => s.project_id === pid) as unknown as T;
  }
  if (method === "POST" && path === "/suivi/situations") {
    const { is_approved, created_at, ...rest } = body as Omit<Situation, "id">;
    const newItem: Situation = {
      ...rest,
      id: nextSituationId++,
      is_approved: false,
      created_at: new Date().toISOString().split("T")[0],
    };
    SITUATIONS.unshift(newItem);
    return newItem as unknown as T;
  }
  if (method === "PATCH" && /^\/suivi\/situations\/\d+\/approve$/.test(path)) {
    const id = parseInt(path.split("/")[3], 10);
    const item = SITUATIONS.find((s) => s.id === id);
    if (item) item.is_approved = true;
    return { success: true } as unknown as T;
  }
  if (method === "DELETE" && /^\/suivi\/situations\/\d+$/.test(path)) {
    const id = parseInt(path.split("/").pop()!, 10);
    const idx = SITUATIONS.findIndex((s) => s.id === id);
    if (idx >= 0) SITUATIONS.splice(idx, 1);
    return { success: true } as unknown as T;
  }

  // Generate report
  if (path.match(/\/reports\/generate/))
    return { success: true } as unknown as T;

  // POST tasks
  if (method === "POST" && path === "/tasks") {
    const { status, ...rest } = (body as any) ?? {};
    return {
      ...rest,
      id: Math.floor(Math.random() * 10000),
      status: "todo",
    } as unknown as T;
  }

  // PATCH/PUT tasks
  if ((method === "PATCH" || method === "PUT") && path.match(/\/tasks\/\d+/)) {
    return { success: true } as unknown as T;
  }

  // DELETE tasks
  if (method === "DELETE" && path.match(/\/tasks\/\d+/)) {
    return { success: true } as unknown as T;
  }

  console.warn("[mock apiRequest] unhandled path:", method, path);
  return {} as T;
}
