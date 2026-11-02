import { HostBreadcrumb } from "./host/HostBreadcrumb";
import { FinAiSummary } from "./host/FinAiSummary";
import { UnitedFooter } from "./host/UnitedFooter";
import { X } from "lucide-react";
import { useTokens } from "../TokensContext";
import { useSkin } from "../SkinContext";
import { useDesignTokens } from "../DesignTokensContext";
import classroomImg from "../../imports/classroom.jpg";
import { AiAssistCard } from "./AiAssistCard";
import type { AiNudge } from "./AiNudgeChips";

const IMAGE_MAP: Record<string, string> = {
  "image-0": classroomImg,
  "image-1": classroomImg,
  "image-2": classroomImg,
  "image-3": classroomImg,
};

export interface ArticleDetails {
  title: string;
  subtitle: string;
  category: string;
  lastUpdated: string;
  content: string;
  image?: string;
  summary?: string;
}

export type ArticleAiNudge = AiNudge;

interface ArticlePanelProps {
  article: ArticleDetails | null;
  onClose?: () => void;
  /** Hide the close control (e.g. full-page article). */
  hideClose?: boolean;
  /** Follow-up nudges inside the AI summary card. */
  aiNudges?: ArticleAiNudge[];
  onAiNudge?: (nudge: ArticleAiNudge) => void;
  /** Hide the in-article AI summary card (e.g. when summary lives in AI zone). */
  hideSummary?: boolean;
  onHome?: () => void;
  onOpenArticle?: (article: ArticleDetails) => void;
  showAiAssist?: boolean;
  /** Thumbs up / down on the AI summary. Off unless the side panel enables it. */
  showSummaryFeedback?: boolean;
  /** Tighter padding for side panels. */
  compact?: boolean;
}

function HelpArticleLayout({
  article,
  onHome,
  onOpenArticle,
  showAiAssist = false,
  showSummaryFeedback = false,
  compact = false,
  onClose,
  hideClose = false,
}: {
  article: ArticleDetails;
  onHome?: () => void;
  onOpenArticle?: (article: ArticleDetails) => void;
  showAiAssist?: boolean;
  showSummaryFeedback?: boolean;
  compact?: boolean;
  onClose?: () => void;
  hideClose?: boolean;
}) {
  const { tokens } = useTokens();
  const { dt } = useDesignTokens();
  const { skin } = useSkin();
  const finStyle = !!skin.host.agent;
  const catalog = (tokens.articles?.learning ?? []) as ArticleDetails[];
  const suggested = catalog
    .filter((a) => a.title !== article.title && a.category === article.category)
    .slice(0, 6);
  const fallbackSuggested =
    suggested.length > 0
      ? suggested
      : catalog.filter((a) => a.title !== article.title).slice(0, 5);

  const blocks = article.content.split("\n\n").filter(Boolean).filter((b, i) => !(i === 0 && b.trim() === article.title.trim()));
  const optionBlocks = blocks.filter(
    (b) =>
      b.startsWith("How do I ") ||
      b.startsWith("What ") ||
      (b.includes("?") && b.length < 120 && !b.includes("\n")),
  );
  const bodyBlocks = blocks.filter((b) => !optionBlocks.includes(b));

  const link = dt.colors.host.link;
  const pageBg = dt.colors.host.pageBg;
  const body = dt.colors.ui.body;
  const muted = dt.colors.ui.mutedDark;
  const border = dt.colors.ui.borderFaint;
  const borderLight = dt.colors.ui.borderLight;
  const font = dt.fonts.families.body;

  return (
    <div className="h-full min-h-0 flex flex-col" style={{ background: pageBg, fontFamily: font }}>
      {!hideClose && onClose && (
        <div
          className="flex justify-end px-[12px] py-[8px] border-b bg-white shrink-0"
          style={{ borderColor: border }}
        >
          <button
            type="button"
            onClick={onClose}
            className="size-[28px] rounded-[6px] flex items-center justify-center hover:opacity-80"
            style={{ color: muted }}
            aria-label="Close article"
          >
            <X className="size-[16px]" />
          </button>
        </div>
      )}
      <div
        className={`flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          compact ? "px-[16px] py-[14px]" : finStyle ? "flex flex-col" : "px-[28px] py-[20px]"
        }`}
      >
        <div className={finStyle ? "flex-1 px-[24px] pt-[22px] pb-[56px]" : ""}>
        <div className={finStyle ? "max-w-[880px] mx-auto" : ""}>
          <HostBreadcrumb
            items={[
              { label: "Help Center", onClick: onHome },
              { label: article.category },
              { label: article.title },
            ]}
          />
        </div>

        <div className={`flex items-start ${compact ? "flex-col gap-[16px]" : "gap-[28px]"}`}>
          <div className={`flex-1 min-w-0 ${finStyle ? "max-w-[880px] mx-auto" : "max-w-[720px]"}`}>
            <h1
              className="text-[28px] sm:text-[32px] font-bold tracking-[-0.02em] leading-[1.2] mb-[20px]"
              style={{ color: body }}
            >
              {article.title}
            </h1>

            {finStyle && showAiAssist && article.summary && (
              <FinAiSummary
                lead={article.summary}
                sources={[{ title: article.title, source: "united.com/help" }]}
                showFeedback={showSummaryFeedback}
                onAsk={(q) => window.dispatchEvent(new CustomEvent("open-fin-chat", { detail: { query: q } }))}
              />
            )}

            {!finStyle && showAiAssist && article.summary && (
              <div
                className="mb-[20px] rounded-[8px] border bg-white p-[16px]"
                style={{ borderColor: border }}
              >
                <AiAssistCard
                  title="AI summary"
                  info={`Updated ${article.lastUpdated}`}
                  showFeedback={showSummaryFeedback}
                >
                  <p className="text-[14px] leading-[22px]" style={{ color: body }}>
                    {article.summary}
                  </p>
                </AiAssistCard>
              </div>
            )}

            <div className="space-y-[16px] mb-[8px]">
              {bodyBlocks.map((block, i) => {
                const nl = block.indexOf("\n");
                if (nl !== -1) {
                  return (
                    <div key={i}>
                      <p className="font-semibold text-[16px] mb-[8px]" style={{ color: body }}>
                        {block.slice(0, nl)}
                      </p>
                      <p className="text-[15px] leading-[24px]" style={{ color: body }}>
                        {block.slice(nl + 1)}
                      </p>
                    </div>
                  );
                }
                return (
                  <p key={i} className="text-[15px] leading-[24px]" style={{ color: body }}>
                    {block}
                  </p>
                );
              })}
            </div>

            {optionBlocks.length > 0 && (
              <div className="mt-[8px] mb-[8px]">
                <p className="text-[15px] font-semibold mb-[10px]" style={{ color: body }}>
                  Select one of these options for more information:
                </p>
                <ul className="list-disc pl-[22px] space-y-[8px]">
                  {optionBlocks.map((opt) => (
                    <li key={opt}>
                      <button
                        type="button"
                        className="text-left text-[15px] font-medium hover:underline"
                        style={{ color: link }}
                        onClick={() =>
                          onOpenArticle?.({ ...article, title: opt.split("\n")[0] })
                        }
                      >
                        {opt.split("\n")[0]}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-[28px] pt-[8px] flex items-center gap-[12px]">
              <span className="text-[13px]" style={{ color: body }}>
                Was this article helpful?
              </span>
              <button
                type="button"
                className="h-[32px] px-[16px] rounded-[6px] border bg-white text-[13px] font-semibold hover:opacity-90"
                style={{ borderColor: borderLight, color: body, background: dt.colors.fixed.white }}
              >
                Yes
              </button>
              <button
                type="button"
                className="h-[32px] px-[16px] rounded-[6px] border bg-white text-[13px] font-semibold hover:opacity-90"
                style={{ borderColor: borderLight, color: body, background: dt.colors.fixed.white }}
              >
                No
              </button>
            </div>
          </div>

          {!finStyle && (
          <aside
            className={`shrink-0 rounded-[8px] border bg-white p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${
              compact ? "w-full" : "w-[280px]"
            }`}
            style={{ borderColor: border }}
          >
            <h2 className="text-[16px] font-bold mb-[8px]" style={{ color: body }}>
              Suggested Articles
            </h2>
            <ul className="flex flex-col">
              {fallbackSuggested.map((a) => (
                <li key={a.title}>
                  <button
                    type="button"
                    onClick={() => onOpenArticle?.(a)}
                    className="w-full text-left py-[12px] border-b last:border-b-0 text-[14px] font-medium hover:underline leading-[18px]"
                    style={{ borderColor: border, color: link }}
                  >
                    {a.title}
                  </button>
                </li>
              ))}
            </ul>
          </aside>
          )}
        </div>
        </div>
        {finStyle && !compact && <UnitedFooter />}
      </div>
    </div>
  );
}

export function ArticlePanel({
  article,
  onClose,
  hideClose = false,
  aiNudges,
  onAiNudge,
  hideSummary = false,
  onHome,
  onOpenArticle,
  showAiAssist = false,
  showSummaryFeedback = false,
  compact = false,
}: ArticlePanelProps) {
  const { tokens } = useTokens();
  const { skin } = useSkin();
  const { dt } = useDesignTokens();
  const t = tokens.articlePanel;

  if (!article) return null;

  if (skin.layout.article === "help-article") {
    return (
      <HelpArticleLayout
        article={article}
        onHome={onHome}
        onOpenArticle={onOpenArticle}
        showAiAssist={!hideSummary && (showAiAssist || Boolean(article.summary))}
        showSummaryFeedback={showSummaryFeedback}
        compact={compact}
        onClose={onClose}
        hideClose={hideClose}
      />
    );
  }

  const heroSrc = article.image ? IMAGE_MAP[article.image] : null;
  const blocks = article.content.split("\n\n").filter(Boolean);
  const mid = Math.max(1, Math.floor(blocks.length / 2));
  const beforeImage = blocks.slice(0, mid);
  const afterImage = blocks.slice(mid);

  const showAiCard = Boolean(article.summary && !hideSummary);
  const suggestionLabels = (aiNudges ?? [])
    .filter((n) => n.kind !== "chat")
    .map((n) => n.label);

  const bodyColor = dt.colors.ui.body;
  const mutedColor = dt.colors.ui.mutedDark;
  const font = dt.fonts.families.body;

  const renderBlock = (block: string, index: number) => {
    const newlineIdx = block.indexOf("\n");
    if (newlineIdx !== -1) {
      const heading = block.slice(0, newlineIdx);
      const body = block.slice(newlineIdx + 1);
      return (
        <div key={index}>
          <p className="font-semibold mb-[4px]" style={{ color: "var(--color-navy, #1e1b4b)" }}>
            {heading}
          </p>
          <p>{body}</p>
        </div>
      );
    }
    return <p key={index}>{block}</p>;
  };

  return (
    <div className="backdrop-blur-[12px] bg-white/80 rounded-[33px] flex flex-col shadow-[0px_8px_30px_0px_rgba(0,0,0,0.06)] h-full min-h-0">
      <div className="px-[24px] pt-[36px] pb-[14px] border-b border-white/20 flex items-start justify-between flex-shrink-0">
        <div className="flex-1 min-w-0">
          <h2
            className="font-bold text-[26px] leading-[32px] mb-[8px]"
            style={{ fontFamily: font, color: bodyColor }}
          >
            {article.title}
          </h2>
          <p
            className="text-[13px] leading-[18px] mb-0"
            style={{ fontFamily: font, color: mutedColor }}
          >
            {t.lastUpdatedPrefix}
            {article.lastUpdated}
          </p>
        </div>
        {!hideClose && onClose && (
          <button
            onClick={onClose}
            className="p-[8px] hover:bg-white/30 rounded-[8px] transition-colors ml-[12px] flex-shrink-0"
          >
            <X className="w-[20px] h-[20px]" style={{ color: bodyColor }} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          className={`px-[24px] pb-[24px] flex flex-col gap-[20px] ${
            showAiCard ? "pt-[12px]" : "pt-[14px]"
          }`}
        >
          {showAiCard && (
            <AiAssistCard
              title="AI summary"
              info={`Based on this article · Updated ${article.lastUpdated}`}
              suggestions={suggestionLabels}
              showSuggestions={suggestionLabels.length > 0}
              showFeedback={showSummaryFeedback}
              onAsk={(query) => {
                const match = (aiNudges ?? []).find((n) => n.label === query);
                onAiNudge?.(match ?? { label: query, kind: "question" });
              }}
            >
              <p
                className="text-[14px] leading-[22px]"
                style={{ fontFamily: font, color: bodyColor }}
              >
                {article.summary}
              </p>
            </AiAssistCard>
          )}

          <div
            className="text-[15px] leading-[24px] space-y-[16px]"
            style={{ fontFamily: font, color: bodyColor }}
          >
            {beforeImage.map((block, i) => renderBlock(block, i))}
          </div>

          {heroSrc && (
            <div className="w-full h-[180px] overflow-hidden rounded-[16px]">
              <img src={heroSrc} alt={article.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div
            className="text-[15px] leading-[24px] space-y-[16px]"
            style={{ fontFamily: font, color: bodyColor }}
          >
            {afterImage.map((block, i) => renderBlock(block, mid + i))}
          </div>
        </div>
      </div>
    </div>
  );
}
