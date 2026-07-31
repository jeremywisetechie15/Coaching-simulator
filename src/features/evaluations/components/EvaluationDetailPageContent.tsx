"use client";

import {
    ChevronRight,
    Clock,
    Eye,
    FileText,
    Gauge,
    LockKeyhole,
    RefreshCw,
    Star,
    type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ContextualLink, ResourceDetailHeader } from "@/features/app-shell/components";
import {
    ContentStatusBadge,
    LearnerContentStatusBadge,
} from "@/features/content/components";
import { isSelectableContent } from "@/features/content/domain";
import {
    EVALUATION_ROUTES,
    QUIZ_ATTEMPT_STATUS,
    QUIZ_DEFAULT_VALIDATION_THRESHOLD,
    getQuizCompetenceCount,
    getQuizKindLabel,
    getQuizQuestionCount,
    getQuizTypeLabel,
    type QuizAttemptSession,
    type QuizDetail,
} from "@/features/evaluations/domain";
import { METHOD_ROUTES } from "@/features/methods/domain/method";
import type { SkillOption } from "@/features/skills/domain/skills";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import { QuizDetailStatCell } from "./QuizDetailStatCell";
import { QuizMetadataBadge } from "./QuizMetadataBadge";
import { QuizStepsAccordion } from "./QuizStepsAccordion";

interface EvaluationDetailPageContentProps {
    canManage?: boolean;
    quiz: QuizDetail;
    skillOptions: SkillOption[];
}

interface ApiErrorPayload {
    error?: string;
}

async function archiveQuizRequest(quizId: string) {
    const response = await fetch(EVALUATION_ROUTES.api.detail(quizId), {
        method: "DELETE",
    });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        throw new Error(payload?.error || "Impossible d'archiver le quiz.");
    }
}

interface FactRowProps {
    icon: LucideIcon;
    prefix?: string;
    suffix?: string;
    value: string;
}

function FactRow({ icon, prefix, suffix, value }: FactRowProps) {
    return (
        <Box className={uiTokens.quizDetail.factRow}>
            <InlineIcon icon={icon} className={uiTokens.quizDetail.factIcon} />
            <Text as="span">
                {prefix}
                <span className={uiTokens.quizDetail.factStrong}>{value}</span>
                {suffix}
            </Text>
        </Box>
    );
}

function formatScore(score: number | null) {
    return score === null ? "—" : `${score}%`;
}

export function EvaluationDetailPageContent({
    canManage = false,
    quiz,
    skillOptions,
}: EvaluationDetailPageContentProps) {
    const router = useRouter();
    const skillNameById = useMemo(
        () => new Map(skillOptions.map((skill) => [skill.id, skill.name])),
        [skillOptions],
    );
    const questionCount = getQuizQuestionCount(quiz);
    const competenceCount = getQuizCompetenceCount(quiz);
    const threshold = quiz.validationThreshold ?? QUIZ_DEFAULT_VALIDATION_THRESHOLD;
    const canStartQuiz = isSelectableContent(quiz.status, quiz.isActive);
    const categoryLabel =
        quiz.categories[0]?.trim()
        || quiz.domain.trim()
        || getQuizKindLabel(quiz.kind);
    const quizHref = EVALUATION_ROUTES.app.quiz(quiz.id);
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

    const hasCompletedAttempt = attemptSession
        ? attemptSession.attempt?.status === QUIZ_ATTEMPT_STATUS.completed
        : quiz.learnerStats.attemptCount > 0;
    const hasInProgressAttempt =
        attemptSession?.attempt?.status === QUIZ_ATTEMPT_STATUS.inProgress;
    const attemptsUsed = attemptSession?.attemptsUsed ?? quiz.learnerStats.attemptCount;
    const maxAttempts = attemptSession ? attemptSession.maxAttempts : quiz.maxAttempts;
    const maxAttemptsValue =
        maxAttempts === null
            ? "Tentatives illimitées"
            : `${maxAttempts} tentative${maxAttempts > 1 ? "s" : ""}`;
    const retryAttemptsLabel =
        maxAttempts === null
            ? "tentatives illimitées"
            : `${attemptsUsed}/${maxAttempts} tentatives`;
    const canRetry =
        attemptSession?.canStartNewAttempt
        ?? (maxAttempts === null || attemptsUsed < maxAttempts);
    const isArchived = quiz.status === "archived" || !quiz.isActive;

    async function handleArchive() {
        await archiveQuizRequest(quiz.id);
        router.push(EVALUATION_ROUTES.app.collection);
        router.refresh();
    }

    return (
        <Box as="main" className={uiTokens.quizDetail.page}>
            <Box className={uiTokens.quizDetail.container}>
                <ResourceDetailHeader
                    archiveAction={{
                        errorMessage: "Impossible d'archiver le quiz.",
                        isArchived,
                        onArchive: handleArchive,
                    }}
                    canManage={canManage}
                    editHref={EVALUATION_ROUTES.app.edit(quiz.id)}
                    fallbackHref={EVALUATION_ROUTES.app.collection}
                />

                <Box className={uiTokens.quizDetail.shell}>
                    <Text as="h1" className="sr-only">
                        {quiz.title}
                    </Text>
                    <Box className={uiTokens.quizDetail.badgeRow}>
                        <QuizMetadataBadge tone="category">{categoryLabel}</QuizMetadataBadge>
                        <QuizMetadataBadge tone="type">
                            {getQuizTypeLabel(quiz.type)}
                        </QuizMetadataBadge>
                        {quiz.difficulty && (
                            <QuizMetadataBadge tone="difficulty">
                                {quiz.difficulty}
                            </QuizMetadataBadge>
                        )}
                        <ContentStatusBadge status={quiz.status} />
                        <LearnerContentStatusBadge status={quiz.learnerStatus} />
                    </Box>

                    <Text className={uiTokens.quizDetail.description}>
                        {quiz.description || "Aucune description renseignée."}
                    </Text>

                    <Box className={uiTokens.quizDetail.factsPanel}>
                        <FactRow
                            icon={FileText}
                            value={`${questionCount} question${questionCount > 1 ? "s" : ""}`}
                            suffix={` répartie${questionCount > 1 ? "s" : ""} en ${quiz.steps.length} étape${quiz.steps.length > 1 ? "s" : ""}`}
                        />
                        <FactRow
                            icon={Clock}
                            value={`${quiz.durationMinutes} minute${quiz.durationMinutes > 1 ? "s" : ""}`}
                            suffix=" environ"
                        />
                        <FactRow
                            icon={Star}
                            value={`${competenceCount} compétence${competenceCount > 1 ? "s" : ""}`}
                            suffix={` évaluée${competenceCount > 1 ? "s" : ""}`}
                        />
                        <FactRow
                            icon={RefreshCw}
                            value={maxAttemptsValue}
                            suffix={
                                maxAttempts === null
                                    ? ""
                                    : ` autorisée${maxAttempts > 1 ? "s" : ""}`
                            }
                        />
                        <FactRow
                            icon={Gauge}
                            prefix="Seuil recommandé : "
                            value={`${threshold}%`}
                        />
                    </Box>

                    <Box className={uiTokens.quizDetail.statsSection}>
                        <Text as="h2" className={uiTokens.quizDetail.sectionTitle}>
                            Vos statistiques
                        </Text>
                        <Box className={uiTokens.quizDetail.statsGrid}>
                            <QuizDetailStatCell
                                helper="Dernière tentative"
                                label="Score actuel"
                                muted={quiz.learnerStats.currentScore === null}
                                value={formatScore(quiz.learnerStats.currentScore)}
                            />
                            <QuizDetailStatCell
                                helper={
                                    quiz.learnerStats.bestScore === null
                                        ? "Aucune tentative"
                                        : "Meilleur résultat"
                                }
                                label="Meilleur score"
                                muted={quiz.learnerStats.bestScore === null}
                                value={formatScore(quiz.learnerStats.bestScore)}
                            />
                            <QuizDetailStatCell
                                helper="Top 3 des 6 dernières"
                                label="Score INDEX"
                                muted={quiz.learnerStats.indexScore === null}
                                value={formatScore(quiz.learnerStats.indexScore)}
                            />
                            <QuizDetailStatCell
                                accent
                                helper="Tentatives effectuées"
                                label="Tentatives"
                                value={String(quiz.learnerStats.attemptCount)}
                            />
                        </Box>
                    </Box>

                    {quiz.methodId && (
                        <Box className={uiTokens.quizDetail.methodPanel}>
                            <Text className={uiTokens.quizDetail.methodText}>
                                Ce quiz évalue vos connaissances sur la méthode{" "}
                                <strong>{quiz.methodName ?? "associée"}</strong>
                            </Text>
                            <ContextualLink
                                href={METHOD_ROUTES.app.detail(quiz.methodId)}
                                className={uiTokens.quizDetail.methodLink}
                            >
                                Découvrir la méthode
                                <InlineIcon
                                    icon={ChevronRight}
                                    className={uiTokens.quizDetail.methodLinkIcon}
                                />
                            </ContextualLink>
                        </Box>
                    )}

                    <QuizStepsAccordion
                        competenceCount={competenceCount}
                        skillNameById={skillNameById}
                        steps={quiz.steps}
                    />

                    <Box className={uiTokens.quizDetail.actions}>
                        {hasCompletedAttempt && (
                            <ContextualLink
                                href={resultHref}
                                className={cn(
                                    uiTokens.action.secondaryButton,
                                    uiTokens.quizDetail.secondaryAction,
                                )}
                            >
                                <InlineIcon icon={Eye} className="h-4 w-4" />
                                Revoir mes réponses
                            </ContextualLink>
                        )}
                        {!canStartQuiz ? (
                            <Button
                                disabled
                                className={cn(
                                    uiTokens.quizDetail.primaryAction,
                                    uiTokens.action.primaryButtonDisabled,
                                )}
                            >
                                <InlineIcon icon={LockKeyhole} className="h-4 w-4" />
                                Publiez le quiz pour commencer
                            </Button>
                        ) : hasCompletedAttempt ? (
                            canRetry && (
                                <ContextualLink
                                    href={`${quizHref}?retry=1`}
                                    className={cn(
                                        uiTokens.quizDetail.primaryAction,
                                        uiTokens.action.primaryButton,
                                    )}
                                >
                                    Retenter le quiz ({retryAttemptsLabel})
                                </ContextualLink>
                            )
                        ) : (
                            <ContextualLink
                                href={quizHref}
                                className={cn(
                                    uiTokens.quizDetail.primaryAction,
                                    uiTokens.action.primaryButton,
                                )}
                            >
                                {hasInProgressAttempt ? "Reprendre le quiz" : "Commencer le quiz"}
                            </ContextualLink>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
