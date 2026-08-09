"use client";

import Image from "next/image";

import type { WikiEntryLayout } from "@/modules/worldbuild/application/wiki/resolve-wiki-entry-layout";
import { Badge } from "@/common/components/ui/badge";
import { cn } from "@/common/utils/cn";
import { kindGradientStyle } from "./wiki-utils";

type WikiEntryHeroProps = {
  title: string;
  kindName: string;
  kindSlug: string;
  layout: WikiEntryLayout;
  className?: string;
};

function WikiEntryHero({
  title,
  kindName,
  kindSlug,
  layout,
  className,
}: WikiEntryHeroProps) {
  const bannerUrl = layout.bannerUrl;
  const fallbackStyle = kindGradientStyle(kindSlug);

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      {bannerUrl ? (
        <Image
          src={bannerUrl}
          alt=""
          fill
          priority
          className="object-cover"
          unoptimized
        />
      ) : (
        <div className="absolute inset-0" style={fallbackStyle} />
      )}

      <div className="from-background via-background/70 to-background/20 absolute inset-0 bg-gradient-to-t" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      <div className="relative flex h-full flex-col justify-center px-4 sm:px-6">
        <div className="mx-auto w-full max-w-6xl space-y-4 pb-8">
          <Badge variant="secondary">{kindName}</Badge>
          <h1 className="font-display max-w-4xl text-4xl font-semibold tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {layout.hero.length > 0 || layout.heroEdges.length > 0 ? (
            <div className="flex flex-wrap gap-4 text-base text-white/90">
              {layout.hero.map((field) => (
                <div key={field.key}>
                  <span className="text-white/70">{field.label}: </span>
                  <span>{String(field.value)}</span>
                </div>
              ))}
              {layout.heroEdges.map((edge) =>
                edge.targets.map((target) => (
                  <div key={`${edge.edgeType}-${target.slug}`}>
                    <span className="text-white/70">{edge.label}: </span>
                    <span>{target.title}</span>
                  </div>
                )),
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export { WikiEntryHero };
