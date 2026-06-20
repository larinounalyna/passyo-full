export interface ReportOut { id: number; title: string; type: string; created_at: string; }
export async function getReports(_pid: number): Promise<ReportOut[]> { return []; }
