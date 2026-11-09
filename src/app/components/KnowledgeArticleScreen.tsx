import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArticlePanel, type ArticleAiNudge } from "./ArticlePanel";
import { AiAssistCard } from "./AiAssistCard";
import { ArticleZoneChat } from "./ArticleZoneChat";
import { useTokens } from "../TokensContext";
import { useSkin } from "../SkinContext";

export interface ArticleDetails {
  title: string;
  subtitle: string;
  category: string;
  lastUpdated: string;
  content: string;
  image?: string;
  summary?: string;
}

export interface ArticleBridgeContext {
  query: string;
  article: ArticleDetails;
}

export type ArticleLayoutVariant = "inline" | "ai-zone";

interface KnowledgeArticleScreenProps {
  article?: ArticleDetails | null;
  onEnableAi?: (ctx: ArticleBridgeContext) => void;
  layoutVariant?: ArticleLayoutVariant;
  showAiAssist?: boolean;
  showSummaryFeedback?: boolean;
}

function nudgesForArticle(article: ArticleDetails): ArticleAiNudge[] {
  const cat = article.category.toLowerCase();
  let questions: string[];

  if (cat.includes("dispute") || cat.includes("chargeback")) {
    questions = [
      "How long do I have to respond?",
      "What evidence do I need to submit?",
      "Where do I upload this in the Dashboard?",
    ];
  } else if (cat.includes("payout") || cat.includes("hold")) {
    questions = [
      "Why was my payout put on hold?",
      "How do I get the hold lifted?",
      "How long do holds usually last?",
    ];
  } else if (cat.includes("billing") || cat.includes("subscription")) {
    questions = [
      "Why was I charged mid-cycle?",
      "How do I view my invoice?",
      "Can I get a prorated refund?",
    ];
  } else {
    questions = [
      "Can you explain this in plain language?",
      "What should I do next?",
      "What are the key steps?",
    ];
  }

  return [
    ...questions.map((label) => ({ label, kind: "question" as const })),
    { label: "Start a chat", kind: "chat" as const },
  ];
}

function ArticleAiZoneIdle({
  article,
  nudges,
  onNudge,
  showSummaryFeedback = false,
}: {
  article: ArticleDetails;
  nudges: ArticleAiNudge[];
  onNudge: (nudge: ArticleAiNudge) => void;
  showSummaryFeedback?: boolean;
}) {
  const suggestionLabels = nudges
    .filter((n) => n.kind !== "chat")
    .map((n) => n.label);

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden px-[8px] pt-[18px] pb-[14px]">
      <AiAssistCard
        variant="plain"
        pinAskToBottom
        className="flex-1 min-h-0"
        title="AI summary"
        info={
          article.lastUpdated
            ? `Based on this article · Updated ${article.lastUpdated}`
            : undefined
        }
        suggestions={suggestionLabels}
        showSuggestions={suggestionLabels.length > 0}
        showFeedback={showSummaryFeedback}
        onAsk={(query) => {
          const match = nudges.find((n) => n.label === query);
          onNudge(match ?? { label: query, kind: "question" });
        }}
      >
        {article.summary ? (
          <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[14px] leading-[22px] text-[#1a1a2e]">
            {article.summary}
          </p>
        ) : (
          <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[14px] leading-[22px] text-[#6b7280]">
            Ask a question about this article to get started.
          </p>
        )}
      </AiAssistCard>
    </div>
  );
}

function ArticleAiZone({
  article,
  nudges,
  showSummaryFeedback = false,
}: {
  article: ArticleDetails;
  nudges: ArticleAiNudge[];
  showSummaryFeedback?: boolean;
}) {
  const [chatQuery, setChatQuery] = useState<string | null>(null);

  // Reset chat when switching articles
  useEffect(() => {
    setChatQuery(null);
  }, [article.title]);

  const startChat = (nudge: ArticleAiNudge) => {
    setChatQuery(
      nudge.kind === "chat" ? `Help me with: ${article.title}` : nudge.label,
    );
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {chatQuery ? (
        <motion.div
          key={`chat-${chatQuery}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="h-full min-h-0"
        >
          <ArticleZoneChat initialQuery={chatQuery} onBack={() => setChatQuery(null)} />
        </motion.div>
      ) : (
        <motion.div
          key="idle"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="h-full min-h-0"
        >
          <ArticleAiZoneIdle
            article={article}
            nudges={nudges}
            onNudge={startChat}
            showSummaryFeedback={showSummaryFeedback}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function KnowledgeArticleScreen({
  article: articleProp,
  onEnableAi,
  layoutVariant = "inline",
  showAiAssist = true,
  showSummaryFeedback = false,
}: KnowledgeArticleScreenProps) {
  const { tokens } = useTokens();
  const article = articleProp ?? tokens.articles.learning[0] ?? null;

  const aiNudges = useMemo(
    () => (article ? nudgesForArticle(article) : []),
    [article],
  );

  if (!article) return null;

  const handleInlineNudge = (nudge: ArticleAiNudge) => {
    onEnableAi?.({
      query:
        nudge.kind === "chat"
          ? `Help me with: ${article.title}`
          : nudge.label,
      article,
    });
  };

  const isAiZone = layoutVariant === "ai-zone" && showAiAssist;
  const { skin } = useSkin();
  /** Skyline pages run edge to edge so the site footer spans the whole browser width. */
  const fullBleed = !!skin.host.agent && !isAiZone;

  return (
    <motion.div
      key={`knowledge-article-${layoutVariant}-${showAiAssist}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex h-full w-full overflow-hidden ${
        isAiZone
          ? "flex-row gap-[16px] px-[16px] py-[14px]"
          : fullBleed
            ? "flex-col"
            : "flex-col items-center px-[24px] py-[16px]"
      }`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {isAiZone ? (
          <>
            <motion.div
              key="ai-zone"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              className="w-[360px] shrink-0 h-full min-h-0"
            >
              <ArticleAiZone
                article={article}
                nudges={aiNudges}
                showSummaryFeedback={showSummaryFeedback}
              />
            </motion.div>
            <motion.div
              key="article-split"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
              className="flex-1 min-w-0 h-full min-h-0"
            >
            <ArticlePanel
              article={article}
              hideClose
              hideSummary
            />
            </motion.div>
          </>
        ) : (
          <motion.div
            key="article-inline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`w-full flex-1 min-h-0 ${fullBleed ? "" : "max-w-[720px]"}`}
          >
            <ArticlePanel
              article={article}
              hideClose
              hideSummary={!showAiAssist}
              showAiAssist={showAiAssist}
              showSummaryFeedback={showSummaryFeedback}
              aiNudges={showAiAssist ? aiNudges : undefined}
              onAiNudge={showAiAssist ? handleInlineNudge : undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** Compact switch for In-article AI vs AI zone split (Google entry tab). */
export function ArticleLayoutSwitch({
  value,
  onChange,
}: {
  value: ArticleLayoutVariant;
  onChange: (value: ArticleLayoutVariant) => void;
}) {
  const options: { id: ArticleLayoutVariant; label: string }[] = [
    { id: "inline", label: "In-article AI" },
    { id: "ai-zone", label: "AI zone split" },
  ];

  return (
    <div className="flex items-center gap-[4px] p-[3px] rounded-[10px] bg-[#e8e8ed]/80 border border-[#d8d8e0]">
      {options.map(({ id, label }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`rounded-[8px] px-[12px] py-[6px] transition-all ${
              active
                ? "bg-white text-[#1a1a2e] shadow-[0px_1px_2px_rgba(0,0,0,0.06)]"
                : "text-[#6b7280] hover:text-[#374151]"
            }`}
          >
            <span className="font-['Plus_Jakarta_Sans',sans-serif] text-[12px] font-semibold whitespace-nowrap">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
