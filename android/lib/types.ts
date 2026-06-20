// Backend data shapes (mirror web/src/lib/types/index.ts).

export type UserRole =
  | "Admin"
  | "Manager"
  | "Team Lead"
  | "Sales"
  | "Field Marketer";

export type UserStatus = "active" | "paused";

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  phone: string | null;
  town: string | null;
  region: string | null;
  team: string | null;
  hireDate: string | null; // ISO date YYYY-MM-DD
  role: UserRole;
  status: UserStatus;
};
