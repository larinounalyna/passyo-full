"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useProject } from "@/lib/context/ProjectContext";
import { apiRequest } from "@/lib/api/client";
import { toast } from "sonner";
import { X, Plus, CheckCircle, Trash2, AlertTriangle } from "lucide-react";
import "./SuiviTab.css";

// ─── Types ────────────────────────────────────────────────

interface Attachment {
  id: number;
  project_id: number;
  task_id?: number;
  title: string;
  quantity: number;
  unit: string;
  conductor_name: string;
  is_validated: boolean;
  validated_by?: number;
  sketch_url?: string;
  created_at?: string;
}

// ─── Helpers ──────────────────────────────────────────────

const WEEKDAYS = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

function calcDurations(
  startDate?: string,
  endDate?: string,
  workingDaysStr?: string,
) {
  if (!startDate || !endDate) return { brut: null, net: null };

  const start = new Date(startDate);
  const end = new Date(endDate);

  const totalDays = Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 86400000),
  );

  const workDays = workingDaysStr
    ? workingDaysStr.split(",").map((d) => d.trim())
    : [];

  const offDays = WEEKDAYS.filter((d) => !workDays.includes(d));

  let weekendCount = 0;

  const cur = new Date(start);

  while (cur <= end) {
    const dayName = WEEKDAYS[cur.getDay()];

    if (offDays.includes(dayName)) weekendCount++;

    cur.setDate(cur.getDate() + 1);
  }

  return {
    brut: totalDays,
    net: totalDays - weekendCount,
  };
}

function fmt(n?: number | null) {
  return n !== null && n !== undefined ? `${n}` : "—";
}

// ─── General Info ─────────────────────────────────────────

function GeneralInfoPanel() {
  const { project } = useProject();

  if (!project) return null;

  const p: any = project;

  const { brut, net } = calcDurations(p.start_date, p.end_date, p.working_days);

  const workingDays = p.working_days
    ? p.working_days.split(",").map((d: string) => d.trim())
    : [];

  return (
    <div className="suivi-card">
      <div className="suivi-card-header">
        <div className="suivi-card-title"> Informations du Projet</div>
      </div>

      {brut !== null && (
        <div className="suivi-duration-row">
          <div className="duration-badge gross">
            <span>{brut}j</span>
            <label>Durée Brute</label>
          </div>

          <div className="duration-badge net">
            <span>{net}j</span>
            <label>Durée Nette</label>
          </div>

          <div className="duration-badge warning">
            <span>{fmt(p.concrete_curing_duration)}j</span>
            <label>Cure Béton</label>
          </div>
        </div>
      )}

      <div className="suivi-info-grid">
        {[
          ["Maître d'Œuvre", p.maitre_oeuvre],
          ["Maître d'Ouvrage", p.maitre_ouvrage],
          ["Entreprise", p.entreprise_realisation],
          ["Système Constructif", p.construction_system],
          ["Blocs", p.block_number],
          ["Étages", p.num_floors],
          ["Début", p.start_date],
          ["Fin", p.end_date],
          [
            "Heures / Jour",
            p.working_hours_per_day ? `${p.working_hours_per_day}h` : null,
          ],
          ["Système Travail", p.work_shifts],
          ["Localisation", p.location],
        ].map(([label, value]) => (
          <div key={label} className="suivi-info-item">
            <span className="suivi-info-label">{label}</span>

            <span className="suivi-info-value">{value ?? "—"}</span>
          </div>
        ))}
      </div>

      {workingDays.length > 0 && (
        <div>
          <p className="suivi-info-label">Jours de Travail</p>

          <div className="working-days-row">
            {WEEKDAYS.map((d) => (
              <span
                key={d}
                className={`day-pill ${
                  workingDays.includes(d) ? "active" : "inactive"
                }`}
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="suivi-modal-overlay" onClick={onClose}>
      <div className="suivi-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="suivi-modal-header">
          <h3>{title}</h3>

          <button className="suivi-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="suivi-modal-body">{children}</div>

        <div className="suivi-modal-footer">{footer}</div>
      </div>
    </div>
  );
}

// ─── Documents ────────────────────────────────────────────

const activeDoc = "attachments";

function DocumentsPanel() {
  const { project } = useProject();

  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const [loading, setLoading] = useState(false);

  const [showAttModal, setShowAttModal] = useState(false);

  const [attForm, setAttForm] = useState({
    title: "",
    quantity: "",
    unit: "m²",
    conductor_name: "",
    sketch_url: "",
  });

  const pid = project?.id;

  const fetchAll = useCallback(async () => {
    if (!pid) return;

    setLoading(true);

    try {
      const data = await apiRequest<Attachment[]>(`/suivi/attachments/${pid}`);

      setAttachments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [pid]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const submitAttachment = async () => {
    if (!pid) return;

    try {
      await apiRequest("/suivi/attachments", {
        method: "POST",
        body: {
          ...attForm,
          quantity: parseFloat(attForm.quantity),
          project_id: pid,
        },
      });

      toast.success("Attachement créé");

      setShowAttModal(false);

      fetchAll();
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  // ─── Attachment actions ───────────────────────────────────

  const validateAtt = async (id: number) => {
    try {
      await apiRequest(`/suivi/attachments/${id}/validate`, {
        method: "PATCH",
      });

      toast.success("Attachement validé");

      fetchAll();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const deleteAtt = async (id: number) => {
    try {
      await apiRequest(`/suivi/attachments/${id}`, {
        method: "DELETE",
      });

      toast.success("Supprimé");

      fetchAll();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const inputCls = "form-input w-full";

  return (
    <div className="suivi-card">
      <div className="suivi-card-header">
        <div className="suivi-card-title">Documents de Suivi de Chantier</div>

        <button className="suivi-add-btn" onClick={() => setShowAttModal(true)}>
          <Plus size={14} />
          Attachement
        </button>
      </div>

      <div className="doc-tabs">
        <button className="doc-tab-btn active">Attachements</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div
            className="
w-8 h-8
border-4
border-blue-500
border-t-transparent
rounded-full
animate-spin
"
          />
        </div>
      ) : (
        <div className="suivi-list">
          {attachments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📐</div>

              <p>Aucun attachement enregistré</p>

              <p
                style={{
                  fontSize: "0.75rem",
                  marginTop: "0.25rem",
                }}
              >
                Enregistrez les quantités physiques constatées sur le terrain
                avant de les couvrir.
              </p>
            </div>
          ) : (
            attachments.map((att) => (
              <div key={att.id} className="suivi-list-item">
                <div className="item-info">
                  <div className="item-title">{att.title}</div>

                  <div className="item-meta">
                    <span>
                      {att.quantity} {att.unit}
                    </span>

                    <span> {att.conductor_name}</span>

                    {att.created_at && (
                      <span>
                        🗓{" "}
                        {new Date(att.created_at).toLocaleDateString("fr-DZ")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="item-actions">
                  <span
                    className={`badge ${
                      att.is_validated ? "validated" : "pending"
                    }`}
                  >
                    {att.is_validated ? "✓ Validé" : " En attente"}
                  </span>

                  {!att.is_validated && (
                    <button
                      className="icon-btn validate"
                      onClick={() => validateAtt(att.id)}
                    >
                      <CheckCircle size={13} />
                      Valider
                    </button>
                  )}

                  <button
                    className="icon-btn delete"
                    onClick={() => deleteAtt(att.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Attachment Modal */}

      {showAttModal && (
        <Modal
          title="Nouvel Attachement"
          onClose={() => setShowAttModal(false)}
          footer={
            <>
              <button
                className="btn-cancel"
                onClick={() => setShowAttModal(false)}
              >
                Annuler
              </button>

              <button className="btn-submit blue" onClick={submitAttachment}>
                Enregistrer
              </button>
            </>
          }
        >
          <div className="form-group">
            <label>Titre / Description de l ouvrage</label>

            <input
              className={inputCls}
              placeholder="ex. Ferraillage poteaux R+1"
              value={attForm.title}
              onChange={(e) =>
                setAttForm((p) => ({
                  ...p,
                  title: e.target.value,
                }))
              }
            />
          </div>

          <div
            style={{
              display: "grid",

              gridTemplateColumns: "1fr 1fr",

              gap: "1rem",
            }}
          >
            <div className="form-group">
              <label>Quantité</label>

              <input
                type="number"
                className={inputCls}
                placeholder="ex. 120"
                value={attForm.quantity}
                onChange={(e) =>
                  setAttForm((p) => ({
                    ...p,
                    quantity: e.target.value,
                  }))
                }
              />
            </div>

            <div className="form-group">
              <label>Unité</label>

              <select
                className={inputCls}
                value={attForm.unit}
                onChange={(e) =>
                  setAttForm((p) => ({
                    ...p,
                    unit: e.target.value,
                  }))
                }
              >
                {["m²", "m³", "ml", "kg", "T", "U", "Forfait"].map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Conducteur de Travaux</label>

            <input
              className={inputCls}
              placeholder="Nom du responsable"
              value={attForm.conductor_name}
              onChange={(e) =>
                setAttForm((p) => ({
                  ...p,
                  conductor_name: e.target.value,
                }))
              }
            />
          </div>

          <div className="form-group">
            <label>URL du Croquis (optionnel)</label>

            <input
              className={inputCls}
              placeholder="https://…"
              value={attForm.sketch_url}
              onChange={(e) =>
                setAttForm((p) => ({
                  ...p,
                  sketch_url: e.target.value,
                }))
              }
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
// ─── Yield Warning Panel ──────────────────────────────────

function YieldWarningPanel() {
  const { project } = useProject();

  const [warnings, setWarnings] = useState<any[]>([]);

  useEffect(() => {
    if (!project?.id) return;

    apiRequest<any[]>(`/tasks/project/${project.id}`)
      .then((data) => {
        const invalid = data.filter((t) => {
          if (!t.start_date || !t.end_date) return false;

          const duration = Math.round(
            (new Date(t.end_date).getTime() -
              new Date(t.start_date).getTime()) /
              86400000,
          );

          return duration < 0;
        });

        setWarnings(invalid);
      })

      .catch(console.error);
  }, [project?.id]);

  if (warnings.length === 0) return null;

  return (
    <div className="suivi-card">
      <div className="suivi-card-header">
        <div className="suivi-card-title">⚠️ Avertissements de Planning</div>
      </div>

      {warnings.map((t) => (
        <div key={t.id} className="yield-warning">
          <div className="warn-icon">
            <AlertTriangle size={24} />
          </div>

          <div className="warn-text">
            <div className="warn-title">
              Tâche « {t.title} » — durée invalide
            </div>

            <div className="warn-desc">
              La date de fin est antérieure à la date de début. Corrigez les
              dates dans l'onglet Schedule.
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────

export default function SuiviTab() {
  return (
    <div className="suivi-tab">
      <GeneralInfoPanel />

      <YieldWarningPanel />

      <DocumentsPanel />
    </div>
  );
}
