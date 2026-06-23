import { useRef, useState } from "react";
import { Search } from "lucide-react";
import { searchBills } from "../api/bills";
import type { Bill } from "../types/bill";
import PdfViewer from "../components/PdfViewer";
import "./SearchPage.css";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [selectedBillKey, setSelectedBillKey] = useState<string | null>(null);
  const [pdfTop, setPdfTop] = useState(0);

  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  async function handleSearch() {
    if (!query.trim()) return;

    setLoading(true);
    setSelectedPdf(null);
    setSelectedBillKey(null);

    try {
      const results = await searchBills(query);
      setBills(results);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <nav className="top-nav">
        <div className="brand">LegiSearch.AI</div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">Congressional Semantic Search</p>

          <h1>
            Search Bills by meaning, <br />
            not just keywords.
          </h1>

          <p className="hero-copy">
            Search through bill text using semantic similarity. Bills currently
            include any legislation introduced in the 118th Congress in either
            the House or Senate.
          </p>

          <div className="search-card">
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

          <div className="results-layout">
            <div className="results-grid">
              {bills.map((bill) => {
                const billKey = `${
                  bill.originChamberCode || bill.chamber || "bill"
                }-${bill.number || bill.id || bill.title}`;

                const billPreview =
                  bill.summary ||
                  bill.summary_text ||
                  bill.summaryText ||
                  bill.bill_text_cleaned ||
                  "No summary available.";

                const pdfUrl =
                  bill.pdf_url || bill.bill_pdf_url || bill.pdfUrl || null;

                const chamber =
                  bill.originChamberCode === "H" || bill.chamber === "House"
                    ? "House"
                    : "Senate";

                return (
                  <article
                    ref={(el) => {
                      cardRefs.current[billKey] = el;
                    }}
                    key={billKey}
                    className={`bill-card ${
                      selectedBillKey === billKey ? "selected" : ""
                    }`}
                  >
                    <p className="bill-meta">
                      118th Congress · Introduced in the {chamber}
                    </p>

                    <h3
                      className={pdfUrl ? "bill-link" : ""}
                      onClick={() => {
                        setSelectedBillKey(billKey);

                        if (pdfUrl) {
                          setSelectedPdf(pdfUrl);
                        }

                        const cardEl = cardRefs.current[billKey];
                        const layoutEl =
                          document.querySelector(".results-layout");

                        if (cardEl && layoutEl) {
                          const cardRect = cardEl.getBoundingClientRect();
                          const layoutRect = layoutEl.getBoundingClientRect();
                          setPdfTop(cardRect.top - layoutRect.top);
                        }
                      }}
                    >
                      {bill.title}
                    </h3>

                    <p>{billPreview.slice(0, 350)}...</p>

                    {!pdfUrl && <p className="no-pdf">PDF not available yet</p>}

                    {selectedBillKey === billKey && selectedPdf && (
                      <div className="mobile-pdf-panel">
                        <PdfViewer url={selectedPdf} />
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            <div className="pdf-panel" style={{ top: `${pdfTop}px` }}>
              {selectedPdf ? (
                <PdfViewer url={selectedPdf} />
              ) : (
                <div className="pdf-placeholder">
                  Select a bill to view the PDF
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}