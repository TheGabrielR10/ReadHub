export type UserRole = "reader" | "writer" | "admin";

export interface Profile {
  id: string;
  birth_date: string;
  phone: string;
  role: UserRole;
  created_at: string;
}

// Vista combinada de auth.users + profiles, usada por la navegación.
export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
}
