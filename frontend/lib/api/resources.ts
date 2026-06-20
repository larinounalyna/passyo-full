import { RESOURCES, TEAM_MEMBERS } from "@/lib/mock/data";
export interface ResourceOut { id: number; name: string; type: string; status: string; [key: string]: unknown; }
export interface ResourceCreate { name: string; type: string; status: string; }
export interface ResourceUpdate { name?: string; type?: string; status?: string; }
export interface CrewMember { id: number; name: string; role: string; email: string; }

export async function getResources(): Promise<ResourceOut[]> { return RESOURCES as unknown as ResourceOut[]; }
export async function createResource(data: ResourceCreate): Promise<ResourceOut> { return { id: Math.random() * 1000 | 0, ...data }; }
export async function updateResource(id: number, data: ResourceUpdate): Promise<ResourceOut> { return { id, ...data } as ResourceOut; }
export async function deleteResource(_id: number): Promise<void> {}
export async function getProjectCrew(pid: number): Promise<CrewMember[]> {
  return TEAM_MEMBERS.filter(m => m.projectId === pid).map(m => ({ id: m.id, name: m.name, role: m.role, email: m.email }));
}
