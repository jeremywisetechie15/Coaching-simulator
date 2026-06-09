"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck, Clock, FileText, Plus, Search } from "lucide-react";
import { Box, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { evaluations, getEvaluationQuestionCount } from "@/features/evaluations/data/evaluations";

export function EvaluationsPageContent() {
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) {
            return evaluations;
        }
        return evaluations.filter((evaluation) =>
            [evaluation.title, evaluation.description, ...evaluation.tags]
                .join(" ")
                .toLowerCase()
                .includes(term),
        );
    }, [query]);

    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <Box className="mb-7 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <Box className="flex items-start gap-6">
                        <Link
                            href="/"
                            aria-label="Retour"
                            className="mt-2 flex h-8 w-8 items-center justify-center rounded-full text-[#111827] transition hover:bg-white"
                        >
                            <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                        </Link>
                        <Box>
                            <Text
                                as="h1"
                                className="text-[30px] font-extrabold leading-tight text-[#111827] md:text-[34px]"
                            >
                                Évaluations
                            </Text>
                            <Text className="mt-2 max-w-[680px] text-[15px] font-semibold leading-6 text-[#596273]">
                                Gérez et créez vos évaluations de connaissances
                            </Text>
                        </Box>
                    </Box>

                    <Link
                        href="/evaluations/new"
                        className="mt-1 flex h-9 items-center justify-center gap-2.5 rounded-lg bg-[#5140F0] px-4 text-[13px] font-bold text-white shadow-[0_10px_20px_rgba(81,64,240,0.18)] transition hover:bg-[#4635E7] md:mt-2"
                    >
                        <InlineIcon icon={Plus} className="h-4 w-4" />
                        Créer un quiz
                    </Link>
                </Box>

                <Box className="relative mb-6">
                    <InlineIcon
                        icon={Search}
                        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]"
                    />
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Rechercher..."
                        className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-white pl-11 pr-4 text-[14px] font-medium text-[#374151] outline-none transition focus:border-[#C9C2FB]"
                    />
                </Box>

                <Box className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((evaluation) => {
                        const questionCount = getEvaluationQuestionCount(evaluation);
                        return (
                            <CardSurface
                                key={evaluation.id}
                                className="flex flex-col rounded-[16px] border border-[#E5E7EB] p-6 shadow-none"
                            >
                                <Box className="flex flex-wrap items-center gap-2">
                                    <Box className="inline-flex h-7 items-center rounded-md border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 text-[12px] font-semibold text-[#2563EB]">
                                        {evaluation.kind}
                                    </Box>
                                    <Box className="inline-flex h-7 items-center rounded-md border border-[#BBF7D0] bg-[#F0FDF4] px-2.5 text-[12px] font-semibold text-[#16A34A]">
                                        {evaluation.status}
                                    </Box>
                                </Box>

                                <Text
                                    as="h3"
                                    className="mt-4 text-[19px] font-extrabold leading-7 text-[#111827]"
                                >
                                    {evaluation.title}
                                </Text>
                                <Text className="mt-2 flex-1 text-[14px] font-medium leading-6 text-[#596273]">
                                    {evaluation.description}
                                </Text>

                                <Box className="mt-4 flex flex-col gap-2">
                                    <Box className="flex items-center gap-2 text-[14px] font-semibold text-[#4B5563]">
                                        <InlineIcon icon={FileText} className="h-4 w-4 text-[#9CA3AF]" />
                                        {questionCount} questions
                                    </Box>
                                    <Box className="flex items-center gap-2 text-[14px] font-semibold text-[#4B5563]">
                                        <InlineIcon icon={Clock} className="h-4 w-4 text-[#9CA3AF]" />
                                        {evaluation.durationMinutes} min
                                    </Box>
                                </Box>

                                <Box className="mt-4 flex flex-wrap gap-2">
                                    {evaluation.tags.map((tag) => (
                                        <Box
                                            key={tag}
                                            className="inline-flex h-7 items-center rounded-md bg-[#F3F4F6] px-2.5 text-[12px] font-semibold text-[#4B5563]"
                                        >
                                            {tag}
                                        </Box>
                                    ))}
                                </Box>

                                <Link
                                    href={`/evaluations/${evaluation.id}`}
                                    className="mt-5 flex h-11 items-center justify-center rounded-xl bg-[#5140F0] text-[14px] font-bold text-white transition hover:bg-[#4635E7]"
                                >
                                    Voir l&apos;évaluation
                                </Link>
                            </CardSurface>
                        );
                    })}
                </Box>

                {filtered.length === 0 && (
                    <CardSurface className="rounded-[16px] border border-[#E5E7EB] px-8 py-16 text-center shadow-none">
                        <InlineIcon
                            icon={ClipboardCheck}
                            className="mx-auto mb-5 h-12 w-12 text-[#C9CED8]"
                        />
                        <Text className="text-[16px] font-extrabold text-[#111827]">
                            Aucune évaluation trouvée
                        </Text>
                    </CardSurface>
                )}
            </Box>
        </Box>
    );
}
