import { getInitialSettings } from "./sharedSettings";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

const KEY = "demo_story_autoplay";

interface AutoplayValue {
  autoplay: boolean;
  setAutoplay: (on: boolean) => void;
}

const AutoplayContext = createContext<AutoplayValue>({ autoplay: false, setAutoplay: () => {} });

export function AutoplayProvider({ children }: { children: ReactNode }) {
  const [autoplay, setState] = useState(() => {
    // Off by default: the story waits for Space or a click on the widget until it is switched on.
    const shared = getInitialSettings()?.autoplay;
    if (typeof shared === "boolean") return shared;
    try {
      return localStorage.getItem(KEY) === "on";
    } catch {
      return false;
    }
  });
  const setAutoplay = useCallback((on: boolean) => {
    setState(on);
    try {
      localStorage.setItem(KEY, on ? "on" : "off");
    } catch {
      /* ignore */
    }
  }, []);
  return <AutoplayContext.Provider value={{ autoplay, setAutoplay }}>{children}</AutoplayContext.Provider>;
}

export const useAutoplay = () => useContext(AutoplayContext);
