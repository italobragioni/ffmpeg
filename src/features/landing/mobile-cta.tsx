"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Sticky mobile CTA that only appears after the user scrolls past a given
 * anchor element (id). Slides up/down smoothly.
 */
export function MobileCta({ anchorId, days }: { anchorId: string; days: number }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = document.getElementById(anchorId);
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setShow(entry.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [anchorId]);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur safe-bottom transition-transform duration-300 md:hidden",
        show ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
    >
      <Button asChild size="lg" className="w-full">
        <Link href="/signup">
          Testar grátis por {days} dias <ArrowRight />
        </Link>
      </Button>
    </div>
  );
}
