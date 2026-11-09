import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { getInitialSettings } from "./sharedSettings";

/** How the pet story collects the pet's details: one interactive card, or rounds of conversation. */
export type PetFlowMode = "card" | "chat";

const KEY = "demo_pet_flow";

interface PetFlowValue {
  petFlow: PetFlowMode;
  setPetFlow: (mode: PetFlowMode) => void;
}

const PetFlowContext = createContext<PetFlowValue>({ petFlow: "chat", setPetFlow: () => {} });

export function PetFlowProvider({ children }: { children: ReactNode }) {
  const [petFlow, setState] = useState<PetFlowMode>(() => {
    const shared = getInitialSettings()?.petFlow;
    if (shared === "card" || shared === "chat") return shared;
    // Conversation is the default; the single card stays one switch away in the side panel.
    try {
      return localStorage.getItem(KEY) === "card" ? "card" : "chat";
    } catch {
      return "chat";
    }
  });
  const setPetFlow = useCallback((mode: PetFlowMode) => {
    setState(mode);
    try {
      localStorage.setItem(KEY, mode);
    } catch {
      /* ignore */
    }
  }, []);
  return <PetFlowContext.Provider value={{ petFlow, setPetFlow }}>{children}</PetFlowContext.Provider>;
}

export const usePetFlow = () => useContext(PetFlowContext);
