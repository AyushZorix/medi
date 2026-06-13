export type UserRole = "attorney" | "user";
export type PortalKind = "attorney" | "applicant";

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
};

export const PORTAL_HOME: Record<PortalKind, "/app" | "/portal"> = {
  attorney: "/app",
  applicant: "/portal",
};

const API_BASE =
  typeof window === "undefined"
    ? (process.env.INTERNAL_API_URL || "http://localhost:4000/api")
    : (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "/api" : "https://medi-1-teri.onrender.com/api"));

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return { message: text } as unknown as T;
  }
}

async function handleAuthResponse<T>(res: Response): Promise<T> {
  if (res.ok) return parseJson<T>(res);
  const data = await parseJson<{ message?: string }>(res);
  const message = data?.message || `Request failed (${res.status})`;
  throw new Error(message);
}

export async function signUp(params: {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  attorneyVisaTypes?: string[];
}): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(params),
  });
  const data = await handleAuthResponse<{ user: User }>(res);
  return data.user;
}

export async function signIn(params: {
  email: string;
  password: string;
}): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/signin`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(params),
  });
  const data = await handleAuthResponse<{ user: User }>(res);
  return data.user;
}

export async function signOut(): Promise<void> {
  await fetch(`${API_BASE}/auth/signout`, {
    method: "POST",
    credentials: "include",
  });
}

export async function getSession(): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
    if (res.status === 401) return null;
    const data = await handleAuthResponse<{ user: User }>(res);
    return data.user;
  } catch {
    return null;
  }
}

export function getUserDisplayName(user: User): string {
  if (user.fullName?.trim()) return user.fullName.trim();
  if (user.email) return user.email.split("@")[0] ?? "User";
  return "User";
}

export function getUserInitials(user: User): string {
  const name = getUserDisplayName(user);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function getUserRole(user: User): UserRole {
  return user.role;
}

export function roleToPortal(role: UserRole | null): PortalKind | null {
  if (role === "attorney") return "attorney";
  if (role === "user") return "applicant";
  return null;
}

export function portalToRole(portal: PortalKind): UserRole {
  return portal === "attorney" ? "attorney" : "user";
}

export function getHomeForUser(user: User): "/app" | "/portal" | "/sign-in" {
  const home = roleToPortal(getUserRole(user));
  return home ? PORTAL_HOME[home] : "/sign-in";
}
