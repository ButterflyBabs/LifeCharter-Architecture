"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Sparkles, ArrowRight } from "lucide-react";

interface AIBusinessGuideProps {
  message?: string;
  suggestions?: string[];
}

export function AIBusinessGuide({
  message = "You're in a strong position to grow. Strengthen your systems and cash flow predictability to move into Expansion.",
  suggestions = [
    "Improve cash flow forecasting",
    "Document and automate key processes",
    "Nurture warm leads into paying clients",
  ],
}: AIBusinessGuideProps) {
  return (
    <Card className="h-full border-[#D4AF63]/30 relative overflow-hidden">
      {/* Decorative watercolor background effect */}
      <div className="absolute top-0 right-0 w-48 h-48 opacity-10 pointer-events-none">
        <svg viewBox="0 0 200 200" className="w-full h-full text-[#2E7C83]">
          <path
            fill="currentColor"
            d="M44.5,-76.3C58.9,-69.3,72.4,-59.6,82.9,-47.2C93.4,-34.8,100.9,-19.7,100.3,-5.1C99.7,9.5,91,23.6,80.8,35.3C70.6,47,58.9,56.3,46.2,63.6C33.5,70.9,19.8,76.2,5.3,78.8C-9.2,81.4,-24.5,81.3,-38.3,76.3C-52.1,71.3,-64.4,61.4,-73.6,49.1C-82.8,36.8,-88.9,22.1,-89.4,7.2C-89.9,-7.7,-84.8,-22.8,-76.3,-35.8C-67.8,-48.8,-55.9,-59.7,-42.5,-67.2C-29.1,-74.7,-14.6,-78.8,0.7,-80.1C15.9,-81.4,31.8,-80,44.5,-76.3Z"
            transform="translate(100 100)"
          />
        </svg>
      </div>

      <CardContent className="p-6 relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[#D4AF63]" />
          <h2 className="text-xs font-semibold tracking-wider uppercase text-[#5E3B6C] dark:text-[#CDBED6]">
            AI Business Guide
          </h2>
        </div>

        {/* Butterfly emblem */}
        <div className="absolute top-4 right-4">
          <svg
            viewBox="0 0 24 24"
            className="w-10 h-10 text-[#D4AF63]/30"
            fill="currentColor"
          >
            <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M12 4C12 4 11 6 11 8C11 10 12 12 12 12C12 12 13 10 13 8C13 6 12 4 12 4Z" />
            <path d="M7 8C7 8 3 6 1 10C-1 14 3 18 7 16C7 16 5 12 7 8Z" />
            <path d="M17 8C17 8 21 6 23 10C25 14 21 18 17 16C17 16 19 12 17 8Z" />
            <path d="M12 12C12 12 8 16 8 20C8 24 12 24 12 24C12 24 16 24 16 20C16 16 12 12 12 12Z" />
          </svg>
        </div>

        <p className="text-[#1F315B] dark:text-[#F6F1E8] font-medium mb-6 leading-relaxed">
          {message}
        </p>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[#5E3B6C] dark:text-[#CDBED6] mb-3">
            Suggested Focus
          </h3>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-[#1F315B]/80 dark:text-[#F6F1E8]/80"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#2E7C83] mt-2 flex-shrink-0" />
                {suggestion}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Button variant="primary" className="w-full">
            <Sparkles className="w-4 h-4 mr-2" />
            Ask AI Guide
          </Button>
          <button className="text-sm text-[#5E3B6C] dark:text-[#CDBED6] hover:text-[#1F315B] dark:hover:text-[#F6F1E8] flex items-center justify-center gap-1 transition-colors">
            View full recommendations
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </CardContent>

      {/* Decorative corner ornament */}
      <div className="absolute bottom-0 left-0 w-16 h-16 opacity-20 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full text-[#D4AF63]">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            d="M0,100 Q30,70 50,50 T100,0 M20,100 Q40,80 60,60 M0,80 Q25,60 40,40"
          />
        </svg>
      </div>
    </Card>
  );
}
