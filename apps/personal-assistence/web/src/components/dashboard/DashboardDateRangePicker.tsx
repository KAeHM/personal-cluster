"use client";

import { useMemo, useState } from "react";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  dateToIso,
  filtersToCalendarRange,
  formatDateRangeLabel,
  PERIOD_PRESETS,
} from "@/lib/dashboard/date-range";
import type { DashboardFilters, DashboardPeriod } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

type DashboardDateRangePickerProps = {
  timezone: string;
  value: DashboardFilters;
  onChange: (patch: Pick<DashboardFilters, "period" | "from" | "to">) => void;
};

export function DashboardDateRangePicker({
  timezone,
  value,
  onChange,
}: DashboardDateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>();

  const label = formatDateRangeLabel(value, timezone);

  const selectedRange = useMemo(() => {
    if (pendingRange) return pendingRange;
    return filtersToCalendarRange(value, timezone);
  }, [pendingRange, value, timezone]);

  const activePreset =
    value.period !== "custom" ? value.period : null;

  const handlePreset = (period: DashboardPeriod) => {
    setPendingRange(undefined);
    onChange({ period, from: undefined, to: undefined });
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    setPendingRange(range);

    if (range?.from && range?.to) {
      onChange({
        period: "custom",
        from: dateToIso(range.from),
        to: dateToIso(range.to),
      });
      setPendingRange(undefined);
    }
  };

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-9 w-full justify-start gap-2 px-2.5 font-normal",
            !label && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto max-w-[calc(100vw-2rem)] p-0"
        align="end"
        side="left"
        sideOffset={8}
      >
        <div className="flex flex-col sm:flex-row">
          <div className="flex flex-col gap-1 border-b border-border p-2 sm:border-r sm:border-b-0">
            <p className="px-2 py-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Atalhos
            </p>
            {PERIOD_PRESETS.map((preset) => (
              <Button
                key={preset.period}
                type="button"
                variant={activePreset === preset.period ? "secondary" : "ghost"}
                size="sm"
                className="h-8 justify-start px-2.5 font-normal"
                onClick={() => handlePreset(preset.period)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="p-2">
            <Calendar
              mode="range"
              locale={ptBR}
              numberOfMonths={1}
              selected={selectedRange}
              onSelect={handleCalendarSelect}
              disabled={{ after: today }}
              defaultMonth={selectedRange?.from ?? today}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
