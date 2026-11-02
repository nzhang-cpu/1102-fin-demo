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
}

export function SearchFirstPromptBar({
  onSearch,
  initialQuery = "",
  showSuggestions = true,
}: SearchFirstPromptBarProps) {
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

  const handleSearch = useCallback(() => {
    if (searchQuery.trim() && onSearch) onSearch(searchQuery);
  }, [searchQuery, onSearch]);

  const handleFocus = () => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    setIsOpen(true);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  const handleSuggestionClick = (text: string) => {
    setSearchQuery(text);
    setIsOpen(false);
    if (inputRef.current) inputRef.current.style.height = "auto";
    if (onSearch) onSearch(text);
  };

  const suggestionGroups = useMemo(
    () => buildSuggestionGroups("search-enhanced", tokens, searchQuery),
    [tokens, searchQuery],
  );
  const hasSuggestions = suggestionGroupsHaveItems(suggestionGroups);
  const canSubmit = searchQuery.trim().length > 0;

  const { skin } = useSkin();
  /** United help home sits the bar directly on a solid blue card, so the pill frame is clear. */
  const clearFrame = skin.layout.home === "united-help";
  const GLOW = clearFrame ? "none" : dt.shadows.searchGlow;

  const inputWrapperStyle: React.CSSProperties = isOpen
    ? { borderRadius: "16px" }
    : { borderRadius: "100px" };

  return (
    <div className="w-full max-w-[896px] mx-auto px-[40px]">
      <div>
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{
            borderRadius: isOpen ? 20 : 100,
            padding: isOpen ? "4px 4px 14px 4px" : "4px 10px 4px 4px",
            backgroundImage: isOpen || clearFrame ? "none" : theme.gradient,
            backgroundColor: isOpen ? "#ffffff" : "transparent",
            boxShadow: GLOW,
            overflow: "hidden",
            transition:
              "border-radius 200ms cubic-bezier(0.4,0,0.2,1), padding 200ms cubic-bezier(0.4,0,0.2,1), background-color 200ms cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isOpen ? "0" : "6px",
              transition: "gap 180ms cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            <div
              className="flex-1 flex flex-col gap-[8px]"
              style={{
                ...inputWrapperStyle,
                background: "white",
                padding: "14px 20px",
                transition: "border-radius 200ms cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              <div className="flex items-center gap-[12px]">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={searchQuery}
                  onChange={(e) => {
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
                  className="flex-1 bg-transparent border-0 outline-none font-['Plus_Jakarta_Sans',sans-serif] text-[16px] placeholder:text-[#99a1af] tracking-[-0.3125px]"
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
              transition: "all 200ms ease-in-out",
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
