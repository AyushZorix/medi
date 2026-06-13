const API_BASE =
  typeof window === "undefined"
    ? (process.env.INTERNAL_API_URL || "http://localhost:4000/api")
    : (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "/api" : "https://medi-1-teri.onrender.com/api"));

export type VerifiedAttorney = {
  id: string;
  fullName: string;
  specialty: string;
  visaTypes: string[];
};

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return { message: text } as unknown as T;
  }
}

export async function listVerifiedAttorneys(
  search?: string,
  visaType?: string,
): Promise<VerifiedAttorney[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (visaType) params.set("visaType", visaType);
  const url = params.toString()
    ? `${API_BASE}/attorneys?${params.toString()}`
    : `${API_BASE}/attorneys`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const data = await parseJson<{ message?: string }>(res);
    throw new Error(data.message || "Failed to load attorneys");
  }
  const data = await parseJson<{ attorneys: VerifiedAttorney[] }>(res);
  return data.attorneys ?? [];
}
