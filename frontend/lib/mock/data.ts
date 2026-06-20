// ─── Mock data replacing all lib/api/ backend calls ───────────────────────

export interface Project {
  id: number;
  name: string;
  description: string;
  location: string;
  status: "active" | "on_track" | "risk" | "blocked" | "completed";
  progress: number;
  budgetUsed: number;
  lateByDays: number;
  dueIn: string;
  team: string;
  maitre_oeuvre: string;
  maitre_ouvrage: string;
  entreprise_realisation: string;
  construction_system: string;
  created_at: string;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: "active" | "on_leave" | "unavailable";
  skills: string[];
  projectId: number;
}

export interface Resource {
  id: number;
  name: string;
  type: "equipment" | "material" | "crew" | "fuel";
  status: "AVAILABLE" | "ON_SITE" | "IN_TRANSIT" | "ORDERED" | "MAINTENANCE";
  available: number;
  total: number;
  ordered: number;
  orderState: "Delivered" | "In Transit" | "Pending" | "Backorder";
  supplyFor: string;
  note: string;
  projectId: number;
}

export const PROJECTS: Project[] = [
  { id: 1, name: "Skyline Plaza Phase II", description: "High-rise residential complex, 24 floors.", location: "Alger Centre", status: "active", progress: 72, budgetUsed: 68, lateByDays: 0, dueIn: "14 jours", team: "Site Operations", maitre_oeuvre: "Arch. Bureau Atlas", maitre_ouvrage: "OPGI Alger", entreprise_realisation: "COSIDER", construction_system: "Béton armé", created_at: "2024-01-15" },
  { id: 2, name: "Riverside Mall Expansion", description: "Commercial expansion, 3 new wings.", location: "Oran", status: "on_track", progress: 48, budgetUsed: 51, lateByDays: 2, dueIn: "31 jours", team: "Architecture Team", maitre_oeuvre: "Arch. Studio Oran", maitre_ouvrage: "Groupe Elsecom", entreprise_realisation: "ENGOA", construction_system: "Structure métallique", created_at: "2024-03-02" },
  { id: 3, name: "Metro Station Upgrade", description: "Renovation of 5 metro stations.", location: "Alger", status: "risk", progress: 37, budgetUsed: 74, lateByDays: 4, dueIn: "9 jours", team: "Procurement & Logistics", maitre_oeuvre: "BETUR", maitre_ouvrage: "RATP Dev Alger", entreprise_realisation: "ETRHB", construction_system: "Béton précontraint", created_at: "2023-11-20" },
  { id: 4, name: "West Ring Road Viaduct", description: "Bridge structure, 1.2km span.", location: "Tipaza", status: "blocked", progress: 25, budgetUsed: 63, lateByDays: 6, dueIn: "5 jours", team: "Quality Assurance", maitre_oeuvre: "LNHC", maitre_ouvrage: "Ministère des Travaux Publics", entreprise_realisation: "Colas Algérie", construction_system: "Béton armé", created_at: "2023-09-10" },
  { id: 5, name: "Airport Access Corridor", description: "New access road and terminal connector.", location: "Dar El Beïda", status: "active", progress: 61, budgetUsed: 55, lateByDays: 0, dueIn: "22 jours", team: "Civil Works", maitre_oeuvre: "GICA", maitre_ouvrage: "EGSA Alger", entreprise_realisation: "SAPTA", construction_system: "Béton bitumineux", created_at: "2024-02-28" },
];

export const TEAM_MEMBERS: TeamMember[] = [
  { id: 1, name: "Karim Bensalem", role: "Chef de chantier", email: "k.bensalem@cosider.dz", phone: "+213 770 123 456", status: "active", skills: ["Béton armé", "Gestion d'équipe", "Sécurité"], projectId: 1 },
  { id: 2, name: "Amina Zerrouki", role: "Ingénieure structure", email: "a.zerrouki@cosider.dz", phone: "+213 770 234 567", status: "active", skills: ["Calcul de structure", "AutoCAD", "SAP2000"], projectId: 1 },
  { id: 3, name: "Mourad Aït Hamou", role: "Conducteur de travaux", email: "m.aithamou@engoa.dz", phone: "+213 661 345 678", status: "active", skills: ["Planning", "Supervision", "Rapport journalier"], projectId: 2 },
  { id: 4, name: "Samira Hamdani", role: "Responsable QSE", email: "s.hamdani@etrhb.dz", phone: "+213 770 456 789", status: "on_leave", skills: ["HSE", "ISO 9001", "Audit"], projectId: 3 },
  { id: 5, name: "Yacine Boulahia", role: "Géotechnicien", email: "y.boulahia@lnhc.dz", phone: "+213 661 567 890", status: "active", skills: ["Sondage", "Géologie", "Rapport sol"], projectId: 4 },
  { id: 6, name: "Nadia Meziane", role: "Architecte", email: "n.meziane@atlas.dz", phone: "+213 770 678 901", status: "active", skills: ["ArchiCAD", "BIM", "Permis de construire"], projectId: 1 },
  { id: 7, name: "Sofiane Khelifi", role: "Electricien chef", email: "s.khelifi@sapta.dz", phone: "+213 661 789 012", status: "unavailable", skills: ["Haute tension", "TGBT", "Plans électriques"], projectId: 5 },
  { id: 8, name: "Lydia Rahmani", role: "Dessinatrice projeteur", email: "l.rahmani@cosider.dz", phone: "+213 770 890 123", status: "active", skills: ["AutoCAD", "Revit", "Détails techniques"], projectId: 1 },
];

export const RESOURCES: Resource[] = [
  { id: 1, name: "Béton B30 – Grade 80", type: "material", status: "ON_SITE", available: 62, total: 100, ordered: 45, orderState: "In Transit", supplyFor: "Skyline Plaza Phase II", note: "Réapprovisionner dans 4 jours", projectId: 1 },
  { id: 2, name: "Grue à tour #02", type: "equipment", status: "AVAILABLE", available: 1, total: 3, ordered: 0, orderState: "Delivered", supplyFor: "West Ring Road Viaduct", note: "Disponible après mardi", projectId: 4 },
  { id: 3, name: "Équipe électricité B", type: "crew", status: "ON_SITE", available: 6, total: 10, ordered: 2, orderState: "Pending", supplyFor: "Metro Station Upgrade", note: "Peut prendre 1 tâche supplémentaire", projectId: 3 },
  { id: 4, name: "Panneaux de coffrage", type: "material", status: "ORDERED", available: 210, total: 260, ordered: 70, orderState: "Backorder", supplyFor: "Riverside Mall Expansion", note: "Fournisseur a modifié la date de livraison", projectId: 2 },
  { id: 5, name: "Carburant diesel", type: "fuel", status: "AVAILABLE", available: 1400, total: 2000, ordered: 700, orderState: "In Transit", supplyFor: "Airport Access Corridor", note: "Aucun problème", projectId: 5 },
  { id: 6, name: "Échafaudage modulaire", type: "equipment", status: "MAINTENANCE", available: 0, total: 5, ordered: 0, orderState: "Pending", supplyFor: "Skyline Plaza Phase II", note: "Révision en cours", projectId: 1 },
];

export const TEAMS = [
  { id: 1, name: "Site Operations", memberCount: 11, projectId: 1 },
  { id: 2, name: "Architecture Team", memberCount: 7, projectId: 2 },
  { id: 3, name: "Procurement & Logistics", memberCount: 5, projectId: 3 },
  { id: 4, name: "Quality Assurance", memberCount: 4, projectId: 4 },
  { id: 5, name: "Civil Works", memberCount: 9, projectId: 5 },
];

// ─── Suivi documents: Attachments / Avenants / Situations ─────────────────

export interface Attachment {
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

export interface Avenant {
  id: number;
  project_id: number;
  title: string;
  description: string;
  price_impact: number;
  planning_impact: number;
  signatures?: string;
  created_at: string;
}

export interface Situation {
  id: number;
  project_id: number;
  title: string;
  billing_period: string;
  total_amount: number;
  is_approved: boolean;
  created_at: string;
}

export const ATTACHMENTS: Attachment[] = [
  { id: 1, project_id: 1, title: "Ferraillage poteaux R+1 — Zone A", quantity: 18.5, unit: "T", conductor_name: "Karim Bensalem", is_validated: true, created_at: "2025-06-08" },
  { id: 2, project_id: 1, title: "Coulage dalle béton armé — Niveau 2", quantity: 240, unit: "m²", conductor_name: "Amina Zerrouki", is_validated: true, created_at: "2025-06-10" },
  { id: 3, project_id: 1, title: "Maçonnerie cloisons — Bloc B", quantity: 96, unit: "m²", conductor_name: "Karim Bensalem", is_validated: false, created_at: "2025-06-14" },
  { id: 4, project_id: 2, title: "Terrassement fondation aile Ouest", quantity: 1240, unit: "m³", conductor_name: "Mourad Aït Hamou", is_validated: true, created_at: "2025-06-05" },
  { id: 5, project_id: 2, title: "Location grue mobile G-15", quantity: 22, unit: "U", conductor_name: "Mourad Aït Hamou", is_validated: false, created_at: "2025-06-12" },
];

export const AVENANTS: Avenant[] = [
  { id: 1, project_id: 1, title: "Extension de scope — Façade Zone B", description: "Ajout d'un revêtement isolant supplémentaire sur la façade nord suite à l'étude thermique complémentaire.", price_impact: 42500, planning_impact: 6, signatures: "Architecte, Maître d'Ouvrage", created_at: "2025-06-09" },
  { id: 2, project_id: 1, title: "Ajustement quantités ferraillage", description: "Révision des quantités d'acier suite au calcul de structure définitif transmis par le bureau d'études.", price_impact: -12200, planning_impact: 0, signatures: "", created_at: "2025-05-20" },
  { id: 3, project_id: 2, title: "Modification réseau électrique", description: "Passage en câblage domotique sur l'ensemble du bâtiment B selon la nouvelle demande du maître d'ouvrage.", price_impact: 18750, planning_impact: 3, signatures: "Entreprise, Maître d'Ouvrage", created_at: "2025-06-02" },
];

export const SITUATIONS: Situation[] = [
  { id: 1, project_id: 1, title: "Situation N°2 — Mai 2025", billing_period: "Mai 2025", total_amount: 4500000, is_approved: true, created_at: "2025-06-01" },
  { id: 2, project_id: 1, title: "Situation N°3 — Juin 2025", billing_period: "Juin 2025", total_amount: 3120000, is_approved: false, created_at: "2025-06-15" },
];
