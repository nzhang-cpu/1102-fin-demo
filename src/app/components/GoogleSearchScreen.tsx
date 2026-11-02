import googleLogo from "../assets/logos/google.png";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Search, Mic, Camera, MoreVertical } from "lucide-react";
import { useTokens } from "../TokensContext";
import type { ArticleDetails } from "./KnowledgeArticleScreen";

interface GoogleSearchScreenProps {
  onSelectArticle: (article: ArticleDetails) => void;
}

function GoogleMark({ className = "" }: { className?: string }) {
  return <img src={googleLogo} alt="Google" className={className} />;
}

function resultUrl(brandSlug: string, title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `https://support.${brandSlug}.com/article/${slug}`;
}

function snippetFor(article: ArticleDetails) {
  if (article.summary) {
    return article.summary.length > 160
      ? `${article.summary.slice(0, 157).trim()}…`
      : article.summary;
  }
  const first = article.content.split("\n\n")[0] ?? article.subtitle;
  return first.length > 160 ? `${first.slice(0, 157).trim()}…` : first;
}

export function GoogleSearchScreen({ onSelectArticle }: GoogleSearchScreenProps) {
  const { tokens } = useTokens();
  const brandName = tokens.brandName as string;
  const brandSlug = brandName.toLowerCase().replace(/\s+/g, "");
  const articles = (tokens.articles.learning ?? []) as ArticleDetails[];

  const defaultQuery =
    (tokens.searchBar?.suggestions?.[0] as string | undefined) ??
    `${brandName} help center`;

  const [query, setQuery] = useState(defaultQuery);

  const results = useMemo(() => {
    return articles.map((article) => ({
      title: article.title,
      displayUrl: resultUrl(brandSlug, article.title),
      snippet: snippetFor(article),
      article,
    }));
  }, [articles, brandSlug]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="h-full w-full overflow-y-auto bg-white [scrollbar-width:thin]"
    >
      {/* SERP header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#ebebeb]">
        <div className="flex items-center gap-[28px] px-[24px] pt-[18px] pb-[12px] max-w-[1100px]">
          <GoogleMark className="h-[30px] w-auto shrink-0" />
          <div className="flex-1 max-w-[690px] flex items-center gap-[12px] h-[44px] px-[16px] rounded-full border border-[#dfe1e5] shadow-[0_1px_6px_rgba(32,33,36,0.18)] bg-white">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 min-w-0 font-['Arial',sans-serif] text-[16px] text-[#202124] outline-none bg-transparent"
              aria-label="Search"
            />
            <div className="h-[24px] w-px bg-[#dfe1e5]" />
            <Mic className="size-[18px] text-[#4285f4] shrink-0" strokeWidth={1.8} />
            <Camera className="size-[18px] text-[#4285f4] shrink-0" strokeWidth={1.8} />
            <Search className="size-[18px] text-[#4285f4] shrink-0" strokeWidth={2.2} />
          </div>
          <div className="ml-auto size-[32px] rounded-full bg-[#1a73e8] flex items-center justify-center text-white font-['Arial',sans-serif] text-[14px] font-medium shrink-0">
            M
          </div>
        </div>

        <div className="flex items-center gap-[24px] px-[144px] pb-[0] max-w-[1100px]">
          {["All", "Images", "Videos", "News", "Shopping", "More"].map((tab, i) => (
            <span
              key={tab}
              className={`font-['Arial',sans-serif] text-[13px] pb-[10px] border-b-[3px] ${
                i === 0
                  ? "text-[#1a73e8] border-[#1a73e8] font-medium"
                  : "text-[#5f6368] border-transparent"
              }`}
            >
              {tab}
            </span>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="w-full max-w-[652px] pl-[144px] pr-[24px] pt-[14px] pb-[64px]">
        <p className="font-['Arial',sans-serif] text-[14px] text-[#70757a] mb-[18px]">
          About {(results.length * 1847).toLocaleString()} results (0.38 seconds)
        </p>

        <div className="flex flex-col gap-[28px]">
          {results.map((result) => (
            <div key={result.title} className="group">
              <div className="flex items-center gap-[10px] mb-[4px]">
                <div className="size-[28px] rounded-full bg-[#f1f3f4] flex items-center justify-center shrink-0 overflow-hidden">
                  <span className="font-['Arial',sans-serif] text-[12px] font-bold text-[#5f6368]">
                    {brandName.charAt(0)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-['Arial',sans-serif] text-[14px] text-[#202124] leading-[18px] truncate">
                    {brandName}
                  </p>
                  <p className="font-['Arial',sans-serif] text-[12px] text-[#4d5156] leading-[16px] truncate">
                    {result.displayUrl}
                  </p>
                </div>
                <MoreVertical className="size-[16px] text-[#70757a] opacity-0 group-hover:opacity-100" />
              </div>

              <button
                type="button"
                onClick={() => onSelectArticle(result.article)}
                className="text-left w-full"
              >
                <h3 className="font-['Arial',sans-serif] text-[20px] leading-[26px] text-[#1a0dab] hover:underline tracking-[-0.2px]">
                  {result.title}
                </h3>
              </button>

              <p className="font-['Arial',sans-serif] text-[14px] leading-[22px] text-[#4d5156] mt-[4px]">
                {result.snippet}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-[40px] font-['Arial',sans-serif] text-[13px] text-[#70757a]">
          Click any article title to open it on {brandName}.
        </p>
      </div>
    </motion.div>
  );
}
