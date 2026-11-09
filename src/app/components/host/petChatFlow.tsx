import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { ComposerFile } from "./FinComposer";
import { gate } from "../../storyGate";
import { PET_FINAL_REPLY } from "../../content/petStory";
import type { PetType } from "./PetInfoCard";

/**
 * The pet story told as conversation instead of a single card: Fin asks one thing per round,
 * the traveler answers by tapping a quick reply (or typing), and each answer unlocks the next
 * round. Used when the "Pet flow" switch is on Conversation; the card path is untouched.
 */

export interface ChatChoice {
  label: string;
  value: string;
}

export interface ChatPush {
  id: string;
  role: "user" | "agent";
  content: string;
  kind?: "uploads";
  choices?: ChatChoice[];
}

type Phase = "idle" | "pet" | "weight" | "docs" | "busy" | "done";

const PET_WORDS: PetType[] = ["cat", "dog", "rabbit", "bird"];
const FILES = [
  { name: "vaccination-record.pdf", size: "1.2 MB" },
  { name: "health-certificate.pdf", size: "860 KB" },
  { name: "rabies-vaccination.jpg", size: "2.4 MB" },
];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Weight is asked as a rough range, the way someone would actually answer. */
const WEIGHT_RANGES = [
  { value: "under-10", label: "Under 10 lbs" },
  { value: "10-20", label: "10–20 lbs" },
  { value: "20-40", label: "20–40 lbs" },
  { value: "over-40", label: "Over 40 lbs" },
];

function rangeFromText(text: string): string {
  const n = parseFloat(text.match(/\d+(\.\d+)?/)?.[0] ?? "");
  if (/under|less|below|<|small/.test(text) && Number.isNaN(n)) return "under-10";
  if (/over|more|above|>|large|big/.test(text) && Number.isNaN(n)) return "over-40";
  if (Number.isNaN(n)) return "10-20";
  if (n < 10) return "under-10";
  if (n <= 20) return "10-20";
  if (n <= 40) return "20-40";
  return "over-40";
}

interface Options {
  autoplay: boolean;
  finDone: Record<string, boolean>;
  push: (m: ChatPush) => void;
  setThinking: (on: boolean) => void;
  later: (ms: number, fn: () => void) => void;
  onPetConfirm: (type: PetType) => void;
  onComplete: () => void;
}

export function usePetChatFlow(o: Options) {
  const [phase, setPhase] = useState<Phase>("idle");
  const petRef = useRef<PetType>("dog");
  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;

  /** Fin thinks for a beat, then asks the next question. */
  const fin = (m: ChatPush, next: Phase, thinkMs = 1500) => {
    setPhase("busy");
    o.setThinking(true);
    o.later(thinkMs, () => {
      o.setThinking(false);
      o.push(m);
      setPhase(next);
    });
  };

  const start = () => {
    if (phaseRef.current !== "idle") return;
    o.push({
      id: "pc-q-pet",
      role: "agent",
      content: "Now, please tell me more about your pet so I can help you with your travel arrangements. What kind of pet do you have?",
      choices: PET_WORDS.map((p) => ({ label: cap(p), value: p })),
    });
    setPhase("pet");
  };

  const answerPet = (type: PetType) => {
    if (phaseRef.current !== "pet") return;
    petRef.current = type;
    setPhase("busy");
    o.push({ id: "pc-a-pet", role: "user", content: cap(type) });
    o.onPetConfirm(type); // the policy panel swaps to the pet-specific article
    fin(
      {
        id: "pc-q-weight",
        role: "agent",
        content: `Lovely! Roughly how much does your ${type} weigh? A range is fine. We combine your pet's weight with the crate's weight for cargo travel.`,
        choices: WEIGHT_RANGES,
      },
      "weight",
    );
  };

  const answerWeight = (range: string) => {
    if (phaseRef.current !== "weight") return;
    const label = (WEIGHT_RANGES.find((r) => r.value === range) ?? WEIGHT_RANGES[1]).label;
    setPhase("busy");
    o.push({ id: "pc-a-weight", role: "user", content: label });
    fin(
      {
        id: "pc-q-docs",
        role: "agent",
        content: `Got it, ${label}. For your trip to Paris I also need your pet's vaccination records: the rabies vaccination certificate, a certificate of veterinary inspection and a USDA-endorsed health certificate. Upload them whenever you're ready.`,
        choices: [{ label: "Upload documents", value: "upload" }],
      },
      "docs",
    );
  };

  /** The documents land in the prompt bar first and load there; they are sent once they finish. */
  const [attached, setAttached] = useState<ComposerFile[]>([]);

  const answerDocs = () => {
    if (phaseRef.current !== "docs") return;
    setPhase("busy");
    setAttached(FILES.map((f) => ({ ...f, progress: 0 })));
  };

  const sendFiles = () => {
    setAttached([]);
    o.push({ id: "pc-a-docs", role: "user", content: "Sent 3 files", kind: "uploads" });
    fin(
      {
        id: "pc-done",
        role: "agent",
        content: "Thanks, all three documents came through. We'll review them and notify you within 24 hours.",
      },
      "done",
      1500,
    );
  };

  useEffect(() => {
    if (attached.length === 0) return;
    if (attached.every((f) => f.progress >= 100)) {
      const id = window.setTimeout(sendFiles, 900);
      return () => window.clearTimeout(id);
    }
    const id = window.setInterval(() => {
      setAttached((fs) => fs.map((f, i) => (f.progress >= 100 ? f : { ...f, progress: Math.min(100, f.progress + 14 + ((i * 7) % 9)) })));
    }, 300);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attached]);

  // after the confirmation, Fin closes the loop with the verdict
  useEffect(() => {
    if (phase !== "done" || !o.finDone["pc-done"]) return;
    return gate(o.autoplay, 2600, () => {
      o.push({ id: "pc-final", role: "agent", content: PET_FINAL_REPLY });
      o.onComplete();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, o.finDone["pc-done"], o.autoplay]);

  // each question waits for Fin to finish typing, then autoplays its default answer (or Space)
  useEffect(() => {
    if (phase !== "pet" || !o.finDone["pc-q-pet"]) return;
    return gate(o.autoplay, 2200, () => answerPet("dog"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, o.finDone["pc-q-pet"], o.autoplay]);

  useEffect(() => {
    if (phase !== "weight" || !o.finDone["pc-q-weight"]) return;
    return gate(o.autoplay, 2000, () => answerWeight("10-20"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, o.finDone["pc-q-weight"], o.autoplay]);

  useEffect(() => {
    if (phase !== "docs" || !o.finDone["pc-q-docs"]) return;
    return gate(o.autoplay, 2200, answerDocs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, o.finDone["pc-q-docs"], o.autoplay]);

  const questionFor: Partial<Record<Phase, string>> = { pet: "pc-q-pet", weight: "pc-q-weight", docs: "pc-q-docs" };

  return {
    start,
    /** True while Fin is waiting on an answer (typing in the composer counts as an answer). */
    awaiting: phase === "pet" || phase === "weight" || phase === "docs",
    isOpenFor: (id: string) => questionFor[phase] === id,
    pick: (value: string) => {
      if (phaseRef.current === "pet") answerPet(value as PetType);
      else if (phaseRef.current === "weight") answerWeight(value);
      else if (phaseRef.current === "docs") answerDocs();
    },
    answerText: (text: string) => {
      const t = text.trim().toLowerCase();
      if (!t) return;
      if (phaseRef.current === "pet") answerPet(PET_WORDS.find((p) => t.includes(p)) ?? "dog");
      else if (phaseRef.current === "weight") answerWeight(rangeFromText(t));
      else if (phaseRef.current === "docs") answerDocs();
    },
    /** Files loading in the prompt bar. */
    attachments: attached,
  };
}

/** The traveler's sent files: the same three documents, already uploaded. */
export function UploadBubble() {
  return (
    <ul className="flex w-[300px] max-w-full flex-col gap-[8px] text-left">
      {FILES.map((f) => (
        <li key={f.name} className="flex items-center gap-[8px] rounded-[10px] bg-white/15 px-[12px] py-[8px] text-[13px]">
          <CheckCircle2 className="size-[15px] shrink-0" />
          <span className="min-w-0 flex-1 truncate font-medium">{f.name}</span>
          <span className="opacity-75">{f.size}</span>
        </li>
      ))}
    </ul>
  );
}
