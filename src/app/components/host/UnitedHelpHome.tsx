import { useState } from "react";
import { motion } from "motion/react";
import {
  Accessibility,
  Armchair,
  Baby,
  Bookmark,
  ChevronDown,
  ChevronRight,
  FileText,
  Headphones,
  Heart,
  Luggage,
  MessagesSquare,
  PawPrint,
  Plane,
  Receipt,
  Search,
  Shuffle,
  Smartphone,
  Palmtree,
  BookUser,
  Users,
  Wine,
  ExternalLink,
  Info,
  type LucideIcon,
} from "lucide-react";
import { SearchBar } from "../SearchBar";
import { SearchFirstPromptBar } from "../SearchFirstPromptBar";
import { useSkin } from "../../SkinContext";
import { useTokens } from "../../TokensContext";

interface UnitedHelpHomeProps {
  onSearch?: (query: string) => void;
  variant: "mirror" | "search-enhanced" | "conversational";
  showSuggestions?: boolean;
  showEscalation?: boolean;
}

interface TopicLink {
  label: string;
  blurb: string;
}

interface Topic {
  label: string;
  icon: LucideIcon;
  intro: string;
  links: TopicLink[];
}

const BLUE = "#1414D2";
const INK = "#000000";

const TOPICS: Topic[] = [
  {
    label: "Accessibility and assistance",
    icon: Accessibility,
    intro: "Find the services and support available to make your trip comfortable.",
    links: [
      { label: "Wheelchair assistance", blurb: "Request help at the airport and on board" },
      { label: "Service animals", blurb: "Documents and rules for traveling with a service animal" },
      { label: "Seating needs", blurb: "Choose accessible seating for your trip" },
      { label: "Hearing and vision assistance", blurb: "Services for travelers who are deaf, hard of hearing, blind or have low vision" },
    ],
  },
  {
    label: "Baggage",
    icon: Luggage,
    intro: "Answers to your questions about checking, carrying on, paying for and tracking your bags.",
    links: [
      { label: "Baggage fee calculator", blurb: "See what it will cost to check your bags" },
      { label: "Carry-on bags", blurb: "See which bags can join you on board" },
      { label: "Checked bags", blurb: "Learn more about our checked bag policies" },
      { label: "Damaged or delayed bags", blurb: "Submit a claim or trace baggage" },
      { label: "Claim status", blurb: "See the status of a baggage claim you filed" },
      { label: "Lost items", blurb: "How to report and follow up on missing items" },
      { label: "Bag info", blurb: "Find out more about our bag policies" },
    ],
  },
  {
    label: "Booking a trip",
    icon: Plane,
    intro: "Everything you need to know about finding and booking your next flight.",
    links: [
      { label: "Fares and Basic Economy", blurb: "Compare fare types and what each includes" },
      { label: "Book with miles", blurb: "How to use MileagePlus miles for award travel" },
      { label: "Hold a fare", blurb: "Lock in a fare while you finish planning" },
      { label: "Payment options", blurb: "Cards, travel credits and certificates accepted" },
    ],
  },
  {
    label: "Children and infants",
    icon: Baby,
    intro: "Tips and policies for flying with kids of every age.",
    links: [
      { label: "Traveling with children", blurb: "Seating, documents and boarding for families" },
      { label: "Infants and lap children", blurb: "Policies for children under two" },
      { label: "Unaccompanied minors", blurb: "Requirements for kids traveling on their own" },
      { label: "Car seats", blurb: "Approved child restraint systems on board" },
    ],
  },
  {
    label: "Customer care",
    icon: Heart,
    intro: "Share feedback, request compensation or recognize an employee.",
    links: [
      { label: "Contact us", blurb: "Ways to reach a United representative" },
      { label: "Share feedback", blurb: "Tell us about your experience" },
      { label: "Compensation request", blurb: "Ask for compensation after a disruption" },
      { label: "Recognize an employee", blurb: "Thank someone who helped you" },
    ],
  },
  {
    label: "Digital trust center",
    icon: FileText,
    intro: "Learn how we protect your information and keep your account secure.",
    links: [
      { label: "Privacy policy", blurb: "How we collect and use your personal information" },
      { label: "Account security", blurb: "Protect your MileagePlus account" },
      { label: "Report suspicious activity", blurb: "Spot and report phishing and fraud" },
    ],
  },
  {
    label: "Help with trips",
    icon: Shuffle,
    intro: "Check in, change or cancel, and track your flight status.",
    links: [
      { label: "Check in", blurb: "Check in 24 hours before departure" },
      { label: "Change or cancel a flight", blurb: "Update your trip or cancel for a future flight credit" },
      { label: "Flight status", blurb: "Track departures, arrivals and gate changes" },
      { label: "Delays and cancellations", blurb: "Your options when your flight changes" },
      { label: "Same-day changes", blurb: "Switch to an earlier or later flight on travel day" },
    ],
  },
  {
    label: "Hotels, Cars, Cruises and Vacation packages",
    icon: Palmtree,
    intro: "Add hotels, rental cars and vacation packages to your trip.",
    links: [
      { label: "Hotels", blurb: "Book a stay and earn miles" },
      { label: "Rental cars", blurb: "Compare rates from top car rental companies" },
      { label: "Cruises", blurb: "Find cruise deals and earn miles" },
      { label: "Vacation packages", blurb: "Bundle flights, hotels and more" },
    ],
  },
  {
    label: "International travel",
    icon: BookUser,
    intro: "What you need to know before you fly abroad.",
    links: [
      { label: "Travel documents", blurb: "Passports, visas and entry requirements" },
      { label: "Global Entry", blurb: "Get through customs faster" },
      { label: "Travel advisories", blurb: "Check the latest requirements for your destination" },
    ],
  },
  {
    label: "My MileagePlus account",
    icon: Bookmark,
    intro: "Earn and redeem miles and manage your MileagePlus account.",
    links: [
      { label: "Enroll in MileagePlus", blurb: "Join for free and start earning miles" },
      { label: "Missing miles", blurb: "Request credit for a past flight" },
      { label: "Premier status", blurb: "Track your progress and see your benefits" },
      { label: "Award travel", blurb: "Redeem miles for flights" },
    ],
  },
  {
    label: "Refunds and receipts",
    icon: Receipt,
    intro: "Request a refund, use a future flight credit or get a receipt.",
    links: [
      { label: "Request a refund", blurb: "Find out if your ticket is eligible" },
      { label: "Future flight credits", blurb: "Use or look up your travel credits" },
      { label: "Receipts", blurb: "Get a receipt for your flight or fees" },
      { label: "Reimbursements", blurb: "Ask to be reimbursed for eligible expenses" },
    ],
  },
  {
    label: "Seats and upgrades",
    icon: Armchair,
    intro: "We're here to help you find your favorite seat and fly in comfort.",
    links: [
      { label: "Seat options", blurb: "See all our seat types and cabin options" },
      { label: "Change seats", blurb: "How to pick a different one" },
      { label: "Basic Economy", blurb: "See more about your ticket" },
      { label: "Economy Plus", blurb: "See what this fare gives you" },
      { label: "Upgrades", blurb: "Everything you need to know" },
      { label: "Upgrade with miles", blurb: "How to redeem your award miles" },
    ],
  },
  {
    label: "Specialty desks",
    icon: Users,
    intro: "Dedicated teams for group, business and military travel.",
    links: [
      { label: "Group travel", blurb: "Book ten or more travelers" },
      { label: "Military and government", blurb: "Fares and policies for service members" },
      { label: "Business travel", blurb: "Tools for companies and frequent travelers" },
    ],
  },
  {
    label: "Traveling with pets",
    icon: PawPrint,
    intro: "Policies for bringing your pet along.",
    links: [
      { label: "Pets in the cabin", blurb: "Carrier size and fees" },
      { label: "Pets in cargo", blurb: "Requirements and restrictions" },
      { label: "Service and support animals", blurb: "Documents needed to travel" },
    ],
  },
  {
    label: "United Club and lounges",
    icon: Wine,
    intro: "Relax before you fly in a United Club or partner lounge.",
    links: [
      { label: "Club access", blurb: "Who can enter and how to get in" },
      { label: "Locations", blurb: "Find a United Club near you" },
      { label: "Day passes", blurb: "Buy single-visit access" },
    ],
  },
];

const HELP_OPTIONS: { icon: LucideIcon; title: string; note?: string; link?: string; action?: "chat" | "search" }[] = [
  { icon: Search, title: "Search united.com", link: "Find answers", action: "search" },
  { icon: Smartphone, title: "Text an agent", note: 'Text "UNITED" to 32050.' },
  { icon: MessagesSquare, title: "Chat with us", note: "Agents available", link: "Chat now", action: "chat" },
  { icon: Headphones, title: "Call an agent", link: "View directory" },
];

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

/** Bespoke United Help Center landing page: the demo's search replaces the sign-in and find-a-trip cards. */
export function UnitedHelpHome({ onSearch, variant, showSuggestions = true, showEscalation = false }: UnitedHelpHomeProps) {
  const { skin } = useSkin();
  const { tokens } = useTokens();
  const [active, setActive] = useState("Seats and upgrades");
  const topic = TOPICS.find((t) => t.label === active) ?? TOPICS[0];
  const logo = skin.host.navLogo;

  const openChat = () => window.dispatchEvent(new CustomEvent("open-fin-messenger"));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full min-h-0 overflow-y-auto bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ color: INK }}
    >
      <div className="max-w-[1000px] mx-auto px-[24px]">
        <h1 className="pt-[28px] text-[40px] font-bold leading-[1.1] tracking-[-0.03em]">Help Center</h1>
        <p className="mt-[28px] text-[15px] leading-[22px]">Search for help with your trip, bags, MileagePlus and more.</p>
        <a
          href="#help-topics"
          className="inline-block text-[15px] underline"
          style={{ color: BLUE }}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("help-topics")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          Looking for something else?
        </a>

        <h2 className="mt-[36px] text-[28px] font-bold leading-[1.15] tracking-[-0.02em]">How can we help you?</h2>

        <div
          className="mt-[20px] rounded-[6px] px-[20px] py-[22px]"
          style={{ background: BLUE }}
        >
          {variant === "search-enhanced" ? (
            <SearchFirstPromptBar onSearch={onSearch} showSuggestions={showSuggestions} />
          ) : variant === "conversational" ? (
            <SearchBar onSearch={onSearch} sharedLayout showSuggestions={showSuggestions} showEscalation={showEscalation} />
          ) : (
            <button
              type="button"
              onClick={() => onSearch?.(tokens.searchBar?.suggestions?.[0] ?? "Help")}
              className="w-full h-[48px] rounded-full bg-white px-[20px] text-left text-[15px] text-black/60"
            >
              {tokens.searchBar?.placeholder ?? "Search help topics and FAQs"}
            </button>
          )}
        </div>

        <h2 id="help-topics" className="mt-[44px] text-[28px] font-bold leading-[1.15] tracking-[-0.02em]">
          What can we help you with today?
        </h2>

        <div className="mt-[22px] grid grid-cols-1 md:grid-cols-[300px_minmax(0,1fr)] gap-x-[28px] gap-y-[20px]">
          <ul className="flex flex-col">
            {TOPICS.map((t) => {
              const on = t.label === topic.label;
              const Icon = t.icon;
              return (
                <li key={t.label}>
                  <button
                    type="button"
                    onClick={() => setActive(t.label)}
                    className="w-full flex items-center gap-[14px] rounded-[10px] border px-[8px] py-[10px] text-left transition-colors"
                    style={{
                      borderColor: on ? BLUE : "transparent",
                      background: on ? "#F5F7FF" : "transparent",
                    }}
                  >
                    <Icon className="size-[20px] shrink-0" strokeWidth={1.8} />
                    <span className="flex-1 text-[14px] font-semibold leading-[20px]">{t.label}</span>
                    <ChevronRight className="size-[18px] shrink-0" style={{ color: BLUE }} strokeWidth={2} />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="min-w-0">
            <h3 className="text-[22px] font-bold leading-[1.2] tracking-[-0.02em]">{topic.label}</h3>
            <p className="mt-[8px] text-[14px] leading-[21px]">{topic.intro}</p>
            <ul className="mt-[28px] flex flex-col gap-[22px]">
              {topic.links.map((l) => (
                <li key={l.label}>
                  <button
                    type="button"
                    onClick={() => onSearch?.(l.label)}
                    className="text-[14px] underline text-left"
                    style={{ color: BLUE }}
                  >
                    {l.label}
                  </button>
                  <p className="text-[14px] leading-[20px]">{l.blurb}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <h2 className="mt-[52px] text-[24px] font-bold leading-[1.15] tracking-[-0.02em]">Still need help?</h2>
        <div className="mt-[24px] grid grid-cols-2 md:grid-cols-4 gap-x-[16px] gap-y-[28px] pb-[56px] text-center">
          {HELP_OPTIONS.map((o) => {
            const Icon = o.icon;
            return (
              <div key={o.title} className="flex flex-col items-center">
                <Icon className="size-[40px]" strokeWidth={1.5} />
                <p className="mt-[10px] text-[15px] font-semibold">{o.title}</p>
                {o.note && <p className="mt-[8px] text-[13px]">{o.note}</p>}
                {o.link && (
                  <button
                    type="button"
                    onClick={() => (o.action === "chat" ? openChat() : o.action === "search" ? onSearch?.("united.com") : undefined)}
                    className="mt-[8px] inline-flex items-center gap-[2px] text-[13px] underline"
                    style={{ color: BLUE }}
                  >
                    {o.link}
                    <ChevronRight className="size-[14px]" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

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
    </motion.div>
  );
}
