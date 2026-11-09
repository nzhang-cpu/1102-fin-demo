import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { Mic, Send } from "lucide-react";
import { useTokens } from "../TokensContext";
import { useTheme } from "../ThemeContext";
import { useSkin } from "../SkinContext";
import { useDesignTokens } from "../DesignTokensContext";
import {
  buildSuggestionGroups,
  suggestionGroupsHaveItems,
  SuggestionGroupList,
} from "./SuggestionGroups";

/**
 * Search-first prompt bar — duplicate of SearchBar with upload/call removed.
 * Typing + submit only (paper plane). Does not share conversational affordances.
 */
interface SearchFirstPromptBarProps {
  onSearch?: (query: string) => void;
  /** Prefill the input (e.g. results page). */
  initialQuery?: string;
  showSuggestions?: boolean;
  /** Demo helper: types this text into the empty box the first time it is focused. */
  autoTypeText?: string;
  /** Drops the built-in side gutter so the bar fills whatever card it sits in. */
  flush?: boolean;
}

export function SearchFirstPromptBar({
  onSearch,
  initialQuery = "",
  showSuggestions: showSuggestionsProp = true,
  autoTypeText,
  flush = false,
}: SearchFirstPromptBarProps) {
  /** The auto-typed demo keeps the box clean: no dropdown under the text. */
  const showSuggestions = showSuggestionsProp && !autoTypeText;
  const { tokens } = useTokens();
  const t = tokens.searchBar;
  const { theme } = useTheme();
  const { dt } = useDesignTokens();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchQuery(initialQuery);
  }, [initialQuery]);

  const autoResize = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    if (el.scrollHeight > 28) setIsOpen(true);
  };

  /** Set once a search is submitted so the bar holds its shape while the screen fades out. */
  const leavingRef = useRef(false);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim() && onSearch) {
      leavingRef.current = true;
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
      onSearch(searchQuery);
    }
  }, [searchQuery, onSearch]);

  const autoTypedRef = useRef(false);
  const autoTypeTimer = useRef<number | null>(null);
  const stopAutoType = () => {
    if (autoTypeTimer.current) window.clearInterval(autoTypeTimer.current);
    autoTypeTimer.current = null;
  };
  useEffect(() => stopAutoType, []);

  const startAutoType = () => {
    if (!autoTypeText || autoTypedRef.current || searchQuery) return;
    autoTypedRef.current = true;
    let i = 0;
    autoTypeTimer.current = window.setInterval(() => {
      i += 1;
      setSearchQuery(autoTypeText.slice(0, i));
      if (i >= autoTypeText.length) stopAutoType();
    }, 85);
  };

  const handleFocus = () => {
    startAutoType();
    leavingRef.current = false;
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    setIsOpen(true);
  };

  const handleBlur = () => {
    if (leavingRef.current) return;
    blurTimeoutRef.current = setTimeout(() => {
      if (!leavingRef.current) setIsOpen(false);
    }, 150);
  };

  const handleSuggestionClick = (text: string) => {
    setSearchQuery(text);
    if (inputRef.current) inputRef.current.style.height = "auto";
    if (onSearch) {
      leavingRef.current = true;
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
      onSearch(text);
    } else {
      setIsOpen(false);
    }
  };

  const suggestionGroups = useMemo(
    () => buildSuggestionGroups("search-enhanced", tokens, searchQuery),
    [tokens, searchQuery],
  );
  const hasSuggestions = suggestionGroupsHaveItems(suggestionGroups);
  const canSubmit = searchQuery.trim().length > 0;

  const { skin } = useSkin();
  /** Skyline help home sits the bar directly on a solid blue card, so the pill frame is clear. */
  const clearFrame = skin.layout.home === "united-help" || skin.layout.home === "united-futuristic";
  const GLOW = clearFrame ? "none" : dt.shadows.searchGlow;

  // Closed radii are half the bar's height (72px outer, 64px inner), not 100px, so the
  // morph to the open shape animates evenly instead of lagging and then snapping.
  const inputWrapperStyle: React.CSSProperties = isOpen
    ? { borderRadius: "16px" }
    : { borderRadius: "32px" };
  const EASE = "cubic-bezier(0.4,0,0.2,1)";
  const DUR = "240ms";

  return (
    <div className={flush ? "w-full" : "w-full max-w-[896px] mx-auto px-[40px]"}>
      <div>
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{
            position: "relative",
            borderRadius: isOpen ? 20 : 36,
            padding: isOpen ? "4px 10px 14px 4px" : "4px 10px 4px 4px",
            backgroundColor: isOpen ? "#ffffff" : "transparent",
            boxShadow: GLOW,
            overflow: "hidden",
            transition: `border-radius ${DUR} ${EASE}, padding ${DUR} ${EASE}, background-color ${DUR} ${EASE}`,
          }}
        >
          {/* Gradient frame fades out instead of switching off, so opening never flashes. */}
          {!clearFrame && (
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: theme.gradient,
                opacity: isOpen ? 0 : 1,
                transition: `opacity ${DUR} ${EASE}`,
                pointerEvents: "none",
              }}
            />
          )}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <div
              className="flex-1 flex flex-col gap-[8px]"
              style={{
                ...inputWrapperStyle,
                background: "white",
                padding: "14px 20px",
                transition: `border-radius ${DUR} ${EASE}`,
              }}
            >
              <div className="flex items-center gap-[12px]">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={searchQuery}
                  onChange={(e) => {
                    stopAutoType();
                    setSearchQuery(e.target.value);
                    autoResize();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder={t.placeholder}
                  style={{
                    fontFamily: "inherit",
                    resize: "none",
                    overflow: "hidden",
                    lineHeight: "24px",
                    color: "var(--color-body, #364153)",
                  }}
                  className="flex-1 bg-transparent border-0 outline-none [font-family:inherit] text-[16px] placeholder:text-[#99a1af] tracking-[-0.3125px]"
                />

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleSearch}
                  className="shrink-0 flex items-center justify-center size-[36px] rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Voice search"
                >
                  <Mic className="size-[18px]" style={{ color: "var(--color-icon, #4A5565)" }} />
                </button>
              </div>
            </div>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSearch}
              disabled={!canSubmit}
              className={`shrink-0 flex items-center justify-center rounded-full bg-white transition-colors ${
                canSubmit ? "hover:bg-gray-50 cursor-pointer" : "cursor-not-allowed"
              }`}
              style={{ width: "64px", height: "64px", borderRadius: "9999px", marginRight: "6px" }}
              aria-label="Search"
            >
              <Send
                className="size-[18px]"
                style={{ color: canSubmit ? "var(--color-icon, #4A5565)" : "#C5CAD1" }}
              />
            </button>
          </div>

          <div
            style={{
              maxHeight: isOpen && showSuggestions && hasSuggestions ? "420px" : "0",
              opacity: isOpen && showSuggestions && hasSuggestions ? 1 : 0,
              marginTop: isOpen && showSuggestions && hasSuggestions ? "12px" : "0",
              overflow: "hidden",
              position: "relative",
              transition: `max-height ${DUR} ${EASE}, opacity ${DUR} ${EASE}, margin-top ${DUR} ${EASE}`,
            }}
          >
            <div style={{ borderTop: "1px solid #f3f4f6" }}>
              <SuggestionGroupList
                groups={suggestionGroups}
                query={searchQuery}
                onSelect={(item) => handleSuggestionClick(item.value)}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
