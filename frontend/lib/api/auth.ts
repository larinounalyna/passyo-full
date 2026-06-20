export interface UserOut {
  id: number;
  username: string;
  email: string;
  name?: string;
  family_name?: string;
  role?: string;
}

export async function getMe(): Promise<UserOut> {
  return { id: 1, username: "lyna", email: "lyna@passyo.dz", name: "Lyna", family_name: "Larinouna", role: "project_manager" };
}

export async function loginUser(_email: string, _password: string) {
  return { access_token: "mock_token", token_type: "bearer" };
}
