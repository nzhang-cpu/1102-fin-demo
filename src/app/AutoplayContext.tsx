import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

const KEY = "demo_story_autoplay";

interface AutoplayValue {
  autoplay: boolean;
  setAutoplay: (on: boolean) => void;
}

const AutoplayContext = createContext<AutoplayValue>({ autoplay: true, setAutoplay: () => {} });

export function AutoplayProvider({ children }: { children: ReactNode }) {
  const [autoplay, setState] = useState(() => {
    try {
      return localStorage.getItem(KEY) !== "off";
    } catch {
      return true;
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
