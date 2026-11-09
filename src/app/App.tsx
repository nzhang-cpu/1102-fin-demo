import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { AnimatePresence } from "motion/react";
import { Header } from "@/app/components/Header";
import { Sidebar } from "@/app/components/Sidebar";
import { HeroSection } from "@/app/components/HeroSection";
import { ChatScreen } from "@/app/components/ChatScreen";
import {
  SearchResultsScreen,
  type SearchBridgeContext,
  type SearchResultsVisibility,
} from "@/app/components/SearchResultsScreen";
import {
  KnowledgeArticleScreen,
  ArticleLayoutSwitch,
  type ArticleBridgeContext,
  type ArticleDetails,
  type ArticleLayoutVariant,
} from "@/app/components/KnowledgeArticleScreen";
import { ArticlePanel } from "@/app/components/ArticlePanel";
import { GoogleSearchScreen } from "@/app/components/GoogleSearchScreen";
import { TextEditorPanel } from "@/app/components/TextEditorPanel";
import { type EntranceTab } from "@/app/components/BrowserEntranceTabs";
import { MaturityToggle, type MaturityMode } from "@/app/components/MaturityToggle";
import {
  FeatureChecklist,
  defaultFlagsForMode,
  type FeatureFlags,
  type FeatureId,
} from "@/app/components/FeatureChecklist";
import { CompanySkins } from "@/app/components/CompanySkins";
import { AutoplayToggle } from "@/app/components/AutoplayToggle";
import { AutoplayProvider, useAutoplay } from "@/app/AutoplayContext";
import { getInitialSettings, saveSharedSettings } from "@/app/sharedSettings";
import { STORY_ADVANCE, hasPendingGate } from "@/app/storyGate";
import { HostShell } from "@/app/components/host/HostShell";
import { SkinProvider, useSkin } from "@/app/SkinContext";
import { TokensProvider, useTokens } from "@/app/TokensContext";
import { ThemeProvider } from "@/app/ThemeContext";
import { DesignTokensProvider, useDesignTokens } from "@/app/DesignTokensContext";

type HomepageView = "home" | "results" | "chat" | "article";
type GoogleView = "serp" | "article";

function AppInner() {
  const { tokens } = useTokens();
  const { dt } = useDesignTokens();
  const { skin } = useSkin();

  const [maturity, setMaturity] = useState<MaturityMode>(() => {
    const m = getInitialSettings()?.maturity;
    return m === "current" || m === "search-enhanced" || m === "conversational" ? m : "search-enhanced";
  });
  const [features, setFeatures] = useState<FeatureFlags>(() => {
    const shared = getInitialSettings();
    const m = shared?.maturity;
    const mode: MaturityMode = m === "current" || m === "conversational" ? m : "search-enhanced";
    return { ...defaultFlagsForMode(mode), ...(shared?.features ?? {}) };
  });
  const [entrance, setEntrance] = useState<EntranceTab>("homepage");
  const [homepageView, setHomepageView] = useState<HomepageView>("home");
  const [googleView, setGoogleView] = useState<GoogleView>("serp");
  const [searchQuery, setSearchQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [chatAnimateBar, setChatAnimateBar] = useState(false);
  const [chatInitialLearner, setChatInitialLearner] = useState<string | null>(null);
  const [homeKey, setHomeKey] = useState(0);
  const [searchBridge, setSearchBridge] = useState<SearchBridgeContext | null>(null);
  const [articleBridge, setArticleBridge] = useState<ArticleDetails | null>(null);
  const [navSearch, setNavSearch] = useState("");
  const [activeArticle, setActiveArticle] = useState<ArticleDetails | null>(null);
  const [instantAgent, setInstantAgent] = useState(false);
  const [articleLayout, setArticleLayout] = useState<ArticleLayoutVariant>(() =>
    getInitialSettings()?.articleLayout === "ai-zone" ? "ai-zone" : "inline",
  );
  const [controlsOpen, setControlsOpen] = useState(false);
  const { autoplay } = useAutoplay();

  // Everything changed in the demo panel is saved for the next visitor (skipping the initial load).
  const settingsReady = useRef(false);
  useEffect(() => {
    if (!settingsReady.current) {
      settingsReady.current = true;
      return;
    }
    saveSharedSettings({ skin: skin.id, maturity, autoplay, articleLayout, features });
  }, [skin.id, maturity, autoplay, articleLayout, features]);

  // Demo controls are hidden until the user presses K (Esc also closes them).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === "Space" && hasPendingGate()) {
        // autoplay is off and the story is waiting: Space moves it to the next beat
        e.preventDefault();
        window.dispatchEvent(new Event(STORY_ADVANCE));
        return;
      }
      if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        setControlsOpen((v) => !v);
      } else if (e.key === "Escape") {
        setControlsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const helpCenterHost = skin.host.shell === "help-center";
  const articles = tokens.articles.learning as ArticleDetails[];

  const resolvedArticle = useMemo(() => {
    if (activeArticle) return activeArticle;
    return articles[0] ?? null;
  }, [activeArticle, articles]);

  const resetSession = () => {
    flushSync(() => setChatAnimateBar(false));
    setSearchQuery("");
    setChatInitialLearner(null);
    setSearchBridge(null);
    setArticleBridge(null);
    setNavSearch("");
    setInstantAgent(false);
    setActiveArticle(null);
  };

  const goEntranceHome = () => {
    resetSession();
    if (entrance === "google") {
      setGoogleView("serp");
      return;
    }
    setHomepageView("home");
    setHomeKey((k) => k + 1);
  };

  const handleMaturityChange = (mode: MaturityMode) => {
    setMaturity(mode);
    setFeatures(defaultFlagsForMode(mode));
    resetSession();
    setEntrance("homepage");
    setHomepageView("home");
    setGoogleView("serp");
    setHomeKey((k) => k + 1);
  };

  const handleFeatureChange = (id: FeatureId, enabled: boolean) => {
    setFeatures((prev) => ({ ...prev, [id]: enabled }));
  };

  const handleEntranceChange = (next: EntranceTab) => {
    setEntrance(next);
    resetSession();
    if (next === "google") {
      setGoogleView("serp");
      return;
    }
    setHomepageView("home");
    setHomeKey((k) => k + 1);
  };

  /** Where the full-page chat was opened from, so closing it can put the viewer back. */
  const chatReturnRef = useRef<{
    maturity: MaturityMode;
    entrance: EntranceTab;
    homepageView: HomepageView;
    googleView: GoogleView;
    searchQuery: string;
    navSearch: string;
    activeArticle: ArticleDetails | null;
  } | null>(null);

  const rememberReturn = () => {
    if (homepageView === "chat") return;
    chatReturnRef.current = { maturity, entrance, homepageView, googleView, searchQuery, navSearch, activeArticle };
  };

  const closeChat = () => {
    const s = chatReturnRef.current;
    chatReturnRef.current = null;
    resetSession();
    if (!s) {
      setHomepageView("home");
      setHomeKey((k) => k + 1);
      return;
    }
    setMaturity(s.maturity);
    setEntrance(s.entrance);
    setGoogleView(s.googleView);
    setHomepageView(s.homepageView);
    setSearchQuery(s.searchQuery);
    setNavSearch(s.navSearch);
    setActiveArticle(s.activeArticle);
  };

  const handleSearch = (query: string) => {
    if (maturity === "conversational") rememberReturn();
    setSearchQuery(query);
    setChatInitialLearner(null);
    setSearchBridge(null);
    setArticleBridge(null);
    setInstantAgent(false);

    if (maturity === "conversational") {
      setChatAnimateBar(true);
      setHomepageView("chat");
      return;
    }

    setChatAnimateBar(false);
    setHomepageView("results");
  };

  const handleStartConversation = (ctx: SearchBridgeContext) => {
    if (maturity === "current") return;
    rememberReturn();
    setSearchBridge(ctx);
    setArticleBridge(null);
    setSearchQuery(ctx.query);
    setChatInitialLearner(null);
    setChatAnimateBar(true);
    setHomepageView("chat");
  };

  const handleArticleBridge = (ctx: ArticleBridgeContext) => {
    if (maturity === "current") return;
    rememberReturn();
    setArticleBridge(ctx.article);
    setSearchBridge(null);
    setSearchQuery(ctx.query);
    setChatInitialLearner(null);
    setChatAnimateBar(false);
    setEntrance("homepage");
    setMaturity("conversational");
    setHomepageView("chat");
  };

  const handleChatWithAgent = () => {
    rememberReturn();
    setSearchBridge(null);
    setArticleBridge(null);
    setChatInitialLearner(null);
    setSearchQuery("Hi — I’d like to chat with an agent.");
    setChatAnimateBar(false);
    setInstantAgent(true);
    setHomepageView("chat");
  };

  /** Expands the floating Fin window into the full-page chat, carrying the latest question over. */
  const handleExpandChat = (query?: string) => {
    rememberReturn();
    setSearchBridge(null);
    setArticleBridge(null);
    setChatInitialLearner(null);
    setSearchQuery(query || "Hi — I’d like to chat with an agent.");
    setChatAnimateBar(false);
    setInstantAgent(true);
    setEntrance("homepage");
    setHomepageView("chat");
  };

  const handleNavArticleSearch = (query: string) => {
    setNavSearch(query);
    setSearchQuery(query);
    setSearchBridge(null);
    setArticleBridge(null);
    setChatInitialLearner(null);
    setChatAnimateBar(false);
    setEntrance("homepage");
    setHomepageView("results");
  };

  const handleGoogleArticleSelect = (article: ArticleDetails) => {
    setActiveArticle(article);
    setGoogleView("article");
  };

  const handleTreeArticle = (title: string) => {
    const match =
      articles.find((a) => a.title === title) ??
      ({
        title,
        subtitle: "Help center article",
        category: "Help Center",
        lastUpdated: "May 2026",
        content: `${title}\n\nThis is a placeholder article from the current contact center knowledge tree. Content is static — no AI summary or generative assist is available in this experience.`,
      } satisfies ArticleDetails);
    setActiveArticle(match);
    setHomepageView("article");
  };

  const brandName = tokens.brandName;
  const brandHost = skin.host.addressBarHost || `${brandName.toLowerCase().replace(/\s+/g, "")}.com`;
  const onGoogleSerp = entrance === "google" && googleView === "serp";
  const onGoogleArticle = entrance === "google" && googleView === "article";

  const useHostShell =
    helpCenterHost &&
    !onGoogleSerp &&
    (entrance === "homepage" || onGoogleArticle);

  const showProductChrome =
    skin.host.showProductChrome &&
    !onGoogleSerp &&
    !useHostShell;

  const showSidebar = maturity === "conversational" && entrance === "homepage" && !helpCenterHost;
  const showNavSearch = onGoogleArticle && maturity !== "current" && showProductChrome;
  const showChatEntry =
    maturity === "search-enhanced" && entrance === "homepage" && homepageView === "home";
  const showArticleLayouts =
    !helpCenterHost &&
    maturity === "search-enhanced" &&
    entrance === "google" &&
    googleView === "article";

  const addressBar = onGoogleSerp
    ? `www.google.com/search?q=${encodeURIComponent(
        (tokens.searchBar?.suggestions?.[0] as string | undefined) ?? brandName,
      )}`
    : onGoogleArticle
      ? `${brandHost}/article`
      : homepageView === "results"
        ? `${brandHost}/search`
        : homepageView === "article"
          ? `${brandHost}/article`
          : homepageView === "chat"
            ? `${brandHost}/chat`
            : brandHost;

  const resultsVisibility: Partial<SearchResultsVisibility> =
    maturity === "current"
      ? {
          promptBar: true,
          smartSummary: false,
          aiNudges: false,
          resultsMeta: false,
          filterSort: false,
          resultsList: true,
          pagination: true,
          articlePanel: true,
        }
      : {
          smartSummary: features.searchSummary,
          filterSort: features.filterSort,
        };

  const helpMirrorVariant =
    maturity === "search-enhanced"
      ? "search-enhanced"
      : maturity === "conversational"
        ? "conversational"
        : "mirror";

  const chatView =
    homepageView === "chat" || (onGoogleArticle && maturity === "conversational");

  const hostShellOpts = (() => {
    if (entrance === "google") {
      if (googleView === "serp" || maturity === "conversational") {
        return { showNavSearch: false, showBanner: false, showChatFab: false, searchValue: "" };
      }
      return {
        showNavSearch: true,
        showBanner: !chatView,
        showChatFab: skin.host.showChatFab && maturity !== "conversational",
        searchValue: "",
      };
    }
    if (homepageView === "home") {
      return {
        showNavSearch: false,
        showBanner: true,
        showChatFab: skin.host.showChatFab && maturity !== "conversational",
        searchValue: "",
      };
    }
    if (homepageView === "results") {
      return {
        showNavSearch: false,
        showBanner: true,
        showChatFab: skin.host.showChatFab && maturity !== "conversational",
        searchValue: searchQuery,
      };
    }
    if (homepageView === "article") {
      return {
        showNavSearch: true,
        showBanner: true,
        showChatFab: skin.host.showChatFab && maturity !== "conversational",
        searchValue: "",
      };
    }
    return { showNavSearch: false, showBanner: false, showChatFab: false, searchValue: "" };
  })();

  const renderHomepage = () => {
    if (homepageView === "home") {
      return (
        <HeroSection
          key={`home-${skin.id}-${homeKey}-${maturity}`}
          onSearch={handleSearch}
          sharedBarLayout={maturity === "conversational"}
          searchFirst={maturity === "current" || maturity === "search-enhanced"}
          showTopicTree={
            maturity === "current" &&
            skin.layout.home !== "help-mirror" &&
            skin.layout.home !== "help-pathway" &&
            skin.layout.home !== "united-help" &&
            skin.layout.home !== "united-futuristic"
          }
          showBotFab={
            maturity === "current" &&
            skin.layout.home !== "help-mirror" &&
            skin.layout.home !== "help-pathway" &&
            skin.layout.home !== "united-help" &&
            skin.layout.home !== "united-futuristic"
          }
          onOpenArticle={handleTreeArticle}
          personalizedHeader={features.customHeader}
          personalizedSubheader={features.customSubheader}
          showSuggestions={maturity === "current" || features.multiObjectSuggestions}
          showEscalation={maturity === "conversational" && features.multiChannelEscalation}
          helpMirrorVariant={helpMirrorVariant}
        />
      );
    }

    if (homepageView === "results") {
      return (
        <SearchResultsScreen
          key={`results-${skin.id}-${maturity}-${searchQuery}`}
          initialQuery={searchQuery}
          onSearch={handleSearch}
          onHome={goEntranceHome}
          onOpenArticle={(article) => {
            setActiveArticle(article);
            setHomepageView("article");
          }}
          onStartConversation={
            maturity === "search-enhanced" ? handleStartConversation : undefined
          }
          visibility={resultsVisibility}
          showAiAssist={maturity === "search-enhanced" && features.aiAssistArticles}
          showSummaryFeedback={features.aiSummaryFeedback}
        />
      );
    }

    if (homepageView === "article") {
      return (
        <PlainArticleView
          key={`article-${skin.id}-${resolvedArticle?.title ?? "none"}`}
          article={resolvedArticle}
          onClose={goEntranceHome}
          onOpenArticle={(article) => setActiveArticle(article)}
          showAiAssist={maturity === "search-enhanced" && features.aiAssistArticles}
          showSummaryFeedback={features.aiSummaryFeedback}
        />
      );
    }

    return (
      <ChatScreen
        key={
          instantAgent
            ? `instant-agent-${skin.id}`
            : articleBridge
              ? `article-bridge-${skin.id}-${articleBridge.title}`
              : searchBridge
                ? `bridge-${skin.id}-${searchBridge.query}`
                : `${chatInitialLearner ?? "chat"}-${skin.id}`
        }
        initialQuery={searchQuery}
        onClose={closeChat}
        animateBar={chatAnimateBar}
        initialLearner={chatInitialLearner}
        searchContext={searchBridge}
        initialArticle={articleBridge}
        instantAgent={instantAgent}
        showSuggestions={features.multiObjectSuggestions}
        showEscalation={features.multiChannelEscalation}
        scriptOverride={
          searchQuery.toLowerCase().includes("best practices for structuring")
            ? tokens.chatScriptBestPractices.messages
            : undefined
        }
      />
    );
  };

  const renderGoogle = () => {
    if (googleView === "serp") {
      return (
        <GoogleSearchScreen
          key={`google-${skin.id}-${maturity}`}
          onSelectArticle={handleGoogleArticleSelect}
        />
      );
    }

    if (maturity === "current") {
      return (
        <PlainArticleView
          key={`google-cc-article-${skin.id}-${resolvedArticle?.title ?? "none"}`}
          article={resolvedArticle}
          onClose={() => setGoogleView("serp")}
          onOpenArticle={(article) => setActiveArticle(article)}
        />
      );
    }

    if (maturity === "conversational") {
      return (
        <ChatScreen
          key={`google-chat-${skin.id}-${resolvedArticle?.title ?? "chat"}`}
          initialQuery={`Help me with: ${resolvedArticle?.title ?? "this article"}`}
          animateBar={false}
          initialArticle={resolvedArticle}
          onClose={() => setGoogleView("serp")}
          showSuggestions={features.multiObjectSuggestions}
          showEscalation={features.multiChannelEscalation}
        />
      );
    }

    return (
      <KnowledgeArticleScreen
        key={`google-article-${skin.id}-${resolvedArticle?.title ?? "none"}-${articleLayout}`}
        article={resolvedArticle}
        layoutVariant={articleLayout}
        onEnableAi={handleArticleBridge}
        showAiAssist={features.aiAssistArticles}
        showSummaryFeedback={features.aiSummaryFeedback}
      />
    );
  };

  const cssVars = {
    background: onGoogleSerp ? "#ffffff" : dt.gradients.pageBackground,
    fontFamily: dt.fonts.families.body,
    ["--color-navy" as string]: dt.colors.brand.navy,
    ["--color-navy-deep" as string]: dt.colors.brand.navyDeep,
    ["--color-body" as string]: dt.colors.ui.body,
    ["--color-muted" as string]: dt.colors.ui.muted,
    ["--color-icon" as string]: dt.colors.ui.iconStroke,
    ["--color-accent" as string]: dt.colors.accent.indigo,
    ["--color-link" as string]: dt.colors.host.link,
    ["--color-page-bg" as string]: dt.colors.host.pageBg,
    ["--color-border" as string]: dt.colors.ui.borderFaint,
    ["--color-host-nav" as string]: dt.colors.host.navBg,
    ["--color-chat-user" as string]: dt.colors.host.chatUserBubble,
    ["--color-chat-agent" as string]: dt.colors.host.chatAgentBubble,
    ["--font-body" as string]: dt.fonts.families.body,
  };

  return (
    <div className="box-border h-dvh w-full max-w-full overflow-hidden flex items-stretch justify-start bg-white">
      <div
        className={`fixed left-0 top-0 bottom-0 z-[80] ${controlsOpen ? "" : "pointer-events-none"}`}
        style={{ width: controlsOpen ? 248 : 0 }}
      >
        <aside
          className={`absolute left-0 top-0 bottom-0 w-[248px] flex flex-col gap-[10px] pt-[clamp(16px,2vh,24px)] pb-[clamp(12px,2vh,20px)] pl-[clamp(12px,2vw,20px)] pr-[12px] min-h-0 overflow-hidden bg-[#c8c8d0] shadow-[10px_0_28px_rgba(0,0,0,0.16)] transition-transform duration-200 ease-out ${
            controlsOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
          }`}
        >
          <MaturityToggle
            mode={maturity}
            onChange={handleMaturityChange}
            orientation="vertical"
          />
          {showArticleLayouts && (
            <ArticleLayoutSwitch value={articleLayout} onChange={setArticleLayout} />
          )}
          <div className="flex-1 min-h-0 flex flex-col gap-[10px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FeatureChecklist
              mode={maturity}
              flags={features}
              onChange={handleFeatureChange}
            />
            <AutoplayToggle />
            <CompanySkins />
          </div>
        </aside>
      </div>

      <div className="min-w-0 min-h-0 flex-1 flex flex-col overflow-hidden bg-white">
        <div className="flex-1 min-h-0 min-w-0 flex flex-col relative overflow-hidden" style={cssVars}>
          <div className="flex h-full min-h-0 min-w-0">
            {showSidebar && (
              <Sidebar
                onLearnerSelect={(name) => {
                  setChatInitialLearner(name);
                  setChatAnimateBar(false);
                  setSearchBridge(null);
                  setArticleBridge(null);
                  setHomepageView("chat");
                }}
              />
            )}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
              {showProductChrome && (
                <Header
                  onLogoClick={goEntranceHome}
                  showSearch={showNavSearch}
                  searchValue={navSearch}
                  onSearchChange={setNavSearch}
                  onSearchSubmit={handleNavArticleSearch}
                  showChatEntry={showChatEntry}
                  onChatWithAgent={handleChatWithAgent}
                />
              )}
              {useHostShell ? (
                <HostShell
                  onHome={goEntranceHome}
                  onSearch={handleSearch}
                  onExpandChat={handleExpandChat}
                  searchValue={hostShellOpts.searchValue}
                  showNavSearch={hostShellOpts.showNavSearch}
                  showBanner={hostShellOpts.showBanner}
                  showChatFab={hostShellOpts.showChatFab}
                >
                  <div className="flex flex-1 min-h-0 min-w-0 h-full">
                    <main
                      className={`flex-1 flex flex-col min-h-0 min-w-0 ${
                        (entrance === "homepage" && homepageView === "home") || onGoogleSerp
                          ? "overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                          : "overflow-hidden"
                      }`}
                    >
                      <AnimatePresence mode="wait">
                        {entrance === "google" ? renderGoogle() : renderHomepage()}
                      </AnimatePresence>
                    </main>
                  </div>
                </HostShell>
              ) : (
                <div className="flex flex-1 min-h-0 min-w-0">
                  <main
                    className={`flex-1 flex flex-col min-h-0 min-w-0 ${
                      (entrance === "homepage" && homepageView === "home") || onGoogleSerp
                        ? "overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        : "overflow-hidden"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {entrance === "google" ? renderGoogle() : renderHomepage()}
                    </AnimatePresence>
                  </main>
                </div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {editorOpen && (
              <div
                className="absolute inset-0 z-[195] bg-black/20 backdrop-blur-[2px]"
                onClick={() => setEditorOpen(false)}
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {editorOpen && <TextEditorPanel onClose={() => setEditorOpen(false)} />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function PlainArticleView({
  article,
  onClose,
  onOpenArticle,
  showAiAssist = false,
  showSummaryFeedback = false,
}: {
  article: ArticleDetails | null;
  onClose: () => void;
  onOpenArticle?: (article: ArticleDetails) => void;
  showAiAssist?: boolean;
  showSummaryFeedback?: boolean;
}) {
  const { skin } = useSkin();
  const helpArticle = skin.layout.article === "help-article";

  if (helpArticle) {
    return (
      <div className="h-full w-full overflow-hidden">
        {article ? (
          <ArticlePanel
            article={article}
            onHome={onClose}
            onOpenArticle={onOpenArticle}
            showAiAssist={showAiAssist}
            showSummaryFeedback={showSummaryFeedback}
            hideClose
            hideSummary={!showAiAssist}
          />
        ) : (
          <p className="p-[24px] text-[14px]" style={{ color: "var(--color-muted, #6B7280)" }}>
            Article not found.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="h-full w-full p-[16px] overflow-hidden">
      <div className="h-full max-w-[800px] mx-auto rounded-[12px] overflow-hidden border border-[#e4e4ea] bg-white">
        {article ? (
          <ArticlePanel article={article} onClose={onClose} hideSummary />
        ) : (
          <p className="p-[24px] text-[14px] text-[#6b7280]">Article not found.</p>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DesignTokensProvider>
      <ThemeProvider>
        <TokensProvider>
          <SkinProvider>
            <AutoplayProvider>
              <AppInner />
            </AutoplayProvider>
          </SkinProvider>
        </TokensProvider>
      </ThemeProvider>
    </DesignTokensProvider>
  );
}
