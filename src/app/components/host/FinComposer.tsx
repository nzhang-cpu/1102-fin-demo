import { ArrowUp, Mic, Paperclip, Smile } from "lucide-react";
import { useDesignTokens } from "../../DesignTokensContext";

interface FinComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend?: () => void;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

/** Message box with attach / emoji / GIF / mic tools, shared by the floating and full-page chat. */
export function FinComposer({ value, onChange, onSend, disabled, onFocus, onBlur }: FinComposerProps) {
  const { dt } = useDesignTokens();
  const ui = dt.colors.ui;
  const host = dt.colors.host;
  const canSend = !!value.trim() && !disabled;

  return (
    <div className="rounded-[22px] border bg-white px-[18px] pt-[14px] pb-[10px]" style={{ borderColor: ui.borderLight }}>
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
