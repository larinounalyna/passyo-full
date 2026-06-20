"use client";
import { useState, useMemo } from "react";
import "./page.css";

// After
import Sidebar from "@/components/sidebar/sidebar";
import PageTitle from "@/components/page_title/page_title";
import SearchBar from "@/components/search-bar/search-bar";
import { TEAMS } from "@/app/teams/teams-data";

type ProjectStatus = "Active" | "On Track" | "Risk" | "Blocked";
type DashboardPanel = "progress" | "latency" | "resources" | null;

type ProjectSummary = {
  id: number;
  name: string;
  team: string;
  status: ProjectStatus;
  progress: number;
  dueIn: string;
  budgetUsed: number;
  lateByDays: number;
  latencyNote: string;
  resources: { crew: string; materials: string; equipment: string };
};

type ResourceItem = {
  id: number;
  name: string;
  type: "Material" | "Equipment" | "Crew" | "Fuel";
  available: number;
  total: number;
  ordered: number;
  orderState: "Delivered" | "In Transit" | "Pending" | "Backorder";
  supplyFor: string;
  note: string;
};

const PROJECTS: ProjectSummary[] = [
  {
    id: 1,
    name: "Skyline Plaza Phase II",
    team: "Site Operations",
    status: "Active",
    progress: 72,
    dueIn: "14 days",
    budgetUsed: 68,
    lateByDays: 0,
    latencyNote: "Milestones aligned with baseline.",
    resources: {
      crew: "11 members",
      materials: "Concrete + Rebar",
      equipment: "2 Cranes",
    },
  },
  {
    id: 2,
    name: "Riverside Mall Expansion",
    team: "Architecture Team",
    status: "On Track",
    progress: 48,
    dueIn: "31 days",
    budgetUsed: 51,
    lateByDays: 2,
    latencyNote: "Facade panel delivery arrived two days late.",
    resources: {
      crew: "7 members",
      materials: "Facade Panels",
      equipment: "1 Lift",
    },
  },
  {
    id: 3,
    name: "Metro Station Upgrade",
    team: "Procurement & Logistics",
    status: "Risk",
    progress: 37,
    dueIn: "9 days",
    budgetUsed: 74,
    lateByDays: 4,
    latencyNote: "Cabling package delayed by customs clearance.",
    resources: {
      crew: "5 members",
      materials: "Cabling delayed",
      equipment: "Generator standby",
    },
  },
  {
    id: 4,
    name: "West Ring Road Viaduct",
    team: "Quality Assurance",
    status: "Blocked",
    progress: 25,
    dueIn: "5 days",
    budgetUsed: 63,
    lateByDays: 6,
    latencyNote: "Final inspection backlog blocked finishing sequence.",
    resources: {
      crew: "4 members",
      materials: "Inspection pending",
      equipment: "Testing Kit",
    },
  },
];

const RESOURCES: ResourceItem[] = [
  {
    id: 1,
    name: "Grade 80 Rebar",
    type: "Material",
    available: 62,
    total: 100,
    ordered: 45,
    orderState: "In Transit",
    supplyFor: "Skyline Plaza Phase II",
    note: "Reorder in 4 days",
  },
  {
    id: 2,
    name: "Tower Crane #02",
    type: "Equipment",
    available: 1,
    total: 3,
    ordered: 0,
    orderState: "Delivered",
    supplyFor: "West Ring Road Viaduct",
    note: "Available after Tue",
  },
  {
    id: 3,
    name: "Electrical Crew B",
    type: "Crew",
    available: 6,
    total: 10,
    ordered: 2,
    orderState: "Pending",
    supplyFor: "Metro Station Upgrade",
    note: "Can take 1 extra task",
  },
  {
    id: 4,
    name: "Formwork Panels",
    type: "Material",
    available: 210,
    total: 260,
    ordered: 70,
    orderState: "Backorder",
    supplyFor: "Riverside Mall Expansion",
    note: "Supplier changed ETA",
  },
  {
    id: 5,
    name: "Diesel Generator Fuel",
    type: "Fuel",
    available: 1400,
    total: 2000,
    ordered: 700,
    orderState: "In Transit",
    supplyFor: "Airport Access Corridor",
    note: "No blockers",
  },
];

const statusClass: Record<ProjectStatus, string> = {
  Active: "status-active",
  "On Track": "status-on-track",
  Risk: "status-risk",
  Blocked: "status-blocked",
};

const orderStateClass: Record<ResourceItem["orderState"], string> = {
  Delivered: "delivered",
  "In Transit": "in-transit",
  Pending: "pending",
  Backorder: "backorder",
};

function AddResourceModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "",
    type: "Material",
    available: "",
    total: "",
    ordered: "",
    orderState: "Pending",
    supplyFor: "",
    note: "",
  });

  const handleChange = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="dash-modal-overlay" onClick={onClose}>
      <section
        className="dash-modal"
        style={{ maxWidth: 520 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dash-modal-header">
          <h3>Add Resource</h3>
          <button className="dash-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "Resource name", key: "name", type: "text" },
            { label: "Available units", key: "available", type: "number" },
            { label: "Total units", key: "total", type: "number" },
            { label: "Ordered", key: "ordered", type: "number" },
            { label: "Supplies for", key: "supplyFor", type: "text" },
            { label: "Note", key: "note", type: "text" },
          ].map(({ label, key, type }) => (
            <label
              key={key}
              style={{ display: "flex", flexDirection: "column", gap: 4 }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                }}
              >
                {label}
              </span>
              <input
                type={type}
                value={(form as Record<string, string>)[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                style={{
                  height: 36,
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "0 12px",
                  fontSize: 13,
                  background: "var(--surface-2)",
                  color: "var(--text-1)",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </label>
          ))}

          {[
            {
              label: "Type",
              key: "type",
              options: ["Material", "Equipment", "Crew", "Fuel"],
            },
            {
              label: "Order state",
              key: "orderState",
              options: ["Delivered", "In Transit", "Pending", "Backorder"],
            },
          ].map(({ label, key, options }) => (
            <label
              key={key}
              style={{ display: "flex", flexDirection: "column", gap: 4 }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                }}
              >
                {label}
              </span>
              <select
                value={(form as Record<string, string>)[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                style={{
                  height: 36,
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "0 12px",
                  fontSize: 13,
                  background: "var(--surface-2)",
                  color: "var(--text-1)",
                }}
              >
                {options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
          ))}

          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
              marginTop: 4,
            }}
          >
            <button className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={onClose}>
              Add resource
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  const [query, setQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(
    PROJECTS[0]?.id ?? 0,
  );
  const [activePanel, setActivePanel] = useState<DashboardPanel>(null);
  const [showAddResource, setShowAddResource] = useState(false);

  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PROJECTS;
    return PROJECTS.filter((p) =>
      [p.name, p.team, p.status].join(" ").toLowerCase().includes(q),
    );
  }, [query]);

  const avgProgress = Math.round(
    PROJECTS.reduce((s, p) => s + p.progress, 0) / PROJECTS.length,
  );
  const lateProjects = PROJECTS.filter((p) => p.lateByDays > 0);
  const latencyPct = Math.round((lateProjects.length / PROJECTS.length) * 100);
  const availablePct = Math.round(
    (RESOURCES.reduce((s, r) => s + r.available, 0) /
      Math.max(
        1,
        RESOURCES.reduce((s, r) => s + r.total, 0),
      )) *
      100,
  );
  const topProject = [...PROJECTS].sort((a, b) => b.progress - a.progress)[0];

  const topCrews = [...TEAMS]
    .sort((a, b) => b.memberCount - a.memberCount)
    .slice(0, 4)
    .map((t) => ({
      label: t.name.split(" ").slice(0, 2).join(" "),
      value: t.memberCount,
    }));

  const maxCrew = Math.max(...topCrews.map((c) => c.value), 1);

  return (
    <div className="dashboard-shell app-shell">
      <Sidebar />

      <main className="dashboard-content app-content">
        {/* Header */}
        <header className="dashboard-header">
          <PageTitle title="Dashboard" />
          <div className="dashboard-search-wrap">
            <SearchBar value={query} onChange={setQuery} />
          </div>
        </header>

        {/* ── Metrics ── */}
        <div className="dash-metrics">
          <button
            className="dash-metric"
            onClick={() => setActivePanel("progress")}
          >
            <span className="dash-metric-label">Avg. Progress</span>
            <span className="dash-metric-value">
              {avgProgress}%<span className="trend">↑</span>
            </span>
            <span className="dash-metric-sub">Across all active projects</span>
            <span className="dash-metric-cta">View per-project → </span>
          </button>

          <button
            className="dash-metric"
            onClick={() => setActivePanel("latency")}
          >
            <span className="dash-metric-label">Project Latency</span>
            <span className="dash-metric-value">{latencyPct}%</span>
            <span className="dash-metric-sub">
              {lateProjects.length} of {PROJECTS.length} projects delayed
            </span>
            <span className="dash-metric-cta">View delay notes →</span>
          </button>

          <button
            className="dash-metric dash-metric-gauge"
            onClick={() => setActivePanel("resources")}
          >
            <span className="dash-metric-label">Available Resources</span>
            <div
              className="gauge-wrap"
              style={{ ["--gauge-val" as string]: `${availablePct}%` }}
            >
              <span className="gauge-number">{availablePct}%</span>
            </div>
            <span className="dash-metric-cta">View supply table →</span>
          </button>
        </div>

        {/* ── Middle ── */}
        <div className="dash-middle">
          {/* Projects list */}
          <div className="dash-panel">
            <div className="dash-panel-head">
              <span className="dash-panel-title">Construction Projects</span>
              <span className="dash-panel-sub">Sorted by risk</span>
            </div>
            <div className="project-rows">
              {filteredProjects.map((p) => (
                <button
                  key={p.id}
                  className={`project-row ${selectedProjectId === p.id ? "selected" : ""}`}
                  onClick={() => setSelectedProjectId(p.id)}
                >
                  <div className="project-avatar">
                    {p.name
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")}
                  </div>
                  <div className="project-row-meta">
                    <p>{p.name}</p>
                    <small>{p.team}</small>
                  </div>
                  <span
                    className={`project-row-status ${statusClass[p.status]}`}
                  >
                    {p.status}
                  </span>
                </button>
              ))}
            </div>
            <button className="dash-panel-link">Full project register →</button>
          </div>

          {/* Right: chart + mini stats */}
          <div className="dash-right">
            <div className="dash-panel dash-chart-panel">
              <div className="dash-panel-head">
                <span className="dash-panel-title">Productivity</span>
                <span className="dash-panel-sub">Weekly output trend</span>
              </div>
              <svg viewBox="0 0 480 160" className="chart-svg" aria-hidden>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity=".18" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M30 130 L100 118 L165 80 L225 60 L280 120 L340 105 L395 64 L450 42 L450 148 L30 148 Z"
                  fill="url(#grad)"
                />
                <polyline
                  points="30,130 100,118 165,80 225,60 280,120 340,105 395,64 450,42"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {[
                  [30, 130],
                  [100, 118],
                  [165, 80],
                  [225, 60],
                  [280, 120],
                  [340, 105],
                  [395, 64],
                  [450, 42],
                ].map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r="3.5" fill="#2563eb" />
                ))}
              </svg>
            </div>

            <div className="dash-mini-grid">
              <div className="dash-panel dash-mini">
                <div className="dash-mini-label">Best crew-day</div>
                <div className="dash-mini-value">Mon</div>
                <div className="dash-mini-note">Highest output per shift</div>
              </div>
              <div className="dash-panel dash-mini">
                <div className="dash-mini-label">Safety streak</div>
                <div className="dash-mini-value">21d</div>
                <div className="dash-mini-note">No incidents recorded</div>
              </div>
              <div className="dash-panel dash-mini dash-mini-project">
                <div className="dash-mini-label">Top project</div>
                <strong>{topProject?.name ?? "—"}</strong>
                <div className="dash-mini-note">{topProject?.team ?? "—"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom ── */}
        <div className="dash-bottom">
          <div className="dash-panel site-updates-panel">
            <span className="dash-panel-title">Site Updates</span>
            <small>5 field notes require attention</small>
            <div className="update-avatars">
              {PROJECTS.slice(0, 4).map((p) => (
                <div key={p.id} className="update-avatar">
                  {p.name.split(" ")[0][0]}
                </div>
              ))}
            </div>
          </div>

          <div className="dash-panel">
            <span className="dash-panel-title">Top Crews</span>
            <div className="crew-bars">
              {topCrews.map((c) => (
                <div key={c.label} className="crew-bar-row">
                  <span className="crew-bar-label">
                    {c.label.split(" ")[0].slice(0, 4)}
                  </span>
                  <div className="crew-bar-track">
                    <div
                      className="crew-bar-fill"
                      style={{
                        width: `${Math.round((c.value / maxCrew) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="crew-bar-count">{c.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dash-panel">
            <span className="dash-panel-title">Supply Watchlist</span>
            <div className="supply-tags">
              {RESOURCES.map((r) => (
                <span
                  key={r.id}
                  className={`supply-tag ${orderStateClass[r.orderState]}`}
                >
                  {r.name} · {r.orderState}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Modals ── */}
        {activePanel && (
          <div
            className="dash-modal-overlay"
            onClick={() => setActivePanel(null)}
          >
            <section
              className="dash-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dash-modal-header">
                <h3>
                  {activePanel === "progress" && "Project Progression"}
                  {activePanel === "latency" && "Delayed Projects"}
                  {activePanel === "resources" && "Resource Inventory & Orders"}
                </h3>
                <button
                  className="dash-modal-close"
                  onClick={() => setActivePanel(null)}
                >
                  ✕
                </button>
              </div>

              {activePanel === "progress" && (
                <div className="dash-detail-list">
                  {PROJECTS.map((p) => (
                    <div key={p.id} className="dash-detail-row">
                      <div>
                        <strong>{p.name}</strong>
                        <p>{p.team}</p>
                      </div>
                      <div className="detail-bar-wrap">
                        <div className="detail-bar-track">
                          <div
                            className="detail-bar-fill"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <span className="detail-bar-pct">{p.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activePanel === "latency" && (
                <div className="dash-detail-list">
                  {lateProjects.length === 0 ? (
                    <p style={{ color: "var(--text-3)", padding: "12px 0" }}>
                      No delayed projects.
                    </p>
                  ) : (
                    lateProjects.map((p) => (
                      <div key={p.id} className="dash-detail-row latency-row">
                        <div>
                          <strong>{p.name}</strong>
                          <p>{p.team}</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span className="latency-badge">
                            +{p.lateByDays}d
                          </span>
                          <p className="latency-note-text">{p.latencyNote}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activePanel === "resources" && (
                <>
                  <div className="resource-table-wrap">
                    <table className="resource-table">
                      <thead>
                        <tr>
                          <th>Resource</th>
                          <th>Type</th>
                          <th>Available</th>
                          <th>Total</th>
                          <th>Ordered</th>
                          <th>Order state</th>
                          <th>Supply for</th>
                          <th>Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {RESOURCES.map((r) => (
                          <tr key={r.id}>
                            <td
                              style={{
                                fontWeight: 600,
                                color: "var(--text-1)",
                              }}
                            >
                              {r.name}
                            </td>
                            <td>
                              <span className="res-type-badge">{r.type}</span>
                            </td>
                            <td>{r.available}</td>
                            <td>{r.total}</td>
                            <td>{r.ordered}</td>
                            <td>
                              <span
                                className={`order-state-badge ${orderStateClass[r.orderState]}`}
                              >
                                {r.orderState}
                              </span>
                            </td>
                            <td>{r.supplyFor}</td>
                            <td style={{ color: "var(--text-3)" }}>{r.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="res-add-row">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setActivePanel(null);
                        setShowAddResource(true);
                      }}
                    >
                      + Add resource
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        )}

        {showAddResource && (
          <AddResourceModal onClose={() => setShowAddResource(false)} />
        )}
      </main>
    </div>
  );
}
