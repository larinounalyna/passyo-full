"use client";

import { useState, useEffect, useCallback } from "react";
import "./AttachmentsPanel.css";
import { useProject } from "@/lib/context/ProjectContext";
import { apiRequest } from "@/lib/api/client";
import { toast } from "sonner";
import { Plus, CheckCircle, Trash2, X, Paperclip } from "lucide-react";

interface Attachment {
  id: number;
  project_id: number;
  title: string;
  quantity: number;
  unit: string;
  conductor_name: string;
  is_validated: boolean;
  sketch_url?: string;
  created_at: string;
}

const UNITS = ["m²", "m³", "ml", "kg", "T", "U", "Forfait"];

const EMPTY_FORM = { title: "", quantity: "", unit: "m²", conductor_name: "", sketch_url: "" };

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("fr-DZ", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return value;
  }
}

export default function AttachmentsPanel() {
  const { project } = useProject();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchAttachments = useCallback(async () => {
    if (!project) return;
    try {
      setLoading(true);
      const data = await apiRequest<Attachment[]>(`/suivi/attachments/${project.id}`);
      setAttachments(data);
    } catch (err) {
      console.error("Failed to fetch attachments:", err);
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    void Promise.resolve().then(fetchAttachments);
  }, [fetchAttachments]);

  const handleCreate = async () => {
    if (!project || !form.title.trim() || !form.quantity) {
      toast.error("Veuillez renseigner au minimum la tâche et la quantité.");
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("/suivi/attachments", {
        method: "POST",
        body: {
          project_id: project.id,
          title: form.title.trim(),
          quantity: parseFloat(form.quantity),
          unit: form.unit,
          conductor_name: form.conductor_name.trim(),
          sketch_url: form.sketch_url.trim() || undefined,
        },
      });
      toast.success("Attachement créé avec succès.");
      setForm(EMPTY_FORM);
      setShowModal(false);
      fetchAttachments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la création de l'attachement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidate = async (id: number) => {
    try {
      await apiRequest(`/suivi/attachments/${id}/validate`, { method: "PATCH" });
      toast.success("Attachement validé.");
      setAttachments(prev => prev.map(a => (a.id === id ? { ...a, is_validated: true } : a)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la validation.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiRequest(`/suivi/attachments/${id}`, { method: "DELETE" });
      toast.success("Attachement supprimé.");
      setAttachments(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la suppression.");
    }
  };

  const validatedCount = attachments.filter(a => a.is_validated).length;
  const pendingCount = attachments.length - validatedCount;
  const recent = attachments.slice(0, 4);

  return (
    <div className="attp-page">
      <div className="attp-header">
        <div>
          <div className="attp-title-row">
            <h2>Gestion des Attachements</h2>
          </div>
          <p className="attp-subtitle">Suivez les quantités exécutées sur le terrain avant facturation.</p>
        </div>
        <button className="attp-create-btn" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Nouvel Attachement
        </button>
      </div>

      <div className="attp-grid">
        <div className="attp-main">
          <div className="attp-table-card">
            <div className="attp-table-card-head">
              <span><Paperclip size={15} /> Détail des travaux constatés</span>
              <span className="attp-count-pill">{attachments.length} entrée{attachments.length > 1 ? "s" : ""}</span>
            </div>

            {loading ? (
              <div className="attp-empty">Chargement…</div>
            ) : attachments.length === 0 ? (
              <div className="attp-empty">
                <div className="attp-empty-icon"><Paperclip size={22} /></div>
                <p>Aucun attachement pour le moment</p>
                <p>Créez le premier attachement pour suivre les quantités exécutées.</p>
              </div>
            ) : (
              <table className="attp-table">
                <thead>
                  <tr>
                    <th>Tâche</th>
                    <th>Conducteur</th>
                    <th>Quantité</th>
                    <th>Date</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attachments.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div className="attp-task-name">{a.title}</div>
                      </td>
                      <td>{a.conductor_name || "—"}</td>
                      <td className="attp-qty">{a.quantity.toLocaleString("fr-DZ")} {a.unit}</td>
                      <td>{formatDate(a.created_at)}</td>
                      <td>
                        <span className={`attp-status ${a.is_validated ? "validated" : "pending"}`}>
                          {a.is_validated ? "Validé" : "En attente"}
                        </span>
                      </td>
                      <td>
                        <div className="attp-row-actions">
                          {!a.is_validated && (
                            <button className="attp-action-btn validate" onClick={() => handleValidate(a.id)}>
                              <CheckCircle size={13} /> Valider
                            </button>
                          )}
                          <button className="attp-action-btn delete" onClick={() => handleDelete(a.id)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <aside className="attp-side">
          <div className="attp-stat-card">
            <h4>Aperçu</h4>
            <div className="attp-stat-row">
              <div className="attp-stat">
                <span className="val">{attachments.length}</span>
                <span className="lbl">Total</span>
              </div>
              <div className="attp-stat success">
                <span className="val">{validatedCount}</span>
                <span className="lbl">Validés</span>
              </div>
              <div className="attp-stat pending">
                <span className="val">{pendingCount}</span>
                <span className="lbl">En attente</span>
              </div>
            </div>
          </div>

          <div className="attp-recent-card">
            <h4>Historique Récent</h4>
            {recent.length === 0 ? (
              <p className="attp-recent-empty">Aucun historique pour l&apos;instant.</p>
            ) : (
              recent.map(a => (
                <div className="attp-recent-item" key={a.id}>
                  <div>
                    <p className="title">{a.title}</p>
                    <p className="date">{formatDate(a.created_at)}</p>
                  </div>
                  <span className={`attp-status ${a.is_validated ? "validated" : "pending"}`}>
                    {a.is_validated ? "Validé" : "En attente"}
                  </span>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      {showModal && (
        <div className="attp-modal-overlay" onClick={() => !submitting && setShowModal(false)}>
          <div className="attp-modal-box" onClick={e => e.stopPropagation()}>
            <div className="attp-modal-header">
              <h3>Nouvel Attachement</h3>
              <button className="attp-modal-close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="attp-modal-body">
              <div className="attp-field">
                <label>Tâche / Libellé</label>
                <input
                  type="text"
                  placeholder="ex. Ferraillage poteaux R+1"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="attp-field-row">
                <div className="attp-field">
                  <label>Quantité</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: e.target.value })}
                  />
                </div>
                <div className="attp-field">
                  <label>Unité</label>
                  <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="attp-field">
                <label>Conducteur de travaux</label>
                <input
                  type="text"
                  placeholder="Nom du conducteur"
                  value={form.conductor_name}
                  onChange={e => setForm({ ...form, conductor_name: e.target.value })}
                />
              </div>
              <div className="attp-field">
                <label>Croquis / Référence (optionnel)</label>
                <input
                  type="text"
                  placeholder="URL ou référence du croquis"
                  value={form.sketch_url}
                  onChange={e => setForm({ ...form, sketch_url: e.target.value })}
                />
              </div>
            </div>
            <div className="attp-modal-footer">
              <button className="attp-btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="attp-btn-submit" onClick={handleCreate} disabled={submitting}>
                {submitting ? "Création…" : "Créer l'attachement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
