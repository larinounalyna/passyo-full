"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import "./page.css";
import Sidebar from "@/components/sidebar/sidebar";
import PageTitle from "@/components/page_title/page_title";
import SearchBar from "@/components/search-bar/search-bar";
import { TEAMS, type Team } from "./teams-data";

/* ─── Add Member Modal ─────────────────────── */
function AddMemberModal({
  team,
  onClose,
}: {
  team: Team;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    role: "",
    department: "",
    location: "",
  });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add member — {team.name}</h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-form">
          {[
            { label: "Full name", key: "name", placeholder: "e.g. Sarah Chen" },
            {
              label: "Role / title",
              key: "role",
              placeholder: "e.g. Structural Engineer",
            },
            {
              label: "Department",
              key: "department",
              placeholder: "e.g. Design & Planning",
            },
            {
              label: "Location",
              key: "location",
              placeholder: "e.g. HQ — Floor 4",
            },
          ].map(({ label, key, placeholder }) => (
            <label key={key} className="form-label">
              <span className="form-label-text">{label}</span>
              <input
                className="form-input"
                placeholder={placeholder}
                value={(form as Record<string, string>)[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            </label>
          ))}
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={onClose}>
              Add member
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Create Team Modal ────────────────────── */
function CreateTeamModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "",
    focus: "",
    lead: "",
    department: "",
    location: "",
    status: "Active",
  });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create team</h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-form">
          {[
            {
              label: "Team name",
              key: "name",
              placeholder: "e.g. MEP Division",
            },
            {
              label: "Focus / description",
              key: "focus",
              placeholder: "What does this team handle?",
            },
            { label: "Team lead", key: "lead", placeholder: "e.g. Amine L." },
            {
              label: "Department",
              key: "department",
              placeholder: "e.g. Operations",
            },
            {
              label: "Location",
              key: "location",
              placeholder: "e.g. West Site Office",
            },
          ].map(({ label, key, placeholder }) => (
            <label key={key} className="form-label">
              <span className="form-label-text">{label}</span>
              <input
                className="form-input"
                placeholder={placeholder}
                value={(form as Record<string, string>)[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            </label>
          ))}
          <label className="form-label">
            <span className="form-label-text">Status</span>
            <select
              className="form-select"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              <option>Active</option>
              <option>Planning</option>
              <option>On Hold</option>
            </select>
          </label>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={onClose}>
              Create team
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Team Card ────────────────────────────── */
function TeamCard({
  team,
  onAddMember,
}: {
  team: Team;
  onAddMember: (t: Team) => void;
}) {
  const statusSlug = team.status.toLowerCase().replace(" ", "-");

  return (
    <article className="team-card">
      <div className="team-card-top">
        <h2>{team.name}</h2>
        <span className={`team-status ${statusSlug}`}>{team.status}</span>
      </div>

      <p className="team-focus">{team.focus}</p>

      <div className="team-meta-row">
        <div className="team-meta-item">
          <span className="team-meta-label">Projects</span>
          <span className="team-meta-value">{team.projectCount}</span>
        </div>
        <div className="team-meta-item">
          <span className="team-meta-label">Members</span>
          <span className="team-meta-value">{team.memberCount}</span>
        </div>
        <div className="team-meta-item">
          <span className="team-meta-label">Last update</span>
          <span className="team-meta-value" style={{ fontSize: 13 }}>
            {team.lastUpdate}
          </span>
        </div>
      </div>

      <div className="team-card-footer">
        <div className="member-stack">
          {team.members.map((m, i) => (
            <span key={`${team.id}-${m}-${i}`} className="member-chip">
              {m}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-ghost"
            style={{ height: 30, fontSize: 12 }}
            onClick={() => onAddMember(team)}
          >
            + Member
          </button>
          <Link
            href={`/teams/${team.id}`}
            className="btn btn-ghost"
            style={{ height: 30, fontSize: 12 }}
          >
            Open →
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ─── Page ─────────────────────────────────── */
export default function TeamsPage() {
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [addMemberTarget, setAddMemberTarget] = useState<Team | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TEAMS;
    return TEAMS.filter((t) =>
      [t.name, t.focus, t.status].join(" ").toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="teams-page-shell app-shell">
      <Sidebar />

      <main className="teams-content app-content">
        <div className="page-header-block">
          <PageTitle title="Teams" />
          <div className="teams-actions">
            <SearchBar value={query} onChange={setQuery} />
            <button
              className="btn btn-primary"
              onClick={() => setShowCreate(true)}
            >
              + Create Team
            </button>
          </div>
        </div>

        {filtered.length > 0 ? (
          <section className="teams-grid">
            {filtered.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onAddMember={setAddMemberTarget}
              />
            ))}
          </section>
        ) : (
          <div className="teams-empty">
            <h2>No teams found</h2>
            <p>Try a different keyword or clear the filter.</p>
          </div>
        )}
      </main>

      {showCreate && <CreateTeamModal onClose={() => setShowCreate(false)} />}
      {addMemberTarget && (
        <AddMemberModal
          team={addMemberTarget}
          onClose={() => setAddMemberTarget(null)}
        />
      )}
    </div>
  );
}
