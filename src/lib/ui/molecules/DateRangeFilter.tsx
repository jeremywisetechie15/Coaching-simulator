"use client";

import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface DateRangeFilterProps {
    className?: string;
    dateFrom: string;
    dateTo: string;
    onChange: (range: { dateFrom: string; dateTo: string }) => void;
}

export function DateRangeFilter({
    className,
    dateFrom,
    dateTo,
    onChange,
}: DateRangeFilterProps) {
    return (
        <div className={cn(uiTokens.dateRangeFilter.container, className)}>
            <label className={uiTokens.dateRangeFilter.field}>
                <span className={uiTokens.dateRangeFilter.prefix}>Du</span>
                <input
                    aria-label="Date de début"
                    max={dateTo || undefined}
                    onChange={(event) => onChange({ dateFrom: event.target.value, dateTo })}
                    type="date"
                    value={dateFrom}
                    className={uiTokens.dateRangeFilter.input}
                />
            </label>
            <label className={uiTokens.dateRangeFilter.field}>
                <span className={uiTokens.dateRangeFilter.prefix}>Au</span>
                <input
                    aria-label="Date de fin"
                    min={dateFrom || undefined}
                    onChange={(event) => onChange({ dateFrom, dateTo: event.target.value })}
                    type="date"
                    value={dateTo}
                    className={uiTokens.dateRangeFilter.input}
                />
            </label>
        </div>
    );
}
