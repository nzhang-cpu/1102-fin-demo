import { useEffect, useState, type ReactNode } from "react";
import { FinMessenger } from "./FinMessenger";
import { Bell, ChevronDown, ChevronRight, Globe, MessageCircle, Search, User, X } from "lucide-react";
import { useDesignTokens } from "../../DesignTokensContext";
import { useTokens } from "../../TokensContext";
import { useSkin } from "../../SkinContext";

interface HostShellProps {
  children: ReactNode;
  searchValue?: string;
  onSearch?: (query: string) => void;
  /** Called when the floating chat window is expanded to the full page. */
  onExpandChat?: (query?: string) => void;
  onHome?: () => void;
  showBanner?: boolean;
  showNavSearch?: boolean;
  showChatFab?: boolean;
}

/** Smiling chat bubble on a brand-colored disc; fills the whole chat button. */
function ChatBubbleMark({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 447 447" className="size-full" aria-hidden>
      <circle cx="223.5" cy="223.5" r="223.5" fill={color} />
      <path
        d="M138 109H308C322.6 109 334.5 120.9 334.5 135.5V365.5L267.5 337.5H138C123.4 337.5 111.5 325.6 111.5 311V135.5C111.5 120.9 123.4 109 138 109Z"
        fill="#FFFFFF"
      />
      <path
        d="M150.5 274.5C188.5 305.5 254.8 307.5 296.5 274"
        fill="none"
        stroke={color}
        strokeWidth="16"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Optional help-center host chrome driven by design tokens.
 * Used when skin.host.shell === "help-center". Brand label comes from content tokens.
 */
export function HostShell({
  children,
  searchValue = "",
  onSearch,
  onExpandChat,
  onHome,
  showBanner = true,
  showNavSearch = true,
  showChatFab = true,
}: HostShellProps) {
  const { dt } = useDesignTokens();
  const { tokens } = useTokens();
  const { skin } = useSkin();
  const brand = tokens.brandName;
  const host = dt.colors.host;
  const banners = skin.host.banners ?? [];
  const [draft, setDraft] = useState(searchValue);
  const [bannerOpen, setBannerOpen] = useState(true);
  const [messengerOpen, setMessengerOpen] = useState(false);
  const hasMessenger = !!skin.host.agent;

  useEffect(() => {
    if (!hasMessenger) return;
    const open = () => setMessengerOpen(true);
    const expand = (e: Event) => onExpandChat?.((e as CustomEvent<{ query?: string }>).detail?.query);
    window.addEventListener("open-fin-messenger", open);
    window.addEventListener("open-fin-chat", expand);
    return () => {
      window.removeEventListener("open-fin-messenger", open);
      window.removeEventListener("open-fin-chat", expand);
    };
  }, [hasMessenger, onExpandChat]);

  useEffect(() => {
    setDraft(searchValue);
  }, [searchValue]);

  const submit = () => {
    const q = draft.trim();
    if (q) onSearch?.(q);
  };

  const navItems = skin.host.navItems;

  const navText = (host.navText || "").toLowerCase();
  const lightNav = navText !== "#ffffff" && navText !== "#fff" && navText !== "white";

  return (
    <div
      className="relative h-full min-h-0 flex flex-col overflow-hidden"
      style={{
        fontFamily: dt.fonts.families.body,
        background: host.pageBg,
        color: dt.colors.ui.body,
      }}
    >
      <div
        className="shrink-0"
        style={{
          background: host.navBg,
          color: host.navText,
          borderBottom: lightNav ? `1px solid ${dt.colors.ui.borderFaint}` : undefined,
        }}
      >
        {navItems ? (
          <div className="flex items-center gap-[24px] px-[32px] h-[68px] w-full">
            <button
              type="button"
              onClick={onHome}
              className="shrink-0 h-[32px] flex items-center pr-[24px] border-r border-white/20"
              aria-label={`Go to ${brand} Help Center`}
            >
              {skin.host.navLogo ? (
                <img src={skin.host.navLogo} alt={brand} className="h-full w-auto" />
              ) : (
                <Globe className="size-[26px] text-white" strokeWidth={1.5} />
              )}
            </button>
            <nav className="flex flex-1 items-center gap-[18px] min-w-0 overflow-hidden">
              {navItems.map((item, i) => (
                <button
                  key={item}
                  type="button"
                  onClick={i === navItems.length - 1 ? onHome : undefined}
                  className="inline-flex shrink-0 items-center gap-[3px] text-[13px] font-semibold whitespace-nowrap hover:opacity-80"
                >
                  {item}
                  {i === navItems.length - 1 ? (
                    <ChevronRight className="size-[12px]" />
                  ) : (
                    <ChevronDown className="size-[12px]" />
                  )}
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-[12px] shrink-0">
              <span className="inline-flex items-center gap-[4px] text-[11px] font-semibold">
                <Globe className="size-[14px]" />
                English - US $
              </span>
              <Search className="size-[16px]" />
              <Bell className="size-[16px]" fill="currentColor" />
              <User className="size-[16px]" fill="currentColor" />
            </div>
          </div>
        ) : (
        <div className="flex items-center gap-[16px] px-[20px] py-[14px] max-w-[1120px] mx-auto w-full">
          <button
            type="button"
            onClick={onHome}
            className="flex items-center gap-[8px] shrink-0 hover:opacity-90"
            aria-label={`Go to ${brand} Help Center`}
          >
            <span className="font-bold text-[18px] tracking-tight">{brand}</span>
            <span className="text-[13px] font-medium opacity-95">Help Center</span>
            <ChevronDown className="size-[12px] opacity-80" />
          </button>

          {showNavSearch ? (
            <div className="flex-1 min-w-0 flex justify-center">
              <div
                className="w-full max-w-[420px] flex items-center gap-[8px] h-[36px] px-[12px] rounded-[6px]"
                style={{
                  color: dt.colors.brand.navy,
                  background: lightNav ? dt.colors.ui.bgPage : "#ffffff",
                  border: lightNav ? `1px solid ${dt.colors.ui.borderLight}` : undefined,
                }}
              >
                <Search className="size-[14px] shrink-0" style={{ color: dt.colors.ui.muted }} />
                <input
                  type="search"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submit();
                    }
                  }}
                  placeholder={tokens.searchBar?.placeholder ?? "Enter a question or topic"}
                  className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[14px] placeholder:opacity-50"
                  aria-label="search"
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 min-w-0" />
          )}

          <div className="flex items-center gap-[10px] shrink-0">
            <button
              type="button"
              className="inline-flex items-center gap-[5px] h-[30px] px-[10px] rounded-[5px] text-[12px]"
              style={{
                border: lightNav
                  ? `1px solid ${dt.colors.ui.borderLight}`
                  : "1px solid rgba(255,255,255,0.25)",
              }}
            >
              <Globe className="size-[12px]" />
              US
            </button>
            <button type="button" className="text-[12px] font-medium hover:underline">
              Sign up
            </button>
            <button
              type="button"
              className="h-[30px] px-[12px] rounded-[5px] text-[12px] font-semibold"
              style={{
                background: lightNav ? host.link : "#ffffff",
                color: lightNav ? "#ffffff" : dt.colors.brand.navy,
              }}
            >
              Log in
            </button>
          </div>
        </div>
        )}

        {showBanner && bannerOpen && banners.length > 0 && (
          <div className="px-[20px] pb-[12px] max-w-[1120px] mx-auto w-full flex flex-col gap-[8px]">
            {banners.map((banner) => (
              <div
                key={`${banner.linkLabel}-${banner.afterLink}`}
                className="flex items-start gap-[10px] rounded-[4px] border px-[14px] py-[10px]"
                style={{
                  borderColor: host.bannerBorder,
                  background: host.bannerBg,
                  color: dt.colors.brand.navy,
                }}
              >
                <span
                  className="mt-[1px] size-[16px] rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                  style={{ background: host.bannerIcon }}
                >
                  i
                </span>
                <p className="flex-1 text-[13px] leading-[18px]">
                  {banner.beforeLink}
                  <span className="font-medium" style={{ color: host.link }}>
                    {banner.linkLabel}
                  </span>
                  {banner.afterLink}
                </p>
                <button
                  type="button"
                  className="shrink-0 p-[2px]"
                  onClick={() => setBannerOpen(false)}
                  aria-label="Dismiss"
                >
                  <X className="size-[14px]" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden relative">{children}</div>

      {showChatFab && hasMessenger && messengerOpen && (
        <FinMessenger
          onClose={() => setMessengerOpen(false)}
          onExpand={(q) => {
            setMessengerOpen(false);
            onExpandChat?.(q);
          }}
        />
      )}

      {showChatFab && (
        <button
          type="button"
          onClick={() =>
            hasMessenger ? setMessengerOpen((v) => !v) : onSearch?.(`Chat with ${brand} support`)
          }
          className="absolute bottom-[20px] right-[20px] size-[52px] rounded-full text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)] flex items-center justify-center z-20"
          style={{ background: hasMessenger ? host.searchCta : host.link }}
          aria-label="Open chat"
        >
          {hasMessenger && messengerOpen ? (
            <ChevronDown className="size-[22px]" />
          ) : hasMessenger ? (
            <ChatBubbleMark color={host.searchCta} />
          ) : (
            <MessageCircle className="size-[22px]" />
          )}
        </button>
      )}
    </div>
  );
}
