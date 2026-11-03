import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getInitialSettings } from "./sharedSettings";
import { useTokens } from "./TokensContext";
import { useDesignTokens } from "./DesignTokensContext";
import { COMPANY_SKINS, getSkin, type CompanySkin, type CompanySkinId } from "./skins";

/** Skin the demo opens on. */
const FALLBACK_SKIN_ID: CompanySkinId = "united-futuristic";
const DEFAULT_SKIN_ID = FALLBACK_SKIN_ID;

/** The last saved skin (shared across visitors) once it has loaded, else the built-in default. */
function startingSkinId(): CompanySkinId {
  const shared = getInitialSettings()?.skin;
  return shared && COMPANY_SKINS.some((s) => s.id === shared) ? shared : FALLBACK_SKIN_ID;
}
const SKIN_STORAGE_KEY = "demo_company_skin";

interface SkinContextValue {
  skinId: CompanySkinId;
  skin: CompanySkin;
  setSkinId: (id: CompanySkinId) => void;
}

const SkinContext = createContext<SkinContextValue>({
  skinId: DEFAULT_SKIN_ID,
  skin: getSkin(DEFAULT_SKIN_ID),
  setSkinId: () => {},
});

export function SkinProvider({ children }: { children: ReactNode }) {
  const { setTokens } = useTokens();
  const { setAll } = useDesignTokens();
  const [skinId, setSkinIdState] = useState<CompanySkinId>(startingSkinId);

  const applySkin = useCallback(
    (id: CompanySkinId) => {
      const next = getSkin(id);
      setSkinIdState(id);
      setTokens(next.tokens);
      setAll(next.designTokens);
      try {
        localStorage.setItem(SKIN_STORAGE_KEY, id);
      } catch {
        /* ignore */
      }
    },
    [setTokens, setAll],
  );

  useEffect(() => {
    applySkin(startingSkinId());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSkinId = useCallback(
    (id: CompanySkinId) => {
      applySkin(id);
    },
    [applySkin],
  );

  const skin = useMemo(() => getSkin(skinId), [skinId]);

  return (
    <SkinContext.Provider value={{ skinId, skin, setSkinId }}>{children}</SkinContext.Provider>
  );
}

export function useSkin() {
  return useContext(SkinContext);
}

export { COMPANY_SKINS };
export type { CompanySkinId, CompanySkin };
