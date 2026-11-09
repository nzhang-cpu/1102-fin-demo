import { usePetFlow, type PetFlowMode } from "../PetFlowContext";

const OPTIONS: { id: PetFlowMode; label: string; hint: string }[] = [
  { id: "card", label: "Card", hint: "One card holds every step" },
  { id: "chat", label: "Conversation", hint: "Fin asks one thing at a time" },
];

/** Side-panel switch between the single dynamic card and the round-by-round conversation. */
export function PetFlowToggle() {
  const { petFlow, setPetFlow } = usePetFlow();
  return (
    <div className="shrink-0 rounded-[14px] bg-[#e8e8ed] border border-[#d8d8e0] px-[10px] py-[12px]">
      <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6b7280] mb-[8px] px-[4px]">
        Pet flow
      </p>
      <ul className="flex flex-col gap-[2px]" role="radiogroup" aria-label="Pet flow">
        {OPTIONS.map((o) => {
          const on = petFlow === o.id;
          return (
            <li key={o.id}>
              <button
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setPetFlow(o.id)}
                className="w-full flex items-start gap-[8px] rounded-[8px] px-[6px] py-[7px] text-left hover:bg-black/[0.04] transition-colors"
              >
                <span
                  className={`mt-[1px] size-[14px] rounded-full border flex items-center justify-center shrink-0 ${
                    on ? "bg-[#1a1a2e] border-[#1a1a2e]" : "bg-white border-[#b0b0bc]"
                  }`}
                >
                  {on && <span className="size-[5px] rounded-full bg-white" />}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block font-['Plus_Jakarta_Sans',sans-serif] text-[12px] leading-[15px] ${
                      on ? "text-[#1a1a2e] font-semibold" : "text-[#6b7280]"
                    }`}
                  >
                    {o.label}
                  </span>
                  <span className="block font-['Plus_Jakarta_Sans',sans-serif] text-[10px] leading-[13px] text-[#9ca3af] mt-[2px]">
                    {o.hint}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
