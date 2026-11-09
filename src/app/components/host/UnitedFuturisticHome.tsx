import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, ChevronDown, Plane } from "lucide-react";
import { SearchFirstPromptBar } from "../SearchFirstPromptBar";
import { useTokens } from "../../TokensContext";

interface UnitedFuturisticHomeProps {
  onSearch?: (query: string) => void;
  variant: "mirror" | "search-enhanced" | "conversational";
  showSuggestions?: boolean;
  showEscalation?: boolean;
}

// Skyline Airways palette
const BLUE = "#1E40C8";
const NAVY = "#0B2A66";
const RED = "#E5122B";
const INK = "#0B1B3F";
const GRADIENT = `linear-gradient(120deg, #1E3FC8 0%, #2F6BEA 100%)`;

const HELP_TOPICS = [
  { label: "check in your flight", query: "Check in" },
  { label: "check immigration requirements", query: "Immigration requirements for Paris" },
  { label: "book ground transportation in Paris", query: "Ground transportation in Paris" },
];

/** Rotates through short links in place; the slot is as wide as the longest one so the line never shifts. */
function HelpCarousel({ items, onPick }: { items: { label: string; query: string }[]; onPick?: (query: string) => void }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % items.length), 2800);
    return () => window.clearInterval(id);
  }, [items.length, paused]);
  return (
    <span
      className="inline-grid text-left"
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {items.map((t, k) => {
        const active = k === i;
        const prev = k === (i + items.length - 1) % items.length;
        return (
          <button
            key={t.label}
            type="button"
            tabIndex={active ? 0 : -1}
            aria-hidden={!active}
            onClick={() => onPick?.(t.query)}
            className="col-start-1 row-start-1 justify-self-start whitespace-nowrap font-semibold underline decoration-2 underline-offset-[4px] transition-all duration-500 ease-out hover:opacity-80"
            style={{
              color: NAVY,
              textDecorationColor: RED,
              opacity: active ? 1 : 0,
              pointerEvents: active ? "auto" : "none",
              transform: active ? "translateY(0)" : prev ? "translateY(-60%)" : "translateY(60%)",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </span>
  );
}

/** Quick-start menus: each chip opens five prompts that send the chosen question. */
const QUICK_MENUS: { label: string; prompts: string[] }[] = [
  {
    label: "Check in",
    prompts: [
      "How do I check in for my flight?",
      "When does check-in open?",
      "Can I check in at the airport?",
      "Where do I find my boarding pass?",
      "How do I add my boarding pass to my phone wallet?",
    ],
  },
  {
    label: "Baggage allowance",
    prompts: [
      "What is my carry-on allowance?",
      "How many bags can I check?",
      "What are the checked bag fees?",
      "Can I bring my pet on my trip to Paris?",
      "Can I bring sports equipment?",
    ],
  },
  {
    label: "Change or cancel",
    prompts: [
      "How do I change my flight?",
      "How do I cancel my flight?",
      "Can I change my seat after booking?",
      "Will I get a refund or a credit?",
      "Can I switch to an earlier flight today?",
    ],
  },
  {
    label: "Refunds and credits",
    prompts: [
      "How do I request a refund?",
      "How long do refunds take?",
      "How do I use a future flight credit?",
      "Where can I see my travel credits?",
      "Do my travel credits expire?",
    ],
  },
];

/** Chip row with one open dropdown at a time; closes on outside click, Esc or selection. */
function QuickMenus({ onPick }: { onPick?: (query: string) => void }) {
  const [open, setOpen] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open === null) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="mt-[12px] flex flex-wrap items-center justify-center gap-[8px]">
      {QUICK_MENUS.map((m, i) => {
        const on = open === i;
        return (
          <div key={m.label} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={on}
              onClick={() => setOpen(on ? null : i)}
              className={`inline-flex items-center gap-[6px] rounded-full border px-[12px] py-[6px] text-[13px] font-medium transition-all ${
                on
                  ? "border-[#1E40C8]/40 bg-white shadow-[0_4px_14px_rgba(30,64,200,0.14)]"
                  : "border-white/80 bg-white/70 hover:bg-white hover:shadow-[0_4px_14px_rgba(30,64,200,0.14)]"
              }`}
            >
              {m.label}
              <ChevronDown className={`size-[13px] text-black/45 transition-transform ${on ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {on && (
                <motion.div
                  role="menu"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className="absolute left-1/2 top-full z-40 mt-[8px] w-[320px] -translate-x-1/2 rounded-[16px] border border-black/[0.06] bg-white p-[8px] text-left shadow-[0_16px_40px_rgba(30,64,200,0.16)]"
                >
                  {m.prompts.map((q) => (
                    <button
                      key={q}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpen(null);
                        onPick?.(q);
                      }}
                      className="group flex w-full items-center justify-between gap-[12px] rounded-[10px] px-[12px] py-[8px] text-left text-[14px] leading-[20px] hover:bg-black/[0.04] transition-colors"
                    >
                      <span>{q}</span>
                      <ArrowUpRight className="size-[14px] shrink-0 text-black/0 group-hover:text-black/40 transition-colors" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

const glass =
  "bg-white/65 backdrop-blur-xl border border-white/70 shadow-[0_10px_40px_rgba(30,64,200,0.10)]";

/** Aurora-glass take on the Skyline help home: same content and Fin, a forward-looking skin. */
export function UnitedFuturisticHome({ onSearch, variant, showSuggestions = true, showEscalation = false }: UnitedFuturisticHomeProps) {
  const { tokens } = useTokens();
  const name = tokens.hero?.userName || "there";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="relative h-full min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ background: "linear-gradient(180deg, #A9CBF3 0%, #CFE2F8 34%, #EAF2FC 70%, #F5F9FE 100%)", color: INK }}
    >
      {/* a plain sky gradient with a fine grain over it */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.04  0 0 0 0 0.12  0 0 0 0 0.3  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* at least one screen tall, so the footer starts below the fold */}
      <div className="relative min-h-full flex flex-col justify-center">
      <div className="relative w-full max-w-[720px] mx-auto px-[24px] pt-[64px]">

        <h1 className="text-center text-balance text-[40px] sm:text-[44px] font-bold leading-[1.15] tracking-[-0.025em]">
          Hi {name}, your trip to{" "}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRADIENT }}>
            Paris is on schedule for tomorrow.
          </span>
        </h1>
        <p className="mt-[16px] flex items-baseline justify-center text-[16px] leading-[24px] text-[#52627F]">
          <span>I can help you with:&nbsp;</span>
          <HelpCarousel items={HELP_TOPICS} onPick={onSearch} />
        </p>

        <div className={`relative z-20 mt-[32px] rounded-[24px] p-[12px] ${glass}`}>
          {variant === "mirror" ? (
            <button
              type="button"
              onClick={() => onSearch?.(tokens.searchBar?.suggestions?.[0] ?? "Help")}
              className="w-full h-[56px] rounded-full bg-white px-[22px] text-left text-[15px] text-black/55"
            >
              {tokens.searchBar?.placeholder ?? "Search help topics and FAQs"}
            </button>
          ) : (
            // search-enhanced and fully conversational share this bar; conversational just skips results
            <SearchFirstPromptBar onSearch={onSearch} showSuggestions={showSuggestions} autoTypeText="pet policy" flush />
          )}
          <QuickMenus onPick={onSearch} />
        </div>

        {/* trip widget */}
        <div className="mt-[24px] flex flex-wrap items-center gap-[16px] rounded-[24px] border border-white/80 border-l-[3px] bg-white/85 px-[20px] py-[16px] shadow-[0_10px_30px_rgba(30,64,200,0.10)] backdrop-blur-md" style={{ borderLeftColor: RED }}>
          <span className="size-[40px] rounded-[12px] flex items-center justify-center" style={{ background: "#FDECEE", color: RED }}>
            <Plane className="size-[18px]" />
          </span>
          <div className="shrink-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#52627F]">Your next trip</p>
            <p className="whitespace-nowrap text-[16px] font-semibold" style={{ color: INK }}>ORD → CDG · Departs tomorrow</p>
          </div>
          <div className="min-w-[120px] flex-1">
            <div className="flex justify-between text-[12px] text-[#52627F]">
              <span>Check-in opens in 3h 12m</span>
            </div>
            <div className="mt-[6px] h-[4px] rounded-full bg-black/[0.08] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: NAVY }}
                initial={{ width: 0 }}
                animate={{ width: "75%" }}
                transition={{ duration: 1.1, ease: "easeOut", delay: 0.3 }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSearch?.("Check in")}
            className="inline-flex items-center gap-[6px] rounded-full px-[18px] py-[10px] text-[14px] font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: NAVY }}
          >
            Check in
            <ArrowUpRight className="size-[14px]" />
          </button>
        </div>

        <div className="pb-[64px]" />
      </div>
      </div>

    </motion.div>
  );
}
