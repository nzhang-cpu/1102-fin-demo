import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, ThumbsUp, ThumbsDown, Plus, Mic, Phone, CheckCheck, ChevronRight, X } from "lucide-react";
import { useDesignTokens } from "../DesignTokensContext";
import { TypingIndicator } from "./TypingIndicator";
import { ArticlePanel } from "./ArticlePanel";
import { useSkin } from "../SkinContext";
import { LearnerProfilePanel } from "./LearnerProfilePanel";
import { CitationChips } from "./CitationChips";
import { ActionTiles } from "./ActionTiles";
import { AssignModuleCard } from "./AssignModuleCard";
import { SendNotificationCard } from "./SendNotificationCard";
import { LearnerProgressCard } from "./LearnerProgressCard";
import { ModuleStepperCard } from "./ModuleStepperCard";
import { ExtendDeadlineCard } from "./ExtendDeadlineCard";
import { SpecialistChatCard } from "./SpecialistChatCard";
import { StudentReadinessCard } from "./StudentReadinessCard";
import { FeedbackFormCard } from "./FeedbackFormCard";
import { AiNudgeChips, type AiNudge } from "./AiNudgeChips";
import {
  buildSuggestionGroups,
  suggestionGroupsHaveItems,
  SuggestionGroupList,
} from "./SuggestionGroups";
import avatarImage from "../../imports/avatar-logo.png";
import userAvatar from "figma:asset/29430ecde91fa3edf6e8c948dcd5e35351d6faf7.png";
import { useTokens } from "../TokensContext";
import type { ChatCard, ChatMessage } from "../chatTypes";
import { useTheme } from "../ThemeContext";
import content from "../content";
import { FinComposer } from "./host/FinComposer";
import { FinCitedText, FinThinking } from "./host/FinCitation";
import { PetInfoCard, type PetType } from "./host/PetInfoCard";
import { ArticleSkeleton } from "./host/ArticleSkeleton";
import { useAutoplay } from "../AutoplayContext";
import { gate, useStoryWaiting } from "../storyGate";
import {
  DOG_TRAVEL_TITLE,
  PET_CARD_INTRO,
  PET_FINAL_REPLY,
  PET_POLICY_REPLY,
  PET_TRAVEL_TITLE,
  isPetTravelQuery,
} from "../content/petStory";

function HelpChatBotAvatar({
  size = 36,
  bg,
  letter = "D",
  logo,
}: {
  size?: number;
  bg: string;
  letter?: string;
  logo?: string;
}) {
  if (logo) {
    return (
      <div
        className="shrink-0 rounded-full flex items-center justify-center bg-black"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <img src={logo} alt="" style={{ width: size * 0.56, height: size * 0.56 }} />
      </div>
    );
  }
  return (
    <div
      className="shrink-0 rounded-full flex items-center justify-center text-white"
      style={{
        width: size,
        height: size,
        background: bg,
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: size * 0.52,
        fontWeight: 700,
        fontStyle: "italic",
        lineHeight: 1,
      }}
      aria-hidden
    >
      {letter}
    </div>
  );
}

function formatChatClock(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" });
}

function formatChatStarted(date: Date) {
  return date.toLocaleString([], {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Follow-up pills under the chat input — same tone as search-results ask suggestions. */
function followUpNudgesForQuery(query: string, categoryHint = ""): AiNudge[] {
  const q = query.toLowerCase();
  const cat = categoryHint.toLowerCase();
  let questions: string[];

  if (q.includes("dispute") || q.includes("chargeback") || cat.includes("dispute")) {
    questions = [
      "How long do I have to respond?",
      "What evidence do I need to submit?",
      "Where do I upload this in the Dashboard?",
    ];
  } else if (q.includes("payout") || q.includes("hold") || cat.includes("payout")) {
    questions = [
      "Why was my payout put on hold?",
      "How do I get the hold lifted?",
      "How long do holds usually last?",
    ];
  } else if (
    q.includes("billing") ||
    q.includes("subscription") ||
    q.includes("invoice") ||
    q.includes("proration") ||
    cat.includes("billing")
  ) {
    questions = [
      "Why was I charged mid-cycle?",
      "How do I view my invoice?",
      "Can I get a prorated refund?",
    ];
  } else {
    questions = [
      "Can you summarize the key steps?",
      "What should I do next?",
      "Which article is most relevant?",
    ];
  }

  return questions.map((label) => ({ label, kind: "question" as const }));
}

interface ArticleDetails {
  title: string;
  subtitle: string;
  category: string;
  lastUpdated: string;
  content: string;
}

interface RuntimeMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  citations?: string[];
  card?: ChatCard;
  /** Story-only message bodies rendered under the text. */
  kind?: "pet-card";
  timestamp: Date;
}

function InlineContent({ text, articles, onArticleClick }: { text: string; articles: ArticleDetails[]; onArticleClick: (a: ArticleDetails) => void }) {
  const { theme } = useTheme();
  const { dt } = useDesignTokens();
  const paragraphs = text.split("\n\n");

  // Collect ordered unique footnotes across all paragraphs
  const footnotes: { label: string; article: ArticleDetails | undefined }[] = [];
  const getFootnoteIndex = (label: string, article: ArticleDetails | undefined) => {
    const existing = footnotes.findIndex((f) => f.label === label);
    if (existing !== -1) return existing + 1;
    footnotes.push({ label, article });
    return footnotes.length;
  };

  // First pass: collect footnotes in order
  paragraphs.forEach((para) => {
    para.split(/(\[[^\]]+\])/g).forEach((part) => {
      const match = part.match(/^\[(.+)\]$/);
      if (!match) return;
      const label = match[1];
      const article = articles.find((a) => a.title.toLowerCase().includes(label.toLowerCase()) || a.category.toLowerCase().includes(label.toLowerCase()));
      getFootnoteIndex(label, article);
    });
  });

  // Reset and re-collect during render
  const renderFootnotes: { label: string; article: ArticleDetails | undefined }[] = [];
  const getRenderIndex = (label: string, article: ArticleDetails | undefined) => {
    const existing = renderFootnotes.findIndex((f) => f.label === label);
    if (existing !== -1) return existing + 1;
    renderFootnotes.push({ label, article });
    return renderFootnotes.length;
  };

  const renderedParagraphs = paragraphs.map((para, pIdx) => {
    const parts = para.split(/(\[[^\]]+\])/g);
    return (
      <p key={pIdx} className={`font-['Plus_Jakarta_Sans',sans-serif] text-[15px] leading-[22px] ${pIdx > 0 ? "mt-[10px]" : ""}`} style={{ color: "var(--color-body, #364153)" }}>
        {parts.map((part, i) => {
          const match = part.match(/^\[(.+)\]$/);
          if (!match) return <span key={i}>{part}</span>;
          const label = match[1];
          const article = articles.find((a) => a.title.toLowerCase().includes(label.toLowerCase()) || a.category.toLowerCase().includes(label.toLowerCase()));
          const n = getRenderIndex(label, article);
          return (
            <span key={i}>
              <span>{label}</span>
              <button
                onClick={() => article && onArticleClick(article)}
                className="inline-flex items-center justify-center align-super text-[9px] font-semibold rounded-full size-[14px] ml-[2px] cursor-pointer hover:opacity-70 transition-opacity"
                style={{ backgroundImage: theme.gradient, color: dt.colors.brand.navy, lineHeight: 1 }}
              >
                {n}
              </button>
            </span>
          );
        })}
      </p>
    );
  });

  return (
    <>
      {renderedParagraphs}
    </>
  );
}

function CardRenderer({ card, onStudentClick }: { card: ChatCard; onStudentClick?: (name: string) => void }) {
  if (card.type === "action_tiles") {
    return <ActionTiles title={card.tilesTitle} tiles={card.tiles} onTileClick={() => {}} />;
  }
  if (card.type === "assign_module") return <AssignModuleCard card={card} />;
  if (card.type === "send_notification") return <SendNotificationCard card={card} />;
  if (card.type === "learner_progress") return <LearnerProgressCard card={card} onViewDetails={() => onStudentClick?.("Sophia Patel")} />;
  if (card.type === "module_stepper") return <ModuleStepperCard card={card} />;
  if (card.type === "extend_deadline") return <ExtendDeadlineCard card={card} />;
  if (card.type === "specialist_chat") return <SpecialistChatCard card={card} />;
  if (card.type === "student_readiness") return <StudentReadinessCard card={card} onStudentClick={onStudentClick} />;
  if (card.type === "feedback_form") return <FeedbackFormCard card={card} />;
  return null;
}

interface ChatScreenProps {
  initialQuery: string;
  animateBar?: boolean;
  scriptOverride?: ChatMessage[];
  initialLearner?: string | null;
  searchContext?: {
    query: string;
    summary: string;
    results: { title: string; category: string; subtitle: string }[];
  } | null;
  /** Open with this article already in the right panel (article → chat bridge). */
  initialArticle?: ArticleDetails | null;
  /** Skip agent typing delay (instant entry). */
  instantAgent?: boolean;
  showSuggestions?: boolean;
  /** Leaves the full-page chat and returns to the screen it was opened from. */
  onClose?: () => void;
  showEscalation?: boolean;
}

export function ChatScreen({
  initialQuery,
  animateBar,
  scriptOverride,
  initialLearner,
  searchContext,
  initialArticle = null,
  instantAgent = false,
  showSuggestions = true,
  onClose,
  showEscalation = true,
}: ChatScreenProps) {
  const { tokens } = useTokens();
  const { skin } = useSkin();
  const { dt } = useDesignTokens();
  const helpChat = skin.layout.chat === "help-chat";
  const { theme } = useTheme();
  const bubbleStyle = { background: `linear-gradient(rgba(255,255,255,0.5), rgba(255,255,255,0.5)), ${theme.gradient}`, color: theme.textColor };
  const tc = tokens.chatUI;
  const helpFont = dt.fonts.families.body;
  const chatUserBubble = dt.colors.host.chatUserBubble;
  const chatAgentBubble = dt.colors.host.chatAgentBubble;
  const chatAvatarBg = dt.colors.host.chatAvatarBg;
  /** Pet-policy story: starts from the AI summary tiles on a pet search and plays itself. */
  // Reached from a search summary tile, or by typing the question straight into the home search in
  // fully conversational mode (which skips the results page).
  const storyQuery = searchContext?.query ?? initialQuery ?? "";
  const petStory = !!skin.host.agent && !instantAgent && !initialArticle && isPetTravelQuery(storyQuery);
  const scriptMessages = petStory ? [] : scriptOverride ?? tokens.chatScript.messages;

  const articles: ArticleDetails[] = tokens.articles.learning;

  // Build runtime messages (stamp timestamps, inject user query into first message)
  const runtimeMessages: RuntimeMessage[] = scriptMessages.map((m, i) => ({
    ...m,
    role: m.role as "user" | "agent",
    content: i === 0 && m.role === "user" ? initialQuery || m.content : m.content,
    citations: (m.citations ?? []) as string[],
    card: (m as any).card as ChatCard | undefined,
    timestamp: new Date(),
  }));

  const [visibleCount, setVisibleCount] = useState(1);
  const [isThinking, setIsThinking] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<ArticleDetails | null>(initialArticle ?? null);
  const [selectedLearner, setSelectedLearner] = useState<string | null>(initialLearner ?? null);
  const [feedback, setFeedback] = useState<Record<string, "up" | "down" | null>>({});
  const [promptValue, setPromptValue] = useState("");
  const [greetingDone, setGreetingDone] = useState(false);
  const [finDone, setFinDone] = useState<Record<string, boolean>>({});
  const [chatStartedAt] = useState(() => new Date());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsReady, setSuggestionsReady] = useState(false);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputBarRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ bottom: number; left: number; width: number } | null>(null);

  const suggestionGroups = useMemo(
    () => buildSuggestionGroups("conversational", tokens, promptValue),
    [tokens, promptValue],
  );
  const hasSuggestionGroups = suggestionGroupsHaveItems(suggestionGroups);

  const handlePromptChange = useCallback((val: string) => {
    setPromptValue(val);
    if (!val.trim()) {
      setDropdownOpen(false);
      setSuggestionsReady(false);
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
      return;
    }
    if (inputBarRef.current) {
      const rect = inputBarRef.current.getBoundingClientRect();
      setDropdownPos({ bottom: window.innerHeight - rect.top + 8, left: rect.left, width: rect.width });
    }
    setDropdownOpen(true);
    setSuggestionsReady(false);
    setSuggestionsLoading(true);
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    loadingTimerRef.current = setTimeout(() => {
      setSuggestionsLoading(false);
      setSuggestionsReady(true);
    }, 800);
  }, []);

  const [liveMessages, setLiveMessages] = useState<RuntimeMessage[]>([]);
  const [liveThinking, setLiveThinking] = useState(false);
  const liveIdRef = useRef(0);
  const lastArticleRef = useRef<ArticleDetails | null>(initialArticle ?? articles[0] ?? null);
  /** Once the viewer sends their own message, the scripted demo lines stop advancing. */
  const liveMode = liveMessages.length > 0;

  // ---- pet-policy story ----
  const [articleLoading, setArticleLoading] = useState(false);
  const [storyDone, setStoryDone] = useState(false);
  const [cardDue, setCardDue] = useState(false);
  const { autoplay } = useAutoplay();
  const storyWaiting = useStoryWaiting();
  const startedRef = useRef(false);
  const storyTimers = useRef<number[]>([]);
  const later = (ms: number, fn: () => void) => {
    storyTimers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(() => () => storyTimers.current.forEach(clearTimeout), []);

  const pushLive = (m: Omit<RuntimeMessage, "timestamp">) =>
    setLiveMessages((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, { citations: [], ...m, timestamp: new Date() }]));

  /** The traveler is already signed in, so Fin goes straight to the answer. */
  const startPetReply = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setLiveThinking(true);
    later(2100, () => {
      setLiveThinking(false);
      pushLive({ id: "story-reply", role: "agent", content: PET_POLICY_REPLY, citations: [PET_TRAVEL_TITLE] });
      const policy = articles.find((a) => a.title === PET_TRAVEL_TITLE);
      if (policy) {
        lastArticleRef.current = policy;
        setSelectedArticle(policy);
      }
      setCardDue(true);
    });
  };

  const handlePetConfirm = (type: PetType) => {
    setArticleLoading(true);
    later(1700, () => {
      const next = articles.find((a) => a.title === (type === "dog" ? DOG_TRAVEL_TITLE : PET_TRAVEL_TITLE));
      if (next) setSelectedArticle(next);
      setArticleLoading(false);
    });
  };

  const handlePetComplete = () => {
    pushLive({ id: "story-final", role: "agent", content: PET_FINAL_REPLY });
    setStoryDone(true);
  };

  useEffect(() => {
    if (!petStory) return;
    pushLive({ id: "story-user", role: "user", content: storyQuery });
    // with autoplay off, Fin waits for Space before answering
    return gate(autoplay, 1400, startPetReply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petStory, autoplay]);

  // the pet card follows the reply after a beat (or on Space)
  useEffect(() => {
    if (!cardDue) return;
    return gate(autoplay, 1500, () =>
      pushLive({ id: "story-card", role: "agent", content: PET_CARD_INTRO, kind: "pet-card" }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardDue, autoplay]);
  const storyLocked = petStory && !storyDone;

  const visibleMessages = [...runtimeMessages.slice(0, visibleCount), ...liveMessages];
  const nextMessage = runtimeMessages[visibleCount] ?? null;
  const canAdvance = visibleCount < runtimeMessages.length;
  // Spacebar only shown when the next message to reveal is a user message
  const showSpacebar = canAdvance && !isThinking && !liveMode && nextMessage?.role === "user";

  const followUpNudges = useMemo(() => {
    const categoryHint = searchContext?.results?.[0]?.category
      ?? initialArticle?.category
      ?? "";
    return followUpNudgesForQuery(initialQuery || searchContext?.query || "", categoryHint);
  }, [initialQuery, searchContext, initialArticle]);

  /** Demo-only canned answers so the viewer can keep talking to Fin. */
  const dummyReply = (text: string): { content: string; citations: string[] } => {
    const q = text.toLowerCase();
    const last = lastArticleRef.current ?? articles[0];
    const steps = (a: ArticleDetails) =>
      a.content
        .split("\n\n")
        .slice(1)
        .map((b) => (b.includes("\n") ? b.slice(b.indexOf("\n") + 1) : b))
        .slice(0, 3)
        .map((s, i) => `${i + 1}. ${s}`)
        .join("\n");

    if (/summar|key step/.test(q) && last) {
      lastArticleRef.current = last;
      return { content: `Here are the key steps from “${last.title}”:\n\n${steps(last)}`, citations: [last.title] };
    }
    if (/\bnext\b/.test(q) && last) {
      return {
        content:
          "Once that’s done, save your boarding pass to your phone wallet and plan to arrive at the airport at least 90 minutes before departure.\n\nThis is a demo reply, so timings are illustrative.",
        citations: [last.title],
      };
    }
    const words = q.split(/\W+/).filter((w) => w.length > 2 && !["how", "the", "for", "and", "can", "you", "what", "which", "article", "most", "relevant"].includes(w));
    const scored = articles
      .map((a) => ({
        a,
        s: words.reduce((n, w) => n + (`${a.title} ${a.category} ${a.content}`.toLowerCase().includes(w) ? 1 : 0), 0),
      }))
      .filter((r) => r.s > 0)
      .sort((x, y) => y.s - x.s);
    const best = /relevant|article/.test(q) ? last : scored[0]?.a;
    if (best) {
      lastArticleRef.current = best;
      const summary = (best as ArticleDetails & { summary?: string }).summary ?? best.subtitle;
      return {
        content: /relevant|article/.test(q)
          ? `The most relevant article for this is “${best.title}”.\n\n${summary}`
          : `${summary}\n\nWould you like me to walk through the steps?`,
        citations: [best.title],
      };
    }
    return {
      content:
        "Thanks for your question! I’m a demo assistant, so I don’t have a live answer for that — but I can help with check-in, seats, baggage, changing a flight or MileagePlus.",
      citations: [],
    };
  };

  const sendLive = (raw: string) => {
    const text = raw.trim();
    if (!text || liveThinking || isThinking || storyLocked) return;
    setPromptValue("");
    setDropdownOpen(false);
    const id = (kind: string) => `live-${kind}-${liveIdRef.current++}`;
    setLiveMessages((m) => [...m, { id: id("u"), role: "user", content: text, citations: [], timestamp: new Date() }]);
    setLiveThinking(true);
    setTimeout(() => {
      const reply = dummyReply(text);
      setLiveMessages((m) => [...m, { id: id("a"), role: "agent", ...reply, timestamp: new Date() }]);
      setLiveThinking(false);
    }, 1300);
  };

  const handleFollowUpNudge = (nudge: AiNudge) => {
    if (skin.host.agent) {
      sendLive(nudge.label);
      return;
    }
    setPromptValue(nudge.label);
    setDropdownOpen(false);
    setSuggestionsReady(false);
    setSuggestionsLoading(false);
  };

  const handleStudentClick = (name: string) => {
    setSelectedArticle(null);
    setSelectedLearner(name);
  };

  // Refresh the side panel when the learner_progress card appears, only if panel is already open
  useEffect(() => {
    const lastVisible = runtimeMessages[visibleCount - 1];
    if (lastVisible?.card?.type === "learner_progress" && (selectedLearner !== null || selectedArticle !== null)) {
      setSelectedArticle(null);
      setSelectedLearner("Sophia Patel");
    }
  }, [visibleCount]);

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [visibleCount, isThinking, liveMessages.length, liveThinking]);

  // Auto-advance agent messages with a typing indicator delay
  useEffect(() => {
    if (!canAdvance || liveMode || nextMessage?.role !== "agent") return;
    setIsThinking(true);
    const timer = setTimeout(() => {
      setIsThinking(false);
      setVisibleCount((n) => n + 1);
    }, instantAgent ? 0 : 1500);
    return () => clearTimeout(timer);
  }, [visibleCount, canAdvance, instantAgent]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      if (e.code === "Space" && !isInput && showSpacebar) {
        e.preventDefault();
        setVisibleCount((n) => n + 1);
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [showSpacebar]);

  return (
    <motion.div
      key="chat"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={`relative flex h-full w-full overflow-hidden ${
        helpChat ? "gap-0 bg-white" : "gap-[20px] pl-[10px] pr-[20px] py-[10px]"
      }`}
      style={helpChat ? { fontFamily: helpFont } : undefined}
    >
      {helpChat && skin.host.agent && onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="absolute right-[20px] top-[14px] z-10 inline-flex items-center gap-[6px] h-[34px] px-[14px] rounded-full border bg-white text-[13px] font-semibold hover:bg-black/[0.04] transition-colors"
          style={{ borderColor: dt.colors.ui.borderLight, color: dt.colors.brand.navy }}
        >
          <X className="size-[14px]" />
          Close
        </button>
      )}
      <motion.div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        <div
          className={`flex flex-col h-full w-full min-h-0 mx-auto ${
            helpChat ? "max-w-[720px]" : "max-w-[800px]"
          }`}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: animateBar ? 0.55 : 0, ease: "easeOut" }}
            className="relative flex-1 min-h-0"
          >
            <div
              ref={scrollRef}
              className={`h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                helpChat ? "px-[28px] pt-[20px] pb-[16px]" : "px-[40px] pt-[24px] pb-[24px]"
              }`}
            >
              {helpChat && (
                <div className="flex items-center gap-[12px] mb-[22px]">
                  <div className="flex-1 h-px bg-[#E4E7ED]" />
                  <p className="shrink-0 text-[12px] text-[#606266] whitespace-nowrap">
                    Chat started at {formatChatStarted(chatStartedAt)}
                  </p>
                  <div className="flex-1 h-px bg-[#E4E7ED]" />
                </div>
              )}

              {/* The welcome only greets people who opened the agent with no question yet (floating button / expand);
              a search that already carries a question starts straight on that question. */}
              {helpChat && skin.host.agent && instantAgent && !petStory && (
                <div className="flex gap-[10px] items-start max-w-[88%] mb-[18px]">
                  <HelpChatBotAvatar bg={chatAvatarBg} letter={skin.host.agent?.label[0]} logo={skin.host.agent?.logo} />
                  <div className="flex flex-col items-start min-w-0">
                    <div
                      className="rounded-[16px] px-[16px] py-[12px] text-[15px] leading-[22px]"
                      style={{ background: chatAgentBubble, color: dt.colors.ui.body }}
                    >
                      <FinCitedText animate text={skin.host.agent.greeting} citations={[]} onDone={() => setGreetingDone(true)} />
                    </div>
                    <span
                      className="mt-[6px] text-[11px] transition-opacity duration-200"
                      style={{ color: dt.colors.ui.mutedDark, opacity: greetingDone ? 1 : 0 }}
                    >
                      {skin.host.agent.label} · {formatChatClock(chatStartedAt)}
                    </span>
                  </div>
                </div>
              )}

              {!helpChat && searchContext && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="mb-[20px] rounded-[14px] border border-white/70 bg-white/70 backdrop-blur-[8px] px-[14px] py-[12px]"
                >
                  <div className="flex items-center gap-[6px] mb-[8px]">
                    <Search className="size-[12px] text-gray-400" />
                    <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[11px] font-semibold tracking-wider text-gray-400">
                      context from search
                    </p>
                  </div>
                  <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[13px] font-semibold text-[#364153] mb-[8px] line-clamp-2">
                    “{searchContext.query}”
                  </p>
                  <div className="flex flex-col gap-[6px]">
                    {searchContext.results.slice(0, 3).map((r) => (
                      <div key={r.title} className="flex items-start gap-[8px]">
                        <span className="mt-[6px] size-[4px] rounded-full bg-gray-300 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[12px] text-[#4b5563] truncate">
                            {r.title}
                          </p>
                          <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[11px] text-gray-400 truncate">
                            {r.category}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <AnimatePresence mode="popLayout">
                {visibleMessages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.45, delay: index * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} ${
                      helpChat ? "mb-[18px]" : "mb-[20px]"
                    }`}
                  >
                    {message.role === "user" ? (
                      helpChat ? (
                        <div className="flex flex-col items-end max-w-[78%]">
                          <div
                            className="rounded-[18px] px-[16px] py-[12px] text-white"
                            style={{ background: chatUserBubble }}
                          >
                            <p className="text-[15px] leading-[22px]">{message.content}</p>
                          </div>
                          <div
                            className="mt-[6px] flex items-center gap-[6px] text-[11px]"
                            style={{ color: dt.colors.ui.mutedDark }}
                          >
                            <span>{formatChatClock(message.timestamp)}</span>
                            <CheckCheck className="size-[14px]" strokeWidth={2.2} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-[12px] items-start max-w-[70%]">
                          <div className="flex flex-col gap-[4px] items-end flex-1">
                            <div className="rounded-[16px] px-[20px] py-[16px]" style={bubbleStyle}>
                              <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[15px] leading-[22px]">
                                {message.content}
                              </p>
                            </div>
                            <span className="text-[11px] px-[4px] text-gray-400">
                              {message.timestamp.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className="shrink-0 size-[40px] rounded-full overflow-hidden">
                            <img src={userAvatar} alt="User" className="block size-full object-cover" />
                          </div>
                        </div>
                      )
                    ) : helpChat ? (
                      <div className="flex gap-[10px] items-end max-w-[88%]">
                        <HelpChatBotAvatar bg={chatAvatarBg} letter={skin.host.agent?.label[0]} logo={skin.host.agent?.logo} />
                        <div className="flex flex-col items-start min-w-0">
                          {message.content && (
                            <div
                              className="rounded-[16px] px-[16px] py-[12px] text-[15px] leading-[22px]"
                              style={{
                                background: chatAgentBubble,
                                color: dt.colors.ui.body,
                              }}
                            >
                              {skin.host.agent ? (
                                <FinCitedText
                                  animate
                                  onDone={() => setFinDone((d) => (d[message.id] ? d : { ...d, [message.id]: true }))}
                                  text={message.content}
                                  citations={(message.citations ?? []).flatMap((title) => {
                                    const a = articles.find((x) => x.title === title);
                                    return a
                                      ? [{ title: a.title, source: "united.com/help", onOpen: () => setSelectedArticle(a) }]
                                      : [];
                                  })}
                                />
                              ) : (
                                <InlineContent
                                  text={message.content}
                                  articles={articles}
                                  onArticleClick={setSelectedArticle}
                                />
                              )}
                            </div>
                          )}
                          {message.kind === "pet-card" && finDone[message.id] && (
                            <PetInfoCard onPetTypeConfirm={handlePetConfirm} onComplete={handlePetComplete} />
                          )}
                          {!skin.host.agent && message.citations && message.citations.length > 0 && (
                            <div className="mt-[8px]">
                              <CitationChips
                                citations={message.citations}
                                articles={articles}
                                onArticleClick={setSelectedArticle}
                              />
                            </div>
                          )}
                          {message.card && (
                            <div className="mt-[8px]">
                              <CardRenderer card={message.card} onStudentClick={handleStudentClick} />
                            </div>
                          )}
                          <span
                            className="mt-[6px] text-[11px] transition-opacity duration-200"
                            style={{
                              color: dt.colors.ui.mutedDark,
                              opacity: skin.host.agent && message.content && !finDone[message.id] ? 0 : 1,
                            }}
                          >
                            {skin.host.agent ? `${skin.host.agent.label} · ` : ""}
                            {formatChatClock(message.timestamp)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-[12px] items-start max-w-[90%] w-[90%]">
                        <div className="relative rounded-full shrink-0 size-[40px]">
                          <img
                            src={avatarImage}
                            alt={tc.avatarAlt}
                            className="block size-full rounded-full object-cover"
                          />
                          <div className="absolute bg-[#00c950] border-2 border-solid border-white left-[30px] rounded-full size-[12px] top-[30px]" />
                        </div>
                        <div className="flex flex-col gap-[4px] items-start flex-1">
                          {message.content && (
                            <div className="rounded-[16px] px-[0.5px] py-[0.5px]">
                              <InlineContent
                                text={message.content}
                                articles={articles}
                                onArticleClick={setSelectedArticle}
                              />
                            </div>
                          )}
                          {message.citations && message.citations.length > 0 && (
                            <CitationChips
                              citations={message.citations}
                              articles={articles}
                              onArticleClick={setSelectedArticle}
                            />
                          )}
                          {message.card && (
                            <CardRenderer card={message.card} onStudentClick={handleStudentClick} />
                          )}
                          <div className="flex items-center gap-[6px] px-[4px] mt-[2px]">
                            <span className="font-['Plus_Jakarta_Sans',sans-serif] text-[11px] text-gray-400">
                              {content.chat.agentName}
                            </span>
                            <span className="text-gray-300">·</span>
                            <span className="font-['Plus_Jakarta_Sans',sans-serif] text-[11px] text-gray-400">
                              {message.timestamp.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className="text-gray-300">·</span>
                            {feedback[message.id] ? (
                              <motion.span
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25 }}
                                className="font-['Plus_Jakarta_Sans',sans-serif] text-[11px] text-gray-400"
                              >
                                {feedback[message.id] === "up"
                                  ? content.chat.feedbackPositive
                                  : content.chat.feedbackNegative}
                              </motion.span>
                            ) : (
                              <>
                                <span className="font-['Plus_Jakarta_Sans',sans-serif] text-[11px] text-gray-400">
                                  {content.chat.feedbackPrompt}
                                </span>
                                <motion.button
                                  whileTap={{ scale: 0.85 }}
                                  onClick={() => setFeedback((f) => ({ ...f, [message.id]: "up" }))}
                                  className="hover:text-gray-600 text-gray-400 transition-colors"
                                >
                                  <ThumbsUp className="size-[12px]" />
                                </motion.button>
                                <motion.button
                                  whileTap={{ scale: 0.85 }}
                                  onClick={() => setFeedback((f) => ({ ...f, [message.id]: "down" }))}
                                  className="hover:text-gray-600 text-gray-400 transition-colors"
                                >
                                  <ThumbsDown className="size-[12px]" />
                                </motion.button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}

                {(isThinking || liveThinking) && (
                  <motion.div
                    key="thinking"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex items-start mb-[18px] ${
                      helpChat ? "gap-[10px]" : "gap-[12px]"
                    }`}
                  >
                    {helpChat ? (
                      <>
                        <HelpChatBotAvatar bg={chatAvatarBg} letter={skin.host.agent?.label[0]} logo={skin.host.agent?.logo} />
                        {skin.host.agent ? (
                          <FinThinking background={chatAgentBubble} dot={dt.colors.ui.muted} />
                        ) : (
                        <div
                            className="rounded-[16px] px-[16px] py-[14px]"
                            style={{ background: chatAgentBubble }}
                          >
                            <div className="flex gap-[5px] items-center">
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  className="size-[7px] rounded-full"
                                  style={{ background: chatUserBubble }}
                                  animate={{ opacity: [0.25, 1, 0.25] }}
                                  transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="relative rounded-full shrink-0 size-[40px]">
                          <img
                            src={avatarImage}
                            alt={tc.avatarAlt}
                            className="block size-full rounded-full object-cover"
                          />
                          <div className="absolute bg-[#00c950] border-2 border-solid border-white left-[30px] rounded-full size-[12px] top-[30px]" />
                        </div>
                        <div className="flex items-center h-[40px]">
                          <TypingIndicator />
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <div
            className={`flex-shrink-0 ${
              helpChat ? "px-[28px] pb-[14px]" : "px-[40px] pb-[16px]"
            }`}
          >
            {helpChat ? (
              <>
                {petStory && !autoplay && storyWaiting && (
                  <div className="mb-[10px] flex justify-center">
                    <span
                      className="rounded-full border bg-white px-[12px] py-[5px] text-[12px] font-medium"
                      style={{ borderColor: dt.colors.ui.borderLight, color: dt.colors.ui.muted }}
                    >
                      Press <kbd className="font-semibold text-black">Space</kbd> to continue
                    </span>
                  </div>
                )}
                <div className="relative w-full" ref={inputBarRef}>
                  {skin.host.agent ? (
                    <FinComposer
                      value={promptValue}
                      onChange={handlePromptChange}
                      onSend={() => sendLive(promptValue)}
                      disabled={liveThinking || isThinking || storyLocked}
                      onFocus={() => promptValue.trim() && setDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                    />
                  ) : (
                  <div className="flex items-center gap-[8px] h-[48px] pl-[18px] pr-[8px] rounded-full border border-[#DCDFE6] bg-white">
                      <input
                        type="text"
                        value={promptValue}
                        onChange={(e) => handlePromptChange(e.target.value)}
                        onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                        onFocus={() => promptValue.trim() && setDropdownOpen(true)}
                        placeholder="Type your message..."
                        className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[15px] text-[#1A1A1A] placeholder:text-[#909399]"
                      />
                      <button
                        type="button"
                        className="size-[34px] rounded-full bg-[#D1D5DB] text-white flex items-center justify-center shrink-0 hover:bg-[#9CA3AF] transition-colors"
                        aria-label="Send"
                      >
                        <ChevronRight className="size-[18px]" strokeWidth={2.5} />
                      </button>
                    </div>
                  )}
                </div>
                {showSuggestions && followUpNudges.length > 0 && (
                  <div className={`mt-[10px] transition-opacity ${storyLocked ? "pointer-events-none opacity-50" : ""}`}>
                    <AiNudgeChips subtle nudges={followUpNudges} onNudge={handleFollowUpNudge} />
                  </div>
                )}
                {!skin.host.agent && (
                  <p className="mt-[12px] text-center text-[11px] leading-[15px] text-[#606266]">
                    Responses generated with the assistance of AI technology.
                    <br />
                    Avoid sharing personal information unless requested.
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="relative w-full flex items-center gap-[8px]" ref={inputBarRef}>
                  <motion.div
                    {...(animateBar ? { layout: true, layoutId: "prompt-bar" } : {})}
                    style={{ borderRadius: "9999px" }}
                    className="relative flex-1 flex items-center gap-[6px] bg-white border border-gray-200 px-[8px] py-[8px]"
                  >
                    <button className="flex items-center justify-center rounded-full size-[36px] border border-gray-200 bg-white hover:bg-gray-50 transition-colors flex-shrink-0">
                      <Plus className="size-[16px]" style={{ color: "var(--color-icon, #4A5565)" }} />
                    </button>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={promptValue}
                        onChange={(e) => handlePromptChange(e.target.value)}
                        onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                        onFocus={() => promptValue.trim() && setDropdownOpen(true)}
                        placeholder={tc.searchPlaceholder}
                        className="w-full bg-transparent border-0 outline-none font-['Plus_Jakarta_Sans',sans-serif] text-[15px] placeholder:text-[#99a1af]"
                        style={{ color: "var(--color-body, #364153)" }}
                      />
                    </div>
                    <button className="flex items-center justify-center rounded-full size-[36px] bg-white border border-gray-200 hover:bg-gray-50 transition-colors flex-shrink-0">
                      <Mic className="size-[16px]" style={{ color: "var(--color-icon, #4A5565)" }} />
                    </button>
                  </motion.div>
                  {showEscalation && (
                    <button className="flex items-center justify-center rounded-full size-[44px] bg-white border border-gray-200 hover:bg-gray-50 transition-colors flex-shrink-0">
                      <Phone className="size-[18px]" style={{ color: "var(--color-icon, #4A5565)" }} />
                    </button>
                  )}
                </div>

                {showSuggestions && followUpNudges.length > 0 && (
                  <div className={`mt-[10px] transition-opacity ${storyLocked ? "pointer-events-none opacity-50" : ""}`}>
                    <AiNudgeChips subtle nudges={followUpNudges} onNudge={handleFollowUpNudge} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Prompt dropdown — fixed to escape overflow:hidden parents */}
      <AnimatePresence>
        {showSuggestions && !skin.host.agent && dropdownOpen && dropdownPos && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className="fixed bg-white rounded-[20px] shadow-[0px_12px_40px_rgba(0,0,0,0.12)] overflow-hidden z-[200] max-h-[min(420px,50vh)] overflow-y-auto"
            style={{ bottom: dropdownPos.bottom, left: dropdownPos.left, width: dropdownPos.width }}
          >
            <div className="flex items-center gap-[12px] px-[16px] py-[12px] border-b border-gray-100">
              <div className="size-[32px] rounded-[8px] bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Search className="size-[14px] text-gray-500" />
              </div>
              <p
                className="font-['Plus_Jakarta_Sans',sans-serif] text-[14px] truncate"
                style={{ color: "var(--color-body, #364153)" }}
              >
                {promptValue}
              </p>
            </div>
            <div className="py-[6px]">
              {suggestionsLoading ? (
                [0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-[12px] px-[16px] py-[10px]">
                    <div className="size-[28px] rounded-[8px] bg-gray-100 animate-pulse flex-shrink-0" />
                    <div className="flex flex-col gap-[6px] flex-1">
                      <div className="h-[12px] bg-gray-100 rounded animate-pulse w-[55%]" />
                      <div className="h-[10px] bg-gray-100 rounded animate-pulse w-[35%]" />
                    </div>
                  </div>
                ))
              ) : suggestionsReady && hasSuggestionGroups ? (
                <SuggestionGroupList
                  compact
                  groups={suggestionGroups}
                  query={promptValue}
                  onSelect={(item) => {
                    setPromptValue(item.value);
                    setDropdownOpen(false);
                    setSuggestionsReady(false);
                    setSuggestionsLoading(false);
                  }}
                />
              ) : suggestionsReady ? (
                <p className="px-[16px] py-[14px] font-['Plus_Jakarta_Sans',sans-serif] text-[13px] text-[#9CA3AF]">
                  No matching suggestions
                </p>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        {(selectedArticle || selectedLearner || articleLoading) && (
          <motion.div
            key={selectedLearner ?? (petStory ? "pet-panel" : selectedArticle?.title)}
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 40, stiffness: 140, mass: 1.2 }}
            className="flex-1 h-full min-w-0"
          >
            <div className="h-full">
              {selectedLearner ? (
                <LearnerProfilePanel
                  studentName={selectedLearner}
                  onClose={() => setSelectedLearner(null)}
                />
              ) : articleLoading ? (
                <ArticleSkeleton />
              ) : (
                <ArticlePanel
                  article={selectedArticle}
                  onClose={() => setSelectedArticle(null)}
                  hideClose={!!skin.host.agent}
                  compact
                  onOpenArticle={setSelectedArticle}
                  showAiAssist
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
