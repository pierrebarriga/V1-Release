import type { Bill } from "../types/bill";

export type CongressNumber = 118 | 119;
export type ChamberName = "House" | "Senate";

type SearchOptions = {
  congresses: CongressNumber[];
  chambers: ChamberName[];
};

type SearchResponse = {
  results: Bill[];
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
      query,
      match_count: 10,
      match_threshold: 0,
      congresses: options.congresses,
      chambers: options.chambers,
    }),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      body?.detail || `Search failed with status ${response.status}`,
    );
  }

  const data = body as SearchResponse;

  return data.results ?? [];
}