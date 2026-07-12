"use client";

import { ArrowRight, CalendarDays, Clock, Flame, GraduationCap, MessagesSquare } from "lucide-react";
import { ContextualLink } from "@/features/app-shell/components";
import { Box, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { dashboardData, skillSummaryStyles } from "@/features/dashboard/data/dashboard";
import type { DashboardStat, SkillSummaryItem } from "@/features/dashboard/data/dashboard";
import { categoryBadgeStyles, roleplays } from "@/features/roleplays/data/roleplays";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";

interface DashboardPageContentProps {
    firstName: string;
}

const monthNames = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function todayLabel(): string {
    const formatted = new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
    }).format(new Date());
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/** Convertit une date "JJ-MM-AAAA" en "JJ mois AAAA". */
function formatRoleplayDate(value: string): string {
    const [day, month, year] = value.split("-");
    const monthIndex = Number(month) - 1;
    if (!day || Number.isNaN(monthIndex) || !monthNames[monthIndex]) {
        return value;
    }
    return `${Number(day)} ${monthNames[monthIndex]} ${year}`;
}

function StatCard({ stat }: { stat: DashboardStat }) {
    return (
        <Box className="rounded-[12px] bg-[#EEF0FB] p-4">
            <Text className="text-[12px] font-semibold text-[#596273]">{stat.label}</Text>
            <Text className="mt-1 text-[20px] font-extrabold text-[#5140F0]">{stat.value}</Text>
            <Box
                className="mt-2 inline-flex h-5 items-center rounded-md px-1.5 text-[10px] font-bold"
                style={
                    stat.hintTone === "positive"
                        ? { backgroundColor: "#DCFCE7", color: "#15803D" }
                        : { backgroundColor: "#FFEDD5", color: "#9A3412" }
                }
            >
                {stat.hint}
            </Box>
        </Box>
    );
}

function SkillCard({ skill }: { skill: SkillSummaryItem }) {
    const style = skillSummaryStyles[skill.tone];
    return (
        <Box className="rounded-[12px] p-4" style={{ backgroundColor: style.bg }}>
            <Text className="text-[12px] font-semibold text-[#596273]">{skill.label}</Text>
            <Text className="mt-1 text-[20px] font-extrabold" style={{ color: style.value }}>
                {skill.count}
            </Text>
            <Box
                className="mt-2 inline-flex h-5 items-center rounded-md px-1.5 text-[10px] font-bold"
                style={{ backgroundColor: style.chipBg, color: style.chipText }}
            >
                sur {skill.total} compétences
            </Box>
        </Box>
    );
}

function ScoreRing({ score }: { score: number }) {
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    const color = score >= 80 ? "#16A34A" : score >= 60 ? "#F59E0B" : "#DC2626";

    return (
        <Box className="relative h-14 w-14 shrink-0">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r={radius} fill="none" stroke="#F1F1F4" strokeWidth="5" />
                <circle
                    cx="28"
                    cy="28"
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - score / 100)}
                />
            </svg>
            <Box className="absolute inset-0 flex items-center justify-center">
                <Text className="text-[12px] font-extrabold text-[#111827]">{score}%</Text>
            </Box>
        </Box>
    );
}

function SectionHeader({ title, href }: { title: string; href?: string }) {
    return (
        <Box className="mb-3 flex items-center justify-between">
            <Text as="h2" className="text-[16px] font-extrabold text-[#111827]">
                {title}
            </Text>
            {href && (
                <ContextualLink
                    href={href}
                    className="text-[13px] font-bold text-[#5140F0] transition hover:text-[#4635E7]"
                >
                    Voir tout
                </ContextualLink>
            )}
        </Box>
    );
}

function RecentRoleplayRow({ roleplay }: { roleplay: RoleplayItem }) {
    const categoryStyle = categoryBadgeStyles[roleplay.category] ?? { bg: "#F3E8FD", text: "#8B2FD6" };
    return (
        <Box className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center">
            <Box
                aria-label={roleplay.name}
                role="img"
                className="h-11 w-11 shrink-0 rounded-full border border-[#EAEAF0] bg-cover bg-center"
                style={{ backgroundImage: `url(${roleplay.avatarSrc})` }}
            />
            <Box className="min-w-0 flex-1">
                <Box className="flex flex-wrap items-center gap-2">
                    <Text className="text-[14px] font-extrabold text-[#111827]">{roleplay.name}</Text>
                    <Box
                        className="inline-flex h-5 items-center rounded-md px-2 text-[11px] font-semibold"
                        style={{ backgroundColor: categoryStyle.bg, color: categoryStyle.text }}
                    >
                        {roleplay.category}
                    </Box>
                </Box>
                <Box className="mt-0.5 flex flex-wrap items-center gap-3 text-[12px] font-semibold text-[#6B7280]">
                    <span className="flex items-center gap-1.5">
                        <InlineIcon icon={CalendarDays} className="h-3.5 w-3.5 text-[#9CA3AF]" />
                        {formatRoleplayDate(roleplay.detail.lastDate)}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <InlineIcon icon={Clock} className="h-3.5 w-3.5 text-[#9CA3AF]" />
                        {roleplay.detail.lastDuration}
                    </span>
                </Box>
                <Text className="mt-0.5 truncate text-[12px] font-medium text-[#596273]">
                    {roleplay.description}
                </Text>
            </Box>
            <Box className="flex items-center gap-3">
                <ScoreRing score={roleplay.detail.scoreActuel} />
                <ContextualLink
                    href={`/roleplays/${roleplay.id}`}
                    className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#5140F0] px-4 text-[12px] font-bold text-white transition hover:bg-[#4635E7]"
                >
                    Rejouer
                    <InlineIcon icon={ArrowRight} className="h-3.5 w-3.5" />
                </ContextualLink>
            </Box>
        </Box>
    );
}

export function DashboardPageContent({ firstName }: DashboardPageContentProps) {
    const { pendingActivities, streakDays, stats, skillsSummary, replayHighlight, recentRoleplayIds } =
        dashboardData;
    const recentRoleplays = recentRoleplayIds
        .map((id) => roleplays.find((roleplay) => roleplay.id === id))
        .filter((roleplay): roleplay is RoleplayItem => Boolean(roleplay));

    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px] space-y-5">
                {/* Bandeau de bienvenue */}
                <CardSurface className="rounded-[16px] border border-[#E9E7FB] p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                    <Box className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <Box>
                            <Text as="h1" className="text-[22px] font-extrabold text-[#111827]">
                                Bienvenue {firstName} ! 👋
                            </Text>
                            <Text className="mt-0.5 text-[13px] font-semibold text-[#596273]">
                                {todayLabel()} · Vous avez{" "}
                                <span className="text-[#5140F0]">
                                    {pendingActivities} activité{pendingActivities > 1 ? "s" : ""}
                                </span>{" "}
                                en attente
                            </Text>
                            <Box className="mt-3 flex flex-wrap gap-2.5">
                                <ContextualLink
                                    href="/methods"
                                    className="flex h-9 items-center justify-center gap-2 rounded-lg bg-[#5140F0] px-4 text-[13px] font-bold text-white shadow-[0_8px_16px_rgba(81,64,240,0.18)] transition hover:bg-[#4635E7]"
                                >
                                    <InlineIcon icon={GraduationCap} className="h-4 w-4" />
                                    Accéder à l&apos;académie
                                </ContextualLink>
                                <ContextualLink
                                    href="/roleplays"
                                    className="flex h-9 items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 text-[13px] font-bold text-[#374151] transition hover:border-[#D5D7DE]"
                                >
                                    <InlineIcon icon={MessagesSquare} className="h-4 w-4" />
                                    Accéder aux roleplays
                                </ContextualLink>
                            </Box>
                        </Box>

                        <Box className="flex items-center gap-2.5 rounded-[12px] bg-[#F0FDF4] p-3">
                            <Box className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F97316]">
                                <InlineIcon icon={Flame} className="h-5 w-5 text-white" />
                            </Box>
                            <Box>
                                <Text className="text-[12px] font-semibold text-[#596273]">
                                    Série active
                                </Text>
                                <Text className="text-[16px] font-extrabold text-[#16A34A]">
                                    {streakDays} jours
                                </Text>
                            </Box>
                        </Box>
                    </Box>
                </CardSurface>

                {/* Progression + compétences — sans wrapper "carte dans une carte" */}
                <Box className="grid gap-5 lg:grid-cols-2">
                    <Box>
                        <SectionHeader title="Ma progression" />
                        <Box className="grid gap-3 sm:grid-cols-2">
                            {stats.map((stat) => (
                                <StatCard key={stat.label} stat={stat} />
                            ))}
                        </Box>
                    </Box>

                    <Box>
                        <SectionHeader title="Mes compétences" href="/skills" />
                        <Box className="grid gap-3 sm:grid-cols-2">
                            {skillsSummary.map((skill) => (
                                <SkillCard key={skill.label} skill={skill} />
                            ))}
                        </Box>
                    </Box>
                </Box>

                {/* Rejouer mon roleplay */}
                <Box>
                    <SectionHeader title="Rejouer mon roleplay" href="/roleplays/history" />
                    <CardSurface className="rounded-[16px] border border-[#E9E7FB] p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                        <Box className="flex flex-col gap-4 md:flex-row md:items-center">
                            <Box
                                aria-label={replayHighlight.title}
                                role="img"
                                className="h-[96px] w-full shrink-0 rounded-[12px] bg-[#EEF0FB] bg-cover bg-center md:w-[160px]"
                                style={{ backgroundImage: `url(${replayHighlight.imageSrc})` }}
                            />
                            <Box className="min-w-0 flex-1">
                                <Text className="text-[15px] font-extrabold text-[#111827]">
                                    {replayHighlight.title}
                                </Text>
                                <Text className="mt-0.5 text-[12px] font-semibold text-[#6B7280]">
                                    {replayHighlight.subtitle}
                                </Text>
                                <Box className="mt-3 flex items-center gap-3">
                                    <Box className="h-2 flex-1 overflow-hidden rounded-full bg-[#EDEDF2]">
                                        <Box
                                            className="h-full rounded-full bg-[#5140F0]"
                                            style={{ width: `${replayHighlight.progress}%` }}
                                        />
                                    </Box>
                                    <Text className="text-[13px] font-extrabold text-[#5140F0]">
                                        {replayHighlight.progress}%
                                    </Text>
                                </Box>
                            </Box>
                            <ContextualLink
                                href={`/roleplays/${replayHighlight.roleplayId}`}
                                className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#5140F0] px-4 text-[13px] font-bold text-white transition hover:bg-[#4635E7]"
                            >
                                Rejouer
                                <InlineIcon icon={ArrowRight} className="h-3.5 w-3.5" />
                            </ContextualLink>
                        </Box>
                    </CardSurface>
                </Box>

                {/* Mes derniers roleplays */}
                <Box>
                    <SectionHeader title="Mes derniers roleplays" href="/roleplays" />
                    <CardSurface className="rounded-[16px] border border-[#E9E7FB] px-5 py-1 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                        {recentRoleplays.map((roleplay, index) => (
                            <Box
                                key={roleplay.id}
                                className={index > 0 ? "border-t border-[#EDEEF3]" : undefined}
                            >
                                <RecentRoleplayRow roleplay={roleplay} />
                            </Box>
                        ))}
                    </CardSurface>
                </Box>
            </Box>
        </Box>
    );
}
