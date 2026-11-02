import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Accessibility,
  Armchair,
  Award,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Headphones,
  Luggage,
  NotebookPen,
  PlaneTakeoff,
  Rocket,
  CreditCard,
  MonitorSmartphone,
  Clapperboard,
  Wrench,
  TriangleAlert,
  Layers,
  Trophy,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { SearchBar } from "./SearchBar";
import { UnitedHelpHome } from "./host/UnitedHelpHome";
import { UnitedFuturisticHome } from "./host/UnitedFuturisticHome";
import { SearchFirstPromptBar } from "./SearchFirstPromptBar";
import { CategoryButtons } from "./CategoryButtons";
import { ContactCenterBotFab, ContactCenterTopicTree } from "./ContactCenterExtras";
import { useTokens } from "../TokensContext";
import { useSkin } from "../SkinContext";
import { useDesignTokens } from "../DesignTokensContext";

interface HeroSectionProps {
  userName?: string;
  onSearch?: (query: string) => void;
  sharedBarLayout?: boolean;
  /** Use Search-first prompt bar (no plus / send instead of call). */
  searchFirst?: boolean;
  /** Legacy contact-center extras under the welcome grid. */
  showTopicTree?: boolean;
  showBotFab?: boolean;
  onOpenArticle?: (title: string) => void;
  /** Personalized greeting vs general welcome copy. */
  personalizedHeader?: boolean;
  personalizedSubheader?: boolean;
  showSuggestions?: boolean;
  showEscalation?: boolean;
  /** Current vs essence modes for help-mirror / help-pathway home. */
  helpMirrorVariant?: "mirror" | "search-enhanced" | "conversational";
}

const GENERAL_HEADING = "Welcome";
const GENERAL_SUBTEXT = "Search our help center or ask a question to get started.";
const SITE_EYEBROW = "We're all ears.";
const SITE_HEADING = "How can we help?";

const TOPIC_ICONS = [
  Rocket,
  CreditCard,
  MonitorSmartphone,
  Clapperboard,
  Wrench,
  TriangleAlert,
  Layers,
  Trophy,
];

const PATHWAY_ICONS: Record<string, LucideIcon> = {
  "Planning & Booking": CalendarDays,
  "Getting Ready": ClipboardCheck,
  "Day of Travel": PlaneTakeoff,
  "Delays, Cancellations, or Schedule Revisions": Clock3,
  Baggage: Luggage,
  "Travel Funds, Refunds, Reimbursements, & Receipts": Wallet,
  "Rapid Rewards®": Award,
  "Disability-Related Accommodations": Accessibility,
  "Assigned Seats": Armchair,
  "Contact Us": Headphones,
};

export function HeroSection({
  onSearch,
  sharedBarLayout = true,
  searchFirst = false,
  showTopicTree = false,
  showBotFab = false,
  onOpenArticle,
  personalizedHeader = true,
  personalizedSubheader = true,
  showSuggestions = true,
  showEscalation = false,
  helpMirrorVariant = "mirror",
}: HeroSectionProps) {
  const { tokens } = useTokens();
  const { skin } = useSkin();
  const { dt } = useDesignTokens();
  const t = tokens.hero;
  const helpMirror = skin.layout.home === "help-mirror";
  const helpPathway = skin.layout.home === "help-pathway";
  const essence = helpMirrorVariant !== "mirror";
  const [showAllAdditional, setShowAllAdditional] = useState(false);

  const heading = personalizedHeader ? t.welcomeHeading : GENERAL_HEADING;
  const subtext = personalizedSubheader ? t.welcomeSubtext : GENERAL_SUBTEXT;

  const popular = useMemo(() => {
    const fromSuggestions = (tokens.searchBar?.suggestions ?? []).slice(0, 6);
    return fromSuggestions.length >= 4
      ? fromSuggestions
      : (tokens.articles?.learning ?? []).slice(0, 6).map((a: { title: string }) => a.title);
  }, [tokens.searchBar?.suggestions, tokens.articles?.learning]);

  const topics = useMemo(() => {
    const cats = tokens.categories ?? [];
    return cats.length > 0 ? cats.map((c) => c.label) : [];
  }, [tokens.categories]);

  if (skin.layout.home === "united-futuristic") {
    return (
      <UnitedFuturisticHome
        onSearch={onSearch}
        variant={helpMirrorVariant}
        showSuggestions={showSuggestions}
        showEscalation={showEscalation}
      />
    );
  }

  if (skin.layout.home === "united-help") {
    return (
      <UnitedHelpHome
        onSearch={onSearch}
        variant={helpMirrorVariant}
        showSuggestions={showSuggestions}
        showEscalation={showEscalation}
      />
    );
  }

  if (helpPathway) {
    const host = dt.colors.host;
    const pathways = tokens.homePathways;
    const primary = pathways?.primary ?? [];
    const additional = pathways?.additional ?? [];
    const visibleAdditional = showAllAdditional ? additional : additional.slice(0, 4);
    const headingText =
      essence && personalizedHeader
        ? tokens.hero?.welcomeHeading || pathways?.heading
        : pathways?.heading || "What do you need help with?";
    const subheadingText =
      essence && personalizedSubheader
        ? tokens.hero?.welcomeSubtext || pathways?.subheading
        : pathways?.subheading || "Choose one of the topics below to get started";

    const PathwayTile = ({
      title,
      summary,
      accent,
    }: {
      title: string;
      summary: string;
      accent: string;
    }) => {
      const Icon = PATHWAY_ICONS[title] ?? Layers;
      return (
        <button
          type="button"
          onClick={() => onSearch?.(title)}
          className="group flex h-full min-h-[9rem] w-full flex-col items-stretch rounded-[4px] border bg-white p-[24px] text-left transition-colors duration-300 hover:text-white"
          style={{
            borderColor: dt.colors.ui.borderLight,
            borderTopWidth: 4,
            borderTopColor: accent,
            color: dt.colors.brand.navy,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = host.searchCta;
            e.currentTarget.style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#ffffff";
            e.currentTarget.style.color = dt.colors.brand.navy;
          }}
        >
          <Icon
            className="mb-[8px] size-[48px] shrink-0"
            strokeWidth={1.5}
            style={{ color: "currentColor" }}
          />
          <span className="flex items-start justify-between gap-[12px]">
            <span className="text-[24px] font-bold leading-[32px]">{title}</span>
            <ChevronRight className="mt-[6px] size-[20px] shrink-0 opacity-70" />
          </span>
          <span
            className="mt-[8px] text-[15px] font-normal leading-[22px] opacity-90 group-hover:text-white"
            style={{ color: "inherit" }}
          >
            {summary}
          </span>
        </button>
      );
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="h-full min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ fontFamily: dt.fonts.families.body, background: host.pageBg }}
      >
        <section className="max-w-[1120px] mx-auto px-[24px] pt-[36px] pb-[28px]">
          <h1
            className="text-[32px] sm:text-[36px] font-bold leading-[1.2] tracking-[-0.02em] mb-[8px]"
            style={{ color: dt.colors.brand.navy }}
          >
            {headingText}
          </h1>
          <p className="text-[16px] leading-[24px] mb-[28px]" style={{ color: dt.colors.ui.mutedDark }}>
            {subheadingText}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[24px]">
            {primary.map((tile) => (
              <PathwayTile
                key={tile.title}
                title={tile.title}
                summary={tile.summary}
                accent={host.tileAccent}
              />
            ))}
          </div>
        </section>

        <section className="max-w-[1120px] mx-auto px-[24px] pb-[36px]">
          {helpMirrorVariant === "search-enhanced" ? (
            <div
              className="rounded-[6px] px-[24px] py-[20px]"
              style={{ background: host.searchCta }}
            >
              <h2 className="text-[24px] font-bold text-white mb-[12px]">
                {pathways?.searchHeading || "Search our help options and FAQs"}
              </h2>
              <div className="text-left -mx-[4px]">
                <SearchFirstPromptBar onSearch={onSearch} showSuggestions={showSuggestions} />
              </div>
            </div>
          ) : helpMirrorVariant === "conversational" ? (
            <div
              className="rounded-[6px] px-[24px] py-[20px]"
              style={{ background: host.searchCta }}
            >
              <h2 className="text-[24px] font-bold text-white mb-[12px]">
                {pathways?.searchHeading || "Search our help options and FAQs"}
              </h2>
              <div className="text-left -mx-[4px]">
                <SearchBar
                  onSearch={onSearch}
                  sharedLayout
                  showSuggestions={showSuggestions}
                  showEscalation={showEscalation}
                />
              </div>
            </div>
          ) : (
            <div
              className="rounded-[6px] px-[24px] pt-[16px] pb-[24px]"
              style={{ background: host.searchCta }}
            >
              <h2 className="text-[30px] font-bold text-white leading-[36px]">
                {pathways?.searchHeading || "Search our help options and FAQs"}
              </h2>
              <div className="mt-[16px] flex items-stretch gap-[8px] rounded-[4px] bg-white p-[8px]">
                <button
                  type="button"
                  onClick={() => onSearch?.(tokens.searchBar?.suggestions?.[0] ?? "Help")}
                  className="flex-1 min-w-0 text-left px-[10px] text-[16px] opacity-55"
                  style={{ color: dt.colors.ui.body }}
                >
                  {tokens.searchBar?.placeholder ?? "Search our help options and FAQs"}
                </button>
                <button
                  type="button"
                  onClick={() => onSearch?.(tokens.searchBar?.suggestions?.[0] ?? "Help")}
                  className="shrink-0 h-[40px] px-[18px] rounded-[4px] text-[15px] font-bold"
                  style={{
                    background: host.searchCtaAlt,
                    color: dt.colors.brand.navy,
                  }}
                >
                  Search
                </button>
              </div>
            </div>
          )}
        </section>

        {additional.length > 0 && (
          <section className="max-w-[1120px] mx-auto px-[24px] pb-[48px]">
            <h2
              className="text-[22px] font-bold mb-[18px]"
              style={{ color: dt.colors.brand.navy }}
            >
              {pathways?.additionalHeading || "Additional topics"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[24px]">
              {visibleAdditional.map((tile) => (
                <PathwayTile
                  key={tile.title}
                  title={tile.title}
                  summary={tile.summary}
                  accent={host.link}
                />
              ))}
            </div>
            {additional.length > 4 && (
              <div className="mt-[20px] flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAllAdditional((v) => !v)}
                  className="h-[36px] px-[16px] rounded-[4px] border text-[14px] font-semibold"
                  style={{
                    borderColor: host.link,
                    color: host.link,
                    background: "#ffffff",
                  }}
                >
                  {showAllAdditional ? "Show Less" : "Show More"}
                </button>
              </div>
            )}
          </section>
        )}
      </motion.div>
    );
  }

  if (helpMirror) {
    const eyebrow =
      essence && personalizedSubheader ? tokens.hero?.welcomeSubtext || SITE_EYEBROW : SITE_EYEBROW;
    const mirrorHeading =
      essence && personalizedHeader ? tokens.hero?.welcomeHeading || SITE_HEADING : SITE_HEADING;
    const host = dt.colors.host;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="h-full min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ fontFamily: dt.fonts.families.body, background: host.pageBg }}
      >
        <div
          className="relative text-white"
          style={{ background: dt.gradients.theme.skyPeriwinkle }}
        >
          <div
            className={`px-[28px] pt-[36px] pb-[56px] mx-auto text-center ${
              essence ? "max-w-[896px]" : "max-w-[720px]"
            }`}
          >
            <p
              className={`mb-[8px] font-medium ${
                essence && personalizedSubheader
                  ? "text-[16px] text-white/70 leading-[24px]"
                  : "text-[18px] text-white/80"
              }`}
            >
              {eyebrow}
            </p>
            <h1 className="text-[42px] sm:text-[48px] font-bold tracking-[-0.03em] leading-[1.1] mb-[28px]">
              {mirrorHeading}
            </h1>

            {helpMirrorVariant === "search-enhanced" ? (
              <div className="text-left -mx-[12px]">
                <SearchFirstPromptBar onSearch={onSearch} showSuggestions={showSuggestions} />
              </div>
            ) : helpMirrorVariant === "conversational" ? (
              <div className="text-left -mx-[12px]">
                <SearchBar
                  onSearch={onSearch}
                  sharedLayout
                  showSuggestions={showSuggestions}
                  showEscalation={showEscalation}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onSearch?.(tokens.searchBar?.suggestions?.[0] ?? "Help")}
                className="w-full flex items-center gap-[10px] h-[52px] px-[16px] rounded-[8px] bg-white text-left shadow-[0_8px_28px_rgba(0,0,0,0.25)]"
                style={{ color: dt.colors.brand.navy }}
              >
                <span className="text-[16px] opacity-50">
                  {tokens.searchBar?.placeholder ?? "Enter a question or topic"}
                </span>
              </button>
            )}
          </div>
        </div>

        <section className="max-w-[1120px] mx-auto px-[28px] py-[36px]">
          <h2
            className="text-[22px] font-bold mb-[18px]"
            style={{ color: dt.colors.brand.navy }}
          >
            Popular help articles
          </h2>
          <ul className="grid sm:grid-cols-2 gap-x-[32px]">
            {popular.map((title) => (
              <li key={title} className="border-b" style={{ borderColor: dt.colors.ui.borderFaint }}>
                <button
                  type="button"
                  onClick={() => onOpenArticle?.(title)}
                  className="w-full flex items-center justify-between gap-[12px] py-[14px] text-left hover:opacity-80"
                >
                  <span
                    className="text-[15px] font-medium"
                    style={{ color: host.link }}
                  >
                    {title}
                  </span>
                  <ChevronRight className="size-[16px] shrink-0 opacity-40" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {topics.length > 0 && (
          <section className="max-w-[1120px] mx-auto px-[28px] pb-[36px]">
            <h2
              className="text-[22px] font-bold mb-[18px]"
              style={{ color: dt.colors.brand.navy }}
            >
              Browse all topics
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-[12px]">
              {topics.map((label, i) => {
                const Icon = TOPIC_ICONS[i % TOPIC_ICONS.length];
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => onSearch?.(label)}
                    className="flex items-center gap-[10px] rounded-[8px] border bg-white px-[14px] py-[14px] text-left hover:shadow-sm transition-shadow"
                    style={{ borderColor: dt.colors.ui.borderFaint }}
                  >
                    <Icon className="size-[18px] shrink-0" style={{ color: host.link }} />
                    <span
                      className="text-[13px] font-semibold leading-[16px]"
                      style={{ color: dt.colors.ui.body }}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="max-w-[1120px] mx-auto px-[28px] pb-[48px]">
          <h2
            className="text-[22px] font-bold mb-[18px]"
            style={{ color: dt.colors.brand.navy }}
          >
            Need more help?
          </h2>
          <div className="grid sm:grid-cols-2 gap-[12px]">
            <button
              type="button"
              onClick={() => onSearch?.(`Get in touch with ${tokens.brandName} support`)}
              className="flex items-start gap-[12px] rounded-[8px] border bg-white p-[16px] text-left"
              style={{ borderColor: dt.colors.ui.borderFaint }}
            >
              <Headphones className="size-[20px] mt-[2px]" style={{ color: host.link }} />
              <span>
                <span
                  className="block text-[15px] font-semibold mb-[4px]"
                  style={{ color: dt.colors.brand.navy }}
                >
                  Get in touch
                </span>
                <span className="text-[13px]" style={{ color: dt.colors.ui.mutedDark }}>
                  We are available for live support 24 hours a day 7 days a week
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => onSearch?.(`Give feedback about ${tokens.brandName}`)}
              className="flex items-start gap-[12px] rounded-[8px] border bg-white p-[16px] text-left"
              style={{ borderColor: dt.colors.ui.borderFaint }}
            >
              <NotebookPen className="size-[20px] mt-[2px]" style={{ color: host.link }} />
              <span>
                <span
                  className="block text-[15px] font-semibold mb-[4px]"
                  style={{ color: dt.colors.brand.navy }}
                >
                  Give feedback
                </span>
                <span className="text-[13px]" style={{ color: dt.colors.ui.mutedDark }}>
                  How can we improve? Let us know through our feedback form.
                </span>
              </span>
            </button>
          </div>
        </section>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="relative flex flex-col items-center w-full max-w-[1200px] mx-auto px-[40px] gap-[32px] py-[80px] pb-[48px]"
      style={{ fontFamily: dt.fonts.families.body }}
    >
      <div className="flex flex-col gap-[12px] items-center text-center w-full max-w-[720px] mx-auto mb-[10px] mt-[70px]">
        <h1
          className="font-bold leading-[60px] text-[60px] tracking-[-1.5px]"
          style={{ color: dt.colors.brand.navyDeep }}
        >
          {heading}
        </h1>
        <p
          className="font-light leading-[28px] text-[20px] tracking-[-0.4492px] max-w-[560px]"
          style={{ color: dt.colors.brand.navyDeep }}
        >
          {subtext}
        </p>
      </div>

      <div className="relative w-full">
        {searchFirst ? (
          <SearchFirstPromptBar onSearch={onSearch} showSuggestions={showSuggestions} />
        ) : (
          <SearchBar
            onSearch={onSearch}
            sharedLayout={sharedBarLayout}
            showSuggestions={showSuggestions}
            showEscalation={showEscalation}
          />
        )}
      </div>

      <div className="w-full">
        <CategoryButtons onSearch={onSearch} />
      </div>

      {showTopicTree && onOpenArticle && (
        <ContactCenterTopicTree onOpenArticle={onOpenArticle} />
      )}

      {showBotFab && <ContactCenterBotFab />}
    </motion.div>
  );
}
