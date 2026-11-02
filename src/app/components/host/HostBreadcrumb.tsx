import { useDesignTokens } from "../../DesignTokensContext";

export interface Crumb {
  label: string;
  onClick?: () => void;
}

/** Breadcrumb trail shared by the search and article pages; the last crumb is the current page. */
export function HostBreadcrumb({ items }: { items: Crumb[] }) {
  const { dt } = useDesignTokens();
  return (
    <nav
      className="mb-[14px] flex flex-wrap items-center gap-x-[6px] text-[13px] leading-[20px]"
      style={{ color: dt.colors.ui.muted }}
      aria-label="Breadcrumb"
    >
      {items.map((c, i) => {
        const last = i === items.length - 1;
        return (
          <span key={`${c.label}-${i}`} className="inline-flex items-center gap-[6px] min-w-0">
            {last || !c.onClick ? (
              <span className={last ? "font-medium truncate" : ""} style={last ? { color: dt.colors.brand.navy } : undefined}>
                {c.label}
              </span>
            ) : (
              <button type="button" className="hover:underline text-[13px] leading-[20px]" style={{ color: dt.colors.host.link }} onClick={c.onClick}>
                {c.label}
              </button>
            )}
            {!last && <span aria-hidden>›</span>}
          </span>
        );
      })}
    </nav>
  );
}
