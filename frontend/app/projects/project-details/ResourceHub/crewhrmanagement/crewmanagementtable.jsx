import React from "react";
import "./crewmanagementtable.css";

/**
 * CrewTable — HR/Crew workforce management table.
 * Renders inside the ResourceHub panel (project details → Resources → HR/Crew).
 * The outer app shell (sidebar, breadcrumb, nav) is provided by ProjectDetailsContent.
 */
export default function CrewTable() {
  return (
    <div className="crew-page-content">
      {/* ── Toolbar ────────────────────────────────────────── */}
      <div className="crew-toolbar">
        {/* Search */}
        <div className="crew-search-wrap">
          <svg className="crew-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="crew-search-input"
            placeholder="Search members..."
            type="text"
          />
        </div>

        {/* Segmented filter */}
        <div className="crew-filter-group">
          <button className="crew-filter-btn active">By Team</button>
          <button className="crew-filter-btn">By Person</button>
          <button className="crew-filter-btn">By Team Lead</button>
        </div>

        {/* Actions */}
        <div className="crew-actions">
          <button className="btn btn-ghost crew-btn-sm" aria-label="More options">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          </button>
          <button className="btn btn-primary crew-btn-sm">
            + Add Workforce
          </button>
        </div>
      </div>

      {/* ── Workforce Grid ──────────────────────────────────── */}
      <div className="crew-grid">

        {/* ── Team: CONCRETE - FORMWORKERS ── */}
        <div className="crew-team-card">
          <div className="crew-team-header">
            <div className="crew-team-header-left">
              <div className="crew-team-icon crew-team-icon--blue">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <div>
                <h3 className="crew-team-name">TEAM CONCRETE — FORMWORKERS</h3>
                <p className="crew-team-sub">8 Members Active • Area: Structural Shell</p>
              </div>
            </div>
            <div className="crew-team-kpis">
              <div className="crew-kpi">
                <span className="crew-kpi-label">Daily Performance</span>
                <span className="crew-kpi-value">45m³ poured</span>
              </div>
              <div className="crew-kpi">
                <span className="crew-kpi-label">Absence Rate</span>
                <span className="crew-kpi-value crew-kpi-value--warn">5%</span>
              </div>
            </div>
          </div>

          <div className="crew-table-wrap">
            <table className="crew-data-table">
              <thead>
                <tr>
                  <th>Member Name</th>
                  <th>Role</th>
                  <th>Working Days</th>
                  <th>Assigned Block</th>
                  <th>Individual Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Lead row */}
                <tr className="crew-row crew-row--lead">
                  <td>
                    <div className="cell-member">
                      <div className="cell-avatar cell-avatar--primary">RM</div>
                      <div>
                        <div className="cell-name">Ricardo Mendes</div>
                        <div className="cell-lead-badge">★ TEAM LEAD</div>
                      </div>
                    </div>
                  </td>
                  <td className="cell-role">Foreman</td>
                  <td>22/22</td>
                  <td>Block A, Floor 2</td>
                  <td className="cell-qty">12m²</td>
                  <td><span className="status-pill active">Present</span></td>
                </tr>
                <tr className="crew-row">
                  <td>
                    <div className="cell-member">
                      <div className="cell-avatar">JS</div>
                      <span className="cell-name">João Silva</span>
                    </div>
                  </td>
                  <td className="cell-role">Ironworker</td>
                  <td>19/22</td>
                  <td>Block A, Floor 2</td>
                  <td className="cell-qty">9m²</td>
                  <td><span className="status-pill active">Present</span></td>
                </tr>
                <tr className="crew-row">
                  <td>
                    <div className="cell-member">
                      <div className="cell-avatar">PA</div>
                      <span className="cell-name">Pedro Alves</span>
                    </div>
                  </td>
                  <td className="cell-role">Mason</td>
                  <td>21/22</td>
                  <td>Block A, Floor 1</td>
                  <td className="cell-qty">15m²</td>
                  <td><span className="status-pill inactive">Absent</span></td>
                </tr>
                <tr className="crew-row">
                  <td>
                    <div className="cell-member">
                      <div className="cell-avatar">MT</div>
                      <span className="cell-name">Miguel Teixeira</span>
                    </div>
                  </td>
                  <td className="cell-role">Ironworker</td>
                  <td>22/22</td>
                  <td>Block B, Ground</td>
                  <td className="cell-qty">11m²</td>
                  <td><span className="status-pill active">Present</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Team: MASONRY & FINISHING ── */}
        <div className="crew-team-card">
          <div className="crew-team-header">
            <div className="crew-team-header-left">
              <div className="crew-team-icon crew-team-icon--violet">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <div>
                <h3 className="crew-team-name">TEAM MASONRY &amp; FINISHING</h3>
                <p className="crew-team-sub">12 Members Active • Area: Internal Dividers</p>
              </div>
            </div>
            <div className="crew-team-kpis">
              <div className="crew-kpi">
                <span className="crew-kpi-label">Daily Performance</span>
                <span className="crew-kpi-value">120m² finished</span>
              </div>
              <div className="crew-kpi">
                <span className="crew-kpi-label">Absence Rate</span>
                <span className="crew-kpi-value">0%</span>
              </div>
            </div>
          </div>

          <div className="crew-table-wrap">
            <table className="crew-data-table">
              <tbody>
                {/* Lead row */}
                <tr className="crew-row crew-row--lead">
                  <td>
                    <div className="cell-member">
                      <div className="cell-avatar cell-avatar--primary">SF</div>
                      <div>
                        <div className="cell-name">Sara Fernandes</div>
                        <div className="cell-lead-badge">★ TEAM LEAD</div>
                      </div>
                    </div>
                  </td>
                  <td className="cell-role">Senior Mason</td>
                  <td>22/22</td>
                  <td>Block A, Floor 4</td>
                  <td className="cell-qty">28m²</td>
                  <td><span className="status-pill active">Present</span></td>
                </tr>
                <tr className="crew-row">
                  <td colSpan={6} className="crew-expand-row">
                    <button className="crew-expand-btn">
                      Show 11 more members
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
