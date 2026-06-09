"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock, History } from "lucide-react";
import { Box, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import {
    categoryBadgeStyles,
    difficultyBadgeStyles,
    discBadgeStyles,
    roleplays,
} from "@/features/roleplays/data/roleplays";
import { roleplaySessions } from "@/features/roleplays/data/sessions";

function scoreColor(score: number) {
    if (score >= 80) {
        return "#16A34A";
    }
    if (score >= 60) {
        return "#F59E0B";
    }
    return "#F97316";
}

function ScoreRing({ score }: { score: number }) {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - score / 100);
    const color = scoreColor(score);

    return (
        <Box className="relative h-[76px] w-[76px]">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 76 76">
                <circle cx="38" cy="38" r={radius} fill="none" stroke="#ECEEF3" strokeWidth="7" />
                <circle
                    cx="38"
                    cy="38"
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                />
            </svg>
            <Box className="absolute inset-0 flex items-center justify-center">
                <Text className="text-[16px] font-extrabold text-[#111827]">{score}%</Text>
            </Box>
        </Box>
    );
}

export function SessionsHistoryPageContent() {
    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <Box className="mb-7 flex items-start gap-6">
                    <Link
                        href="/roleplays"
                        aria-label="Retour"
                        className="mt-2 flex h-8 w-8 items-center justify-center rounded-full text-[#111827] transition hover:bg-white"
                    >
                        <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                    </Link>
                    <Box>
                        <Text as="h1" className="text-[30px] font-extrabold leading-tight text-[#111827] md:text-[34px]">
                            Historique des sessions
                        </Text>
                        <Text className="mt-2 text-[15px] font-semibold leading-6 text-[#596273]">
                            Consultez toutes vos sessions de roleplay et leurs évaluations
                        </Text>
                    </Box>
                </Box>

                {roleplaySessions.length > 0 ? (
                    <Box className="space-y-4">
                        {roleplaySessions.map((session) => {
                            const roleplay = roleplays.find((item) => item.id === session.roleplayId);
                            if (!roleplay) {
                                return null;
                            }

                            const categoryStyle =
                                categoryBadgeStyles[roleplay.category] ?? { bg: "#F3E8FD", text: "#8B2FD6" };
                            const difficultyStyle = difficultyBadgeStyles[roleplay.difficulty];
                            const discStyle = discBadgeStyles[roleplay.disc];

                            return (
                                <CardSurface
                                    key={session.id}
                                    className="flex flex-col gap-5 rounded-[16px] border border-[#E5E7EB] p-5 shadow-none transition duration-200 hover:border-[#D8DCE6] hover:shadow-[0_12px_28px_rgba(17,24,39,0.08)] md:flex-row md:items-center md:justify-between"
                                >
                                    <Box className="flex items-center gap-4">
                                        <Box className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full border-2 border-[#E7EAFF] bg-[#F1F2F6]">
                                            <Box
                                                aria-label={roleplay.name}
                                                role="img"
                                                className="h-full w-full bg-cover bg-center"
                                                style={{ backgroundImage: `url(${roleplay.avatarSrc})` }}
                                            />
                                        </Box>
                                        <Box>
                                            <Text as="h2" className="text-[18px] font-extrabold text-[#111827]">
                                                {roleplay.name}
                                            </Text>
                                            <Box className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] font-semibold text-[#6B7280]">
                                                <Box className="flex items-center gap-1.5">
                                                    <InlineIcon icon={CalendarDays} className="h-4 w-4 text-[#9CA3AF]" />
                                                    {session.date}
                                                </Box>
                                                <Box className="flex items-center gap-1.5">
                                                    <InlineIcon icon={Clock} className="h-4 w-4 text-[#9CA3AF]" />
                                                    Durée: {session.duration}
                                                </Box>
                                            </Box>
                                            <Box className="mt-2.5 flex flex-wrap items-center gap-2">
                                                <Box
                                                    className="inline-flex h-[26px] items-center rounded-lg px-2.5 text-[12px] font-semibold"
                                                    style={{
                                                        backgroundColor: categoryStyle.bg,
                                                        color: categoryStyle.text,
                                                    }}
                                                >
                                                    {roleplay.category}
                                                </Box>
                                                <Box
                                                    className="inline-flex h-[26px] items-center rounded-lg border px-2.5 text-[12px] font-semibold"
                                                    style={{
                                                        backgroundColor: difficultyStyle.bg,
                                                        borderColor: difficultyStyle.border,
                                                        color: difficultyStyle.text,
                                                    }}
                                                >
                                                    {roleplay.difficulty}
                                                </Box>
                                                <Box
                                                    className="inline-flex h-[26px] items-center rounded-lg px-2.5 text-[12px] font-semibold"
                                                    style={{ backgroundColor: discStyle.bg, color: discStyle.text }}
                                                >
                                                    {roleplay.disc}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Box className="flex items-center gap-5 md:shrink-0">
                                        <ScoreRing score={session.score} />
                                        <Link
                                            href={`/roleplays/history/${session.id}`}
                                            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#5140F0] px-5 text-[14px] font-bold text-white shadow-[0_10px_20px_rgba(81,64,240,0.18)] transition hover:bg-[#4635E7]"
                                        >
                                            Voir évaluation &gt;
                                        </Link>
                                    </Box>
                                </CardSurface>
                            );
                        })}
                    </Box>
                ) : (
                    <CardSurface className="rounded-[16px] border border-[#E5E7EB] px-8 py-16 text-center shadow-none">
                        <InlineIcon icon={History} className="mx-auto mb-5 h-12 w-12 text-[#C9CED8]" />
                        <Text className="text-[16px] font-extrabold text-[#111827]">Aucune session pour le moment</Text>
                        <Text className="mt-2 text-[14px] font-semibold text-[#737B8E]">
                            Lancez un roleplay pour démarrer votre historique.
                        </Text>
                    </CardSurface>
                )}
            </Box>
        </Box>
    );
}
