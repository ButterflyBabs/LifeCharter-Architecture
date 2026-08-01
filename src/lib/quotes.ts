// lib/quotes.ts
// Rotating login quotes. `emphasis` (optional) is a substring of `text`
// that gets highlighted in gold — no HTML/dangerouslySetInnerHTML needed.

export interface Quote {
  text: string;
  emphasis?: string;
  author: string;
  role: string;
}

export const quotes: Quote[] = [
  {
    text: "The people who are crazy enough to think they can change the world are the ones who do.",
    author: "Steve Jobs",
    role: "Co-founder, Apple",
  },
  {
    text: "Working hard for something we don't care about is called stress. Working hard for something we love is called passion.",
    emphasis: "passion.",
    author: "Simon Sinek",
    role: "Author, Start With Why",
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    role: "Statesman",
  },
  {
    text: "You may encounter many defeats, but you must not be defeated. In fact, it may be necessary to encounter the defeats.",
    author: "Maya Angelou",
    role: "Poet & Thought Leader",
  },
  {
    text: "The biggest risk is not taking any risk. In a world changing quickly, the only strategy guaranteed to fail is not taking risks.",
    author: "Mark Zuckerberg",
    role: "Founder, Meta",
  },
  {
    text: "Whatever the mind can conceive and believe, it can achieve.",
    author: "Napoleon Hill",
    role: "Author, Think and Grow Rich",
  },
  {
    text: "Chase the vision, not the money — the money will end up following you.",
    author: "Tony Hsieh",
    role: "CEO, Zappos",
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    role: "Co-founder, Apple",
  },
  {
    text: "Do the best you can until you know better. Then when you know better, do better.",
    emphasis: "do better.",
    author: "Maya Angelou",
    role: "Poet & Thought Leader",
  },
  {
    text: "One ecosystem. Multiple doorways. A life, mission, and business built from Truth rather than fear.",
    emphasis: "Truth rather than fear.",
    author: "Babs",
    role: "Founder, LifeCharter",
  },
  {
    text: "Otherwise able doesn't mean unable.",
    author: "Babs",
    role: "Founder, LifeCharter",
  },
  {
    text: "Clarity. Insight. Alignment — always. Transformation every day.",
    emphasis: "Transformation every day.",
    author: "Babs",
    role: "Founder, LifeCharter",
  },
  {
    text: "Align. Clarify. Act. Live aligned. Your charter is already within you — the work is remembering it.",
    author: "Babs",
    role: "Founder, LifeCharter",
  },
];
