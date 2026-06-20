"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/sidebar/sidebar";
import PageTitle from "@/components/page_title/page_title";
import { TEAMS, type Team } from "@/app/teams/teams-data";
import { TEAM_MEMBERS, PROJECTS } from "@/lib/mock/data";
import "./page.css";

export default function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const team: Team | undefined = TEAMS.find((t) => t.id === Number(teamId));

  const members = useMemo(
    () =>
      TEAM_MEMBERS.filter((m) => {
        const proj = PROJECTS.find((p) => p.id === m.projectId);
        return proj?.team === team?.name;
      }),
    [team],
  );

  if (!team) {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="app-content" style={{ padding: 40 }}>
          <p>Équipe introuvable.</p>
          <Link href="/teams" style={{ color: "#2563eb" }}>
            ← Retour aux équipes
          </Link>
        </main>
      </div>
    );
  }

  const statusColor =
    team.status === "Active"
      ? "#16a34a"
      : team.status === "On Hold"
        ? "#d97706"
        : "#64748b";

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-content" style={{ padding: "32px 40px" }}>
        <div style={{ marginBottom: 8 }}>
          <Link
            href="/teams"
            style={{ color: "#64748b", fontSize: 13, textDecoration: "none" }}
          >
            ← Équipes
          </Link>
        </div>
        <PageTitle title={team.name} />

        {/* Overview card */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            marginTop: 24,
            marginBottom: 32,
          }}
        >
          {[
            { label: "Statut", value: team.status, color: statusColor },
            { label: "Responsable", value: team.lead },
            { label: "Département", value: team.department },
            { label: "Localisation", value: team.location },
            { label: "Projets actifs", value: String(team.projectCount) },
            { label: "Membres", value: String(team.memberCount) },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "16px 20px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#94a3b8",
                  marginBottom: 6,
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: item.color ?? "#0f172a",
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Focus */}
        <div
          style={{
            background: "#f8f9fb",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: "16px 20px",
            marginBottom: 32,
            fontSize: 14,
            color: "#475569",
          }}
        >
          {team.focus}
        </div>

        {/* Active projects */}
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 12,
            color: "#0f172a",
          }}
        >
          Projets actifs
        </h3>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 32,
          }}
        >
          {team.activeProjects.map((proj) => (
            <span
              key={proj}
              style={{
                padding: "6px 14px",
                background: "#dbe1ff",
                color: "#004ac6",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {proj}
            </span>
          ))}
        </div>

        {/* Members */}
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 12,
            color: "#0f172a",
          }}
        >
          Membres ({members.length || team.memberCount})
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
          }}
        >
          {(members.length > 0
            ? members
            : team.members.map((initials, i) => ({
                id: i,
                name: initials,
                role: "Membre",
                email: "—",
                phone: "—",
                status: "active" as const,
                skills: [],
                projectId: 0,
              }))
          ).map((m) => (
            <div
              key={m.id}
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#dbe1ff",
                  color: "#004ac6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {typeof m.name === "string"
                  ? m.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2)
                  : "?"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}
                >
                  {m.name}
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{m.role}</div>
              </div>
              {"status" in m && (
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 600,
                    background:
                      m.status === "active"
                        ? "#dcfce7"
                        : m.status === "on_leave"
                          ? "#fef9c3"
                          : "#fee2e2",
                    color:
                      m.status === "active"
                        ? "#166534"
                        : m.status === "on_leave"
                          ? "#854d0e"
                          : "#991b1b",
                  }}
                >
                  {m.status === "active"
                    ? "Actif"
                    : m.status === "on_leave"
                      ? "Congé"
                      : "Indisponible"}
                </span>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
