"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
    ArrowLeft,
    ClipboardCheck,
    Clock,
    Edit3,
    Eye,
    FileText,
    Gauge,
    RefreshCw,
    Star,
} from "lucide-react";
import { ContextualBackLink, ContextualLink } from "@/features/app-shell/components";
import {
    EVALUATION_ROUTES,
    getQuizCompetenceCount,
    getQuizKindLabel,
    getQuizQuestionCount,
    getQuizScopeLabel,
    getQuizStatusLabel,
    getQuizTypeLabel,
    type QuizAttemptSession,
    type QuizDetail,
} from "@/features/evaluations/domain";
import type { SkillOption } from "@/features/skills/domain/skills";
import { Box, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface EvaluationDetailPageContentProps {
    canManage?: boolean;
    quiz: QuizDetail;
    skillOptions: SkillOption[];
}

const stepAccents = [
    { badge: "bg-[#E5E9FF] text-[#3B5BDB]", chip: "bg-[#EFF1FE] text-[#3B5BDB]" },
    { badge: "bg-[#F3E8FF] text-[#9333EA]", chip: "bg-[#F8F0FF] text-[#9333EA]" },
    { badge: "bg-[#FFEAD5] text-[#EA580C]", chip: "bg-[#FFF3E8] text-[#EA580C]" },
    { badge: "bg-[#DCFCE7] text-[#16A34A]", chip: "bg-[#ECFDF3] text-[#16A34A]" },
];

export function EvaluationDetailPageContent({ canManage = false, quiz, skillOptions }: EvaluationDetailPageContentProps) {
    const skillNameById = new Map(skillOptions.map((skill) => [skill.id, skill.name]));
    const questionCount = getQuizQuestionCount(quiz);
    const competenceCount = getQuizCompetenceCount(quiz);
    const threshold = quiz.validationThreshold ?? 70;

    const quizHref = `/evaluations/${quiz.id}/quiz`;
    const resultHref = EVALUATION_ROUTES.app.results(quiz.id);
    const [attemptSession, setAttemptSession] = useState<QuizAttemptSession | null>(null);

    useEffect(() => {
        let active = true;

        void fetch(EVALUATION_ROUTES.api.latestAttempt(quiz.id), { cache: "no-store" })
            .then((response) => (response.ok ? response.json() : null))
            .then((session: QuizAttemptSession | null) => {
                if (active && session) setAttemptSession(session);
            })
            .catch(() => undefined);

        return () => {
            active = false;
        };
    }, [quiz.id]);

    const hasCompletedAttempt = attemptSession?.attempt?.status === "completed";
    const hasInProgressAttempt = attemptSession?.attempt?.status === "in_progress";
    const attemptsUsed = attemptSession?.attemptsUsed ?? 0;
    const maxAttempts = attemptSession ? attemptSession.maxAttempts : quiz.maxAttempts;
    const canRetry = attemptSession?.canStartNewAttempt ?? true;
    const maxAttemptsLabel =
        maxAttempts === null
            ? "Tentatives illimitées"
            : `${maxAttempts} tentative${maxAttempts > 1 ? "s" : ""}`;
    const retryAttemptsLabel =
        maxAttempts === null ? "tentatives illimitées" : `${attemptsUsed}/${maxAttempts} tentatives`;

    const stats = [
        {
            icon: FileText,
            value: `${questionCount} question${questionCount > 1 ? "s" : ""}`,
            suffix: ` répartie${questionCount > 1 ? "s" : ""} en ${quiz.steps.length} étape${quiz.steps.length > 1 ? "s" : ""}`,
        },
        { icon: Clock, value: `${quiz.durationMinutes} minutes`, suffix: " environ" },
        { icon: Star, value: `${competenceCount} compétence${competenceCount > 1 ? "s" : ""}`, suffix: "" },
        { icon: RefreshCw, value: maxAttemptsLabel, suffix: "" },
        { icon: Gauge, value: `Seuil recommandé : ${threshold}%`, suffix: "" },
    ];

    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[920px]">
                <Box className="mb-5 flex items-center justify-between">
                    <ContextualBackLink
                        fallbackHref={EVALUATION_ROUTES.app.collection}
                        aria-label="Retour"
                        className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white",
                            uiTokens.text.heading,
                        )}
                    >
                        <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                    </ContextualBackLink>
                    {canManage && (
                        <ContextualLink
                            href={`/evaluations/${quiz.id}/edit`}
                            className={cn(uiTokens.action.secondaryButton, "h-10 gap-2 px-4")}
                        >
                            <InlineIcon icon={Edit3} className="h-4 w-4" />
                            Modifier
                        </ContextualLink>
                    )}
                </Box>

                <CardSurface className={uiTokens.surface.formCard}>
                    <Box className="flex items-start gap-5">
                        <Box className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EEF0FB]">
                            <InlineIcon icon={ClipboardCheck} className={cn("h-7 w-7", uiTokens.text.primary)} />
                        </Box>
                        <Box>
                            <Box className="flex flex-wrap items-center gap-2">
                                <Badge>{getQuizKindLabel(quiz.kind)}</Badge>
                                <Badge>{getQuizTypeLabel(quiz.type)}</Badge>
                                <Badge>{getQuizStatusLabel(quiz.status)}</Badge>
                            </Box>
                            <Text as="h1" className={cn("mt-3 text-[26px] font-extrabold", uiTokens.text.heading)}>
                                {quiz.title}
                            </Text>
                            <Text className={cn("mt-2 text-[15px] font-medium leading-7", uiTokens.text.muted)}>
                                {quiz.description || "Aucune description renseignée."}
                            </Text>
                        </Box>
                    </Box>

                    <Box className="mt-6 grid gap-3 rounded-[16px] bg-[#F7F8FB] p-5 md:grid-cols-2">
                        {stats.map((stat) => (
                            <Box key={stat.value} className="flex items-center gap-2.5">
                                <InlineIcon icon={stat.icon} className={cn("h-5 w-5", uiTokens.text.muted)} />
                                <Text className={cn("text-[14px]", uiTokens.text.subtle)}>
                                    <span className="font-extrabold">{stat.value}</span>
                                    {stat.suffix}
                                </Text>
                            </Box>
                        ))}
                        <Text className={cn("text-[14px] font-semibold", uiTokens.text.subtle)}>
                            Visibilité : {getQuizScopeLabel(quiz.scope)}
                        </Text>
                        <Text className={cn("text-[14px] font-semibold", uiTokens.text.subtle)}>
                            Méthode : {quiz.methodName ?? "Aucune méthode associée"}
                        </Text>
                    </Box>

                    <Box className="mt-7">
                        <Text as="h3" className={cn("text-[13px] font-extrabold uppercase tracking-[0.08em]", uiTokens.text.muted)}>
                            Étapes évaluées
                        </Text>
                        <Box className="mt-4 flex flex-col gap-3">
                            {quiz.steps.map((step, index) => {
                                const accent = stepAccents[index % stepAccents.length];
                                return (
                                    <Box
                                        key={step.id}
                                        className="rounded-[14px] border border-[#E5E7EB] bg-white p-4"
                                    >
                                        <Box className="flex items-center gap-3">
                                            <Box
                                                className={cn(
                                                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold",
                                                    accent.badge,
                                                )}
                                            >
                                                {index + 1}
                                            </Box>
                                            <Text className={cn("flex-1 text-[15px] font-bold", uiTokens.text.heading)}>
                                                {step.name}
                                            </Text>
                                            <Box className="inline-flex h-6 items-center rounded-md bg-[#F1F2F5] px-2.5 text-[12px] font-bold text-[#4B5563]">
                                                {step.weight}%
                                            </Box>
                                        </Box>
                                        <Box className="mt-3 flex flex-wrap items-center gap-2">
                                            <Text className={cn("text-[12px] font-semibold", uiTokens.text.muted)}>
                                                Compétences :
                                            </Text>
                                            {step.competenceIds.length > 0 ? (
                                                step.competenceIds.map((competenceId) => (
                                                    <Box
                                                        key={competenceId}
                                                        className={cn(
                                                            "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold",
                                                            accent.chip,
                                                        )}
                                                    >
                                                        <InlineIcon icon={Star} className="h-3 w-3" />
                                                        {skillNameById.get(competenceId) ?? competenceId}
                                                    </Box>
                                                ))
                                            ) : (
                                                <Text className={cn("text-[12px] font-semibold", uiTokens.text.muted)}>
                                                    Aucune compétence renseignée.
                                                </Text>
                                            )}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>

                    {hasCompletedAttempt ? (
                        <Box className="mt-7 flex flex-wrap gap-3">
                            <ContextualLink href={resultHref} className={cn(uiTokens.action.secondaryButton, "h-12 gap-2 px-6")}>
                                <InlineIcon icon={Eye} className="h-5 w-5" />
                                Revoir mes réponses
                            </ContextualLink>
                            {canRetry && (
                                <ContextualLink
                                    href={`${quizHref}?retry=1`}
                                    className={cn(
                                        "flex h-12 items-center justify-center gap-2 rounded-xl px-7 text-[15px] font-bold text-white transition",
                                        uiTokens.action.primaryButton,
                                    )}
                                >
                                    <InlineIcon icon={RefreshCw} className="h-5 w-5" />
                                    Retenter le quiz ({retryAttemptsLabel})
                                </ContextualLink>
                            )}
                        </Box>
                    ) : (
                        <ContextualLink
                            href={quizHref}
                            className={cn(
                                "mt-7 flex h-12 w-fit items-center justify-center rounded-xl px-7 text-[15px] font-bold text-white transition",
                                uiTokens.action.primaryButton,
                            )}
                        >
                            {hasInProgressAttempt ? "Reprendre le quiz" : "Commencer le quiz"}
                        </ContextualLink>
                    )}
                </CardSurface>
            </Box>
        </Box>
    );
}

function Badge({ children }: { children: ReactNode }) {
    return (
        <Box className="inline-flex h-7 items-center rounded-md border border-[#E5E7EB] bg-[#F3F4F6] px-2.5 text-[12px] font-semibold text-[#4B5563]">
            {children}
        </Box>
    );
}
