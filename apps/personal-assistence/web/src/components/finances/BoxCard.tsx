"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents } from "@/lib/finances/format";
import { BOX_PROFILE_LABELS } from "@/lib/finances/labels";
import type { FinanceBoxDto } from "@/lib/finances/types";
import { cn } from "@/lib/utils";

type BoxCardProps = {
  box: FinanceBoxDto;
};

export function BoxCard({ box }: BoxCardProps) {
  return (
    <Link href={`/finances/caixinhas/${box.id}`}>
      <Card
        className={cn(
          "hover:border-primary/40 transition-colors",
          box.isNegative && "border-destructive/40",
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{box.name}</CardTitle>
            <Badge variant="secondary">{BOX_PROFILE_LABELS[box.profile]}</Badge>
          </div>
          {box.description && (
            <p className="text-muted-foreground line-clamp-2 text-sm">
              {box.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p
              className={cn(
                "text-2xl font-semibold tabular-nums",
                box.isNegative && "text-destructive",
              )}
            >
              {formatCents(box.balanceCents)}
            </p>
            {box.isNegative && (
              <p className="text-destructive text-xs">Saldo negativo</p>
            )}
          </div>

          {box.targetAmountCents !== null && (
            <div className="space-y-1">
              <div className="bg-muted h-2 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-all"
                  style={{
                    width: `${Math.min(100, box.progressPercent ?? 0)}%`,
                  }}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                Meta: {formatCents(box.targetAmountCents)}
                {box.progressPercent !== null && ` (${box.progressPercent}%)`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
