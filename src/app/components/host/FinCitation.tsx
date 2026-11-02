import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { createPortal } from "react-dom";
import { Link2 } from "lucide-react";
import { useDesignTokens } from "../../DesignTokensContext";

interface FinCitationProps {
  n: number;
  title: string;
  /** Domain-style label shown above the title in the hover card. */
  source: string;
  onOpen?: () => void;
}

/** Numbered citation badge with a dark hover card, rendered inline at the end of a sentence. */
export function FinCitation({ n, title, source, onOpen }: FinCitationProps) {
  const { dt } = useDesignTokens();
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const half = 150;
    const x = Math.min(Math.max(r.left + r.width / 2, half + 8), window.innerWidth - half - 8);
    setPos({ x, y: r.top });
  };

  return (
    <>
      <button
        ref={ref}
        type="button"
        onClick={onOpen}
        onMouseEnter={show}
        onMouseLeave={() => setPos(null)}
        onFocus={show}
        onBlur={() => setPos(null)}
        className="inline-flex items-center justify-center align-baseline ml-[6px] size-[18px] rounded-full text-[11px] font-semibold leading-none hover:opacity-80 transition-opacity"
        style={{ background: dt.colors.ui.borderFaint, color: dt.colors.ui.body }}
        aria-label={`Source ${n}: ${title}`}
      >
        {n}
      </button>
      {pos &&
        createPortal(
          <div
            className="fixed z-[1000] pointer-events-none w-[300px] -translate-x-1/2 -translate-y-full rounded-[12px] bg-[#16171B] text-white px-[14px] py-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
            style={{ left: pos.x, top: pos.y - 8 }}
            role="tooltip"
          >
            <div className="flex items-center gap-[8px] text-[12px] text-white/60">
              <span className="size-[18px] rounded-full bg-white/10 flex items-center justify-center">
                <Link2 className="size-[10px]" />
              </span>
              {source}
            </div>
            <p className="mt-[4px] text-[13px] font-semibold leading-[18px]">{title}</p>
          </div>,
          document.body,
        )}
    </>
  );
}

interface FinCitedTextProps {
  text: string;
  citations: { title: string; source: string; onOpen?: () => void }[];
  renderText?: (paragraph: string) => ReactNode;
  /** Reveal the text word by word with a fading tail, then show the citations. */
  animate?: boolean;
  onDone?: () => void;
}

const WORD_MS = 38;
const TAIL = [0.2, 0.4, 0.6, 0.8];

/** Paragraphs with citation badges appended to the last paragraphs, Fin-style. */
export function FinCitedText({ text, citations, renderText, animate = false, onDone }: FinCitedTextProps) {
  const paragraphs = text.split("\n\n");
  const totalWords = text.split(/\s+/).filter(Boolean).length;
  const [shown, setShown] = useState(animate ? 0 : totalWords);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!animate) return;
    const id = setInterval(() => {
      setShown((n) => {
        if (n + 1 >= totalWords) clearInterval(id);
        return Math.min(n + 1, totalWords);
      });
    }, WORD_MS);
    return () => clearInterval(id);
  }, [animate, totalWords]);

  const finished = shown >= totalWords;
  useEffect(() => {
    if (finished && !doneRef.current) {
      doneRef.current = true;
      onDone?.();
    }
  }, [finished, onDone]);

  const first = Math.max(0, paragraphs.length - citations.length);
  let wordIndex = 0;
  return (
    <>
      {paragraphs.map((para, i) => {
        const ci = i - first;
        // extra citations beyond one-per-paragraph all land on the last paragraph
        const here =
          i === paragraphs.length - 1
            ? citations.slice(Math.max(0, ci))
            : ci >= 0
              ? [citations[ci]]
              : [];
        const offset = i === paragraphs.length - 1 ? Math.max(0, ci) : ci;

        let body: ReactNode;
        if (!animate || (finished && !renderText)) {
          body = renderText ? renderText(para) : para;
        } else {
          body = para.split(/(\s+)/).map((tok, k) => {
            if (!tok.trim()) return tok;
            const idx = wordIndex++;
            if (idx >= shown) return <span key={k} style={{ opacity: 0 }}>{tok}</span>;
            const fromHead = shown - 1 - idx;
            const o = finished || fromHead >= TAIL.length ? 1 : TAIL[fromHead];
            return (
              <span key={k} style={{ opacity: o, transition: "opacity 160ms linear" }}>
                {tok}
              </span>
            );
          });
        }

        return (
          <p key={i} className={`whitespace-pre-line ${i > 0 ? "mt-[10px]" : ""}`}>
            {body}
            {finished &&
              here.map((cit, k) => (
                <FinCitation key={cit.title} n={offset + k + 1} title={cit.title} source={cit.source} onOpen={cit.onOpen} />
              ))}
          </p>
        );
      })}
    </>
  );
}

/** "Thinking" pill: three dots bob in a wave while the pill gently breathes. */
export function FinThinking({ background, dot }: { background: string; dot: string }) {
  return (
    <motion.div
      className="inline-flex items-center gap-[5px] rounded-full px-[14px] py-[11px]"
      style={{ background }}
      animate={{ scaleX: [1, 1.07, 1] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      aria-label="Fin is thinking"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-[6px] rounded-full"
          style={{ background: dot }}
          animate={{ y: [0, -4, 0], opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", delay: i * 0.16 }}
        />
      ))}
    </motion.div>
  );
}
