import { useLayoutEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useDesignTokens } from "../../DesignTokensContext";
import { AiSummaryFeedback } from "../AiAssistCard";
import { FinCitation } from "./FinCitation";

export interface SummarySource {
  title: string;
  source: string;
  onOpen?: () => void;
}

interface FinAiSummaryProps {
  /** Lead sentence; its key phrase is highlighted. Clamped to three lines with View more. */
  lead: string;
  /** Optional detail copy; {{n}} markers become citation badges for sources[n - 1]. */
  body?: string;
  sources?: SummarySource[];
  /** Suggested follow-up tiles shown under the summary; clicking one sends it to Fin. */
  suggestions?: string[];
  /** Sends a question to Fin; omit to hide the chat box. */
  onAsk?: (query: string) => void;
  showFeedback?: boolean;
}

/** Skyline-style AI summary card shared by the search results and article pages. */
/** Splits a sentence into [before, key phrase, after] so the answer can be highlighted. */
function splitHighlight(s: string): [string, string, string] {
  const m = s.match(/^(.{24,100}?)(?=,| then | and |;|\.|$)/);
  const hl = m ? m[1] : s;
  return ["", hl, s.slice(hl.length)];
}

export function FinAiSummary({ lead, body, sources = [], suggestions = [], onAsk, showFeedback = false }: FinAiSummaryProps) {
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

  const [before, hl, after] = splitHighlight(lead);
  const renderBody = (text: string) =>
    text.split(/\{\{(\d+)\}\}/).map((part, i) => {
      if (i % 2 === 0) return <span key={i}>{part}</span>;
      const s = sources[Number(part) - 1];
      return s ? <FinCitation key={i} n={Number(part)} title={s.title} source={s.source} onOpen={s.onOpen} /> : null;
    });

  const submit = () => {
    const q = draft.trim();
    if (!q) return;
    setDraft("");
    onAsk?.(q);
  };

  return (
    <div
      className="mb-[18px] rounded-[10px] border bg-white overflow-hidden"
      style={{ borderColor: "#D6D6D6", borderTop: `4px solid ${host.link}` }}
    >
      <div className="px-[18px] pt-[16px] pb-[14px]">
        <div className="flex items-center mb-[14px]">
          <span className="text-[16px] font-semibold" style={{ color: host.link }}>
            AI Summary
          </span>
        </div>
        <p
          ref={ref}
          className={`text-[15px] leading-[22px] mb-[4px] ${expanded ? "" : "line-clamp-3"}`}
          style={{ color: ui.body }}
        >
          {before}
          <mark
            className="rounded-[3px] px-[2px] font-semibold text-inherit"
            style={{ background: `${host.link}26`, boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}
          >
            {hl}
          </mark>
          {after}
          {body ? " " : ""}
          {body ? renderBody(body) : sources.map((s, i) => <FinCitation key={s.title} n={i + 1} title={s.title} source={s.source} onOpen={s.onOpen} />)}
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
        {showFeedback && <AiSummaryFeedback />}
      </div>

      {onAsk && (
        <div className="px-[18px] pb-[14px]">
          <div
            className={`relative rounded-[999px] p-[1.5px] transition-shadow duration-200 ${
              focused ? "shadow-[0_0_0_3px_rgba(20,20,210,0.14)]" : "shadow-[0_2px_10px_rgba(15,40,50,0.06)]"
            }`}
            style={{ background: focused ? host.link : ui.borderLight }}
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
          {suggestions.length > 0 && (
          <div className="mt-[12px] flex flex-wrap gap-[8px]">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onAsk(s)}
                className="rounded-full border bg-white px-[14px] py-[8px] text-[13px] font-medium transition-colors hover:border-current"
                style={{ borderColor: ui.borderLight, color: host.link }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
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
