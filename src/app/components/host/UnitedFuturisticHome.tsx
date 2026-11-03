import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowUpRight, Plane } from "lucide-react";
import { SearchFirstPromptBar } from "../SearchFirstPromptBar";
import { UnitedFooter } from "./UnitedFooter";
import { useTokens } from "../../TokensContext";

interface UnitedFuturisticHomeProps {
  onSearch?: (query: string) => void;
  variant: "mirror" | "search-enhanced" | "conversational";
  showSuggestions?: boolean;
  showEscalation?: boolean;
}

const BLUE = "#1414D2";
const VIOLET = "#6B5BFF";
const CYAN = "#22D3EE";
const GRADIENT = `linear-gradient(120deg, ${BLUE} 0%, ${VIOLET} 55%, ${CYAN} 100%)`;

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
            className="col-start-1 row-start-1 justify-self-start whitespace-nowrap underline underline-offset-[3px] transition-all duration-500 ease-out hover:text-black/80"
            style={{
              color: "inherit",
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

const QUICK = ["Check in", "Baggage allowance", "Change or cancel", "Refunds and credits"];

const glass =
  "bg-white/65 backdrop-blur-xl border border-white/70 shadow-[0_10px_40px_rgba(20,20,210,0.10)]";

/** Aurora-glass take on the United help home: same content and Fin, a forward-looking skin. */
export function UnitedFuturisticHome({ onSearch, variant, showSuggestions = true, showEscalation = false }: UnitedFuturisticHomeProps) {
  const { tokens } = useTokens();
  const name = tokens.hero?.userName || "there";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="relative h-full min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ background: "#F4F6FF", color: "#0B0B1F" }}
    >
      {/* aurora */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[640px] overflow-hidden">
        <motion.div
          className="absolute -left-[120px] -top-[160px] size-[520px] rounded-full blur-[90px]"
          style={{ background: `${BLUE}40` }}
          animate={{ x: [0, 40, 0], y: [0, 24, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[-140px] top-[-100px] size-[460px] rounded-full blur-[90px]"
          style={{ background: `${CYAN}45` }}
          animate={{ x: [0, -36, 0], y: [0, 30, 0] }}
          transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-[35%] top-[120px] size-[380px] rounded-full blur-[100px]"
          style={{ background: `${VIOLET}33` }}
          animate={{ x: [0, 30, -20, 0], y: [0, -20, 14, 0] }}
          transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: "radial-gradient(rgba(20,20,210,0.18) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            maskImage: "linear-gradient(to bottom, black, transparent 85%)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent 85%)",
          }}
        />
      </div>

      {/* at least one screen tall, so the footer starts below the fold */}
      <div className="relative min-h-full flex flex-col justify-center">
      <div className="relative w-full max-w-[720px] mx-auto px-[24px] pt-[64px]">

        <h1 className="text-center text-balance text-[40px] sm:text-[44px] font-bold leading-[1.15] tracking-[-0.025em]">
          Hi {name}, your trip to{" "}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRADIENT }}>
            Paris is on schedule for tomorrow.
          </span>
        </h1>
        <p className="mt-[16px] flex items-baseline justify-center text-[16px] leading-[24px] text-black/60">
          <span>I can help you with:&nbsp;</span>
          <HelpCarousel items={HELP_TOPICS} onPick={onSearch} />
        </p>

        <div className={`mt-[32px] rounded-[24px] p-[12px] ${glass}`}>
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
          <div className="mt-[12px] flex flex-wrap items-center justify-center gap-[8px]">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onSearch?.(q)}
                className="rounded-full border border-white/80 bg-white/70 px-[12px] py-[6px] text-[13px] font-medium hover:bg-white hover:shadow-[0_4px_14px_rgba(20,20,210,0.14)] transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* trip widget: kept quiet so it does not compete with the search box */}
        <div className="mt-[24px] flex flex-wrap items-center gap-[16px] rounded-[24px] border border-black/[0.06] bg-white/45 px-[20px] py-[16px] backdrop-blur-md">
          <span className="size-[36px] rounded-[10px] bg-black/[0.05] flex items-center justify-center text-black/50">
            <Plane className="size-[17px]" />
          </span>
          <div className="shrink-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-black/40">Your next trip</p>
            <p className="whitespace-nowrap text-[15px] font-medium text-black/75">ORD → CDG · Departs tomorrow</p>
          </div>
          <div className="min-w-[120px] flex-1">
            <div className="flex justify-between text-[12px] text-black/45">
              <span>Check-in opens in 3h 12m</span>
            </div>
            <div className="mt-[6px] h-[3px] rounded-full bg-black/[0.08] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-black/35"
                initial={{ width: 0 }}
                animate={{ width: "75%" }}
                transition={{ duration: 1.1, ease: "easeOut", delay: 0.3 }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSearch?.("Check in")}
            className="inline-flex items-center gap-[6px] rounded-full border border-black/15 px-[14px] py-[8px] text-[13px] font-medium text-black/70 hover:bg-white/80 transition-colors"
          >
            Check in
            <ArrowUpRight className="size-[13px]" />
          </button>
        </div>

        <div className="pb-[64px]" />
      </div>
      </div>

      <UnitedFooter />
    </motion.div>
  );
}
