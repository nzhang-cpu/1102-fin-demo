import type { LucideIcon } from "lucide-react";
import { Clock, HelpCircle, Layers, Search } from "lucide-react";

export type SuggestionMode = "search-enhanced" | "conversational";

export type SuggestionItem = {
  id: string;
  label: string;
  sub?: string;
  /** Value submitted / filled into the input. */
  value: string;
};

export type SuggestionGroup = {
  id: string;
  title: string;
  icon: LucideIcon;
  items: SuggestionItem[];
};

type SearchBarLike = {
  suggestions?: string[];
  allSuggestions?: string[];
};

type DropdownLike = {
  quickAnswers?: { question: string; answer?: string }[];
  relatedObjects?: { type: string; title: string; subtitle?: string; details?: string }[];
};

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <strong className="font-semibold text-[#1a1a2e]">
        {text.slice(idx, idx + query.length)}
      </strong>
      {text.slice(idx + query.length)}
    </span>
  );
}

function matchesQuery(hay: string, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return hay.toLowerCase().includes(q);
}

function pastSearchTerms(searchBar: SearchBarLike | undefined): SuggestionItem[] {
  const terms = (searchBar?.suggestions?.length
    ? searchBar.suggestions
    : searchBar?.allSuggestions ?? []
  ).slice(0, 5);
  return terms.map((label, i) => ({
    id: `past-${i}-${label}`,
    label,
    value: label,
  }));
}

function frequentObjects(dropdown: DropdownLike | undefined): SuggestionItem[] {
  return (dropdown?.relatedObjects ?? []).slice(0, 5).map((obj, i) => ({
    id: `obj-${i}-${obj.title}`,
    label: obj.title,
    sub: [obj.type, obj.subtitle].filter(Boolean).join(" · "),
    value: obj.title,
  }));
}

function frequentQuestions(dropdown: DropdownLike | undefined): SuggestionItem[] {
  return (dropdown?.quickAnswers ?? []).slice(0, 5).map((qa, i) => ({
    id: `faq-${i}-${qa.question}`,
    label: qa.question,
    value: qa.question,
  }));
}

/** Build titled suggestion groups for search-enhanced vs conversational typing. */
export function buildSuggestionGroups(
  mode: SuggestionMode,
  tokens: { searchBar?: SearchBarLike; searchBarDropdown?: DropdownLike },
  query = "",
): SuggestionGroup[] {
  const past = pastSearchTerms(tokens.searchBar).filter((i) =>
    matchesQuery(`${i.label} ${i.sub ?? ""}`, query),
  );
  const objects = frequentObjects(tokens.searchBarDropdown).filter((i) =>
    matchesQuery(`${i.label} ${i.sub ?? ""}`, query),
  );
  const faqs = frequentQuestions(tokens.searchBarDropdown).filter((i) =>
    matchesQuery(`${i.label} ${i.sub ?? ""}`, query),
  );

  if (mode === "search-enhanced") {
    return [
      { id: "past", title: "Past searches", icon: Clock, items: past },
      { id: "objects", title: "Frequent objects", icon: Layers, items: objects },
    ].filter((g) => g.items.length > 0);
  }

  return [
    { id: "objects", title: "Frequent objects", icon: Layers, items: objects },
    { id: "faqs", title: "Frequently asked questions", icon: HelpCircle, items: faqs },
  ].filter((g) => g.items.length > 0);
}

export function suggestionGroupsHaveItems(groups: SuggestionGroup[]) {
  return groups.some((g) => g.items.length > 0);
}

interface SuggestionGroupListProps {
  groups: SuggestionGroup[];
  query?: string;
  onSelect: (item: SuggestionItem) => void;
  /** Compact padding for chat dropdown. */
  compact?: boolean;
}

export function SuggestionGroupList({
  groups,
  query = "",
  onSelect,
  compact = false,
}: SuggestionGroupListProps) {
  return (
    <div className={compact ? "py-[4px]" : "pt-[4px]"}>
      {groups.map((group, gi) => (
        <div key={group.id} className={gi > 0 ? "mt-[6px]" : ""}>
          <p
            className={`[font-family:inherit] text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF] ${
              compact ? "px-[16px] pt-[8px] pb-[4px]" : "px-[24px] pt-[10px] pb-[4px]"
            }`}
          >
            {group.title}
          </p>
          <ul>
            {group.items.map((item) => {
              const Icon = group.id === "past" ? Search : group.icon;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onSelect(item)}
                    className={`w-full text-left flex items-center gap-[12px] hover:bg-gray-50 transition-colors ${
                      compact
                        ? "px-[16px] py-[10px]"
                        : "px-[24px] py-[11px] rounded-[12px]"
                    }`}
                  >
                    <span className="size-[28px] rounded-[8px] bg-[#F3F4F6] flex items-center justify-center shrink-0">
                      <Icon className="size-[14px] text-[#6B7280]" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex flex-col gap-[2px]">
                      <span className="[font-family:inherit] text-[14px] text-[#374151] leading-snug">
                        {highlightMatch(item.label, query)}
                      </span>
                      {item.sub ? (
                        <span className="[font-family:inherit] text-[12px] text-[#9CA3AF] truncate">
                          {item.sub}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
