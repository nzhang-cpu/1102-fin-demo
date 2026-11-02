import { useSkin } from "../../SkinContext";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  Search,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useDesignTokens } from "../../DesignTokensContext";
import { useTokens } from "../../TokensContext";
import { type SortOption } from "../SearchResultsControls";
import { AiSummaryFeedback } from "../AiAssistCard";
import { FinAiSummary } from "./FinAiSummary";
import { HostBreadcrumb } from "./HostBreadcrumb";
import { buildSmartSummary } from "../SmartSummaryBlock";
import type { SearchBridgeContext } from "../SearchResultsScreen";

export interface HostArticleDetails {
  title: string;
  subtitle: string;
  category: string;
  lastUpdated: string;
  content: string;
  summary?: string;
}

export interface HostSearchResultsProps {
  initialQuery: string;
  onSearch: (query: string) => void;
  onHome?: () => void;
  onOpenArticle: (article: HostArticleDetails) => void;
  onStartConversation?: (ctx: SearchBridgeContext) => void;
  showSmartSummary?: boolean;
  showFilterSort?: boolean;
  showAiAssist?: boolean;
  showSummaryFeedback?: boolean;
}

function resultSnippet(article: HostArticleDetails, max = 160) {
  const raw = (article.summary || article.subtitle || article.content.split("\n\n")[0] || "")
    .replace(/\s+/g, " ")
    .trim();
  if (raw.length <= max) return raw;
  return raw.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

export function HostSearchResults({
  initialQuery,
  onSearch,
  onHome,
  onOpenArticle,
  onStartConversation,
  showSmartSummary = true,
  showFilterSort = true,
  showAiAssist = true,
  showSummaryFeedback = false,
}: HostSearchResultsProps) {
  const { tokens } = useTokens();
  const { dt } = useDesignTokens();
  const { skin } = useSkin();
  const catalog = (tokens.articles?.learning ?? []) as HostArticleDetails[];
  const categories = (tokens.categories ?? []) as { label: string; menuItems?: string[] }[];
  const query = initialQuery.trim();

  const host = dt.colors.host;
  const brand = dt.colors.brand;
  const ui = dt.colors.ui;
  const font = dt.fonts.families.body;
  const assistantLabel = skin.host.agent?.label ?? `${tokens.brandName} Virtual Assistant`;

  const compactSummary = !!skin.host.agent;
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [summaryOverflows, setSummaryOverflows] = useState(false);
  const summaryRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const el = summaryRef.current;
    if (compactSummary && el && !summaryExpanded) {
      setSummaryOverflows(el.scrollHeight > el.clientHeight + 1);
    }
  });

  const [draft, setDraft] = useState(query);
  const [askDraft, setAskDraft] = useState("");
  const [askFocused, setAskFocused] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setDraft(query);
    setPage(1);
  }, [query]);

  const smartSummary = useMemo(() => buildSmartSummary(query || "help", catalog), [query, catalog]);
  const summaryPlain = `${smartSummary.leadBefore}${smartSummary.highlight}${smartSummary.leadAfter}`;

  const results = useMemo(() => {
    const q = query.toLowerCase();
    let items = catalog.filter((a) => {
      if (!q) return true;
      const hay = `${a.title} ${a.subtitle} ${a.category} ${a.summary ?? ""} ${a.content}`.toLowerCase();
      return hay.includes(q) || q.split(/\s+/).some((w) => w.length > 2 && hay.includes(w));
    });
    if (filterCategory) {
      items = items.filter((a) => a.category === filterCategory);
    }
    items = [...items].sort((a, b) => {
      if (sortBy === "newest") return Date.parse(b.lastUpdated) - Date.parse(a.lastUpdated);
      if (sortBy === "oldest") return Date.parse(a.lastUpdated) - Date.parse(b.lastUpdated);
      if (sortBy === "title") return a.title.localeCompare(b.title);
      const as = a.title.toLowerCase().includes(q) ? 0 : 1;
      const bs = b.title.toLowerCase().includes(q) ? 0 : 1;
      return as - bs || a.title.localeCompare(b.title);
    });
    return items;
  }, [catalog, query, filterCategory, sortBy]);

  const total = results.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIdx = Math.min(safePage * pageSize, total);
  const pageItems = results.slice((safePage - 1) * pageSize, safePage * pageSize);

  const submit = () => {
    const q = draft.trim();
    if (q) onSearch(q);
  };

  const openAssistant = (askQuery?: string) => {
    const q = (askQuery ?? (query || draft || "Help me")).trim();
    if (!q) return;
    onStartConversation?.({
      query: q,
      summary: summaryPlain,
      results: results.slice(0, 4).map((r) => ({
        title: r.title,
        category: r.category,
        subtitle: r.subtitle,
      })),
    });
  };

  const submitAsk = (override?: string) => {
    const q = (override ?? askDraft).trim();
    if (!q || !onStartConversation) return;
    setAskDraft("");
    openAssistant(q);
  };

  const followUps = useMemo(() => {
    const fromCitations = smartSummary.citations.map((c) => c.title).filter(Boolean);
    const fromResults = results.slice(0, 3).map((r) => `Tell me more about ${r.title}`);
    const defaults = [
      "Can you summarize the key steps?",
      "What should I do next?",
      "How do I contact support?",
    ];
    return [...fromCitations.slice(0, 1), ...fromResults.slice(0, 1), ...defaults]
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .slice(0, 3);
  }, [smartSummary.citations, results]);

  return (
    <div
      className="h-full min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ fontFamily: font, background: host.pageBg, color: ui.body }}
    >
      <div className="max-w-[880px] mx-auto px-[24px] py-[22px] pb-[80px]">
        <HostBreadcrumb items={[{ label: "Help Center", onClick: onHome }, { label: "Search" }]} />

        <h1
          className="text-[32px] font-bold tracking-[-0.02em] mb-[18px]"
          style={{ color: brand.navy }}
        >
          Search
        </h1>

        <div className="flex items-stretch gap-[10px] mb-[20px]">
          <div
            className="flex-1 min-w-0 flex items-center gap-[10px] h-[44px] px-[14px] rounded-[4px] border bg-white"
            style={{ borderColor: ui.borderLight }}
          >
            <Search className="size-[18px] shrink-0" style={{ color: ui.muted }} />
            <input
              type="search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Enter a question or topic"
              className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[15px] placeholder:opacity-50"
              style={{ color: brand.navy }}
              aria-label="search"
            />
            {draft && (
              <button
                type="button"
                onClick={() => setDraft("")}
                className="size-[20px] rounded-full text-white flex items-center justify-center shrink-0"
                style={{ background: ui.muted }}
                aria-label="Clear"
              >
                <X className="size-[12px]" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={submit}
            className="h-[44px] px-[22px] rounded-[4px] text-white text-[15px] font-semibold shrink-0 hover:opacity-90"
            style={{ background: host.searchCta }}
          >
            Search
          </button>
        </div>

        {showSmartSummary && compactSummary && (
          <FinAiSummary
            onAsk={onStartConversation ? (q) => submitAsk(q) : undefined}
            showFeedback={showSummaryFeedback}
          >
            {summaryPlain} {smartSummary.detail.split("\n\n")[0].replace(/\{\{\d+\}\}/g, "")}
          </FinAiSummary>
        )}

        {showSmartSummary && !compactSummary && (
          <div
            className="mb-[18px] rounded-[10px] border overflow-hidden shadow-[0_1px_2px_rgba(13,115,119,0.04)]"
            style={{
              borderColor: `${host.aiSummaryAccent}33`,
              background: `linear-gradient(to bottom, ${host.aiSummaryBg}, ${host.pageBg})`,
            }}
          >
            <div className="px-[18px] pt-[16px] pb-[14px]">
              <div className="flex items-center gap-[8px] mb-[10px]">
                <span
                  className="size-[26px] rounded-full flex items-center justify-center"
                  style={{ background: `${host.aiSummaryAccent}1F` }}
                >
                  <Sparkles
                    className="size-[14px]"
                    style={{ color: host.aiSummaryAccent }}
                    strokeWidth={2.2}
                  />
                </span>
                <span className="text-[15px] font-bold" style={{ color: brand.navy }}>
                  AI Summary
                </span>
              </div>
              <p
                ref={summaryRef}
                className={`text-[15px] leading-[22px] ${compactSummary ? "mb-[4px]" : "mb-[10px]"} ${
                  compactSummary && !summaryExpanded ? "line-clamp-3" : ""
                }`}
                style={{ color: ui.body }}
              >
                {summaryPlain} {smartSummary.detail.split("\n\n")[0].replace(/\{\{\d+\}\}/g, "")}{" "}
                {onStartConversation && (
                  <>
                    You can also get more help or connect with a live agent by using the{" "}
                    <button
                      type="button"
                      onClick={() => openAssistant()}
                      className="font-medium hover:underline"
                      style={{ color: host.link }}
                    >
                      {assistantLabel}
                    </button>
                    .
                  </>
                )}
              </p>
              {compactSummary && (summaryOverflows || summaryExpanded) && (
                <button
                  type="button"
                  onClick={() => setSummaryExpanded((v) => !v)}
                  className="mb-[10px] text-[14px] font-semibold hover:underline"
                  style={{ color: host.link }}
                >
                  {summaryExpanded ? "View less" : "View more"}
                </button>
              )}
              <div className="flex items-start justify-between gap-[12px] flex-wrap">
                <p className="text-[12px] leading-[16px] flex-1 min-w-[180px]" style={{ color: ui.muted }}>
                  {compactSummary
                    ? "Summarized by AI, so it may occasionally be wrong. Please don’t share payment or ID numbers."
                    : "Responses generated with the assistance of AI technology, avoid sharing personal information. For the most accurate and complete information, please check source links."}
                </p>
                {showSummaryFeedback && <AiSummaryFeedback />}
              </div>
            </div>

            {onStartConversation && (
              <div className="px-[18px] pb-[14px]">
                <div
                  className={`relative rounded-[999px] p-[1.5px] transition-shadow duration-200 ${
                    askFocused
                      ? "shadow-[0_0_0_3px_rgba(13,115,119,0.12),0_8px_24px_rgba(13,115,119,0.12)]"
                      : "shadow-[0_2px_10px_rgba(15,40,50,0.06)]"
                  }`}
                  style={{
                    background: askFocused
                      ? `linear-gradient(110deg, ${host.aiSummaryAccent} 0%, #1A8FA8 45%, ${host.link} 100%)`
                      : "linear-gradient(110deg, #C5D5DC 0%, #D7E2E8 50%, #C9D4E0 100%)",
                  }}
                >
                  <div className="flex items-center gap-[8px] rounded-full bg-white pl-[16px] pr-[6px] py-[6px]">
                    {!compactSummary && (
                      <Sparkles
                        className="size-[15px] shrink-0 transition-colors"
                        style={{ color: askFocused ? host.aiSummaryAccent : ui.muted }}
                        strokeWidth={2}
                      />
                    )}
                    <input
                      type="text"
                      value={askDraft}
                      onChange={(e) => setAskDraft(e.target.value)}
                      onFocus={() => setAskFocused(true)}
                      onBlur={() => setAskFocused(false)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          submitAsk();
                        }
                      }}
                      placeholder={compactSummary ? "Chat with Fin" : "Ask a follow-up question…"}
                      className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[14px] placeholder:opacity-50"
                      style={{ color: brand.navy }}
                      aria-label="Ask a follow-up question"
                    />
                    <button
                      type="button"
                      onClick={() => submitAsk()}
                      disabled={!askDraft.trim()}
                      className="size-[34px] rounded-full flex items-center justify-center shrink-0 transition-all"
                      style={
                        askDraft.trim()
                          ? {
                              background: host.aiSummaryAccent,
                              color: "#fff",
                              boxShadow: `0 4px 12px ${host.aiSummaryAccent}59`,
                            }
                          : { background: ui.bgInput, color: ui.muted }
                      }
                      aria-label="Send question"
                    >
                      <Send className="size-[14px]" strokeWidth={2.2} />
                    </button>
                  </div>
                </div>

                <div className="mt-[10px] flex flex-wrap gap-[8px]">
                  {(compactSummary ? [] : followUps).map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => submitAsk(label)}
                      className="max-w-full truncate rounded-full border bg-white/80 px-[12px] py-[6px] text-[12px] font-medium transition-colors hover:bg-white"
                      style={{
                        borderColor: `${host.aiSummaryAccent}33`,
                        color: host.chatUserBubble,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = `${host.aiSummaryAccent}66`;
                        e.currentTarget.style.color = host.aiSummaryAccent;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${host.aiSummaryAccent}33`;
                        e.currentTarget.style.color = host.chatUserBubble;
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div
              className="flex items-center justify-between gap-[12px] px-[18px] py-[12px] border-t bg-white/70"
              style={{ borderColor: ui.borderFaint }}
            >
              <span className="text-[13px]" style={{ color: ui.body }}>
                Did this answer your question?
              </span>
              <div className="flex items-center gap-[8px]">
                <button
                  type="button"
                  className="h-[32px] px-[16px] rounded-[4px] border bg-white text-[13px] font-semibold hover:opacity-90"
                  style={{ borderColor: host.searchCta, color: brand.navy }}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className="h-[32px] px-[16px] rounded-[4px] border bg-white text-[13px] font-semibold hover:opacity-90"
                  style={{ borderColor: host.searchCta, color: brand.navy }}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {showFilterSort && (
          <div
            className="mb-[14px] flex items-center gap-[12px] flex-wrap rounded-[6px] border bg-white px-[16px] py-[12px]"
            style={{ borderColor: ui.borderFaint }}
          >
            <span className="text-[14px] font-semibold" style={{ color: brand.navy }}>
              Filter by:
            </span>
            <div className="relative">
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setPage(1);
                }}
                className="appearance-none h-[36px] pl-[12px] pr-[32px] rounded-[4px] border bg-white text-[14px] outline-none"
                style={{ borderColor: ui.borderLight, color: ui.body }}
              >
                <option value="">Select an option</option>
                {categories.map((c) => (
                  <option key={c.label} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2 size-[14px]"
                style={{ color: ui.muted }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setFilterCategory("");
                setPage(1);
              }}
              className={`text-[14px] ${filterCategory ? "hover:underline" : ""}`}
              style={{ color: filterCategory ? host.link : ui.muted }}
            >
              Clear filters
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-[12px] mb-[14px] flex-wrap">
          <p className="text-[14px]" style={{ color: ui.body }}>
            {total === 0
              ? `No results for '${query || "…"}'`
              : `Showing ${startIdx}-${endIdx} of ${total} results${
                  query ? ` for '${query}'` : ""
                }`}
          </p>
          {showFilterSort && (
            <div className="flex items-center gap-[8px]">
              <span className="text-[14px]" style={{ color: ui.body }}>
                Sort by:
              </span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none h-[36px] pl-[12px] pr-[32px] rounded-[4px] border bg-white text-[14px] outline-none"
                  style={{ borderColor: ui.borderLight, color: ui.body }}
                >
                  <option value="relevance">Most relevant</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="title">Title A–Z</option>
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2 size-[14px]"
                  style={{ color: ui.muted }}
                />
              </div>
            </div>
          )}
        </div>

        {pageItems.length > 0 ? (
          <ul className="flex flex-col gap-[12px]">
            {pageItems.map((article) => (
              <li key={article.title}>
                <button
                  type="button"
                  onClick={() => onOpenArticle(article)}
                  className="w-full text-left rounded-[8px] border bg-white px-[20px] py-[18px] hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-colors"
                  style={{ borderColor: ui.borderFaint }}
                >
                  <p
                    className="text-[17px] font-bold mb-[6px] leading-[22px]"
                    style={{ color: brand.navy }}
                  >
                    {article.title}
                  </p>
                  <p className="text-[14px] leading-[20px]" style={{ color: ui.mutedDark }}>
                    {resultSnippet(article)}
                  </p>
                  {showAiAssist && !compactSummary && article.summary && (
                    <span
                      className="mt-[10px] inline-flex items-center gap-[4px] text-[12px] font-medium"
                      style={{ color: host.aiSummaryAccent }}
                    >
                      <Sparkles className="size-[12px]" />
                      AI assist available
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center text-center py-[48px] px-[16px]">
            <FileSearch
              className="size-[56px] mb-[16px]"
              style={{ color: host.link }}
              strokeWidth={1.4}
            />
            <p className="text-[18px] font-bold mb-[8px]" style={{ color: brand.navy }}>
              No results – please try a different term.
            </p>
            <p className="text-[14px] max-w-[420px]" style={{ color: ui.muted }}>
              Your search{query ? `, ${query},` : ""} didn't match any results. Please try again
              using a different term.
            </p>
          </div>
        )}

        {total > 0 && (
          <div className="mt-[22px] flex items-center justify-between gap-[12px] flex-wrap">
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="appearance-none h-[36px] pl-[12px] pr-[32px] rounded-[4px] border bg-white text-[14px] outline-none"
                style={{ borderColor: ui.borderLight, color: ui.body }}
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2 size-[14px]"
                style={{ color: ui.muted }}
              />
            </div>
            <div className="flex items-center gap-[6px]">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="size-[32px] rounded-full flex items-center justify-center disabled:opacity-30 hover:bg-black/[0.04]"
                style={{ color: ui.muted }}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-[16px]" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(0, 7)
                .map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className="size-[32px] rounded-full text-[13px] font-semibold"
                    style={
                      n === safePage
                        ? { background: brand.navy, color: "#fff" }
                        : { color: ui.body }
                    }
                  >
                    {n}
                  </button>
                ))}
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="size-[32px] rounded-full flex items-center justify-center disabled:opacity-30 hover:bg-black/[0.04]"
                style={{ color: ui.muted }}
                aria-label="Next page"
              >
                <ChevronRight className="size-[16px]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
