export interface UserOut { id: number; name: string; email: string; }
export async function getUsers(): Promise<UserOut[]> { return []; }
