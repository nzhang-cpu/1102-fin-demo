import type { MaturityMode } from "./components/MaturityToggle";
import type { FeatureFlags } from "./components/FeatureChecklist";
import type { ArticleLayoutVariant } from "./components/KnowledgeArticleScreen";
import type { CompanySkinId } from "./skins";

/**
 * Demo settings shared by everyone who opens the page: the last visitor's choices become the
 * next visitor's defaults. They live in a small public JSON document (no account needed).
 *
 * The document's URL is below. While it is empty or unreachable, settings are only remembered in
 * this browser. Anyone who has the URL can change the settings.
 */
const SHARED_SETTINGS_URL = "https://api.npoint.io/e9bf6d3f1ce74aeef558";

const LOCAL_KEY = "demo_shared_settings";
const URL_OVERRIDE_KEY = "demo_settings_url"; // handy for testing against another endpoint

export interface SharedSettings {
  skin: CompanySkinId;
  maturity: MaturityMode;
  autoplay: boolean;
  articleLayout: ArticleLayoutVariant;
  features: Partial<FeatureFlags>;
}

let initial: Partial<SharedSettings> | null = null;

function endpoint() {
  try {
    return localStorage.getItem(URL_OVERRIDE_KEY) || SHARED_SETTINGS_URL;
  } catch {
    return SHARED_SETTINGS_URL;
  }
}

function readLocal(): Partial<SharedSettings> | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as Partial<SharedSettings>) : null;
  } catch {
    return null;
  }
}

/** Fetches the shared settings before the app renders; a slow or failed fetch falls back to defaults. */
export async function preloadSharedSettings(timeoutMs = 1500): Promise<void> {
  const url = endpoint();
  if (!url) {
    initial = readLocal();
    return;
  }
  try {
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    window.clearTimeout(timer);
    if (res.ok) initial = (await res.json()) as Partial<SharedSettings>;
  } catch {
    initial = readLocal();
  }
}

export const getInitialSettings = () => initial;

let saveTimer: number | null = null;

/** Saves after a short pause so a burst of changes is written once. */
export function saveSharedSettings(settings: SharedSettings) {
  if (saveTimer !== null) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
    const url = endpoint();
    if (!url) return;
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
      keepalive: true,
    }).catch(() => {
      /* offline or blocked: the local copy still keeps this browser's choices */
    });
  }, 700);
}
