import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useDesignTokens } from "../../DesignTokensContext";

/** Placeholder shown for a moment after a search, so the results page eases in instead of jumping. */
export function SearchLoading() {
  const { dt } = useDesignTokens();
  const navy = dt.colors.host.searchCta;
  const bar = "rounded-[6px] bg-black/[0.07] animate-pulse";
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-[18px] h-[3px] w-full overflow-hidden rounded-full bg-black/[0.06]">
        <motion.div
          className="h-full w-[35%] rounded-full"
          style={{ background: navy }}
          animate={{ x: ["-100%", "300%"] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div
        className="mb-[18px] overflow-hidden rounded-[10px] border bg-white"
        style={{ borderColor: "#D6D6D6", borderTop: `4px solid ${navy}` }}
      >
        <div className="px-[18px] pt-[16px] pb-[18px]">
          <div className="flex items-center gap-[8px]" style={{ color: navy }}>
            <Sparkles className="size-[16px] animate-pulse" />
            <span className="text-[16px] font-semibold">Fin is reading the help articles…</span>
          </div>
          <div className={`${bar} mt-[16px] h-[14px] w-[92%]`} />
          <div className={`${bar} mt-[10px] h-[14px] w-[84%]`} />
          <div className={`${bar} mt-[10px] h-[14px] w-[60%]`} />
          <div className={`${bar} mt-[18px] h-[44px] w-full !rounded-full`} />
        </div>
      </div>

      {[0, 1, 2].map((i) => (
        <div key={i} className="mb-[12px] rounded-[8px] border bg-white px-[20px] py-[16px]" style={{ borderColor: "#E5E7EB" }}>
          <div className={`${bar} h-[16px] w-[45%]`} />
          <div className={`${bar} mt-[10px] h-[12px] w-[88%]`} />
        </div>
      ))}
    </div>
  );
}
