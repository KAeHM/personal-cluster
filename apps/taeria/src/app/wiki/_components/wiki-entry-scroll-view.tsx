"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import type { WikiEntryLayout } from "@/modules/worldbuild/application/wiki/resolve-wiki-entry-layout";
import { WikiEntryHero } from "./wiki-entry-hero";

type WikiEntryScrollViewProps = {
  title: string;
  kindName: string;
  kindSlug: string;
  layout: WikiEntryLayout;
  compactHero?: boolean;
  children: React.ReactNode;
};

function WikiEntryScrollView({
  title,
  kindName,
  kindSlug,
  layout,
  compactHero = false,
  children,
}: WikiEntryScrollViewProps) {
  const heroHeightClass = compactHero
    ? "relative min-h-[42vh] max-h-[28rem] shrink-0"
    : "relative h-full shrink-0";
  const scrollRef = useRef<HTMLDivElement>(null);
  const heroSpacerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    container: scrollRef,
    target: heroSpacerRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.85, 1], [1, 0, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.04]);

  if (reduceMotion) {
    return (
      <div
        ref={scrollRef}
        className="relative h-full overflow-y-auto overscroll-y-contain"
      >
        <div ref={heroSpacerRef} className={heroHeightClass}>
          <WikiEntryHero
            title={title}
            kindName={kindName}
            kindSlug={kindSlug}
            layout={layout}
          />
        </div>
        <div className="bg-background relative z-10">{children}</div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="relative h-full overflow-y-auto overscroll-y-contain"
    >
      <div ref={heroSpacerRef} className={heroHeightClass}>
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="pointer-events-none absolute inset-0 origin-center will-change-[opacity,transform]"
        >
          <WikiEntryHero
            title={title}
            kindName={kindName}
            kindSlug={kindSlug}
            layout={layout}
          />
        </motion.div>
      </div>

      <div className="bg-background relative z-10 -mt-10 rounded-t-4xl shadow-[0_-24px_48px_-24px_rgba(0,0,0,0.35)]">
        {children}
      </div>
    </div>
  );
}

export { WikiEntryScrollView };
