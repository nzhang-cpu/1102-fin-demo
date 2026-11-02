import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  Download,
  Maximize2,
  MoreHorizontal,
  Search,
  X,
} from "lucide-react";
import { FinComposer } from "./FinComposer";
import { FinCitedText, FinThinking } from "./FinCitation";
import { useDesignTokens } from "../../DesignTokensContext";
import { useTokens } from "../../TokensContext";
import { useSkin } from "../../SkinContext";

interface MessengerMessage {
  id: number;
  role: "user" | "agent";
  text: string;
  source?: string;
  at: Date;
}

function clock(d: Date) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function FinAvatar() {
  const { skin } = useSkin();
  return (
    <span className="shrink-0 size-[32px] rounded-full bg-black text-white flex items-center justify-center">
      <img src={skin.host.agent?.logo} alt="Fin" className="size-[18px]" />
    </span>
  );
}

/** Small light-themed messenger window opened from the host chat button. */
export function FinMessenger({
  onClose,
  onExpand,
}: {
  onClose: () => void;
  onExpand?: (lastQuestion?: string) => void;
}) {
  const { dt } = useDesignTokens();
  const { tokens } = useTokens();
  const { skin } = useSkin();
  const host = dt.colors.host;
  const ui = dt.colors.ui;
  const agent = skin.host.agent;
  const label = agent?.label ?? "Fin";

  const [messages, setMessages] = useState<MessengerMessage[]>([
    {
      id: 0,
      role: "agent",
      text: agent?.greeting ?? "How can I help you today?",
      at: new Date(),
    },
  ]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [doneIds, setDoneIds] = useState<Set<number>>(() => new Set([0]));
  const [menuOpen, setMenuOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    // keep the long greeting readable from its first line until the chat gets going
    if (messages.length === 1 && !typing) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const answerFor = (q: string) => {
    const words = q.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
    const articles = tokens.articles?.learning ?? [];
    let best: (typeof articles)[number] | null = null;
    let bestScore = 0;
    for (const a of articles) {
      const hay = `${a.title} ${a.summary} ${a.category}`.toLowerCase();
      const score = words.filter((w) => hay.includes(w)).length;
      if (score > bestScore) {
        best = a;
        bestScore = score;
      }
    }
    return best
      ? { text: best.summary, source: best.title }
      : {
          text: "I couldn't find that in our help articles. I can connect you with the team if you'd like.",
          source: undefined,
        };
  };

  const send = (preset?: string) => {
    const text = (preset ?? draft).trim();
    if (!text || typing) return;
    setDraft("");
    setMessages((m) => [...m, { id: nextId.current++, role: "user", text, at: new Date() }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [
        ...m,
        { id: nextId.current++, role: "agent", ...answerFor(text), at: new Date() },
      ]);
    }, 1100);
  };

  const downloadTranscript = () => {
    const body = messages
      .map((m) => `[${clock(m.at)}] ${m.role === "agent" ? label : "You"}: ${m.text}`)
      .join("\n\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "fin-transcript.txt";
    a.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  const visible = filter.trim()
    ? messages.filter((m) => m.text.toLowerCase().includes(filter.trim().toLowerCase()))
    : messages;

  const menuItem = "w-full flex items-center gap-[12px] px-[14px] py-[10px] text-[14px] hover:bg-black/[0.04] text-left";

  return (
    <div
      className="absolute bottom-[84px] right-[20px] z-30 w-[380px] max-w-[calc(100%-24px)] h-[560px] max-h-[calc(100%-100px)] min-h-[320px] flex flex-col rounded-[20px] bg-white overflow-hidden border shadow-[0_16px_48px_rgba(0,0,0,0.22)]"
      style={{ borderColor: ui.borderFaint, color: ui.body }}
      role="dialog"
      aria-label={`Chat with ${label}`}
    >
      <div
        className="shrink-0 flex items-center gap-[10px] px-[14px] py-[12px] border-b"
        style={{ borderColor: ui.borderFaint }}
      >
        <button type="button" onClick={onClose} aria-label="Back" className="p-[2px] hover:opacity-70">
          <ChevronLeft className="size-[18px]" />
        </button>
        <FinAvatar />
        <div className="min-w-0 flex-1 leading-[18px]">
          <p className="text-[15px] font-bold">Fin</p>
          <p className="text-[12px]" style={{ color: ui.muted }}>
            The team can also help
          </p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="More options"
            className="p-[4px] hover:opacity-70"
          >
            <MoreHorizontal className="size-[18px]" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-[30px] w-[210px] rounded-[12px] bg-white border shadow-[0_8px_24px_rgba(0,0,0,0.16)] py-[6px] z-10"
              style={{ borderColor: ui.borderFaint }}
            >
              <button
                type="button"
                className={menuItem}
                onClick={() => {
                  const lastQuestion = [...messages].reverse().find((x) => x.role === "user")?.text;
                  setMenuOpen(false);
                  onExpand ? onExpand(lastQuestion) : onClose();
                }}
              >
                <Maximize2 className="size-[16px]" /> Expand window
              </button>
              <button
                type="button"
                className={menuItem}
                onClick={() => {
                  setSearching((v) => !v);
                  setMenuOpen(false);
                }}
              >
                <Search className="size-[16px]" /> Search conversation
              </button>
              <button type="button" className={menuItem} onClick={downloadTranscript}>
                <Download className="size-[16px]" /> Download transcript
              </button>
            </div>
          )}
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="p-[4px] hover:opacity-70">
          <X className="size-[18px]" />
        </button>
      </div>

      {searching && (
        <div className="shrink-0 px-[14px] py-[8px] border-b" style={{ borderColor: ui.borderFaint }}>
          <input
            autoFocus
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search conversation"
            className="w-full h-[32px] rounded-full px-[12px] text-[13px] outline-none border"
            style={{ borderColor: ui.borderLight }}
          />
        </div>
      )}

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-[14px] py-[16px] flex flex-col gap-[14px]">
        {visible.map((m) =>
          m.role === "agent" ? (
            <div key={m.id} className="flex items-start gap-[8px] max-w-[92%]">
              <FinAvatar />
              <div className="flex flex-col items-start min-w-0">
                <div
                  className="rounded-[18px] px-[16px] py-[10px] text-[14px] leading-[21px]"
                  style={{ background: host.chatAgentBubble }}
                >
                  <FinCitedText
                    animate={m.id !== 0}
                    onDone={() => setDoneIds((d) => (d.has(m.id) ? d : new Set(d).add(m.id)))}
                    text={m.text}
                    citations={m.source ? [{ title: m.source, source: "united.com/help" }] : []}
                  />
                </div>
                <span
                  className="mt-[4px] px-[4px] text-[11px] transition-opacity duration-200"
                  style={{ color: ui.muted, opacity: doneIds.has(m.id) ? 1 : 0 }}
                >
                  {label} · {clock(m.at)}
                </span>
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex flex-col items-end self-end max-w-[80%]">
              <div
                className="rounded-[18px] px-[16px] py-[10px] text-[14px] leading-[21px] text-white"
                style={{ background: host.chatUserBubble }}
              >
                {m.text}
              </div>
              <span className="mt-[4px] px-[4px] text-[11px]" style={{ color: ui.muted }}>
                {clock(m.at)}
              </span>
            </div>
          ),
        )}
        {messages.length === 1 && !typing && agent?.suggestions && (
          <div className="mt-auto flex flex-col items-end gap-[8px]">
            {agent.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="max-w-full rounded-full border bg-white px-[14px] py-[8px] text-[13px] text-right hover:bg-black/[0.03] transition-colors"
                style={{ borderColor: host.chatUserBubble, color: host.chatUserBubble }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {typing && (
          <div className="self-start flex items-start gap-[8px]">
            <FinAvatar />
            <FinThinking background={host.chatAgentBubble} dot={ui.muted} />
          </div>
        )}
      </div>

      <div className="shrink-0 p-[14px]">
        <FinComposer value={draft} onChange={setDraft} onSend={() => send()} disabled={typing} />
      </div>
    </div>
  );
}
