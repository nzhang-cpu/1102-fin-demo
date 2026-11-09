import { ArrowUp, Check, FileText, Loader2, Mic, Paperclip, Smile } from "lucide-react";
import { useDesignTokens } from "../../DesignTokensContext";

export interface ComposerFile {
  name: string;
  size: string;
  /** 0 to 100; the chip shows a spinner and bar until it reaches 100. */
  progress: number;
}

interface FinComposerProps {
  /** Files waiting in the bar (with their loading state) before they are sent. */
  attachments?: ComposerFile[];
  value: string;
  onChange: (value: string) => void;
  onSend?: () => void;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

/** Message box with attach / emoji / GIF / mic tools, shared by the floating and full-page chat. */
export function FinComposer({ attachments = [], value, onChange, onSend, disabled, onFocus, onBlur }: FinComposerProps) {
  const { dt } = useDesignTokens();
  const ui = dt.colors.ui;
  const host = dt.colors.host;
  const canSend = !!value.trim() && !disabled;

  return (
    <div className="rounded-[22px] border bg-white px-[18px] pt-[14px] pb-[10px]" style={{ borderColor: ui.borderLight }}>
      {attachments.length > 0 && (
        <ul className="mb-[10px] flex flex-wrap gap-[8px]" aria-label="Attached files">
          {attachments.map((f) => {
            const done = f.progress >= 100;
            return (
              <li
                key={f.name}
                className="w-[196px] rounded-[12px] border px-[10px] py-[8px]"
                style={{ borderColor: ui.borderLight, background: "#F7F9FC" }}
              >
                <div className="flex items-center gap-[8px] text-[12px]">
                  {done ? (
                    <Check className="size-[14px] shrink-0 text-emerald-600" strokeWidth={3} />
                  ) : (
                    <Loader2 className="size-[14px] shrink-0 animate-spin" style={{ color: host.searchCta }} />
                  )}
                  <FileText className="size-[14px] shrink-0" style={{ color: ui.muted }} />
                  <span className="min-w-0 flex-1 truncate font-medium" style={{ color: ui.body }}>
                    {f.name}
                  </span>
                </div>
                <div className="mt-[6px] flex items-center gap-[8px]">
                  <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-black/10">
                    <div
                      className="h-full rounded-full transition-[width] duration-300"
                      style={{ width: `${Math.min(100, f.progress)}%`, background: done ? "#059669" : host.searchCta }}
                    />
                  </div>
                  <span className="text-[11px]" style={{ color: ui.muted }}>
                    {done ? f.size : `${Math.min(100, Math.round(f.progress))}%`}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (canSend) onSend?.();
          }
        }}
        placeholder="Message…"
        aria-label="Message"
        className="w-full bg-transparent outline-none text-[15px] py-[4px]"
      />
      <div className="flex items-center gap-[14px] mt-[10px]" style={{ color: ui.muted }}>
        <Paperclip className="size-[16px]" />
        <Smile className="size-[16px]" />
        <span className="text-[9px] font-bold border rounded-[3px] px-[2px] leading-[12px]">GIF</span>
        <Mic className="size-[16px]" />
        <div className="flex-1" />
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send"
          className="size-[36px] rounded-full flex items-center justify-center transition-colors"
          style={canSend ? { background: host.chatUserBubble, color: "#fff" } : { background: ui.borderFaint, color: ui.muted }}
        >
          <ArrowUp className="size-[18px]" />
        </button>
      </div>
    </div>
  );
}
