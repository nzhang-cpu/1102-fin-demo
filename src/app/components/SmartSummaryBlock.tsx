import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AiAssistCard } from "./AiAssistCard";

export interface SummaryCitation {
  id: number;
  label: string;
  title: string;
  subtitle: string;
  lastUpdated: string;
  excerpt: string;
}

export interface SmartSummaryModel {
  question: string;
  /** Plain sentence with the key fact called out separately for highlight. */
  leadBefore: string;
  highlight: string;
  leadAfter: string;
  detail: string;
  citations: SummaryCitation[];
  info: string;
}

interface ArticleLike {
  title: string;
  subtitle: string;
  category: string;
  lastUpdated: string;
  content: string;
  summary?: string;
}

function excerptFrom(article: ArticleLike, max = 140) {
  const raw = (article.summary || article.content || "").replace(/\s+/g, " ").trim();
  if (raw.length <= max) return raw;
  return raw.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

function citationFrom(article: ArticleLike | undefined, id: number, fallbackTitle: string): SummaryCitation {
  if (!article) {
    return {
      id,
      label: fallbackTitle,
      title: fallbackTitle,
      subtitle: "",
      lastUpdated: "",
      excerpt: "",
    };
  }
  return {
    id,
    label: article.title,
    title: article.title,
    subtitle: article.subtitle,
    lastUpdated: article.lastUpdated,
    excerpt: excerptFrom(article),
  };
}

const STOPWORDS = new Set([
  "how", "do", "does", "can", "what", "when", "where", "why", "the", "and", "for", "you", "your", "with",
  "are", "was", "will", "have", "has", "get", "need", "want", "about", "tell", "more", "from", "this", "that",
]);

function queryWords(query: string) {
  return query
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .map((w) => w.replace(/s$/, ""));
}

/** Rank catalog articles by how well they match the query words (title > category > body). */
function rankArticles(query: string, catalog: ArticleLike[]) {
  const words = queryWords(query);
  return catalog
    .map((a) => {
      const title = a.title.toLowerCase();
      const cat = a.category.toLowerCase();
      const body = `${a.summary ?? ""} ${a.subtitle} ${a.content}`.toLowerCase();
      const score = words.reduce(
        (s, w) => s + (title.includes(w) ? 3 : 0) + (cat.includes(w) ? 2 : 0) + (body.includes(w) ? 1 : 0),
        0,
      );
      return { a, score };
    })
    .filter((r) => r.score > 0)
    .sort((x, y) => y.score - x.score)
    .map((r) => r.a);
}

/** Summary drawn from the best-matching knowledge articles, for catalogs without hand-written answers. */
function summaryFromCatalog(query: string, catalog: ArticleLike[]): SmartSummaryModel {
  const ranked = rankArticles(query, catalog);
  const top = ranked[0] ?? catalog[0];
  const second = ranked[1];
  const bodies = top.content
    .split("\n\n")
    .slice(1)
    .map((block) => {
      const nl = block.indexOf("\n");
      return (nl === -1 ? block : block.slice(nl + 1)).trim();
    })
    .filter(Boolean);
  const first = bodies[0] ?? "";
  const rest = bodies.slice(1).join(" ");
  const detail = [
    `${first}{{1}} ${rest}`.trim(),
    second ? `Related: ${second.summary ?? second.subtitle}{{2}}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  const count = second ? 2 : 1;
  return {
    question: top.title,
    leadBefore: "",
    highlight: top.summary ?? top.subtitle,
    leadAfter: "",
    detail,
    citations: [citationFrom(top, 1, top.title), ...(second ? [citationFrom(second, 2, second.title)] : [])],
    info: `Based on ${count} knowledge article${count > 1 ? "s" : ""} · Updated ${top.lastUpdated}`,
  };
}

/** Build a direct-answer summary tuned to the query (demo content). */
export function buildSmartSummary(query: string, catalog: ArticleLike[]): SmartSummaryModel {
  const q = query.toLowerCase();
  const byTitle = (partial: string) =>
    catalog.find((a) => a.title.toLowerCase().includes(partial.toLowerCase()));

  const hasCuratedCatalog = Boolean(byTitle("Respond to a Dispute"));
  if (!hasCuratedCatalog && catalog.length > 0) return summaryFromCatalog(query, catalog);

  const disputeArticle = byTitle("Respond to a Dispute") ?? catalog[0];
  const payoutArticle = byTitle("Payout on Hold") ?? catalog[1];
  const billingArticle = byTitle("Proration") ?? catalog[2];

  if (q.includes("payout") || q.includes("hold")) {
    return {
      question: "Why is my payout on hold, and what should I do?",
      leadBefore: "Most holds are caused by ",
      highlight: "incomplete verification, a dispute spike, or unusual volume",
      leadAfter: ".",
      detail:
        "Start in Dashboard → Account details and clear every red-flagged field. Upload a clear government ID, business registration, and a verified bank account — verification holds usually clear within a few business days once documents are accepted.{{1}} Blurry scans, expired IDs, and name mismatches are the most common reasons uploads get rejected, so resubmit higher-resolution files if you see a retry prompt.\n\nIf Account details looks complete, the hold is often risk-related. A sudden rise in disputes can pause payouts until open cases are answered and you reply to any review email with context about recent volume or chargebacks.{{2}} Resolving Needs response disputes first is usually the fastest path to lifting a risk hold.\n\nUnusual sales spikes can also trigger an automated review even when your dispute rate is normal. If you planned a promotion, include dates and expected volume when you contact support. Keep an eye on Balances for reserved vs available funds, and open a case with your account ID if the hold lasts more than a few business days with no Dashboard guidance.",
      citations: [
        citationFrom(payoutArticle, 1, "Payout holds guide"),
        citationFrom(disputeArticle, 2, "Dispute response guide"),
      ],
      info: "Based on 2 knowledge articles · Updated May 2026",
    };
  }

  if (
    q.includes("proration") ||
    q.includes("billing") ||
    q.includes("subscription") ||
    q.includes("invoice") ||
    q.includes("upgrade")
  ) {
    return {
      question: "Why was I charged when I upgraded mid-cycle?",
      leadBefore: "An immediate charge is expected — Stripe bills ",
      highlight: "the prorated difference for the rest of the current period",
      leadAfter: ".",
      detail:
        "Your billing cycle anchor (renewal date) does not change when you upgrade. Stripe credits the unused portion of the old plan and charges the cost of the new plan for the remaining days, which appears as a proration line on the invoice right away.{{1}} The next full period then invoices at the new plan price with no extra mid-cycle adjustment.\n\nOpen Billing → Invoices, find the charge, and expand line items to see the credit and debit that make up the prorated amount.{{2}} Download the PDF if you need to share it with finance. If the math looks wrong, open a support case with the invoice ID and subscription ID and describe the expected vs actual charge.\n\nDowngrades usually take effect at period end by default so you are not issued an immediate credit. Immediate cancels or mid-cycle refunds may require a manual credit note. If tax is enabled, confirm whether tax was recalculated on the prorated lines before disputing the total.",
      citations: [
        citationFrom(billingArticle, 1, "Billing & proration guide"),
        citationFrom(billingArticle, 2, "Billing & proration guide"),
      ],
      info: "Based on 1 knowledge article · Updated May 2026",
    };
  }

  return {
    question: "How long do I have to respond to a chargeback?",
    leadBefore: "You typically have ",
    highlight: "7–21 days to submit a response",
    leadAfter: ", depending on the card network.",
    detail:
      "The deadline on the dispute detail page in Payments → Disputes is authoritative for that case — do not rely on the email alone. Match your evidence pack to the reason code: delivery confirmation and tracking for product-not-received, product photos and descriptions for not-as-described, and authorization proof for fraud.{{1}} Submit PDFs or images under Submit evidence before the countdown expires; late submissions are usually auto-lost.\n\nAfter you submit, the card issuer reviews your package. Most networks take about 60–75 days to decide, and you will see status updates in the Dashboard plus email when the case is won or lost.{{2}} If funds were reversed at dispute open, a win returns them to your Stripe balance; a loss keeps the reverse and may add a dispute fee.\n\nTo reduce repeat chargebacks, use a recognizable billing descriptor, send tracking as soon as you ship, and answer buyer questions quickly. If several disputes share the same reason code, fix the underlying fulfillment or descriptor issue before the next spike triggers a payout review.",
    citations: [
      citationFrom(disputeArticle, 1, "Dispute response guide"),
      citationFrom(
        disputeArticle
          ? { ...disputeArticle, subtitle: "Issuer review window after evidence is submitted." }
          : undefined,
        2,
        "Dispute timeline",
      ),
    ],
    info: "Based on 2 knowledge articles · Updated May 2026",
  };
}

function CitationMark({
  citation,
  onOpen,
}: {
  citation: SummaryCitation;
  onOpen?: (citation: SummaryCitation) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex align-super"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => onOpen?.(citation)}
        className="ml-[2px] px-[4px] h-[16px] min-w-[16px] rounded-[4px] bg-[#001769]/[0.08] hover:bg-[#001769]/[0.14] font-['Plus_Jakarta_Sans',sans-serif] text-[10px] font-semibold text-[#001769] leading-none transition-colors"
        aria-label={`Source ${citation.id}: ${citation.title}`}
      >
        {citation.id}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1/2 -translate-x-1/2 top-[22px] z-50 w-[280px] rounded-[12px] bg-white border border-[#e4e4ea] shadow-[0_12px_32px_rgba(0,0,0,0.12)] p-[14px] text-left"
          >
            <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[10px] font-semibold tracking-[0.08em] uppercase text-[#9ca3af] mb-[6px]">
              Source {citation.id}
            </p>
            <p className="font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-[13px] leading-[18px] text-[#1a1a2e] mb-[4px]">
              {citation.title}
            </p>
            {citation.subtitle && (
              <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[12px] leading-[16px] text-[#6b7280] mb-[8px]">
                {citation.subtitle}
              </p>
            )}
            {citation.excerpt && (
              <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[11px] leading-[16px] text-[#6b7280] line-clamp-3 border-t border-[#f0f0f4] pt-[8px]">
                {citation.excerpt}
              </p>
            )}
            {citation.lastUpdated && (
              <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[10px] text-[#9ca3af] mt-[8px]">
                Updated {citation.lastUpdated}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

function DetailWithCitations({
  text,
  citations,
  onOpenCitation,
}: {
  text: string;
  citations: SummaryCitation[];
  onOpenCitation?: (c: SummaryCitation) => void;
}) {
  const parts = text.split(/(\{\{\d+\}\})/g);
  const byId = new Map(citations.map((c) => [c.id, c]));

  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\{\{(\d+)\}\}$/);
        if (match) {
          const id = Number(match[1]);
          const citation = byId.get(id);
          if (!citation) return null;
          return <CitationMark key={`c-${i}`} citation={citation} onOpen={onOpenCitation} />;
        }
        return <span key={`t-${i}`}>{part}</span>;
      })}
    </>
  );
}

interface SmartSummaryBlockProps {
  model: SmartSummaryModel;
  /** Quiet follow-up suggestion pills under the ask input. */
  suggestions?: string[];
  onAsk?: (query: string) => void;
  onCitationClick?: (citation: SummaryCitation) => void;
  showAskInput?: boolean;
  showSuggestions?: boolean;
  showFeedback?: boolean;
}

export function SmartSummaryBlock({
  model,
  suggestions = [],
  onAsk,
  onCitationClick,
  showAskInput = true,
  showSuggestions = true,
  showFeedback = false,
}: SmartSummaryBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const detailParagraphs = model.detail.split(/\n\n+/).filter(Boolean);
  const extraParagraphs = detailParagraphs.slice(1);

  return (
    <AiAssistCard
      title="Smart summary"
      info={model.info}
      suggestions={suggestions}
      onAsk={onAsk}
      showAskInput={showAskInput}
      showSuggestions={showSuggestions}
      showFeedback={showFeedback}
    >
      <div className={expanded ? undefined : "relative"}>
        <div className={expanded ? undefined : "line-clamp-3"}>
          <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[14px] leading-[22px] text-[#1a1a2e]">
            {model.leadBefore}
            <mark className="bg-[#dce8ff] text-[#001769] font-semibold px-[3px] rounded-[3px]">
              {model.highlight}
            </mark>
            {model.leadAfter}
            {model.citations[0] && (
              <CitationMark citation={model.citations[0]} onOpen={onCitationClick} />
            )}{" "}
            <DetailWithCitations
              text={detailParagraphs[0] ?? ""}
              citations={model.citations}
              onOpenCitation={onCitationClick}
            />
            {expanded && extraParagraphs.length === 0 && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="inline font-['Plus_Jakarta_Sans',sans-serif] text-[14px] leading-[22px] font-semibold text-[#001769] hover:underline"
                >
                  View less
                </button>
              </>
            )}
          </p>
          {expanded &&
            extraParagraphs.map((paragraph, i) => {
              const isLast = i === extraParagraphs.length - 1;
              return (
                <p
                  key={i}
                  className="mt-[12px] font-['Plus_Jakarta_Sans',sans-serif] text-[14px] leading-[22px] text-[#1a1a2e]"
                >
                  <DetailWithCitations
                    text={paragraph}
                    citations={model.citations}
                    onOpenCitation={onCitationClick}
                  />
                  {isLast && (
                    <>
                      {" "}
                      <button
                        type="button"
                        onClick={() => setExpanded(false)}
                        className="inline font-['Plus_Jakarta_Sans',sans-serif] text-[14px] leading-[22px] font-semibold text-[#001769] hover:underline"
                      >
                        View less
                      </button>
                    </>
                  )}
                </p>
              );
            })}
        </div>

        {!expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="absolute bottom-0 right-0 pl-[36px] font-['Plus_Jakarta_Sans',sans-serif] text-[14px] leading-[22px] font-semibold text-[#001769] hover:underline"
            style={{
              background:
                "linear-gradient(to right, rgba(255,255,255,0), #ffffff 28%, #ffffff 100%)",
            }}
          >
            View more
          </button>
        )}
      </div>
    </AiAssistCard>
  );
}
