"use client";

import { useState, useEffect, useCallback } from "react";
import "./AvenantsPanel.css";
import { useProject } from "@/lib/context/ProjectContext";
import { apiRequest } from "@/lib/api/client";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, CalendarClock, Trash2, FileSignature } from "lucide-react";

interface Avenant {
  id: number;
  project_id: number;
  title: string;
  description: string;
  price_impact: number;
  planning_impact: number;
  signatures?: string;
  created_at: string;
}

const EMPTY_FORM = { title: "", description: "", price_impact: "", planning_impact: "", signatures: "" };

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("fr-DZ", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return value;
  }
}

export default function AvenantsPanel() {
  const { project } = useProject();
  const [avenants, setAvenants] = useState<Avenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchAvenants = useCallback(async () => {
    if (!project) return;
    try {
      setLoading(true);
      const data = await apiRequest<Avenant[]>(`/suivi/avenants/${project.id}`);
      setAvenants(data.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)));
    } catch (err) {
      console.error("Failed to fetch avenants:", err);
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    void Promise.resolve().then(fetchAvenants);
  }, [fetchAvenants]);

  const handleCreate = async () => {
    if (!project || !form.title.trim()) {
      toast.error("Veuillez renseigner au minimum le titre de l'avenant.");
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("/suivi/avenants", {
        method: "POST",
        body: {
          project_id: project.id,
          title: form.title.trim(),
          description: form.description.trim(),
          price_impact: form.price_impact ? parseFloat(form.price_impact) : 0,
          planning_impact: form.planning_impact ? parseInt(form.planning_impact, 10) : 0,
          signatures: form.signatures.trim(),
        },
      });
      toast.success("Avenant enregistré avec succès.");
      setForm(EMPTY_FORM);
      fetchAvenants();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'enregistrement de l'avenant.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiRequest(`/suivi/avenants/${id}`, { method: "DELETE" });
      toast.success("Avenant supprimé.");
      setAvenants(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la suppression.");
    }
  };

  return (
    <div className="avp-page">
      <div className="avp-header">
        <div>
          <div className="avp-title-row">
            <h2>Historique des Avenants</h2>
          </div>
          <p className="avp-subtitle">Modifications contractuelles et leurs impacts sur le budget et le planning.</p>
        </div>
      </div>

      <div className="avp-grid">
        <div className="avp-timeline">
          {loading ? (
            <div className="avp-empty">Chargement…</div>
          ) : (
            <>
              {avenants.length === 0 && (
                <div className="avp-empty">
                  <div className="avp-empty-icon"><FileSignature size={26} /></div>
                  <p>Aucun avenant enregistré</p>
                  <p>Utilisez le formulaire pour ajouter le premier avenant du projet.</p>
                </div>
              )}

              {avenants.map((av, idx) => (
                <div className="avp-timeline-item" key={av.id}>
                  <div className={`avp-version-dot ${idx === 0 ? "active" : ""}`}>
                    V{avenants.length - idx}
                  </div>
                  <div className={`avp-card ${idx === 0 ? "active" : ""}`}>
                    <div className="avp-card-top">
                      <div>
                        <div className="avp-card-title-row">
                          <h3>{av.title}</h3>
                          {idx === 0 && <span className="avp-pill active">Actif</span>}
                        </div>
                        <p className="avp-card-meta">
                          {formatDate(av.created_at)}
                          {av.signatures ? ` • Signé par ${av.signatures}` : ""}
                        </p>
                      </div>
                      <div className="avp-impact">
                        <span className="avp-impact-label">Impact Budget</span>
                        <span className={`avp-impact-value ${av.price_impact >= 0 ? "pos" : "neg"}`}>
                          {av.price_impact >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {av.price_impact >= 0 ? "+" : ""}{av.price_impact.toLocaleString("fr-DZ")} DZD
                        </span>
                      </div>
                    </div>

                    {av.description && <p className="avp-card-desc">{av.description}</p>}

                    <div className="avp-card-bottom">
                      <span className="avp-tag">
                        <CalendarClock size={13} />
                        {av.planning_impact >= 0 ? "+" : ""}{av.planning_impact} jour{Math.abs(av.planning_impact) > 1 ? "s" : ""}
                      </span>
                      <button className="avp-delete-btn" onClick={() => handleDelete(av.id)} title="Supprimer">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Base contract — origin of the amendment chain */}
              <div className="avp-timeline-item">
                <div className="avp-version-dot final">V0</div>
                <div className="avp-card final">
                  <div className="avp-card-top">
                    <div>
                      <div className="avp-card-title-row">
                        <h3>Contrat Initial</h3>
                      </div>
                      <p className="avp-card-meta">Marché de base — {project?.name ?? "Projet"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <aside className="avp-form-card">
          <div className="avp-form-head">
            <div className="avp-form-icon"><FileSignature size={20} /></div>
            <h3>Nouvel Avenant</h3>
          </div>
          <div className="avp-form-body">
            <label>
              Titre de la modification
              <input
                type="text"
                placeholder="ex. Extension de scope — Zone B"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label>
              Description détaillée
              <textarea
                rows={3}
                placeholder="Détail du changement par rapport au contrat initial…"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <div className="avp-form-row">
              <label>
                Impact Financier (DZD)
                <input
                  type="number"
                  placeholder="+ ou −"
                  value={form.price_impact}
                  onChange={e => setForm({ ...form, price_impact: e.target.value })}
                />
              </label>
              <label>
                Impact Calendaire (jours)
                <input
                  type="number"
                  placeholder="+ ou −"
                  value={form.planning_impact}
                  onChange={e => setForm({ ...form, planning_impact: e.target.value })}
                />
              </label>
            </div>
            <label>
              Signatures
              <input
                type="text"
                placeholder="Architecte, MOA, Entreprise"
                value={form.signatures}
                onChange={e => setForm({ ...form, signatures: e.target.value })}
              />
            </label>
            <button className="avp-submit-btn" onClick={handleCreate} disabled={submitting}>
              <FileSignature size={16} />
              {submitting ? "Enregistrement…" : "Enregistrer l'avenant"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
