export interface Company { id: number; name: string; }
export async function getCompanies(): Promise<Company[]> { return []; }
