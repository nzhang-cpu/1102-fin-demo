import { Pause, Play } from "lucide-react";
import { useAutoplay } from "../AutoplayContext";

/** Side-panel switch: story plays itself, or waits for Space / a click on the widget. */
export function AutoplayToggle() {
  const { autoplay, setAutoplay } = useAutoplay();
  return (
    <div className="shrink-0 rounded-[14px] bg-[#e8e8ed] border border-[#d8d8e0] px-[10px] py-[12px]">
      <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6b7280] mb-[8px] px-[4px]">
        Story playback
      </p>
      <button
        type="button"
        role="switch"
        aria-checked={autoplay}
        onClick={() => setAutoplay(!autoplay)}
        className="w-full flex items-center gap-[8px] rounded-[8px] px-[6px] py-[7px] text-left hover:bg-black/[0.04] transition-colors"
      >
        <span
          className={`size-[22px] rounded-full flex items-center justify-center shrink-0 ${
            autoplay ? "bg-[#1a1a2e] text-white" : "bg-white border border-[#b0b0bc] text-[#6b7280]"
          }`}
        >
          {autoplay ? <Pause className="size-[11px]" /> : <Play className="size-[11px]" />}
        </span>
        <span className="min-w-0">
          <span className="block font-['Plus_Jakarta_Sans',sans-serif] text-[12px] leading-[15px] font-semibold text-[#1a1a2e]">
            Autoplay {autoplay ? "on" : "off"}
          </span>
          <span className="block font-['Plus_Jakarta_Sans',sans-serif] text-[10px] leading-[13px] text-[#9ca3af] mt-[2px]">
            {autoplay ? "Chat plays itself" : "Press Space or use the widget"}
          </span>
        </span>
      </button>
    </div>
  );
}
