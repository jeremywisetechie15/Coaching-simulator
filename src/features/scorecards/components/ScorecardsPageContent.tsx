"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ClipboardList, ListChecks, Plus, Search, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CONTENT_DOMAINS } from "@/features/content/domain";
import { getQuizStatusLabel } from "@/features/evaluations/domain";
import { SCORECARD_VISIBILITY_LABELS, type ScorecardListItem } from "@/features/scorecards/domain";
import { Box, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface ScorecardsPageContentProps {
    scorecards: ScorecardListItem[];
}

export function ScorecardsPageContent({ scorecards }: ScorecardsPageContentProps) {
    const [query, setQuery] = useState("");
    const [domain, setDomain] = useState("all");

    const domainOptions = ["all", ...CONTENT_DOMAINS];

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();

        return scorecards.filter((scorecard) => {
            const matchesTerm =
                !term ||
                [scorecard.name, scorecard.description, scorecard.domain, scorecard.category, scorecard.methodName]
                    .join(" ")
                    .toLowerCase()
                    .includes(term);
            const matchesDomain = domain === "all" || scorecard.domain === domain;

            return matchesTerm && matchesDomain;
        });
    }, [domain, query, scorecards]);

    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <Box className={uiTokens.surface.pageBanner}>
                    <Text as="h1" className={cn("text-[22px] font-extrabold leading-tight", uiTokens.text.heading)}>
                        Scorecards
                    </Text>
                    <Link
                        href="/scorecards/new"
                        className={cn(
                            "flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-[14px] font-bold text-white transition",
                            uiTokens.action.primaryButton,
                        )}
                    >
                        <InlineIcon icon={Plus} className="h-4 w-4" />
                        Créer une scorecard
                    </Link>
                </Box>

                <CardSurface className={cn("mt-6", uiTokens.surface.listToolbar)}>
                    <Box className="grid gap-3 lg:grid-cols-[1fr_220px]">
                        <Box className="relative">
                            <InlineIcon
                                icon={Search}
                                className={cn("pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2", uiTokens.text.muted)}
                            />
                            <input
                                type="search"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Rechercher une scorecard..."
                                className={cn(uiTokens.form.control, "h-11 pl-11 text-[14px]")}
                            />
                        </Box>
                        <select
                            value={domain}
                            onChange={(event) => setDomain(event.target.value)}
                            className={cn(uiTokens.form.control, "h-11 px-3 text-[14px]")}
                        >
                            {domainOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option === "all" ? "Tous les domaines" : option}
                                </option>
                            ))}
                        </select>
                    </Box>
                </CardSurface>

                {filtered.length === 0 ? (
                    <Box className="flex flex-col items-center justify-center py-24 text-center">
                        <InlineIcon icon={ClipboardList} className={cn("h-12 w-12", uiTokens.text.muted)} />
                        <Text className={cn("mt-4 text-[15px] font-semibold", uiTokens.text.muted)}>
                            Aucune scorecard trouvée
                        </Text>
                    </Box>
                ) : (
                    <Box className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {filtered.map((scorecard) => (
                            <ScorecardCard key={scorecard.id} scorecard={scorecard} />
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
}

function ScorecardCard({ scorecard }: { scorecard: ScorecardListItem }) {
    return (
        <CardSurface className="flex flex-col rounded-[16px] border border-[#E5E7EB] p-6 shadow-none transition hover:shadow-[0_16px_36px_rgba(17,24,39,0.08)]">
            <Box className="flex flex-wrap items-center gap-2">
                {scorecard.category && <Badge>{scorecard.category}</Badge>}
                {scorecard.level && <Badge tone="purple">{scorecard.level}</Badge>}
                <Badge tone={scorecard.status === "published" ? "green" : "gray"}>
                    {getQuizStatusLabel(scorecard.status)}
                </Badge>
            </Box>

            <Text as="h3" className={cn("mt-4 text-[19px] font-extrabold leading-7", uiTokens.text.heading)}>
                {scorecard.name}
            </Text>
            <Text className={cn("mt-2 line-clamp-2 flex-1 text-[14px] font-medium leading-6", uiTokens.text.muted)}>
                {scorecard.description || "Aucune description renseignée."}
            </Text>

            <Box className="mt-4 flex flex-col gap-2">
                <MetaLine icon={ListChecks} label={`${scorecard.stepCount} étape${scorecard.stepCount > 1 ? "s" : ""}`} />
                <MetaLine
                    icon={Target}
                    label={`${scorecard.criteriaCount} critère${scorecard.criteriaCount > 1 ? "s" : ""}`}
                />
                <Text className={cn("text-[13px] font-semibold", uiTokens.text.primary)}>{scorecard.methodName}</Text>
            </Box>

            <Box className="mt-4 flex items-center gap-2">
                <Badge tone="gray">{SCORECARD_VISIBILITY_LABELS[scorecard.visibility]}</Badge>
            </Box>
        </CardSurface>
    );
}

function Badge({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "purple" | "green" | "gray" }) {
    const tones = {
        blue: "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]",
        gray: "border-[#E5E7EB] bg-[#F3F4F6] text-[#4B5563]",
        green: "border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]",
        purple: "border-[#DDD6FE] bg-[#F5F3FF] text-[#6D28D9]",
    } as const;

    return (
        <Box className={cn("inline-flex h-7 items-center rounded-md border px-2.5 text-[12px] font-semibold", tones[tone])}>
            {children}
        </Box>
    );
}

function MetaLine({ icon, label }: { icon: LucideIcon; label: string }) {
    return (
        <Box className="flex items-center gap-2 text-[14px] font-semibold text-[#4B5563]">
            <InlineIcon icon={icon} className="h-4 w-4 text-[#9CA3AF]" />
            {label}
        </Box>
    );
}
