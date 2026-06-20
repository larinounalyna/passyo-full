import { PROJECTS } from "@/lib/mock/data";
export interface ProjectOut { id: number; name?: string; description?: string; company_id?: number; team_id?: number; location?: string; status?: string; created_by?: number; created_at?: string; maitre_oeuvre?: string; maitre_ouvrage?: string; entreprise_realisation?: string; construction_system?: string; }
export interface ProjectMemberOut { member_id: number; user_id: number; name?: string; }
export interface ProjectCreate { name: string; description?: string; company_id?: number; team_id?: number; location?: string; [key: string]: unknown; }

export async function getMyProjects(): Promise<ProjectOut[]> {
  return PROJECTS.map(p => ({ id: p.id, name: p.name, description: p.description, location: p.location, status: p.status }));
}
export async function getProject(id: number): Promise<ProjectOut> {
  const p = PROJECTS.find(x => x.id === id);
  return { id: p?.id ?? id, name: p?.name, description: p?.description, location: p?.location, status: p?.status };
}
export async function createProject(data: ProjectCreate): Promise<ProjectOut> {
  return { id: Math.floor(Math.random() * 1000) + 100, ...data };
}
export async function updateProject(id: number, data: Partial<ProjectCreate>): Promise<ProjectOut> {
  return { id, ...data };
}
export async function deleteProject(_id: number): Promise<void> {}
export async function getProjectMembers(_id: number): Promise<ProjectMemberOut[]> { return []; }
