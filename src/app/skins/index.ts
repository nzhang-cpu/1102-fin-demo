import type { DesignTokens } from "../DesignTokensContext";
import type { Tokens } from "../tokens";
import defaultDt from "../designTokens.json";
import { defaultTokens } from "../tokens";
import fixedJson from "../content/fixed.json";
import disneyPlusGenerated from "../content/generated script/generated_disney_plus.json";
import southwestGenerated from "../content/generated script/generated_southwest.json";
import finLogo from "../assets/logos/fin-white.png";
import unitedLogo from "../assets/logos/united.svg";
import unitedGenerated from "../content/generated script/generated_united.json";

export type CompanySkinId = "default" | "disney-plus" | "southwest" | "united" | "united-futuristic";

export type HostShellKind = "none" | "help-center";
export type HomeLayout = "centered-hero" | "help-mirror" | "help-pathway" | "united-help" | "united-futuristic";
export type ArticleLayout = "panel" | "help-article";
export type ChatLayout = "default" | "help-chat";

export interface HostBannerCopy {
  beforeLink: string;
  linkLabel: string;
  afterLink: string;
}

export interface CompanySkinHost {
  addressBarHost: string;
  showProductChrome: boolean;
  shell: HostShellKind;
  showChatFab: boolean;
  /** Optional promo/alert strips under the host nav. */
  banners?: HostBannerCopy[];
  /** Optional primary nav links (mega-nav style). Replaces the brand + search header. */
  navItems?: string[];
  /** Optional logo image shown in the mega-nav. */
  navLogo?: string;
  /** Optional named assistant: greeting bubble opens the chat; label prefixes agent timestamps. */
  agent?: { label: string; greeting: string; logo?: string; suggestions?: string[] };
}

export interface CompanySkinLayout {
  home: HomeLayout;
  article: ArticleLayout;
  chat: ChatLayout;
}

export interface CompanySkin {
  id: CompanySkinId;
  label: string;
  /** Short note under the skin name in the picker. */
  hint: string;
  designTokens: DesignTokens;
  tokens: Tokens;
  host: CompanySkinHost;
  layout: CompanySkinLayout;
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = target[key];
    if (
      sv !== null &&
      typeof sv === "object" &&
      !Array.isArray(sv) &&
      tv !== null &&
      typeof tv === "object" &&
      !Array.isArray(tv)
    ) {
      result[key] = deepMerge(tv as Record<string, unknown>, sv as Record<string, unknown>);
    } else {
      result[key] = sv;
    }
  }
  return result;
}

function buildTokens(generated: Record<string, unknown>, brandName: string): Tokens {
  const merged = deepMerge(fixedJson as unknown as Record<string, unknown>, generated);
  const chatScriptMessages = ((merged.chatScript as { messages?: unknown[] })?.messages ?? []).map(
    (m: unknown) => {
      const msg = m as Record<string, unknown>;
      return {
        ...msg,
        role: msg.role as "user" | "agent",
        citations: (msg.citations ?? []) as string[],
      };
    },
  );
  const resolvedChatMessages =
    chatScriptMessages.length > 0
      ? chatScriptMessages
      : (defaultTokens.chatScript.messages as unknown[]);
  return {
    ...defaultTokens,
    brandName,
    hero: (merged.hero ?? defaultTokens.hero) as typeof defaultTokens.hero,
    searchHero: (merged.searchHero ?? defaultTokens.searchHero) as typeof defaultTokens.searchHero,
    searchBar: (merged.searchBar ?? defaultTokens.searchBar) as typeof defaultTokens.searchBar,
    searchBarDropdown: (merged.searchBarDropdown ??
      defaultTokens.searchBarDropdown) as typeof defaultTokens.searchBarDropdown,
    categories: (merged.categories ?? defaultTokens.categories) as typeof defaultTokens.categories,
    homePathways: (merged.homePathways ??
      defaultTokens.homePathways) as typeof defaultTokens.homePathways,
    sidebar: (merged.sidebar ?? defaultTokens.sidebar) as typeof defaultTokens.sidebar,
    chat: (merged.chat ?? defaultTokens.chat) as typeof defaultTokens.chat,
    articles: (merged.articles ?? defaultTokens.articles) as typeof defaultTokens.articles,
    chatScript: { messages: resolvedChatMessages as typeof defaultTokens.chatScript.messages },
  };
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

const DEFAULT_HOST: CompanySkinHost = {
  addressBarHost: "",
  showProductChrome: true,
  shell: "none",
  showChatFab: false,
};

const DEFAULT_LAYOUT: CompanySkinLayout = {
  home: "centered-hero",
  article: "panel",
  chat: "default",
};

/** Disney+ Help host paint — applied via DesignTokensContext on skin switch. */
export function buildDisneyPlusDesignTokens(): DesignTokens {
  const dt = deepClone(defaultDt) as DesignTokens;
  dt.colors.brand.navy = "#0B0C0F";
  dt.colors.brand.navyDeep = "#0040E5";
  dt.colors.brand.purple = "#0040E5";
  dt.colors.brand.purpleDark = "#0030B0";
  dt.colors.brand.purpleMid = "#1A1B1E";
  dt.colors.ui.body = "#1A1B1E";
  dt.colors.ui.muted = "#6B7280";
  dt.colors.ui.mutedDark = "#4B5563";
  dt.colors.ui.iconStroke = "#1A1B1E";
  dt.colors.ui.borderLight = "#D1D5DB";
  dt.colors.ui.borderFaint = "#E5E7EB";
  dt.colors.ui.bgPage = "#F6F7F8";
  dt.colors.ui.bgInput = "#FFFFFF";
  dt.colors.accent.indigo = "#0040E5";
  dt.colors.accent.sky = "#7EB8C8";
  dt.colors.host.navBg = "#0B1A22";
  dt.colors.host.navText = "#ffffff";
  dt.colors.host.bannerBg = "#FBF0E6";
  dt.colors.host.bannerBorder = "#E8A070";
  dt.colors.host.bannerIcon = "#E07A2F";
  dt.colors.host.link = "#0040E5";
  dt.colors.host.pageBg = "#F6F7F8";
  dt.colors.host.chatUserBubble = "#164453";
  dt.colors.host.chatAgentBubble = "#EEF0F4";
  dt.colors.host.chatAvatarBg = "#0E3342";
  dt.colors.host.aiSummaryAccent = "#0D7377";
  dt.colors.host.aiSummaryBg = "#F4F7FA";
  dt.colors.host.searchCta = "#1A1B1E";
  dt.gradients.pageBackground = "#F6F7F8";
  dt.gradients.theme.skyPeriwinkle =
    "linear-gradient(180deg, #0B1A24 0%, #14303C 45%, #0F2430 100%)";
  dt.gradients.button.primary = "linear-gradient(180deg, #0040E5 0%, #0030B0 100%)";
  dt.gradients.button.send = "linear-gradient(180deg, #0040E5 0%, #0030B0 100%)";
  dt.gradients.button.indigo = "linear-gradient(180deg, #0040E5 0%, #0030B0 100%)";
  dt.shadows.searchGlow = "0 4px 24px rgba(0, 0, 0, 0.18)";
  dt.fonts.families.body = "'Avenir Next', Avenir, 'Segoe UI', Arial, sans-serif";
  dt.fonts.families.heading = "'Avenir Next', Avenir, 'Segoe UI', Arial, sans-serif";
  dt.themes.skyPeriwinkle = {
    id: "disney-plus",
    label: "Disney+",
    gradient: "linear-gradient(135deg, #0040E5 0%, #5B9FCF 55%, #7EB8C8 100%)",
    swatchA: "#0040E5",
    swatchB: "#7EB8C8",
    textColor: "#0B0C0F",
  };
  return dt;
}

/** Southwest Airlines Help Center — Bold Blue host paint from support.southwest.com. */
export function buildSouthwestDesignTokens(): DesignTokens {
  const dt = deepClone(defaultDt) as DesignTokens;
  const boldBlue = "#304CB2";
  const linkBlue = "#273E92";
  const deepBlue = "#1E2F6E";
  const heartRed = "#C60C30";
  dt.colors.brand.navy = "#1C1C1C";
  dt.colors.brand.navyDeep = linkBlue;
  dt.colors.brand.purple = boldBlue;
  dt.colors.brand.purpleDark = deepBlue;
  dt.colors.brand.purpleMid = "#2A3A6E";
  dt.colors.ui.body = "#3E3E3C";
  dt.colors.ui.muted = "#706E6B";
  dt.colors.ui.mutedDark = "#514F4D";
  dt.colors.ui.iconStroke = "#3E3E3C";
  dt.colors.ui.borderLight = "#C9C7C5";
  dt.colors.ui.borderFaint = "#E5E5E5";
  dt.colors.ui.bgPage = "#FFFFFF";
  dt.colors.ui.bgInput = "#FFFFFF";
  dt.colors.accent.indigo = boldBlue;
  dt.colors.accent.sky = "#5B8DEF";
  dt.colors.host.navBg = "#FFFFFF";
  dt.colors.host.navText = boldBlue;
  dt.colors.host.bannerBg = "#FFF8F0";
  dt.colors.host.bannerBorder = "#F5C28A";
  dt.colors.host.bannerIcon = heartRed;
  dt.colors.host.link = linkBlue;
  dt.colors.host.pageBg = "#FFFFFF";
  dt.colors.host.chatUserBubble = boldBlue;
  dt.colors.host.chatAgentBubble = "#F3F2F2";
  dt.colors.host.chatAvatarBg = deepBlue;
  dt.colors.host.aiSummaryAccent = boldBlue;
  dt.colors.host.aiSummaryBg = "#F4F6FB";
  dt.colors.host.searchCta = boldBlue;
  dt.colors.host.searchCtaAlt = "#FFBF27";
  dt.colors.host.tileAccent = "#FF792E";
  dt.gradients.pageBackground = "#FFFFFF";
  dt.gradients.theme.skyPeriwinkle = boldBlue;
  dt.gradients.button.primary = `linear-gradient(180deg, ${boldBlue} 0%, ${linkBlue} 100%)`;
  dt.gradients.button.send = `linear-gradient(180deg, ${boldBlue} 0%, ${linkBlue} 100%)`;
  dt.gradients.button.indigo = `linear-gradient(180deg, ${boldBlue} 0%, ${linkBlue} 100%)`;
  dt.shadows.searchGlow = "0 4px 20px rgba(48, 76, 178, 0.16)";
  dt.fonts.families.body = "'Helvetica Neue', Helvetica, Arial, sans-serif";
  dt.fonts.families.heading = "'Helvetica Neue', Helvetica, Arial, sans-serif";
  dt.themes.skyPeriwinkle = {
    id: "southwest",
    label: "Southwest",
    gradient: `linear-gradient(135deg, ${boldBlue} 0%, #5B8DEF 55%, #FFBF27 100%)`,
    swatchA: boldBlue,
    swatchB: "#FFBF27",
    textColor: "#1C1C1C",
  };
  return dt;
}

/** Skyline Airways Help Center — Skyline blue host paint (brand values, not scraped from skylineairways.com). */
export function buildUnitedDesignTokens(): DesignTokens {
  const dt = deepClone(defaultDt) as DesignTokens;
  const unitedBlue = "#1414D2";
  const linkBlue = "#1414D2";
  const deepBlue = "#000000";
  dt.colors.brand.navy = deepBlue;
  dt.colors.brand.navyDeep = linkBlue;
  dt.colors.brand.purple = unitedBlue;
  dt.colors.brand.purpleDark = deepBlue;
  dt.colors.brand.purpleMid = "#2A2A2A";
  dt.colors.ui.body = "#000000";
  dt.colors.ui.muted = "#6B7280";
  dt.colors.ui.mutedDark = "#4B5563";
  dt.colors.ui.iconStroke = "#000000";
  dt.colors.ui.borderLight = "#C9CED6";
  dt.colors.ui.borderFaint = "#E5E7EB";
  dt.colors.ui.bgPage = "#FFFFFF";
  dt.colors.ui.bgInput = "#FFFFFF";
  dt.colors.accent.indigo = unitedBlue;
  dt.colors.accent.sky = "#6B6BE6";
  dt.colors.host.navBg = "#000000";
  dt.colors.host.navText = "#FFFFFF";
  dt.colors.host.bannerBg = "#F2F2F2";
  dt.colors.host.bannerBorder = "#D0D0D0";
  dt.colors.host.bannerIcon = unitedBlue;
  dt.colors.host.link = linkBlue;
  dt.colors.host.pageBg = "#FFFFFF";
  dt.colors.host.chatUserBubble = unitedBlue;
  dt.colors.host.chatAgentBubble = "#F2F2F2";
  dt.colors.host.chatAvatarBg = deepBlue;
  dt.colors.host.aiSummaryAccent = unitedBlue;
  dt.colors.host.aiSummaryBg = "#F2F2F2";
  dt.colors.host.searchCta = unitedBlue;
  dt.colors.host.searchCtaAlt = "#EDEDED";
  dt.colors.host.tileAccent = unitedBlue;
  dt.gradients.pageBackground = "#FFFFFF";
  dt.gradients.theme.skyPeriwinkle = unitedBlue;
  dt.gradients.button.primary = `linear-gradient(180deg, ${unitedBlue} 0%, ${deepBlue} 100%)`;
  dt.gradients.button.send = `linear-gradient(180deg, ${unitedBlue} 0%, ${deepBlue} 100%)`;
  dt.gradients.button.indigo = `linear-gradient(180deg, ${unitedBlue} 0%, ${deepBlue} 100%)`;
  dt.shadows.searchGlow = "0 2px 12px rgba(20, 20, 210, 0.14)";
  dt.fonts.families.body = "'Helvetica Neue', Helvetica, Arial, sans-serif";
  dt.fonts.families.heading = "'Helvetica Neue', Helvetica, Arial, sans-serif";
  dt.themes.skyPeriwinkle = {
    id: "united",
    label: "Skyline",
    gradient: `linear-gradient(135deg, ${unitedBlue} 0%, #6B6BE6 60%, #B8B8F2 100%)`,
    swatchA: unitedBlue,
    swatchB: "#B8B8F2",
    textColor: deepBlue,
  };
  return dt;
}

export const COMPANY_SKINS: CompanySkin[] = [
  {
    id: "default",
    label: "Default",
    hint: "Current demo look",
    designTokens: deepClone(defaultDt) as DesignTokens,
    tokens: defaultTokens,
    host: { ...DEFAULT_HOST },
    layout: { ...DEFAULT_LAYOUT },
  },
  {
    id: "disney-plus",
    label: "Disney+",
    hint: "Help-center host + shared essence",
    designTokens: buildDisneyPlusDesignTokens(),
    tokens: buildTokens(
      disneyPlusGenerated as unknown as Record<string, unknown>,
      "Disney+",
    ),
    host: {
      addressBarHost: "help.disneyplus.com",
      showProductChrome: false,
      shell: "help-center",
      showChatFab: true,
      banners: [
        {
          beforeLink: "New bundle subscribers, be sure to ",
          linkLabel: "activate your Hulu account",
          afterLink: " before logging in to the Hulu app for kickoff!",
        },
      ],
    },
    layout: {
      home: "help-mirror",
      article: "help-article",
      chat: "help-chat",
    },
  },
  {
    id: "southwest",
    label: "Southwest",
    hint: "Help Center host + shared essence",
    designTokens: buildSouthwestDesignTokens(),
    tokens: buildTokens(
      southwestGenerated as unknown as Record<string, unknown>,
      "Southwest",
    ),
    host: {
      addressBarHost: "support.southwest.com/helpcenter",
      showProductChrome: false,
      shell: "help-center",
      showChatFab: true,
      banners: [
        {
          beforeLink: "",
          linkLabel: "Power banks/portable chargers",
          afterLink: " — Review important updates for Customers traveling with a power bank.",
        },
        {
          beforeLink: "",
          linkLabel: "Assigned seats",
          afterLink: " — All Southwest flights now have assigned seats! Learn more.",
        },
      ],
    },
    layout: {
      home: "help-pathway",
      article: "help-article",
      chat: "help-chat",
    },
  },
  {
    id: "united",
    label: "Skyline",
    hint: "Help Center host + shared essence",
    designTokens: buildUnitedDesignTokens(),
    tokens: buildTokens(
      unitedGenerated as unknown as Record<string, unknown>,
      "Skyline",
    ),
    host: {
      addressBarHost: "skylineairways.com/en/us/fly/help-center.html",
      showProductChrome: false,
      shell: "help-center",
      showChatFab: true,
      navLogo: unitedLogo,
      agent: {
        label: "Fin from Skyline",
        logo: finLogo,
        suggestions: [
          "How do I check in for my flight?",
          "What's my baggage allowance?",
          "Change or cancel my flight",
        ],
        greeting: [
          "Welcome to Skyline Messaging!",
          "I’m Skyline’s AI-powered Virtual Assistant here to help answer your travel questions. [Note: Some answers may be AI-generated based on content from skylineairways.com. Please check the source links for up-to-date information.]",
          "Don’t want to be tied to your desktop? For the same service on the go, text “SKYLINE” to 32050 on your mobile device.",
          "How can I help you today?",
        ].join("\n\n"),
      },
      navItems: ["Booking", "Manage my trips", "Travel info", "MileagePlus", "Skyline cards", "Deals", "Help"],
    },
    layout: {
      home: "united-help",
      article: "help-article",
      chat: "help-chat",
    },
  },
];

/** Skyline Futuristic: same Skyline content and Fin, with an aurora-glass home page. */
export function buildUnitedFuturisticDesignTokens(): DesignTokens {
  const dt = buildUnitedDesignTokens();
  dt.colors.host.pageBg = "#F4F6FF";
  dt.colors.host.chatAgentBubble = "#EEF1FF";
  dt.gradients.pageBackground = "#F4F6FF";
  dt.themes.skyPeriwinkle = {
    id: "united-futuristic",
    label: "Skyline Futuristic",
    gradient: "linear-gradient(135deg, #1414D2 0%, #6B5BFF 55%, #22D3EE 100%)",
    swatchA: "#1414D2",
    swatchB: "#22D3EE",
    textColor: "#000000",
  };
  return dt;
}

const UNITED_SKIN = COMPANY_SKINS.find((k) => k.id === "united")!;
COMPANY_SKINS.push({
  ...UNITED_SKIN,
  id: "united-futuristic",
  label: "Skyline Futuristic",
  hint: "Aurora glass home + Fin",
  designTokens: buildUnitedFuturisticDesignTokens(),
  host: { ...UNITED_SKIN.host },
  layout: { ...UNITED_SKIN.layout, home: "united-futuristic" },
});

export function getSkin(id: CompanySkinId): CompanySkin {
  return COMPANY_SKINS.find((s) => s.id === id) ?? COMPANY_SKINS[0];
}
