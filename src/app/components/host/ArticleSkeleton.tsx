/** Placeholder shown in the article panel while the next article loads. */
export function ArticleSkeleton() {
  const bar = "rounded-[6px] bg-black/[0.07] animate-pulse";
  return (
    <div className="h-full bg-white px-[28px] py-[24px]" aria-busy="true" aria-label="Loading article">
      <div className={`${bar} h-[12px] w-[200px]`} />
      <div className={`${bar} mt-[22px] h-[34px] w-[75%]`} />
      <div className={`${bar} mt-[24px] h-[120px] w-full`} />
      {[92, 100, 84, 96, 70].map((w, i) => (
        <div key={i} className={`${bar} mt-[16px] h-[14px]`} style={{ width: `${w}%` }} />
      ))}
      <div className={`${bar} mt-[28px] h-[18px] w-[40%]`} />
      {[88, 94, 60].map((w, i) => (
        <div key={i} className={`${bar} mt-[14px] h-[14px]`} style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}
