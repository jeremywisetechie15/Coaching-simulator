"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    BookOpen,
    CheckCircle2,
    Phone,
    RotateCcw,
    ShieldCheck,
    Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Box, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { cn } from "@/lib/ui/utils/cn";
import type { Evaluation, QuizSectionIcon } from "@/features/evaluations/data/evaluations";

interface EvaluationQuizPageContentProps {
    evaluation: Evaluation;
}

const sectionIcons: Record<QuizSectionIcon, LucideIcon> = {
    phone: Phone,
    target: Target,
    shield: ShieldCheck,
    check: CheckCircle2,
    book: BookOpen,
};

export function EvaluationQuizPageContent({ evaluation }: EvaluationQuizPageContentProps) {
    /** Liste à plat de toutes les questions avec leur index de section. */
    const flatQuestions = useMemo(
        () =>
            evaluation.sections.flatMap((section, sectionIndex) =>
                section.questions.map((question) => ({ question, sectionIndex })),
            ),
        [evaluation],
    );

    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showResults, setShowResults] = useState(false);

    const current = flatQuestions[currentIndex];
    const isLast = currentIndex === flatQuestions.length - 1;
    const currentAnswered = answers[current.question.id] !== undefined;

    function selectOption(optionIndex: number) {
        setAnswers((prev) => ({ ...prev, [current.question.id]: optionIndex }));
    }

    function goToSection(sectionIndex: number) {
        const target = flatQuestions.findIndex((item) => item.sectionIndex === sectionIndex);
        if (target >= 0) {
            setCurrentIndex(target);
        }
    }

    function answeredCountForSection(sectionIndex: number) {
        return evaluation.sections[sectionIndex].questions.filter(
            (question) => answers[question.id] !== undefined,
        ).length;
    }

    function restart() {
        setAnswers({});
        setCurrentIndex(0);
        setShowResults(false);
    }

    if (showResults) {
        const correct = flatQuestions.filter(
            ({ question }) =>
                answers[question.id] !== undefined &&
                question.options[answers[question.id]]?.correct,
        ).length;
        const total = flatQuestions.length;
        const score = Math.round((correct / total) * 100);
        const passed = score >= 70;

        return (
            <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
                <Box className="mx-auto max-w-[760px]">
                    <CardSurface className="rounded-[20px] border border-[#E9E7FB] p-8 text-center shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                        <Box
                            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
                            style={{ backgroundColor: passed ? "#F0FDF4" : "#FEF2F2" }}
                        >
                            <Text
                                className="text-[24px] font-extrabold"
                                style={{ color: passed ? "#16A34A" : "#DC2626" }}
                            >
                                {score}%
                            </Text>
                        </Box>
                        <Text as="h1" className="mt-4 text-[24px] font-extrabold text-[#111827]">
                            {passed ? "Évaluation réussie !" : "Évaluation à retravailler"}
                        </Text>
                        <Text className="mt-1 text-[15px] font-medium text-[#596273]">
                            {correct} bonne(s) réponse(s) sur {total} questions
                        </Text>

                        <Box className="mt-6 space-y-2.5 text-left">
                            {evaluation.sections.map((section, sectionIndex) => {
                                const sectionCorrect = section.questions.filter(
                                    (question) =>
                                        answers[question.id] !== undefined &&
                                        question.options[answers[question.id]]?.correct,
                                ).length;
                                return (
                                    <Box
                                        key={section.id}
                                        className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 py-3"
                                    >
                                        <Box className="flex items-center gap-2.5">
                                            <InlineIcon
                                                icon={sectionIcons[section.icon]}
                                                className="h-4 w-4 text-[#5140F0]"
                                            />
                                            <Text className="text-[14px] font-bold text-[#374151]">
                                                {section.title}
                                            </Text>
                                        </Box>
                                        <Text className="text-[14px] font-bold text-[#4B5563]">
                                            {sectionCorrect}/{section.questions.length}
                                        </Text>
                                        <span className="sr-only">section {sectionIndex + 1}</span>
                                    </Box>
                                );
                            })}
                        </Box>

                        <Box className="mt-7 flex flex-wrap justify-center gap-3">
                            <button
                                type="button"
                                onClick={restart}
                                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#C9C2FB] bg-white px-5 text-[14px] font-bold text-[#5140F0] transition hover:bg-[#F4F3FE]"
                            >
                                <InlineIcon icon={RotateCcw} className="h-4 w-4" />
                                Recommencer
                            </button>
                            <Link
                                href="/evaluations"
                                className="flex h-11 items-center justify-center rounded-xl bg-[#5140F0] px-5 text-[14px] font-bold text-white transition hover:bg-[#4635E7]"
                            >
                                Retour aux évaluations
                            </Link>
                        </Box>
                    </CardSurface>
                </Box>
            </Box>
        );
    }

    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1180px]">
                <Box className="mb-5 flex items-center gap-4">
                    <Link
                        href={`/evaluations/${evaluation.id}`}
                        aria-label="Retour"
                        className="flex h-9 w-9 items-center justify-center rounded-full text-[#111827] transition hover:bg-white"
                    >
                        <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                    </Link>
                    <Box>
                        <Text as="h1" className="text-[24px] font-extrabold text-[#111827]">
                            {evaluation.quizTitle}
                        </Text>
                        <Text className="text-[14px] font-medium text-[#6B7280]">
                            {evaluation.quizSubtitle}
                        </Text>
                    </Box>
                </Box>

                <Box className="grid gap-5 lg:grid-cols-[300px_1fr]">
                    {/* Sidebar des étapes */}
                    <Box className="flex flex-col gap-3">
                        {evaluation.sections.map((section, sectionIndex) => {
                            const isActive = sectionIndex === current.sectionIndex;
                            const answered = answeredCountForSection(sectionIndex);
                            const totalQuestions = section.questions.length;
                            const progress = (answered / totalQuestions) * 100;

                            return (
                                <button
                                    key={section.id}
                                    type="button"
                                    onClick={() => goToSection(sectionIndex)}
                                    className={cn(
                                        "rounded-[14px] border p-4 text-left transition",
                                        isActive
                                            ? "border-[#C9D8F4] bg-[#EFF4FD]"
                                            : "border-[#E5E7EB] bg-white hover:border-[#D5D7DE]",
                                    )}
                                >
                                    <Box className="flex items-center gap-2.5">
                                        <InlineIcon
                                            icon={sectionIcons[section.icon]}
                                            className={cn(
                                                "h-4 w-4",
                                                isActive ? "text-[#3061C8]" : "text-[#9CA3AF]",
                                            )}
                                        />
                                        <Text className="text-[13px] font-bold uppercase tracking-wide text-[#374151]">
                                            {section.title}
                                        </Text>
                                    </Box>
                                    <Text className="mt-1.5 text-[12px] font-semibold text-[#6B7280]">
                                        {answered}/{totalQuestions} questions
                                    </Text>
                                    <Box className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
                                        <Box
                                            className="h-full rounded-full bg-[#5140F0] transition-all"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </Box>
                                </button>
                            );
                        })}
                    </Box>

                    {/* Panneau question */}
                    <Box className="flex flex-col">
                        <CardSurface className="rounded-[18px] border border-[#C9D8F4] bg-gradient-to-b from-[#EFF4FD] to-white p-7 shadow-none">
                            <Box className="flex items-start justify-between gap-4">
                                <Text as="h2" className="text-[20px] font-extrabold text-[#111827]">
                                    {current.question.prompt}
                                </Text>
                                <Box className="inline-flex h-7 shrink-0 items-center rounded-md border border-[#E5E7EB] bg-white px-2.5 text-[12px] font-bold text-[#6B7280]">
                                    {current.question.type}
                                </Box>
                            </Box>

                            <Box className="mt-5 space-y-3">
                                {current.question.options.map((option, optionIndex) => {
                                    const selected = answers[current.question.id] === optionIndex;
                                    return (
                                        <button
                                            key={option.label}
                                            type="button"
                                            onClick={() => selectOption(optionIndex)}
                                            className={cn(
                                                "flex w-full items-center rounded-xl border bg-white px-4 py-3.5 text-left text-[15px] font-medium transition",
                                                selected
                                                    ? "border-[#5140F0] bg-[#F4F3FE] text-[#1F2937] shadow-[0_0_0_1px_#5140F0]"
                                                    : "border-[#E5E7EB] text-[#374151] hover:border-[#C9C2FB]",
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "mr-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                                                    selected
                                                        ? "border-[#5140F0]"
                                                        : "border-[#C9CED8]",
                                                )}
                                            >
                                                {selected && (
                                                    <span className="h-2.5 w-2.5 rounded-full bg-[#5140F0]" />
                                                )}
                                            </span>
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </Box>
                        </CardSurface>

                        <Box className="mt-5 flex items-center justify-between">
                            <button
                                type="button"
                                disabled={currentIndex === 0}
                                onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
                                className="flex h-11 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-5 text-[14px] font-bold text-[#4B5563] transition hover:border-[#D5D7DE] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Question précédente
                            </button>
                            <button
                                type="button"
                                disabled={!currentAnswered}
                                onClick={() => {
                                    if (isLast) {
                                        setShowResults(true);
                                    } else {
                                        setCurrentIndex((index) => index + 1);
                                    }
                                }}
                                className="flex h-11 items-center justify-center rounded-xl bg-[#5140F0] px-5 text-[14px] font-bold text-white transition hover:bg-[#4635E7] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {isLast ? "Terminer l'évaluation" : "Question suivante"}
                            </button>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
