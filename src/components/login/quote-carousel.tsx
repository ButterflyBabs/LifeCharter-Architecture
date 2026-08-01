"use client";

// Rotating brand quotes with fade transitions + clickable position dots.
import { useCallback, useEffect, useRef, useState } from "react";
import { quotes } from "@/lib/quotes";

const ROTATE_MS = 6500;

function QuoteText({ text, emphasis }: { text: string; emphasis?: string }) {
  if (!emphasis || !text.includes(emphasis)) return <>{text}</>;
  const [before, after] = text.split(emphasis);
  return (
    <>
      {before}
      <span className="text-brand-gold-soft">{emphasis}</span>
      {after}
    </>
  );
}

export function QuoteCarousel() {
  const [idx, setIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(
      () => setIdx((i) => (i + 1) % quotes.length),
      ROTATE_MS,
    );
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [startTimer]);

  const jumpTo = (n: number) => {
    setIdx(n);
    startTimer();
  };

  return (
    <>
      {/* Stage — quotes stack absolutely and cross-fade */}
      <div className="relative my-auto flex min-h-[230px] items-center py-2">
        <span className="pointer-events-none absolute -left-1.5 -top-9 font-display text-[120px] leading-none text-brand-gold/30 select-none">
          &ldquo;
        </span>

        {quotes.map((q, i) => (
          <figure
            key={i}
            aria-hidden={i !== idx}
            className={`absolute transition-all duration-1000 ease-out ${
              i === idx
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-3.5 opacity-0"
            }`}
          >
            <blockquote className="font-display text-[29px] font-medium italic leading-[1.34] tracking-[0.2px] text-brand-ivory">
              <QuoteText text={q.text} emphasis={q.emphasis} />
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3 text-[12.5px] font-medium uppercase tracking-[0.22em] text-brand-lavender">
              <span className="h-px w-6 flex-none bg-brand-gold" />
              {q.author}
              <span className="tracking-[0.16em] text-brand-taupe normal-case">
                {q.role}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* Position dots */}
      <div className="mt-2 flex gap-2.5">
        {quotes.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Show quote ${i + 1}`}
            onClick={() => jumpTo(i)}
            className={`h-[7px] w-[7px] rounded-full border border-brand-gold/60 p-0 transition-all duration-300 ${
              i === idx
                ? "bg-brand-gold shadow-[0_0_10px_rgba(212,175,99,0.7)]"
                : "bg-transparent"
            }`}
          />
        ))}
      </div>
    </>
  );
}
