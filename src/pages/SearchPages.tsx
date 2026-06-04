import { useState } from "react";
import { Search } from "lucide-react";
import { searchBills } from "../api/bills";
import type { Bill } from "../types/bill";
import "./SearchPage.css";
export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"titles" | "text">("titles");
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;

    setLoading(true);
    const results = await searchBills(query);
    setBills(results);
    setLoading(false);
  }

  return (
    <main className="app-shell">
      <nav className="top-nav">
        <div className="brand">LegiSearch.AI</div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">Congressional Semantic Search</p>

          <h1>Search bills by meaning, not just keywords.</h1>

          <p className="hero-copy">
            Explore legislation introduced in the 118th Congress across the
            House and Senate. Search bill titles, summaries, and legislative
            text using semantic similarity.
          </p>

          <div className="search-card">
            <div className="toggle-row">
              <button
                className={searchType === "titles" ? "active" : ""}
                onClick={() => setSearchType("titles")}
              >
                Bill Titles
              </button>

              <button
                className={searchType === "text" ? "active" : ""}
                onClick={() => setSearchType("text")}
              >
                Bill Summaries or Text
              </button>
            </div>

            <label htmlFor="bill-search">Enter your search criteria</label>

            <div className="search-input-row">
              <Search size={20} />
              <input
                id="bill-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Try "AI and Taiwan" or "election integrity"'
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              />
              <button onClick={handleSearch}>
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {bills.length > 0 && (
        <section className="results-section">
          <h2>Search Results</h2>

          <div className="results-grid">
            {bills.map((bill) => (
              <article key={bill.id} className="bill-card">
                <p className="bill-meta">
                  {bill.congress}th Congress · {bill.chamber}
                </p>
                <h3>{bill.title}</h3>
                <p>{bill.summary}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}