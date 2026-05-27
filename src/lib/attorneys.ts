const API_BASE =
  typeof window === "undefined" ? "http://localhost:4000/api" : "/api";

export type VerifiedAttorney = {
  id: string;
  fullName: string;
  specialty: string;
};

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

export async function listVerifiedAttorneys(): Promise<VerifiedAttorney[]> {
  const res = await fetch(`${API_BASE}/attorneys`, { credentials: "include" });
  if (!res.ok) {
    const data = await parseJson<{ message?: string }>(res);
    throw new Error(data.message || "Failed to load attorneys");
  }
  const data = await parseJson<{ attorneys: VerifiedAttorney[] }>(res);
  return data.attorneys ?? [];
}
