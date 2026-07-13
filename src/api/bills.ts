import type { Bill } from "../types/bill";

type SearchResponse = {
  results: Bill[];
};

export async function searchBills(query: string): Promise<Bill[]> {
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
    }),
  });

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("Semantic search API error:", responseBody);

    throw new Error(
      responseBody?.detail ||
        `Semantic search failed with status ${response.status}`,
    );
  }

  const data = responseBody as SearchResponse;

  console.log("Semantic search response:", data);

  return data.results ?? [];
}