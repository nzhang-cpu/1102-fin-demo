import { motion } from "motion/react";
import { ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, FileSearch, Search, X } from "lucide-react";
import { useDesignTokens } from "../../DesignTokensContext";
import { FinAiSummary, type SummarySource } from "./FinAiSummary";
import { SearchLoading } from "./SearchLoading";
import type { SortOption } from "../SearchResultsControls";

interface ResultArticle {
  title: string;
  category: string;
  lastUpdated: string;
}

interface ModernSearchResultsProps {
  query: string;
  draft: string;
  setDraft: (v: string) => void;
  onSubmit: () => void;
  onHome?: () => void;
  loading: boolean;
  showSummary: boolean;
  summary: {
    lead: string;
    body: string;
    sources: SummarySource[];
    suggestions?: string[];
    onAsk?: (q: string) => void;
    showFeedback: boolean;
  };
  categories: string[];
  filterCategory: string;
  setFilterCategory: (c: string) => void;
  sortBy: SortOption;
  setSortBy: (s: SortOption) => void;
  total: number;
  pageItems: ResultArticle[];
  snippet: (a: ResultArticle) => string;
  onOpenArticle: (a: ResultArticle) => void;
  page: number;
  totalPages: number;
  setPage: (n: number) => void;
}

const SORTS: { id: SortOption; label: string }[] = [
  { id: "relevance", label: "Most relevant" },
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "title", label: "A to Z" },
];

/**
 * Results page for the Skyline skins: the landing page's sky gradient and grain, one floating
 * search pill, pill filters and roomy result cards. The classic layout in HostSearchResults is
 * left as it was for the other skins.
 */
export function ModernSearchResults(p: ModernSearchResultsProps) {
  const { dt } = useDesignTokens();
  const navy = dt.colors.host.searchCta;
  const ink = dt.colors.ui.body;
  const muted = "#52627F";

  return (
    <div
      className="relative h-full min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{
        background: "linear-gradient(180deg, #B9D5F4 0%, #D8E7FA 220px, #EDF3FC 520px, #F6F9FE 100%)",
        color: ink,
        fontFamily: dt.fonts.families.body,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px] opacity-[0.2] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.04  0 0 0 0 0.12  0 0 0 0 0.3  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          maskImage: "linear-gradient(to bottom, black, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[800px] px-[24px] pb-[96px] pt-[48px]">
        {/* one floating search pill */}
        <div className="flex items-center gap-[8px] rounded-full bg-white p-[8px] pl-[24px] shadow-[0_12px_36px_rgba(30,64,200,0.14)]">
          <Search className="size-[18px] shrink-0" style={{ color: muted }} />
          <input
            type="search"
            value={p.draft}
            onChange={(e) => p.setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                p.onSubmit();
              }
            }}
            placeholder="Enter a question or topic"
            aria-label="search"
            className="h-[48px] min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:opacity-50"
            style={{ color: navy }}
          />
          {p.draft && (
            <button
              type="button"
              onClick={() => p.setDraft("")}
              aria-label="Clear"
              className="flex size-[24px] shrink-0 items-center justify-center rounded-full bg-black/[0.08] hover:bg-black/[0.14]"
            >
              <X className="size-[13px]" />
            </button>
          )}
          <button
            type="button"
            onClick={p.onSubmit}
            className="h-[48px] shrink-0 rounded-full px-[30px] text-[15px] font-semibold text-white hover:brightness-125 hover:shadow-[0_6px_16px_rgba(11,42,102,0.3)]"
            style={{ background: navy }}
          >
            Search
          </button>
        </div>

        {p.loading ? (
          <div className="mt-[32px]">
            <SearchLoading />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="mt-[32px]"
          >
            {p.showSummary && (
              <FinAiSummary
                lead={p.summary.lead}
                body={p.summary.body}
                sources={p.summary.sources}
                suggestions={p.summary.suggestions}
                onAsk={p.summary.onAsk}
                showFeedback={p.summary.showFeedback}
              />
            )}

            {/* quiet results label under the summary, sort on the right */}
            <div className="mb-[18px] mt-[36px] flex items-center justify-between gap-[8px]">
              <h2 className="text-[15px] font-semibold" style={{ color: ink }}>
                {p.query ? (
                  <>
                    Results for “{p.query}”
                  </>
                ) : (
                  "All articles"
                )}
                <span className="ml-[8px] text-[13px] font-normal" style={{ color: muted }}>
                  {p.total} {p.total === 1 ? "article" : "articles"}
                </span>
              </h2>
              <label className="relative ml-auto flex items-center gap-[6px] text-[13px]" style={{ color: muted }}>
                Sort
                <span className="relative">
                  <select
                    value={p.sortBy}
                    onChange={(e) => p.setSortBy(e.target.value as SortOption)}
                    className="h-[34px] cursor-pointer appearance-none rounded-full border border-white/90 bg-white/75 pl-[14px] pr-[30px] text-[13px] font-medium outline-none"
                    style={{ color: ink }}
                  >
                    {SORTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-[10px] top-1/2 size-[14px] -translate-y-1/2" style={{ color: muted }} />
                </span>
              </label>
            </div>

            {p.pageItems.length > 0 ? (
              <ul className="flex flex-col gap-[16px]">
                {p.pageItems.map((a, i) => (
                  <motion.li
                    key={a.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <button
                      type="button"
                      onClick={() => p.onOpenArticle(a)}
                      className="group flex w-full items-start gap-[20px] rounded-[24px] border border-white/90 bg-white/85 p-[24px] text-left shadow-[0_6px_24px_rgba(30,64,200,0.07)] backdrop-blur-md hover:-translate-y-[2px] hover:bg-white hover:shadow-[0_14px_36px_rgba(30,64,200,0.16)]"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-[10px]">
                          <span
                            className="rounded-full px-[10px] py-[3px] text-[12px] font-semibold"
                            style={{ background: "#E8EFFB", color: navy }}
                          >
                            {a.category}
                          </span>
                          <span className="text-[12px]" style={{ color: muted }}>
                            Updated {a.lastUpdated}
                          </span>
                        </span>
                        <span className="mt-[12px] block text-[19px] font-bold leading-[26px]" style={{ color: ink }}>
                          {a.title}
                        </span>
                        <span className="mt-[8px] line-clamp-2 block text-[15px] leading-[23px]" style={{ color: muted }}>
                          {p.snippet(a)}
                        </span>
                      </span>
                      <span
                        className="mt-[2px] flex size-[36px] shrink-0 items-center justify-center rounded-full bg-[#EEF3FC] transition-colors group-hover:bg-[#0B2A66] group-hover:text-white"
                        style={{ color: navy }}
                      >
                        <ArrowUpRight className="size-[18px]" />
                      </span>
                    </button>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center rounded-[24px] bg-white/80 px-[24px] py-[64px] text-center">
                <span className="mb-[16px] flex size-[64px] items-center justify-center rounded-full bg-[#EEF3FC]" style={{ color: navy }}>
                  <FileSearch className="size-[30px]" strokeWidth={1.5} />
                </span>
                <p className="text-[18px] font-bold" style={{ color: ink }}>
                  No articles match that yet
                </p>
                <p className="mt-[6px] max-w-[380px] text-[14px]" style={{ color: muted }}>
                  Try a different word, or ask Fin in the chat box above.
                </p>
              </div>
            )}

            {p.totalPages > 1 && (
              <div className="mt-[36px] flex items-center justify-center gap-[8px]">
                <button
                  type="button"
                  disabled={p.page <= 1}
                  onClick={() => p.setPage(Math.max(1, p.page - 1))}
                  aria-label="Previous page"
                  className="flex size-[36px] items-center justify-center rounded-full bg-white/75 disabled:opacity-30"
                >
                  <ChevronLeft className="size-[16px]" />
                </button>
                {Array.from({ length: p.totalPages }, (_, i) => i + 1)
                  .slice(0, 7)
                  .map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => p.setPage(n)}
                      className="size-[36px] rounded-full text-[13px] font-semibold"
                      style={n === p.page ? { background: navy, color: "#fff" } : { background: "rgba(255,255,255,0.75)", color: ink }}
                    >
                      {n}
                    </button>
                  ))}
                <button
                  type="button"
                  disabled={p.page >= p.totalPages}
                  onClick={() => p.setPage(Math.min(p.totalPages, p.page + 1))}
                  aria-label="Next page"
                  className="flex size-[36px] items-center justify-center rounded-full bg-white/75 disabled:opacity-30"
                >
                  <ChevronRight className="size-[16px]" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
