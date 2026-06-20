"use client";

import Link from "next/link";
import { MapPin, Clock, Users } from "lucide-react";
import "./project_card.css";

type Project = {
  id: number;
  name: string;
  description: string;
  teamId?: number;
  cover?: string;
  status?: string;
  members?: string[];
  progress?: number;
  team?: string;
  location?: string;
  dueIn?: string;
};

const STATUS_CONFIG: Record<string, { label: string; coverClass: string; badgeClass: string }> = {
  active:    { label: "Actif",     coverClass: "cover--active",    badgeClass: "badge--active"    },
  on_track:  { label: "En cours",  coverClass: "cover--on-track",  badgeClass: "badge--on-track"  },
  risk:      { label: "À risque",  coverClass: "cover--risk",      badgeClass: "badge--risk"      },
  blocked:   { label: "Bloqué",    coverClass: "cover--blocked",   badgeClass: "badge--blocked"   },
  completed: { label: "Terminé",   coverClass: "cover--completed", badgeClass: "badge--completed" },
};

function ProjectCard({ project }: { project: Project }) {
  const statusKey = (project.status ?? "active").toLowerCase();
  const config = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG["active"];
  const progress = project.progress ?? 0;

  const initials = project.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join("");

  return (
    <article className="project-card">
      <Link
        href={`/projects/${project.id}`}
        className="project-link"
        aria-label={`Voir le projet ${project.name}`}
      >
        {/* ── Gradient banner ── */}
        <div className={`project-cover-wrap ${config.coverClass}`}>
          <span className="project-cover-initials" aria-hidden="true">{initials}</span>
        </div>

        {/* ── Body ── */}
        <div className="project-card-body">
          <div className="project-card-head">
            <span className={`project-badge ${config.badgeClass}`}>{config.label}</span>
            {project.location && (
              <span className="project-location" title={project.location}>
                <MapPin size={11} aria-hidden />
                {project.location}
              </span>
            )}
          </div>

          <h2 className="project-name">{project.name}</h2>
          <p className="project-description">{project.description}</p>

          {/* ── Progress bar ── */}
          <div className="project-progress-row" aria-label={`Progression: ${progress}%`}>
            <div className="project-progress-track">
              <div
                className="project-progress-fill"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <span className="project-progress-pct">{progress}%</span>
          </div>

          {/* ── Footer ── */}
          <div className="project-card-footer">
            {project.team && (
              <span className="project-footer-chip">
                <Users size={11} aria-hidden />
                {project.team}
              </span>
            )}
            {project.dueIn && (
              <span className="project-footer-chip">
                <Clock size={11} aria-hidden />
                {project.dueIn}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}

export default ProjectCard;
