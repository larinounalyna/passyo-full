export interface TaskWithDetails { id: number; title: string; status: string; project_id?: number; assigned_to?: number; }
export async function getTasksByAssignee(_uid: number): Promise<TaskWithDetails[]> {
  return [
    { id: 1, title: "Vérification coffrages", status: "in_progress", project_id: 1, assigned_to: _uid },
    { id: 2, title: "Réunion coordination", status: "done", project_id: 2, assigned_to: _uid },
  ];
}
