"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

import type { WikiLayoutEdge } from "@/modules/worldbuild/application/wiki/resolve-wiki-entry-layout";
import { Badge } from "@/common/components/ui/badge";
import { kindGradientStyle } from "./wiki-utils";

type WikiEntryRelatedProps = {
  related: WikiLayoutEdge[];
  kindNameBySlug: Map<string, string>;
};

function WikiEntryRelated({ related, kindNameBySlug }: WikiEntryRelatedProps) {
  const reduceMotion = useReducedMotion();

  if (related.length === 0) {
    return null;
  }

  const cards = related.flatMap((edge) =>
    edge.targets.map((target) => ({ edge, target })),
  );

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-semibold">Relacionado</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ edge, target }, index) => {
          const kindName =
            kindNameBySlug.get(target.kindSlug) ?? target.kindSlug;

          return (
            <motion.div
              key={`${edge.edgeType}-${target.slug}`}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.35 }}
            >
              <article className="hover:border-primary/40 overflow-hidden rounded-lg border transition-colors">
                <Link href={`/wiki/${target.slug}`} className="group block">
                  <div
                    className="relative aspect-[16/9]"
                    style={
                      target.bannerUrl
                        ? undefined
                        : kindGradientStyle(target.kindSlug || "default")
                    }
                  >
                    {target.bannerUrl ? (
                      <Image
                        src={target.bannerUrl}
                        alt=""
                        fill
                        className="object-cover transition-transform group-hover:scale-[1.02]"
                        unoptimized
                      />
                    ) : null}
                  </div>
                </Link>
                <div className="flex items-start justify-between gap-2 p-4">
                  <Link
                    href={`/wiki/${target.slug}`}
                    className="text-base leading-snug font-medium hover:underline"
                  >
                    {target.title}
                  </Link>
                  {target.kindSlug ? (
                    <Link
                      href={`/wiki/kinds/${target.kindSlug}`}
                      className="shrink-0"
                    >
                      <Badge variant="outline">{kindName}</Badge>
                    </Link>
                  ) : null}
                </div>
              </article>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export { WikiEntryRelated };
