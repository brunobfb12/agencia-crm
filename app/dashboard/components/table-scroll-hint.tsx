"use client";
import { useRef, useEffect } from "react";

export function ScrollHint() {
  return (
    <div className="md:hidden flex items-center justify-end gap-1.5 mb-2 pr-1">
      <span className="text-[11px] font-medium" style={{ color: "var(--muted-3)" }}>
        deslize para ver mais
      </span>
      <svg
        className="w-4 h-4 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
        style={{ color: "var(--muted-3)" }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18m0 0l-4-4m4 4l-4 4" />
      </svg>
    </div>
  );
}

export function TopScrollbar({ tableRef }: { tableRef: React.RefObject<HTMLDivElement | null> }) {
  const topRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const table = tableRef.current;
    const top = topRef.current;
    const inner = innerRef.current;
    if (!table || !top || !inner) return;

    const syncWidth = () => {
      inner.style.width = table.scrollWidth + "px";
    };
    syncWidth();

    const onTableScroll = () => { top.scrollLeft = table.scrollLeft; };
    const onTopScroll = () => { table.scrollLeft = top.scrollLeft; };

    table.addEventListener("scroll", onTableScroll);
    top.addEventListener("scroll", onTopScroll);

    const ro = new ResizeObserver(syncWidth);
    ro.observe(table);

    return () => {
      table.removeEventListener("scroll", onTableScroll);
      top.removeEventListener("scroll", onTopScroll);
      ro.disconnect();
    };
  }, [tableRef]);

  return (
    <div
      ref={topRef}
      className="hidden sm:block overflow-x-auto mb-1"
      style={{ scrollbarWidth: "thin" }}
    >
      <div ref={innerRef} style={{ height: 1 }} />
    </div>
  );
}

export function GradientFade() {
  return (
    <div
      className="md:hidden absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none rounded-r-2xl"
      style={{ background: "linear-gradient(to left, var(--fade-edge) 0%, transparent 100%)" }}
    />
  );
}
