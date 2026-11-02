import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Send } from "lucide-react";
import { useDesignTokens } from "../../DesignTokensContext";
import { AiSummaryFeedback } from "../AiAssistCard";

interface FinAiSummaryProps {
  /** Summary copy; may include inline links. Clamped to three lines with View more. */
  children: ReactNode;
  /** Sends a question to Fin; omit to hide the chat box. */
  onAsk?: (query: string) => void;
  showFeedback?: boolean;
}

/** United-style AI summary card shared by the search results and article pages. */
export function FinAiSummary({ children, onAsk, showFeedback = false }: FinAiSummaryProps) {
  const { dt } = useDesignTokens();
  const host = dt.colors.host;
  const ui = dt.colors.ui;
  const brand = dt.colors.brand;
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && !expanded) setOverflows(el.scrollHeight > el.clientHeight + 1);
  });

  const submit = () => {
    const q = draft.trim();
    if (!q) return;
    setDraft("");
    onAsk?.(q);
  };

  return (
    <div
      className="mb-[18px] rounded-[10px] border overflow-hidden shadow-[0_1px_2px_rgba(13,115,119,0.04)]"
      style={{
        borderColor: `${host.aiSummaryAccent}33`,
        background: `linear-gradient(to bottom, ${host.aiSummaryBg}, ${host.pageBg})`,
      }}
    >
      <div className="px-[18px] pt-[16px] pb-[14px]">
        <div className="flex items-center gap-[8px] mb-[10px]">
          <span className="text-[15px] font-bold" style={{ color: brand.navy }}>
            AI Summary
          </span>
        </div>
        <p
          ref={ref}
          className={`text-[15px] leading-[22px] mb-[4px] ${expanded ? "" : "line-clamp-3"}`}
          style={{ color: ui.body }}
        >
          {children}
        </p>
        {(overflows || expanded) && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mb-[10px] text-[14px] font-semibold hover:underline"
            style={{ color: host.link }}
          >
            {expanded ? "View less" : "View more"}
          </button>
        )}
        <div className="flex items-start justify-between gap-[12px] flex-wrap">
          <p className="text-[12px] leading-[16px] flex-1 min-w-[180px]" style={{ color: ui.muted }}>
            Summarized by AI, so it may occasionally be wrong. Please don’t share payment or ID numbers.
          </p>
          {showFeedback && <AiSummaryFeedback />}
        </div>
      </div>

      {onAsk && (
        <div className="px-[18px] pb-[14px]">
          <div
            className={`relative rounded-[999px] p-[1.5px] transition-shadow duration-200 ${
              focused
                ? "shadow-[0_0_0_3px_rgba(13,115,119,0.12),0_8px_24px_rgba(13,115,119,0.12)]"
                : "shadow-[0_2px_10px_rgba(15,40,50,0.06)]"
            }`}
            style={{
              background: focused
                ? `linear-gradient(110deg, ${host.aiSummaryAccent} 0%, #1A8FA8 45%, ${host.link} 100%)`
                : "linear-gradient(110deg, #C5D5DC 0%, #D7E2E8 50%, #C9D4E0 100%)",
            }}
          >
            <div className="flex items-center gap-[8px] rounded-full bg-white pl-[16px] pr-[6px] py-[6px]">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder="Chat with Fin"
                className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[14px] placeholder:opacity-50"
                style={{ color: brand.navy }}
                aria-label="Chat with Fin"
              />
              <button
                type="button"
                onClick={submit}
                disabled={!draft.trim()}
                className="size-[34px] rounded-full flex items-center justify-center shrink-0 transition-all"
                style={
                  draft.trim()
                    ? { background: host.aiSummaryAccent, color: "#fff" }
                    : { background: ui.bgInput, color: ui.muted }
                }
                aria-label="Send question"
              >
                <Send className="size-[14px]" strokeWidth={2.2} />
              </button>
            </div>
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
          {["Yes", "No"].map((l) => (
            <button
              key={l}
              type="button"
              className="h-[32px] px-[16px] rounded-[4px] border bg-white text-[13px] font-semibold hover:opacity-90"
              style={{ borderColor: host.searchCta, color: brand.navy }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
