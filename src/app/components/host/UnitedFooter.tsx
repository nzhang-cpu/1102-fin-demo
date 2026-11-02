import { ChevronDown, ChevronRight, ExternalLink, Info, Search } from "lucide-react";
import { useSkin } from "../../SkinContext";

const BLUE = "#1414D2";

const FOOTER_LINKS_1 = [
  "Contract of carriage",
  "Lengthy tarmac delay plan",
  "Legal information",
  "Our United Customer Commitment",
  "Help Center",
  "Accessible travel",
  "Sustainability",
  "Privacy Policy",
];
const FOOTER_LINKS_2 = ["Do Not Sell or Share My Personal Information", "Interest Based Ads", "United Jetstream", "Cargo"];

/** United site footer: 100-years band, link bar and legal footer. */
export function UnitedFooter() {
  const { skin } = useSkin();
  const logo = skin.host.navLogo;
  return (
    <>
      <div className="bg-black flex items-center justify-center gap-[40px] py-[4px]">
        {logo && <img src={logo} alt="United" className="h-[48px]" />}
        <div className="text-white text-center leading-none">
          <p className="text-[34px] font-black tracking-[0.08em]">100</p>
          <p className="text-[8px] tracking-[0.5em]">YEARS OF</p>
          <p className="text-[14px] font-bold tracking-[0.3em]">UNITED</p>
        </div>
      </div>

      <div className="bg-[#EDEDED] text-[12px] font-semibold" style={{ color: BLUE }}>
        <div className="max-w-[1000px] mx-auto px-[24px] py-[12px] flex flex-wrap items-center gap-x-[22px] gap-y-[6px]">
          {["About United", "Products and services", "Popular destinations"].map((l) => (
            <span key={l} className="inline-flex items-center gap-[3px]">
              {l}
              <ChevronDown className="size-[12px]" />
            </span>
          ))}
          <span className="inline-flex items-center gap-[3px]">
            Careers
            <ExternalLink className="size-[11px]" />
          </span>
          <span className="ml-auto inline-flex items-center gap-[5px]">
            <Info className="size-[14px]" />
            Important notices
          </span>
        </div>
      </div>

      <footer className="bg-black text-white">
        <div className="max-w-[1000px] mx-auto px-[24px] pt-[28px] pb-[32px]">
          <div className="flex flex-wrap items-center gap-[16px]">
            <span
              className="inline-flex items-center gap-[6px] h-[40px] px-[22px] rounded-full border-2 text-[13px] font-semibold"
              style={{ borderColor: "#6B6BF0" }}
            >
              <Search className="size-[14px]" />
              Search
            </span>
            <span className="flex-1 text-center text-[11px] font-semibold">
              English - United States $ <span className="mx-[6px] opacity-60">|</span> Español
            </span>
            <span className="flex items-center gap-[12px] text-[11px] font-bold">
              {["◐", "f", "𝕏", "▶", "◎", "in"].map((s) => (
                <span key={s} className="opacity-90">
                  {s}
                </span>
              ))}
            </span>
          </div>

          <p className="mt-[24px] flex flex-wrap gap-x-[16px] gap-y-[10px] text-[11px] font-medium underline">
            {FOOTER_LINKS_1.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </p>
          <p className="mt-[14px] flex flex-wrap gap-x-[16px] gap-y-[10px] text-[11px] font-medium underline">
            {FOOTER_LINKS_2.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </p>

          <div className="mt-[22px] flex items-end justify-between gap-[16px]">
            <p className="max-w-[560px] text-[10px] leading-[15px]">
              <ExternalLink className="inline size-[12px] mr-[6px]" />
              Indicates an external site that may or may not meet accessibility guidelines. Copyright © 2026 United Airlines,
              Inc. All rights reserved.
            </p>
            <span className="flex items-center gap-[8px]">
              <span className="text-[22px] font-bold tracking-[0.18em]">UNITED</span>
              {logo && <img src={logo} alt="" className="h-[28px]" />}
            </span>
          </div>

          <div className="mt-[28px] flex justify-center">
            <span className="inline-flex items-center gap-[4px] h-[40px] px-[18px] rounded-full bg-white text-black text-[13px] font-semibold">
              <ChevronRight className="size-[14px]" style={{ color: BLUE }} />
              CoBrowse
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
