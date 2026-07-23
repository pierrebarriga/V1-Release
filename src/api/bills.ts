import type { Bill } from "../types/bill";

export type CongressNumber = 118 | 119;
export type ChamberName = "House" | "Senate";

export type SearchOptions = {
  congresses: CongressNumber[];
  chambers: ChamberName[];
  cosponsor_bioguide_id?: string | null;
  match_count?: number;
  match_threshold?: number;
};

type SearchResponse = {
  results?: Bill[];
};

export async function searchBills(
  query: string,
  options: SearchOptions,
): Promise<Bill[]> {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (!apiUrl) {
    throw new Error("VITE_API_URL is missing.");
  }

  const response = await fetch(`${apiUrl}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: query.trim(),
      match_count: options.match_count ?? 25,
      match_threshold: options.match_threshold ?? 0,
      congresses: options.congresses,
      chambers: options.chambers,
      cosponsor_bioguide_id: options.cosponsor_bioguide_id ?? null,
    }),
  });

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      body && typeof body === "object" && "detail" in body
        ? String((body as { detail?: unknown }).detail)
        : null;

    throw new Error(detail || `Search failed with status ${response.status}`);
  }

  if (!body || typeof body !== "object") {
    return [];
  }

  const data = body as SearchResponse;
  return Array.isArray(data.results) ? data.results : [];
}