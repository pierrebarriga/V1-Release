import { useState } from "react";
import { searchBills } from "../api/bills";
import type { Bill } from "../types/bill";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    setLoading(true);
    const results = await searchBills(query);
    setBills(results);
    setLoading(false);
  }

  return (
    <main>
      <h1>Bill Search</h1>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search bills..."
      />

      <button onClick={handleSearch}>Search</button>

      {loading && <p>Searching...</p>}

      {bills.map((bill) => (
        <article key={bill.id}>
          <h2>{bill.title}</h2>
          <p>{bill.summary}</p>
        </article>
      ))}
    </main>
  );
}