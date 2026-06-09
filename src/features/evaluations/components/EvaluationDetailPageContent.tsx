"use client";

import Link from "next/link";
import { ArrowLeft, ClipboardCheck, Clock, FileText } from "lucide-react";
import { Box, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { getEvaluationQuestionCount } from "@/features/evaluations/data/evaluations";
import type { Evaluation } from "@/features/evaluations/data/evaluations";

interface EvaluationDetailPageContentProps {
    evaluation: Evaluation;
}

export function EvaluationDetailPageContent({ evaluation }: EvaluationDetailPageContentProps) {
    const questionCount = getEvaluationQuestionCount(evaluation);
    const sectionCount = evaluation.sections.length;

    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[920px]">
                <Box className="mb-5">
                    <Link
                        href="/evaluations"
                        aria-label="Retour"
                        className="flex h-9 w-9 items-center justify-center rounded-full text-[#111827] transition hover:bg-white"
                    >
                        <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                    </Link>
                </Box>

                <CardSurface className="rounded-[20px] border border-[#E9E7FB] p-7 shadow-[0_1px_2px_rgba(17,24,39,0.04)] md:p-9">
                    <Box className="flex items-start gap-5">
                        <Box className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EEF0FB]">
                            <InlineIcon icon={ClipboardCheck} className="h-7 w-7 text-[#5140F0]" />
                        </Box>
                        <Box>
                            <Text as="h1" className="text-[26px] font-extrabold text-[#111827]">
                                {evaluation.title}
                            </Text>
                            <Text className="mt-2 text-[15px] font-medium leading-7 text-[#596273]">
                                {evaluation.description}
                            </Text>
                        </Box>
                    </Box>

                    <Box className="mt-6 rounded-[16px] bg-[#F7F8FB] p-6">
                        <Box className="flex items-center gap-2.5">
                            <InlineIcon icon={FileText} className="h-5 w-5 text-[#9CA3AF]" />
                            <Text className="text-[15px] text-[#374151]">
                                <span className="font-extrabold">{questionCount} questions</span>{" "}
                                réparties en {sectionCount} étapes
                            </Text>
                        </Box>
                        <Box className="mt-3 flex items-center gap-2.5">
                            <InlineIcon icon={Clock} className="h-5 w-5 text-[#9CA3AF]" />
                            <Text className="text-[15px] text-[#374151]">
                                <span className="font-extrabold">
                                    {evaluation.durationMinutes} minutes
                                </span>{" "}
                                environ
                            </Text>
                        </Box>
                    </Box>

                    <Link
                        href={`/evaluations/${evaluation.id}/quiz`}
                        className="mt-6 flex h-12 w-fit items-center justify-center rounded-xl bg-[#5140F0] px-7 text-[15px] font-bold text-white shadow-[0_12px_24px_rgba(81,64,240,0.24)] transition hover:bg-[#4635E7]"
                    >
                        Commencer
                    </Link>
                </CardSurface>
            </Box>
        </Box>
    );
}
