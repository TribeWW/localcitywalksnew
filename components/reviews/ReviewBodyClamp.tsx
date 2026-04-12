"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ReviewBodyClampProps = {
  text: string;
  /** Number of lines when collapsed (Tailwind line-clamp). */
  maxLines: number;
  className?: string;
};

const LINE_CLAMP: Record<number, string> = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
  5: "line-clamp-5",
  6: "line-clamp-6",
};

/**
 * Review body with line clamp; shows Read more / Show less only when clamped text overflows.
 */
export function ReviewBodyClamp({
  text,
  maxLines,
  className,
}: ReviewBodyClampProps) {
  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const clampClass = LINE_CLAMP[maxLines] ?? "line-clamp-4";

  useLayoutEffect(() => {
    if (expanded) return;
    const el = textRef.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    const clone = document.createElement("p");
    clone.textContent = text;
    clone.setAttribute("aria-hidden", "true");
    clone.className =
      "invisible absolute left-0 top-0 z-[-1] w-full text-sm leading-[1.6] text-[#1A1A1A]";
    clone.style.width = `${el.offsetWidth}px`;
    parent.appendChild(clone);
    const fullHeight = clone.offsetHeight;
    clone.remove();

    const clampedHeight = el.getBoundingClientRect().height;
    setShowToggle(fullHeight > clampedHeight + 1);
  }, [text, expanded, clampClass]);

  return (
    <div className={cn("relative mt-0 flex flex-col", className)}>
      <p
        ref={textRef}
        className={cn(
          "text-sm leading-[1.6] text-[#1A1A1A]",
          !expanded && clampClass,
        )}
      >
        {text}
      </p>
      {showToggle ? (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 self-start text-sm font-medium text-[#0F172A] underline decoration-1 underline-offset-[3px] hover:opacity-90"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}
