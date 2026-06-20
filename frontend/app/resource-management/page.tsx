"use client";
import { useState, useMemo } from "react";
import Sidebar from "@/components/sidebar/sidebar";
import PageTitle from "@/components/page_title/page_title";
import { RESOURCES, TEAM_MEMBERS, Resource } from "@/lib/mock/data";
import "./page.css";

type Tab = "physical" | "human";

export default function ResourceManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>("physical");
  const [query, setQuery] = useState("");

  const filteredResources = useMemo(() => {
    const q = query.toLowerCase();
    return RESOURCES.filter(
      (r) =>
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q),
    );
  }, [query]);

  const filteredCrew = useMemo(() => {
    const q = query.toLowerCase();
    return TEAM_MEMBERS.filter(
      (m) =>
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q),
    );
  }, [query]);

  const statusBadge = (r: Resource) => {
    const map: Record<Resource["status"], string> = {
      AVAILABLE: "#16a34a",
      ON_SITE: "#2563eb",
      IN_TRANSIT: "#d97706",
      ORDERED: "#7c3aed",
      MAINTENANCE: "#dc2626",
    };
    return map[r.status] ?? "#64748b";
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-content" style={{ padding: "32px 40px" }}>
        <PageTitle title="Gestion des Ressources" />

        {/* Tabs */}
        <div
          style={{ display: "flex", gap: 8, marginBottom: 24, marginTop: 24 }}
        >
          {(["physical", "human"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                background: activeTab === tab ? "#2563eb" : "#f3f4f6",
                color: activeTab === tab ? "#fff" : "#64748b",
              }}
            >
              {tab === "physical"
                ? "Ressources physiques"
                : "Ressources humaines"}
            </button>
          ))}
          <input
            placeholder="Rechercher…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              marginLeft: "auto",
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 13,
              width: 220,
              outline: "none",
            }}
          />
        </div>

        {activeTab === "physical" && (
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                {[
                  "Ressource",
                  "Type",
                  "Statut",
                  "Disponible",
                  "Total",
                  "Commandé",
                  "État commande",
                  "Projet",
                  "Note",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 12px",
                      textAlign: "left",
                      fontWeight: 600,
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "#64748b",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredResources.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td
                    style={{
                      padding: "12px",
                      fontWeight: 600,
                      color: "#0f172a",
                    }}
                  >
                    {r.name}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: "#f3f4f6",
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      {r.type}
                    </span>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: statusBadge(r),
                          flexShrink: 0,
                        }}
                      />
                      {r.status}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {r.available}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {r.total}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {r.ordered}
                  </td>
                  <td style={{ padding: "12px" }}>{r.orderState}</td>
                  <td style={{ padding: "12px", color: "#64748b" }}>
                    {r.supplyFor}
                  </td>
                  <td
                    style={{ padding: "12px", color: "#94a3b8", fontSize: 12 }}
                  >
                    {r.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "human" && (
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                {[
                  "Nom",
                  "Rôle",
                  "Email",
                  "Téléphone",
                  "Statut",
                  "Compétences",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 12px",
                      textAlign: "left",
                      fontWeight: 600,
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "#64748b",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCrew.map((m) => (
                <tr key={m.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td
                    style={{
                      padding: "12px",
                      fontWeight: 600,
                      color: "#0f172a",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "#dbe1ff",
                          color: "#004ac6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: 12,
                          flexShrink: 0,
                        }}
                      >
                        {m.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      {m.name}
                    </div>
                  </td>
                  <td style={{ padding: "12px", color: "#475569" }}>
                    {m.role}
                  </td>
                  <td
                    style={{ padding: "12px", color: "#64748b", fontSize: 12 }}
                  >
                    {m.email}
                  </td>
                  <td
                    style={{ padding: "12px", color: "#64748b", fontSize: 12 }}
                  >
                    {m.phone}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        padding: "3px 10px",
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
                          ? "En congé"
                          : "Indisponible"}
                    </span>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {m.skills.map((s) => (
                        <span
                          key={s}
                          style={{
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: "#f3f4f6",
                            fontSize: 11,
                            color: "#475569",
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
