"use client";

import "./SituationsPanel.css";
import { Fragment } from "react";
import { AlertTriangle, CalendarDays, ChevronDown, Clock3, PlusCircle } from "lucide-react";

const recentSituations = [
  { id: "N14", month: "Juin 2026", amount: "12 450 000,00 DA", status: "En cours", tone: "pending", active: true },
  { id: "N13", month: "Mai 2026", amount: "8 215 300,00 DA", status: "Validé", tone: "validated" },
  { id: "N12", month: "Avril 2026", amount: "15 000 000,00 DA", status: "Payé", tone: "paid" },
];

const summaryCards = [
  { label: "Montant Cumulé H.T", value: "145 230", extra: "400,00 DA", tone: "blue" },
  { label: "Montant de la Période", value: "12 450", extra: "000,00 DA" },
  { label: "Avancement Global", value: "62%", progress: 62 },
  { label: "Dépassements Constatés", value: "3 Postes", tone: "danger" },
];

const situationRows = [
  {
    section: "SECTION A : TRAVAUX DU CONTRAT INITIAL (DQE)",
    rows: [
      { ref: "1.1", designation: "Terrassement en pleine masse", price: "1", unit: "m3", planned: "15 000", period: "2500", cumulative: "12 400", percent: "82%" },
      { ref: "1.2", designation: "Béton de propreté dosé à 150kg/m3", price: "1", unit: "m3", planned: "450", period: "45", cumulative: "495", percent: "110%", alert: true },
      { ref: "1.3", designation: "Location Grue Mobile 40T", price: "8", unit: "Jour", planned: "22", period: "12", cumulative: "18", percent: "81%" },
    ],
  },
  {
    section: "SECTION B : TRAVAUX SUR AVENANTS",
    rows: [
      { ref: "A-1", designation: "Suppléments ferraillage radier", price: "3", unit: "kg", planned: "5 000", period: "1200", cumulative: "3 200", percent: "64%" },
    ],
  },
];

export default function SituationsPanel() {
  return (
    <div className="sit-page">
      <aside className="sit-history">
        <button className="sit-new-btn">
          <PlusCircle size={17} />
          Nouvelle Situation
        </button>

        <div className="sit-history-title">Historique récent</div>
        <div className="sit-history-list">
          {recentSituations.map((situation) => (
            <button
              key={situation.id}
              className={`sit-history-card ${situation.active ? "active" : ""}`}
            >
              <div className="sit-history-card-top">
                <span>Situation {situation.id}</span>
                <span className={`sit-status ${situation.tone}`}>{situation.status}</span>
              </div>
              <span className="sit-history-month">{situation.month}</span>
              <strong>{situation.amount}</strong>
              {situation.active && (
                <span className="sit-edited">
                  <Clock3 size={11} />
                  Modifié il y a 2h
                </span>
              )}
            </button>
          ))}
        </div>
      </aside>

      <main className="sit-workspace">
        <header className="sit-header">
          <div>
            <h2>Gestion des Situations</h2>
            <p>Projet : Extension Terminal Aéroportuaire - Alger</p>
          </div>
          <div className="sit-period-card">
            <CalendarDays size={18} />
            <div>
              <span>Période de facturation</span>
              <strong>01/06/2026 au 30/06/2026</strong>
            </div>
          </div>
        </header>

        <section className="sit-summary-grid">
          {summaryCards.map((card) => (
            <article key={card.label} className={`sit-summary-card ${card.tone ?? ""}`}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              {card.extra && <strong>{card.extra}</strong>}
              {card.progress && (
                <div className="sit-progress">
                  <span style={{ width: `${card.progress}%` }} />
                </div>
              )}
            </article>
          ))}
        </section>

        <section className="sit-table-card">
          <div className="sit-table-wrap">
            <table className="sit-table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Désignation des travaux</th>
                  <th>Mode</th>
                  <th>Prix (DA)</th>
                  <th>Unité</th>
                  <th>Qté prév.</th>
                  <th>Qté période</th>
                  <th>Cumul</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {situationRows.map((section) => (
                  <Fragment key={section.section}>
                    <tr className="sit-section-row">
                      <td colSpan={9}>{section.section}</td>
                    </tr>
                    {section.rows.map((row) => (
                      <tr key={row.ref} className={row.alert ? "overrun" : ""}>
                        <td>{row.ref}</td>
                        <td>
                          <div className="sit-designation">
                            <span>{row.designation}</span>
                            {row.alert && <AlertTriangle size={14} />}
                          </div>
                        </td>
                        <td>
                          <button className="sit-mode-btn" aria-label="Choisir le mode">
                            <ChevronDown size={14} />
                          </button>
                        </td>
                        <td>{row.price}</td>
                        <td>{row.unit}</td>
                        <td>{row.planned}</td>
                        <td><span className="sit-period-qty">{row.period}</span></td>
                        <td>{row.cumulative}</td>
                        <td className={row.alert ? "danger" : ""}>{row.percent}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sit-total-row">Total net période (DA)</div>
        </section>

        <section className="sit-observations">
          <h3>Observations & Justifications</h3>
          <textarea
            placeholder="Ajouter une note pour le maître de l'ouvrage concernant les dépassements ou les écarts constatés..."
          />
        </section>
      </main>
    </div>
  );
}
