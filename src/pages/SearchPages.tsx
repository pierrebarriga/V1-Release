import { useEffect, useState } from "react";
import { Search, Star, X } from "lucide-react";
import { searchBills } from "../api/bills";
import type { Bill } from "../types/bill";
import PdfViewer from "../components/PdfViewer";
import "./SearchPage.css";

type CongressNumber = 118 | 119;
type ChamberName = "House" | "Senate";

const STATUS_OPTIONS = [
  "Introduced",
  "Passed Senate",
  "Passed House",
  "President",
  "Became Law",
] as const;

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selectedCongresses, setSelectedCongresses] = useState<
    CongressNumber[]
  >([118, 119]);

  const [selectedChambers, setSelectedChambers] = useState<ChamberName[]>([
    "House",
    "Senate",
  ]);

  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    ...STATUS_OPTIONS,
  ]);

  const [congressMenuOpen, setCongressMenuOpen] = useState(false);
  const [chamberMenuOpen, setChamberMenuOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [selectedBillKey, setSelectedBillKey] = useState<string | null>(null);

  function toggleCongress(congress: CongressNumber) {
    setSelectedCongresses((current) =>
      current.includes(congress)
        ? current.filter((item) => item !== congress)
        : [...current, congress],
    );
  }

  function toggleChamber(chamber: ChamberName) {
    setSelectedChambers((current) =>
      current.includes(chamber)
        ? current.filter((item) => item !== chamber)
        : [...current, chamber],
    );
  }

  function toggleStatus(status: string) {
    setSelectedStatuses((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status],
    );
  }

  function closeAllFilterMenus() {
    setCongressMenuOpen(false);
    setChamberMenuOpen(false);
    setStatusMenuOpen(false);
  }

  async function handleSearch() {
    const cleanedQuery = query.trim();

    if (!cleanedQuery) {
      setSearchError("Enter a search query.");
      return;
    }

    if (selectedCongresses.length === 0) {
      setSearchError("Select at least one Congress.");
      return;
    }

    if (selectedChambers.length === 0) {
      setSearchError("Select at least one chamber.");
      return;
    }

    setLoading(true);
    setSearchError(null);
    setSelectedPdf(null);
    setSelectedBillKey(null);
    closeAllFilterMenus();

    try {
      const results = await searchBills(cleanedQuery, {
        congresses: selectedCongresses,
        chambers: selectedChambers,
      });

      setBills(results);
    } catch (error) {
      console.error("Search failed:", error);

      setBills([]);
      setSearchError(
        error instanceof Error
          ? error.message
          : "The semantic search could not be completed.",
      );
    } finally {
      setLoading(false);
    }
  }

  function closePdfModal() {
    setSelectedPdf(null);
    setSelectedBillKey(null);
  }

  function getPdfViewerUrl(pdfUrl: string) {
    if (pdfUrl.includes("/pdf?url=")) {
      return pdfUrl;
    }

    return `${import.meta.env.VITE_API_URL}/pdf?url=${encodeURIComponent(
      pdfUrl,
    )}`;
  }

  useEffect(() => {
    if (!selectedPdf) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePdfModal();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selectedPdf]);

  return (
    <main className="app-shell">
      <nav className="top-nav">
        <div className="brand">LegiSearch.AI</div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">Congressional Semantic Search</p>

          <h1>
            Search Bills by meaning,
            <br />
            not just keywords.
          </h1>

          <p className="hero-copy">
            Search through bill text using semantic similarity. Bills currently
            include legislation introduced in the 118th or 119th Congress in
            either the House or Senate.
          </p>

          <div className="filters-card">
            <div className="filter-dropdown">
              <button
                type="button"
                className="filter-dropdown-trigger"
                onClick={() => {
                  setCongressMenuOpen((current) => !current);
                  setChamberMenuOpen(false);
                  setStatusMenuOpen(false);
                }}
                aria-expanded={congressMenuOpen}
              >
                <span>
                  Congress
                  <strong>
                    {selectedCongresses.length === 2
                      ? "All"
                      : selectedCongresses
                          .map((item) => `${item}th`)
                          .join(", ")}
                  </strong>
                </span>

                <span aria-hidden="true">⌄</span>
              </button>

              {congressMenuOpen && (
                <div className="filter-dropdown-menu">
                  <label className="dropdown-option">
                    <input
                      type="checkbox"
                      checked={selectedCongresses.includes(118)}
                      onChange={() => toggleCongress(118)}
                    />
                    <span>118th Congress</span>
                  </label>

                  <label className="dropdown-option">
                    <input
                      type="checkbox"
                      checked={selectedCongresses.includes(119)}
                      onChange={() => toggleCongress(119)}
                    />
                    <span>119th Congress</span>
                  </label>
                </div>
              )}
            </div>

            <div className="filter-dropdown">
              <button
                type="button"
                className="filter-dropdown-trigger"
                onClick={() => {
                  setChamberMenuOpen((current) => !current);
                  setCongressMenuOpen(false);
                  setStatusMenuOpen(false);
                }}
                aria-expanded={chamberMenuOpen}
              >
                <span>
                  Origin chamber
                  <strong>
                    {selectedChambers.length === 2
                      ? "All"
                      : selectedChambers.join(", ")}
                  </strong>
                </span>

                <span aria-hidden="true">⌄</span>
              </button>

              {chamberMenuOpen && (
                <div className="filter-dropdown-menu">
                  <label className="dropdown-option">
                    <input
                      type="checkbox"
                      checked={selectedChambers.includes("House")}
                      onChange={() => toggleChamber("House")}
                    />
                    <span>House</span>
                  </label>

                  <label className="dropdown-option">
                    <input
                      type="checkbox"
                      checked={selectedChambers.includes("Senate")}
                      onChange={() => toggleChamber("Senate")}
                    />
                    <span>Senate</span>
                  </label>
                </div>
              )}
            </div>

            <div className="filter-dropdown">
              <button
                type="button"
                className="filter-dropdown-trigger"
                onClick={() => {
                  setStatusMenuOpen((current) => !current);
                  setCongressMenuOpen(false);
                  setChamberMenuOpen(false);
                }}
                aria-expanded={statusMenuOpen}
              >
                <span>
                  Status
                  <strong>
                    {selectedStatuses.length === STATUS_OPTIONS.length
                      ? "All"
                      : `${selectedStatuses.length} selected`}
                  </strong>
                </span>

                <span aria-hidden="true">⌄</span>
              </button>

              {statusMenuOpen && (
                <div className="filter-dropdown-menu">
                  {STATUS_OPTIONS.map((status) => (
                    <label className="dropdown-option" key={status}>
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(status)}
                        onChange={() => toggleStatus(status)}
                      />
                      <span>{status}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="search-card">
            <label htmlFor="bill-search">Enter your search criteria</label>

            <div className="search-input-row">
              <Search size={20} aria-hidden="true" />

              <input
                id="bill-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder='Try "AI and Taiwan" or "election integrity"'
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !loading) {
                    handleSearch();
                  }
                }}
              />

              <button
                type="button"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>

            {searchError && (
              <p className="search-error" role="alert">
                {searchError}
              </p>
            )}
          </div>
        </div>
      </section>

      {bills.length > 0 && (
        <section className="results-section">
          <h2>Search Results</h2>

          <div className="results-grid">
            {bills.map((bill) => {
              const chamber: ChamberName =
                bill.originChamberCode === "H" ||
                bill.chamber === "House"
                  ? "House"
                  : "Senate";

              const billPrefix = chamber === "House" ? "H.R." : "S.";
              const congress = bill.congress ?? 118;

              const billKey = `${congress}-${chamber}-${
                bill.number || bill.id || bill.title
              }`;

              const billPreview =
                bill.summary ||
                bill.summary_text ||
                bill.summaryText ||
                bill.bill_text_cleaned ||
                "No summary or bill text is currently available.";

              const pdfUrl =
                bill.pdf_url ||
                bill.bill_pdf_url ||
                bill.pdfUrl ||
                null;

              const truncatedPreview =
                billPreview.length > 350
                  ? `${billPreview.slice(0, 350)}...`
                  : billPreview;

              function selectBill() {
                if (!pdfUrl) return;

                setSelectedBillKey(billKey);
                setSelectedPdf(pdfUrl);
              }

              return (
                <article
                  key={billKey}
                  className={`bill-card ${
                    selectedBillKey === billKey ? "selected" : ""
                  }`}
                >
                  <div className="bill-card-top">
                    <span className="bill-status introduced">
                      Introduced
                    </span>

                    <div className="track-btn">
                      <Star size={16} />
                      <span>Track</span>
                    </div>
                  </div>

                  <h3
                    className={pdfUrl ? "bill-link" : ""}
                    onClick={pdfUrl ? selectBill : undefined}
                  >
                    {bill.title}
                  </h3>

                  <p className="bill-meta">
                    <span>
                      {billPrefix} {bill.number}
                    </span>

                    <span className="meta-dot">•</span>
                    <span>{congress}th Congress</span>

                    <span className="meta-dot">•</span>
                    <span>{chamber}</span>
                  </p>

                  <p>{truncatedPreview}</p>

                  {!pdfUrl && (
                    <p className="no-pdf">
                      PDF not available for this result.
                    </p>
                  )}

                  <div className="bill-footer">
                    <div className="footer-item">
                      <span className="footer-label">
                        Last Updated
                      </span>

                      <span className="footer-value">
                        July 12, 2026
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {selectedPdf && (
        <div
          className="pdf-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePdfModal();
            }
          }}
        >
          <section
            className="pdf-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Bill PDF viewer"
          >
            <header className="pdf-modal-header">
              <div>
                <p className="pdf-modal-eyebrow">Bill document</p>
                <h2>PDF Preview</h2>
              </div>

              <button
                type="button"
                className="pdf-modal-close"
                onClick={closePdfModal}
                aria-label="Close PDF viewer"
              >
                <X size={22} />
              </button>
            </header>

            <div className="pdf-modal-content">
              <PdfViewer url={getPdfViewerUrl(selectedPdf)} />
            </div>
          </section>
        </div>
      )}
    </main>
  );
}