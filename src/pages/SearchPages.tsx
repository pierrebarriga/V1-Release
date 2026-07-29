import { useEffect, useRef, useState } from "react";
import { Search, Star, X } from "lucide-react";
import { searchBills } from "../api/bills";
import type { Bill } from "../types/bill";
import PdfViewer from "../components/PdfViewer";
import "./SearchPage.css";

type CongressNumber = 118 | 119;
type ChamberName = "House" | "Senate";

type Representative = {
  bioguideId: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  party?: string;
  state?: string;
  district?: string | number | null;
  originChamberCode?: "H" | "S";
};

const ACTION_OPTIONS = [
  { value: "introduced", label: "Introduced" },
  { value: "committee", label: "Committee Action" },
  { value: "house_floor", label: "House Floor Action" },
  { value: "senate_floor", label: "Senate Floor Action" },
  { value: "passed_house", label: "Passed House" },
  { value: "passed_senate", label: "Passed Senate" },
  { value: "passed_both", label: "Passed Both Chambers" },
  { value: "sent_to_president", label: "Sent to President" },
  { value: "vetoed", label: "Vetoed" },
  { value: "became_law", label: "Became Law" },
] as const;

type ActionCategory = (typeof ACTION_OPTIONS)[number]["value"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [cosponsorQuery, setCosponsorQuery] = useState("");
  const [cosponsorOptions, setCosponsorOptions] = useState<Representative[]>([]);
  const [selectedCosponsor, setSelectedCosponsor] =
    useState<Representative | null>(null);
  const [cosponsorLoading, setCosponsorLoading] = useState(false);
  const [cosponsorError, setCosponsorError] = useState<string | null>(null);
  const [cosponsorSearchComplete, setCosponsorSearchComplete] = useState(false);
  const [cosponsorMenuOpen, setCosponsorMenuOpen] = useState(false);
  const cosponsorRequestId = useRef(0);
  const selectedCosponsorRef = useRef<Representative | null>(null);

  const [sponsorQuery, setSponsorQuery] = useState("");
  const [sponsorOptions, setSponsorOptions] = useState<Representative[]>([]);
  const [selectedSponsor, setSelectedSponsor] =
    useState<Representative | null>(null);
  const [sponsorLoading, setSponsorLoading] = useState(false);
  const [sponsorError, setSponsorError] = useState<string | null>(null);
  const [sponsorSearchComplete, setSponsorSearchComplete] = useState(false);
  const [sponsorMenuOpen, setSponsorMenuOpen] = useState(false);
  const sponsorRequestId = useRef(0);
  const selectedSponsorRef = useRef<Representative | null>(null);

  const [selectedCongresses, setSelectedCongresses] = useState<
    CongressNumber[]
  >([118, 119]);

  const [selectedChambers, setSelectedChambers] = useState<ChamberName[]>([
    "House",
    "Senate",
  ]);

  const [selectedActions, setSelectedActions] = useState<ActionCategory[]>([]);

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

  function toggleAction(action: ActionCategory) {
    setSelectedActions((current) => {
      const next = current.includes(action)
        ? current.filter((item) => item !== action)
        : [...current, action];

      // Action data is currently available only for the 119th Congress.
      if (next.length > 0) {
        setSelectedCongresses([119]);
      }

      return next;
    });
  }

  function clearActions() {
    setSelectedActions([]);
  }

  function closeAllFilterMenus() {
    setCongressMenuOpen(false);
    setChamberMenuOpen(false);
    setStatusMenuOpen(false);
    setCosponsorMenuOpen(false);
    setSponsorMenuOpen(false);
  }

  function selectCosponsor(cosponsor: Representative) {
    selectedCosponsorRef.current = cosponsor;
    setSelectedCosponsor(cosponsor);
    setCosponsorQuery(cosponsor.fullName);
    setCosponsorOptions([]);
    setCosponsorMenuOpen(false);
    setSelectedCongresses([119]);

    if (cosponsor.originChamberCode === "H") {
      setSelectedChambers(["House"]);
    } else if (cosponsor.originChamberCode === "S") {
      setSelectedChambers(["Senate"]);
    }
  }

  function clearCosponsor() {
    selectedCosponsorRef.current = null;
    setSelectedCosponsor(null);
    setCosponsorQuery("");
    setCosponsorOptions([]);
    setCosponsorError(null);
    setCosponsorSearchComplete(false);
    setCosponsorMenuOpen(false);
  }

  function selectSponsor(sponsor: Representative) {
    selectedSponsorRef.current = sponsor;
    setSelectedSponsor(sponsor);
    setSponsorQuery(sponsor.fullName);
    setSponsorOptions([]);
    setSponsorMenuOpen(false);
    setSelectedCongresses([119]);

    if (sponsor.originChamberCode === "H") {
      setSelectedChambers(["House"]);
    } else if (sponsor.originChamberCode === "S") {
      setSelectedChambers(["Senate"]);
    }
  }

  function clearSponsor() {
    selectedSponsorRef.current = null;
    setSelectedSponsor(null);
    setSponsorQuery("");
    setSponsorOptions([]);
    setSponsorError(null);
    setSponsorSearchComplete(false);
    setSponsorMenuOpen(false);
  }

  async function handleSearch() {
    const cleanedQuery = query.trim();
    const activeCosponsor = selectedCosponsorRef.current ?? selectedCosponsor;
    const activeSponsor = selectedSponsorRef.current ?? selectedSponsor;

    if (!cleanedQuery && !activeCosponsor && !activeSponsor) {
      setSearchError("Enter a search query or select a representative.");
      return;
    }

    if (selectedActions.length > 0 && !cleanedQuery) {
      setSearchError("Enter a search query to use the action filter.");
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
        congresses: activeCosponsor || activeSponsor ? [119] : selectedCongresses,
        chambers: selectedChambers,
        cosponsor_bioguide_id: activeCosponsor?.bioguideId ?? null,
        sponsor_bioguide_id: activeSponsor?.bioguideId ?? null,
        action_categories: selectedActions,
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
    const cleanedQuery = cosponsorQuery.trim();

    if (selectedCosponsor && cleanedQuery === selectedCosponsor.fullName) {
      setCosponsorOptions([]);
      setCosponsorError(null);
      setCosponsorSearchComplete(false);
      setCosponsorLoading(false);
      return;
    }

    // Keep the dropdown open while the user types. The API requires at least
    // two characters, so one character should show guidance instead of closing.
    if (cleanedQuery.length < 2) {
      cosponsorRequestId.current += 1;
      setCosponsorOptions([]);
      setCosponsorError(null);
      setCosponsorSearchComplete(false);
      setCosponsorLoading(false);
      return;
    }

    const requestId = ++cosponsorRequestId.current;
    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      setCosponsorLoading(true);
      setCosponsorError(null);
      setCosponsorSearchComplete(false);

      try {
        const apiUrl = import.meta.env.VITE_API_URL;

        if (!apiUrl) {
          throw new Error("VITE_API_URL is not configured.");
        }

        const response = await fetch(
          `${apiUrl}/cosponsors?query=${encodeURIComponent(cleanedQuery)}&limit=10`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          const body = await response.text();
          throw new Error(
            `Could not load cosponsors (${response.status})${body ? `: ${body}` : ""}`,
          );
        }

        const data: unknown = await response.json();

        if (requestId !== cosponsorRequestId.current) return;

        const rows = Array.isArray(data)
          ? data
          : data && typeof data === "object" && Array.isArray((data as { results?: unknown[] }).results)
            ? (data as { results: unknown[] }).results
            : [];

        const normalized = rows
          .map((row): Representative | null => {
            if (!row || typeof row !== "object") return null;

            const item = row as Record<string, unknown>;
            const bioguideId = String(
              item.bioguideId ?? item.bioguide_id ?? item.bioguideid ?? "",
            ).trim();

            const fullName = String(
              item.fullName ??
                item.full_name ??
                item.fullname ??
                [item.firstName ?? item.first_name, item.lastName ?? item.last_name]
                  .filter(Boolean)
                  .join(" "),
            ).trim();

            if (!bioguideId || !fullName) return null;

            const chamberCode =
              item.originChamberCode ??
              item.origin_chamber_code ??
              item.originchambercode;

            return {
              bioguideId,
              fullName,
              firstName: String(item.firstName ?? item.first_name ?? "") || undefined,
              lastName: String(item.lastName ?? item.last_name ?? "") || undefined,
              party: String(item.party ?? "") || undefined,
              state: String(item.state ?? "") || undefined,
              district:
                item.district === null || item.district === undefined
                  ? null
                  : String(item.district),
              originChamberCode:
                chamberCode === "H" ? "H" : chamberCode === "S" ? "S" : undefined,
            };
          })
          .filter((item): item is Representative => item !== null);

        setCosponsorOptions(normalized);
        setCosponsorSearchComplete(true);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Cosponsor search failed:", error);
        setCosponsorOptions([]);
        setCosponsorSearchComplete(true);
        setCosponsorError(
          error instanceof Error ? error.message : "Could not load cosponsors.",
        );
      } finally {
        if (requestId === cosponsorRequestId.current) {
          setCosponsorLoading(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [cosponsorQuery, selectedCosponsor]);

  useEffect(() => {
    const cleanedQuery = sponsorQuery.trim();

    if (selectedSponsor && cleanedQuery === selectedSponsor.fullName) {
      setSponsorOptions([]);
      setSponsorError(null);
      setSponsorSearchComplete(false);
      setSponsorLoading(false);
      return;
    }

    if (cleanedQuery.length < 2) {
      sponsorRequestId.current += 1;
      setSponsorOptions([]);
      setSponsorError(null);
      setSponsorSearchComplete(false);
      setSponsorLoading(false);
      return;
    }

    const requestId = ++sponsorRequestId.current;
    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      setSponsorLoading(true);
      setSponsorError(null);
      setSponsorSearchComplete(false);

      try {
        const apiUrl = import.meta.env.VITE_API_URL;

        if (!apiUrl) {
          throw new Error("VITE_API_URL is not configured.");
        }

        const response = await fetch(
          `${apiUrl}/sponsors?query=${encodeURIComponent(cleanedQuery)}&limit=10`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          const body = await response.text();
          throw new Error(
            `Could not load sponsors (${response.status})${body ? `: ${body}` : ""}`,
          );
        }

        const data: unknown = await response.json();

        if (requestId !== sponsorRequestId.current) return;

        const rows = Array.isArray(data)
          ? data
          : data &&
              typeof data === "object" &&
              Array.isArray((data as { results?: unknown[] }).results)
            ? (data as { results: unknown[] }).results
            : [];

        const normalized = rows
          .map((row): Representative | null => {
            if (!row || typeof row !== "object") return null;

            const item = row as Record<string, unknown>;
            const bioguideId = String(
              item.bioguideId ?? item.bioguide_id ?? item.bioguideid ?? "",
            ).trim();

            const fullName = String(
              item.fullName ??
                item.full_name ??
                item.fullname ??
                [item.firstName ?? item.first_name, item.lastName ?? item.last_name]
                  .filter(Boolean)
                  .join(" "),
            ).trim();

            if (!bioguideId || !fullName) return null;

            const chamberCode =
              item.originChamberCode ??
              item.origin_chamber_code ??
              item.originchambercode;

            return {
              bioguideId,
              fullName,
              firstName:
                String(item.firstName ?? item.first_name ?? "") || undefined,
              lastName:
                String(item.lastName ?? item.last_name ?? "") || undefined,
              party: String(item.party ?? "") || undefined,
              state: String(item.state ?? "") || undefined,
              district:
                item.district === null || item.district === undefined
                  ? null
                  : String(item.district),
              originChamberCode:
                chamberCode === "H"
                  ? "H"
                  : chamberCode === "S"
                    ? "S"
                    : undefined,
            };
          })
          .filter((item): item is Representative => item !== null);

        setSponsorOptions(normalized);
        setSponsorSearchComplete(true);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Sponsor search failed:", error);
        setSponsorOptions([]);
        setSponsorSearchComplete(true);
        setSponsorError(
          error instanceof Error ? error.message : "Could not load sponsors.",
        );
      } finally {
        if (requestId === sponsorRequestId.current) {
          setSponsorLoading(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [sponsorQuery, selectedSponsor]);

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
                  setCosponsorMenuOpen(false);
                  setSponsorMenuOpen(false);
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
                      disabled={
                        Boolean(selectedCosponsor) ||
                        Boolean(selectedSponsor) ||
                        selectedActions.length > 0
                      }
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
                  setCosponsorMenuOpen(false);
                  setSponsorMenuOpen(false);
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
                  setCosponsorMenuOpen(false);
                  setSponsorMenuOpen(false);
                }}
                aria-expanded={statusMenuOpen}
              >
                <span>
                  Status
                  <strong>
                    {selectedActions.length === 0
                      ? "Any"
                      : `${selectedActions.length} selected`}
                  </strong>
                </span>

                <span aria-hidden="true">⌄</span>
              </button>

              {statusMenuOpen && (
                <div className="filter-dropdown-menu">
                  <label className="dropdown-option">
                    <input
                      type="checkbox"
                      checked={selectedActions.length === 0}
                      onChange={clearActions}
                    />
                    <span>Any action</span>
                  </label>

                  {ACTION_OPTIONS.map((action) => (
                    <label className="dropdown-option" key={action.value}>
                      <input
                        type="checkbox"
                        checked={selectedActions.includes(action.value)}
                        onChange={() => toggleAction(action.value)}
                      />
                      <span>{action.label}</span>
                    </label>
                  ))}

                  <p className="cosponsor-filter-note">
                    Action filtering currently uses 119th Congress data.
                  </p>
                </div>
              )}
            </div>
          </div>
            <div className="filter-dropdown cosponsor-filter">
              <button
                type="button"
                className="filter-dropdown-trigger"
                onClick={() => {
                  setCosponsorMenuOpen((current) => !current);
                  setCongressMenuOpen(false);
                  setChamberMenuOpen(false);
                  setStatusMenuOpen(false);
                  setSponsorMenuOpen(false);
                }}
                aria-expanded={cosponsorMenuOpen}
              >
                <span>
                  Cosponsor
                  <strong>
                    {selectedCosponsor?.fullName ?? "Any"}
                  </strong>
                </span>

                <span aria-hidden="true">⌄</span>
              </button>

              {cosponsorMenuOpen && (
                <div className="filter-dropdown-menu cosponsor-filter-menu">
                  <div className="cosponsor-autocomplete">
                    <div className="cosponsor-filter-input-row">
                      <Search size={17} aria-hidden="true" />

                      <input
                        id="cosponsor-search"
                        value={cosponsorQuery}
                        onChange={(event) => {
                          setCosponsorQuery(event.target.value);

                          if (
                            selectedCosponsor &&
                            event.target.value.trim() !== selectedCosponsor.fullName
                          ) {
                            selectedCosponsorRef.current = null;
                            setSelectedCosponsor(null);
                          }

                          setCosponsorMenuOpen(true);
                        }}
                        placeholder="Type a name"
                        autoComplete="off"
                        autoFocus
                      />

                      {(selectedCosponsor || cosponsorQuery) && (
                        <button
                          type="button"
                          className="cosponsor-clear"
                          onClick={clearCosponsor}
                          aria-label="Clear cosponsor filter"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    {cosponsorQuery.trim().length === 1 && !cosponsorLoading && (
                      <p className="cosponsor-loading">Type one more letter.</p>
                    )}

                    {cosponsorLoading && (
                      <p className="cosponsor-loading">Searching...</p>
                    )}

                    {cosponsorError && (
                      <p className="search-error" role="alert">
                        {cosponsorError}
                      </p>
                    )}

                    {cosponsorSearchComplete &&
                      !cosponsorLoading &&
                      !cosponsorError &&
                      cosponsorOptions.length === 0 && (
                        <p className="cosponsor-loading">No cosponsors found.</p>
                      )}

                    {cosponsorOptions.length > 0 && (
                      <div className="cosponsor-options" role="listbox">
                        {cosponsorOptions.map((cosponsor) => {
                          const details = [
                            cosponsor.party,
                            cosponsor.state,
                            cosponsor.originChamberCode === "H"
                              ? "House"
                              : cosponsor.originChamberCode === "S"
                                ? "Senate"
                                : null,
                          ]
                            .filter(Boolean)
                            .join(" · ");

                          return (
                            <button
                              type="button"
                              className="cosponsor-option"
                              key={`${cosponsor.bioguideId}-${cosponsor.originChamberCode ?? ""}`}
                              onMouseDown={(event) => {
                                event.preventDefault();
                                selectCosponsor(cosponsor);
                              }}
                              role="option"
                              aria-selected={
                                selectedCosponsor?.bioguideId ===
                                cosponsor.bioguideId
                              }
                            >
                              <strong>{cosponsor.fullName}</strong>
                              {details && <span>{details}</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {!cosponsorLoading &&
                      cosponsorQuery.trim().length >= 2 &&
                      cosponsorOptions.length === 0 &&
                      !selectedCosponsor && (
                        <p className="cosponsor-empty">
                          No matching cosponsors found.
                        </p>
                      )}

                    <p className="cosponsor-filter-note">
                      Cosponsor filtering currently uses 119th Congress data.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="filter-dropdown cosponsor-filter sponsor-filter">
              <button
                type="button"
                className="filter-dropdown-trigger"
                onClick={() => {
                  setSponsorMenuOpen((current) => !current);
                  setCongressMenuOpen(false);
                  setChamberMenuOpen(false);
                  setStatusMenuOpen(false);
                  setCosponsorMenuOpen(false);
                }}
                aria-expanded={sponsorMenuOpen}
              >
                <span>
                  Sponsor
                  <strong>{selectedSponsor?.fullName ?? "Any"}</strong>
                </span>

                <span aria-hidden="true">⌄</span>
              </button>

              {sponsorMenuOpen && (
                <div className="filter-dropdown-menu cosponsor-filter-menu">
                  <div className="cosponsor-autocomplete">
                    <div className="cosponsor-filter-input-row">
                      <Search size={17} aria-hidden="true" />

                      <input
                        id="sponsor-search"
                        value={sponsorQuery}
                        onChange={(event) => {
                          setSponsorQuery(event.target.value);

                          if (
                            selectedSponsor &&
                            event.target.value.trim() !== selectedSponsor.fullName
                          ) {
                            selectedSponsorRef.current = null;
                            setSelectedSponsor(null);
                          }

                          setSponsorMenuOpen(true);
                        }}
                        placeholder="Type a name"
                        autoComplete="off"
                        autoFocus
                      />

                      {(selectedSponsor || sponsorQuery) && (
                        <button
                          type="button"
                          className="cosponsor-clear"
                          onClick={clearSponsor}
                          aria-label="Clear sponsor filter"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    {sponsorQuery.trim().length === 1 && !sponsorLoading && (
                      <p className="cosponsor-loading">Type one more letter.</p>
                    )}

                    {sponsorLoading && (
                      <p className="cosponsor-loading">Searching...</p>
                    )}

                    {sponsorError && (
                      <p className="search-error" role="alert">
                        {sponsorError}
                      </p>
                    )}

                    {sponsorSearchComplete &&
                      !sponsorLoading &&
                      !sponsorError &&
                      sponsorOptions.length === 0 && (
                        <p className="cosponsor-loading">No sponsors found.</p>
                      )}

                    {sponsorOptions.length > 0 && (
                      <div className="cosponsor-options" role="listbox">
                        {sponsorOptions.map((sponsor) => {
                          const details = [
                            sponsor.party,
                            sponsor.state,
                            sponsor.originChamberCode === "H"
                              ? "House"
                              : sponsor.originChamberCode === "S"
                                ? "Senate"
                                : null,
                          ]
                            .filter(Boolean)
                            .join(" · ");

                          return (
                            <button
                              type="button"
                              className="cosponsor-option"
                              key={`${sponsor.bioguideId}-${sponsor.originChamberCode ?? ""}`}
                              onMouseDown={(event) => {
                                event.preventDefault();
                                selectSponsor(sponsor);
                              }}
                              role="option"
                              aria-selected={
                                selectedSponsor?.bioguideId === sponsor.bioguideId
                              }
                            >
                              <strong>{sponsor.fullName}</strong>
                              {details && <span>{details}</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {!sponsorLoading &&
                      sponsorQuery.trim().length >= 2 &&
                      sponsorOptions.length === 0 &&
                      !selectedSponsor && (
                        <p className="cosponsor-empty">
                          No matching sponsors found.
                        </p>
                      )}

                    <p className="cosponsor-filter-note">
                      Sponsor filtering currently uses 119th Congress data.
                    </p>
                  </div>
                </div>
              )}
            </div>

          <div className="search-card">
            <label htmlFor="bill-search">Enter your search criteria</label>

            <div className="search-input-row">
              <Search size={20} aria-hidden="true" />

              <input
                id="bill-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                  selectedSponsor
                    ? "Optional: search within this sponsor’s bills"
                    : selectedCosponsor
                      ? "Optional: search within this cosponsor’s bills"
                      : 'Try "AI and Taiwan" or "election integrity"'
                }
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
                {loading
                  ? "Loading..."
                  : (selectedSponsor || selectedCosponsor) && !query.trim()
                    ? "View bills"
                    : "Search"}
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
          <h2>
            {selectedSponsor
              ? query.trim()
                ? `Results for “${query.trim()}” within bills sponsored by ${selectedSponsor.fullName}`
                : `Bills sponsored by ${selectedSponsor.fullName}`
              : selectedCosponsor
                ? query.trim()
                ? `Results for “${query.trim()}” within bills cosponsored by ${selectedCosponsor.fullName}`
                : `Bills cosponsored by ${selectedCosponsor.fullName}`
              : selectedActions.length > 0
                ? `Search Results · ${selectedActions.length} action filter${
                    selectedActions.length === 1 ? "" : "s"
                  }`
                : "Search Results"}
          </h2>

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