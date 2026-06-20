import { TEAM_MEMBERS } from "@/lib/mock/data";
export interface UserCompanyOut { id: number; name: string; email: string; role: string; }
export async function getCompanyMembers(): Promise<UserCompanyOut[]> {
  return TEAM_MEMBERS.map(m => ({ id: m.id, name: m.name, email: m.email, role: m.role }));
}
