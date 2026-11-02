import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, Database, FileText, X, Mic, Phone } from "lucide-react";
import { useTokens } from "../TokensContext";
import { useTheme } from "../ThemeContext";
import { useDesignTokens } from "../DesignTokensContext";
import {
  buildSuggestionGroups,
  suggestionGroupsHaveItems,
  SuggestionGroupList,
} from "./SuggestionGroups";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  /** When false, skip shared layout morph into chat. */
  sharedLayout?: boolean;
  /** Prefill the input (e.g. results page). */
  initialQuery?: string;
  showSuggestions?: boolean;
  showEscalation?: boolean;
}

interface UploadedFile {
  name: string;
  size: string;
}

function FileChip({ file, onRemove }: { file: UploadedFile; onRemove: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, x: -8 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.85, x: -8 }}
      transition={{ duration: 0.18 }}
      className="flex items-center gap-[6px] bg-[#f0f0f8] border border-[#e0e0f0] rounded-[10px] px-[10px] py-[6px] shrink-0 max-w-[180px]"
    >
      <div className="shrink-0 size-[22px] rounded-[5px] bg-[#6366f1] flex items-center justify-center">
        <FileText className="size-[12px] text-white" />
      </div>
      <span
        className="[font-family:inherit] text-[12px] truncate min-w-0"
        style={{ color: "var(--color-body, #364153)" }}
      >
        {file.name}
      </span>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={onRemove}
        className="shrink-0 size-[14px] rounded-full bg-[#d1d5db] hover:bg-[#9ca3af] flex items-center justify-center transition-colors ml-[2px]"
      >
        <X className="size-[8px] text-white" strokeWidth={3} />
      </button>
    </motion.div>
  );
}

export function SearchBar({
  onSearch,
  sharedLayout = true,
  initialQuery = "",
  showSuggestions = true,
  showEscalation = true,
}: SearchBarProps) {
  const { tokens } = useTokens();
  const t = tokens.searchBar;
  const { theme } = useTheme();
  const { dt } = useDesignTokens();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const [plusMenuPos, setPlusMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const plusRef = useRef<HTMLDivElement>(null);
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
    blurTimeoutRef.current = setTimeout(() => {
      if (uploadedFiles.length === 0) setIsOpen(false);
    }, 150);
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (plusRef.current && !plusRef.current.contains(e.target as Node)) {
      setPlusOpen(false);
    }
  };

  const handleSuggestionClick = (text: string) => {
    setSearchQuery(text);
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    if (onSearch) onSearch(text);
  };

  const handleUploadClick = () => {
    setPlusOpen(false);
    const fakeFile: UploadedFile = {
      name: t.fakeUploadName,
      size: t.fakeUploadSize,
    };
    setUploadedFiles((prev) => [...prev, fakeFile]);
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const suggestionGroups = useMemo(
    () => buildSuggestionGroups("conversational", tokens, searchQuery),
    [tokens, searchQuery],
  );
  const hasSuggestions = suggestionGroupsHaveItems(suggestionGroups);

  const GLOW = dt.shadows.searchGlow;

  const inputWrapperStyle: React.CSSProperties = isOpen
    ? { borderRadius: "16px" }
    : { borderRadius: "100px" };

  return (
    <>
      <div
        className="w-full max-w-[896px] mx-auto px-[40px]"
        onMouseDown={handleContainerMouseDown}
      >
        <div>
          <motion.div
            {...(sharedLayout ? { layoutId: "prompt-bar" } : {})}
            ref={containerRef}
            style={{
              borderRadius: isOpen ? 20 : 100,
              padding: isOpen ? "4px 4px 14px 4px" : "4px 10px 4px 4px",
              backgroundImage: isOpen ? "none" : theme.gradient,
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
                  padding: uploadedFiles.length > 0 ? "14px 20px 14px 20px" : "14px 20px",
                  transition: "border-radius 200ms cubic-bezier(0.4,0,0.2,1)",
                }}
              >
                <AnimatePresence>
                  {uploadedFiles.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-wrap gap-[6px]"
                    >
                      {uploadedFiles.map((file, i) => (
                        <FileChip
                          key={i}
                          file={file}
                          onRemove={() => {
                            const next = uploadedFiles.filter((_, idx) => idx !== i);
                            setUploadedFiles(next);
                            if (next.length === 0) setIsOpen(false);
                          }}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-[12px]">
                  <div ref={plusRef} className="relative shrink-0">
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        if (plusOpen) {
                          setPlusOpen(false);
                        } else {
                          const rect = plusRef.current?.getBoundingClientRect();
                          if (rect) setPlusMenuPos({ top: rect.top - 8, left: rect.left });
                          setPlusOpen(true);
                        }
                      }}
                      className="relative rounded-full size-[40px] border-2 border-[#e5e7eb] flex items-center justify-center hover:bg-gray-50 transition-colors"
                      style={{ background: plusOpen ? "#f3f4f6" : "white" }}
                    >
                      <svg className="block size-[20px]" fill="none" viewBox="0 0 20 20">
                        <path
                          d="M4.16667 10H15.8333"
                          stroke="#4A5565"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.66667"
                        />
                        <path
                          d="M10 4.16667V15.8333"
                          stroke="#4A5565"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.66667"
                        />
                      </svg>
                    </button>
                  </div>

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
                    className="flex-1 bg-transparent border-0 outline-none [font-family:inherit] text-[16px] placeholder:text-[#99a1af] tracking-[-0.3125px]"
                  />

                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleSearch}
                    className="shrink-0 flex items-center justify-center size-[36px] rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Mic className="size-[18px]" style={{ color: "var(--color-icon, #4A5565)" }} />
                  </button>
                </div>
              </div>

              <button
                onMouseDown={(e) => e.preventDefault()}
                className={`shrink-0 flex items-center justify-center rounded-full bg-white hover:bg-gray-50 transition-colors ${
                  showEscalation ? "" : "invisible pointer-events-none"
                }`}
                style={{ width: "64px", height: "64px", borderRadius: "9999px", marginRight: "6px" }}
                aria-hidden={!showEscalation}
                tabIndex={showEscalation ? 0 : -1}
              >
                <Phone className="size-[18px]" style={{ color: "var(--color-icon, #4A5565)" }} />
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

      <AnimatePresence>
        {plusOpen && plusMenuPos && (
          <>
            <div className="fixed inset-0 z-[90]" onMouseDown={() => setPlusOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 4 }}
              transition={{ duration: 0.15 }}
              className="fixed bg-white rounded-[14px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-hidden z-[100] w-[210px]"
              style={{
                top: plusMenuPos.top,
                left: plusMenuPos.left,
                transform: "translateY(-100%)",
              }}
            >
              <button
                className="w-full flex items-center gap-[10px] px-[14px] py-[12px] hover:bg-gray-50 transition-colors text-left"
                onClick={handleUploadClick}
              >
                <Upload className="size-[15px] text-[#6B7280] shrink-0" />
                <span className="[font-family:inherit] text-[13px] text-[#364153]">
                  {t.uploadLabel}
                </span>
              </button>
              <div className="h-px bg-gray-100" />
              <button
                className="w-full flex items-center gap-[10px] px-[14px] py-[12px] hover:bg-gray-50 transition-colors text-left"
                onClick={() => setPlusOpen(false)}
              >
                <Database className="size-[15px] text-[#6B7280] shrink-0" />
                <span className="[font-family:inherit] text-[13px] text-[#364153]">
                  {t.connectLabel}
                </span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
