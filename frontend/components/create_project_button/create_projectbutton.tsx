"use client";
import { useState } from "react";
import { toast } from "sonner";
import { TEAMS } from "@/lib/mock/data";
import "./create_projectbutton.css";

const ALGERIAN_WILAYAS = ["Adrar","Chlef","Laghouat","Oum El Bouaghi","Batna","Béjaïa","Biskra","Béchar","Blida","Bouira","Tamanrasset","Tébessa","Tlemcen","Tiaret","Tizi Ouzou","Alger","Djelfa","Jijel","Sétif","Saïda","Skikda","Sidi Bel Abbès","Annaba","Guelma","Constantine","Médéa","Mostaganem","M'Sila","Mascara","Ouargla","Oran","El Bayadh","Illizi","Bordj Bou Arréridj","Boumerdès","El Tarf","Tindouf","Tissemsilt","El Oued","Khenchela","Souk Ahras","Tipaza","Mila","Aïn Defla","Naâma","Aïn Témouchent","Ghardaïa","Relizane"];

const WEEKDAYS = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
const FULL_WEEKDAYS = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const STEPS = ["Informations Générales","Système Constructif","Calendrier & Timing"];
const CONSTRUCTION_SYSTEMS = ["Structure en Béton Armé","Structure Métallique","Structure Mixte"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="passyo-stepper">
      {STEPS.map((label, i) => (
        <div key={i} className="passyo-step-item">
          <div className="passyo-step-col">
            <div className={`passyo-step-dot ${i < current ? "done" : i === current ? "active" : "idle"}`}>
              {i < current ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> : i + 1}
            </div>
            <span className={`passyo-step-label ${i === current ? "active" : "idle"}`}>{label}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`passyo-step-line ${i < current ? "done" : "idle"}`}/>}
        </div>
      ))}
    </div>
  );
}

function SectionCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="passyo-section-card">
      <div className="passyo-section-head">
        <span className="material-symbols-outlined passyo-section-icon">{icon}</span>
        <h3 className="passyo-section-title">{title}</h3>
      </div>
      <div className="passyo-section-body">{children}</div>
    </div>
  );
}

export default function CreateProjectButton({ onCreated }: { onCreated?: () => void } = {}) {
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "", description: "", team_id: "", location: "",
    maitre_oeuvre: "", maitre_ouvrage: "", entreprise_realisation: "",
    construction_system: "", block_number: "", num_floors: "",
    start_date: "", end_date: "", working_days: [] as string[],
    working_hours_per_day: "8", work_shifts: "Équipe unique",
    concrete_curing_duration: "28", project_documents: "",
  });

  const set = (key: string, val: string) => setFormData(prev => ({ ...prev, [key]: val }));
  const toggleDay = (day: string) => setFormData(prev => ({
    ...prev, working_days: prev.working_days.includes(day)
      ? prev.working_days.filter(d => d !== day)
      : [...prev.working_days, day],
  }));
  const closeReset = () => { setShowForm(false); setStep(0); };
  const canNext = () => { if (step === 0) return formData.name.trim().length > 0; if (step === 1) return formData.construction_system.length > 0; return true; };
  const durationDays = formData.start_date && formData.end_date ? Math.max(0, Math.round((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / 86400000)) : null;

  const handleSubmit = async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 600)); // simulate async
    toast.success("Projet créé avec succès !");
    closeReset();
    onCreated?.();
    setIsLoading(false);
  };

  const inputCls = "passyo-input";
  const labelCls = "passyo-label";

  return (
    <>
      <button className="button_ create-project-trigger" onClick={() => setShowForm(true)}>+ Créer un Projet</button>
      {showForm && (
        <div className="passyo-overlay">
          <div className="passyo-modal">
            <div className="passyo-modal-header">
              <div>
                <h2 className="passyo-modal-title">Créer un Nouveau Projet</h2>
                <p className="passyo-modal-subtitle">Étape {step + 1} sur {STEPS.length} — {STEPS[step]}</p>
              </div>
              <button onClick={closeReset} className="passyo-close-btn" aria-label="Fermer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="passyo-modal-body">
              <StepIndicator current={step} />
              {step === 0 && (
                <div className="passyo-step-content">
                  <SectionCard icon="apartment" title="Identité du Projet">
                    <div className="passyo-field">
                      <label className={labelCls}>Titre du projet *</label>
                      <input type="text" placeholder="ex. Tour Résidentielle Phase II" className={inputCls} value={formData.name} onChange={e => set("name", e.target.value)} />
                    </div>
                    <div className="passyo-field">
                      <label className={labelCls}>Description</label>
                      <textarea rows={3} placeholder="Objectifs et portée du projet…" className={`${inputCls} passyo-textarea`} value={formData.description} onChange={e => set("description", e.target.value)} />
                    </div>
                    <div className="passyo-row2">
                      <div className="passyo-field">
                        <label className={labelCls}>Équipe</label>
                        <select className={inputCls} value={formData.team_id} onChange={e => set("team_id", e.target.value)}>
                          <option value="">Sélectionner une équipe</option>
                          {TEAMS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      <div className="passyo-field">
                        <label className={labelCls}>Wilaya / Localisation</label>
                        <input type="text" list="wilayas-list" placeholder="Chercher une wilaya…" className={inputCls} value={formData.location} onChange={e => set("location", e.target.value)} />
                        <datalist id="wilayas-list">{ALGERIAN_WILAYAS.map(w => <option key={w} value={w} />)}</datalist>
                      </div>
                    </div>
                  </SectionCard>
                </div>
              )}
              {step === 1 && (
                <div className="passyo-step-content">
                  <SectionCard icon="groups" title="Parties Prenantes">
                    <div className="passyo-row2">
                      <div className="passyo-field">
                        <label className={labelCls}>Maître d'Œuvre</label>
                        <input type="text" placeholder="Nom de l'architecte / bureau" className={inputCls} value={formData.maitre_oeuvre} onChange={e => set("maitre_oeuvre", e.target.value)} />
                      </div>
                      <div className="passyo-field">
                        <label className={labelCls}>Maître d'Ouvrage</label>
                        <input type="text" placeholder="Nom du client / promoteur" className={inputCls} value={formData.maitre_ouvrage} onChange={e => set("maitre_ouvrage", e.target.value)} />
                      </div>
                    </div>
                    <div className="passyo-field">
                      <label className={labelCls}>Entreprise de Réalisation</label>
                      <input type="text" placeholder="Nom de l'entreprise exécutante" className={inputCls} value={formData.entreprise_realisation} onChange={e => set("entreprise_realisation", e.target.value)} />
                    </div>
                  </SectionCard>
                  <SectionCard icon="engineering" title="Système Constructif *">
                    <div className="passyo-sys-grid">
                      {CONSTRUCTION_SYSTEMS.map(sys => (
                        <button key={sys} type="button" onClick={() => set("construction_system", sys)} className={`passyo-sys-btn ${formData.construction_system === sys ? "selected" : ""}`}>
                          <span className="material-symbols-outlined passyo-sys-icon">{sys.includes("Béton") ? "blur_on" : sys.includes("Métallique") ? "foundation" : "layers"}</span>
                          {sys}
                        </button>
                      ))}
                    </div>
                    <div className="passyo-row2">
                      <div className="passyo-field">
                        <label className={labelCls}>Nombre de Blocs</label>
                        <input type="text" placeholder="ex. A, B, C  ou  3" className={inputCls} value={formData.block_number} onChange={e => set("block_number", e.target.value)} />
                      </div>
                      <div className="passyo-field">
                        <label className={labelCls}>Nombre d'Étages</label>
                        <input type="number" min="0" placeholder="ex. 12" className={inputCls} value={formData.num_floors} onChange={e => set("num_floors", e.target.value)} />
                      </div>
                    </div>
                  </SectionCard>
                </div>
              )}
              {step === 2 && (
                <div className="passyo-step-content">
                  <SectionCard icon="calendar_month" title="Dates du Projet">
                    <div className="passyo-row2">
                      <div className="passyo-field">
                        <label className={labelCls}>Date de Début</label>
                        <input type="date" className={inputCls} value={formData.start_date} onChange={e => set("start_date", e.target.value)} />
                      </div>
                      <div className="passyo-field">
                        <label className={labelCls}>Date de Fin</label>
                        <input type="date" className={inputCls} value={formData.end_date} onChange={e => set("end_date", e.target.value)} />
                      </div>
                    </div>
                    {durationDays !== null && (
                      <div className="passyo-duration-pill">
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>schedule</span>
                        Durée brute : <strong>{durationDays} jours</strong> calendaires
                      </div>
                    )}
                    <div className="passyo-field">
                      <label className={labelCls}>Jours de Travail</label>
                      <div className="passyo-days-wrap">
                        {WEEKDAYS.map((day, i) => (
                          <button key={day} type="button" onClick={() => toggleDay(FULL_WEEKDAYS[i])} className={`passyo-day-btn ${formData.working_days.includes(FULL_WEEKDAYS[i]) ? "on" : ""}`}>{day}</button>
                        ))}
                      </div>
                    </div>
                  </SectionCard>
                  <SectionCard icon="schedule" title="Horaires & Équipes">
                    <div className="passyo-row2">
                      <div className="passyo-field">
                        <label className={labelCls}>Heures / Jour</label>
                        <input type="number" min="1" max="24" step="0.5" className={inputCls} value={formData.working_hours_per_day} onChange={e => set("working_hours_per_day", e.target.value)} />
                      </div>
                      <div className="passyo-field">
                        <label className={labelCls}>Système de Travail</label>
                        <select className={inputCls} value={formData.work_shifts} onChange={e => set("work_shifts", e.target.value)}>
                          <option>Équipe unique</option>
                          <option>2×8h (2 équipes)</option>
                          <option>3×8h (3 équipes)</option>
                          <option>Travail continu</option>
                        </select>
                      </div>
                    </div>
                  </SectionCard>
                </div>
              )}
            </div>
            <div className="passyo-modal-footer">
              <button type="button" onClick={step === 0 ? closeReset : () => setStep(s => s - 1)} className="passyo-btn-back">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
                {step === 0 ? "Annuler" : "Retour"}
              </button>
              {step < 2 ? (
                <button type="button" disabled={!canNext()} onClick={() => setStep(s => s + 1)} className="passyo-btn-next">
                  Suivant<span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                </button>
              ) : (
                <button type="button" disabled={isLoading} onClick={handleSubmit} className="passyo-btn-create">
                  {isLoading ? <span className="passyo-spinner" /> : <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>Créer le Projet</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
