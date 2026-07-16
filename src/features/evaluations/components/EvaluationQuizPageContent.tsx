"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ArrowLeft,
    BookOpen,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ClipboardCheck,
    Eye,
    Info,
    Phone,
    Shield,
    Target,
    X,
    type LucideIcon,
} from "lucide-react";
import { ContextualBackLink, useContextualReturnHref } from "@/features/app-shell/components";
import {
    EVALUATION_ROUTES,
    QUIZ_KIND,
    QUIZ_DIMENSION_LABELS,
    QUIZ_DIMENSIONS,
    getQuizDimensionDiagnostic,
    getQuizResumeQuestionIndex,
    scoreQuizAnswers,
    type QuizAttemptAnswer,
    type QuizAttemptDetail,
    type QuizAttemptSession,
    type QuizDetail,
    type QuizDimension,
    type QuizQuestion,
    type QuizQuestionAttachment,
    type QuizStep,
} from "@/features/evaluations/domain";
import { METHOD_ROUTES } from "@/features/methods/domain/method";
import type { SkillOption } from "@/features/skills/domain/skills";
import { getStoragePathFileName } from "@/lib/uploads/content-upload";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { FilePreviewCard, type FilePreviewKind } from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface EvaluationQuizPageContentProps {
    initialAttemptSession: QuizAttemptSession;
    initialRetryRequested: boolean;
    initialView: "quiz" | "results";
    quiz: QuizDetail;
    skillOptions: SkillOption[];
}

type QuizMode = "quiz" | "results" | "review";

function scoreTone(pct: number, threshold: number) {
    if (pct >= threshold) {
        return {
            bg: "bg-[#DCFCE7]",
            dot: "bg-[#16A34A]",
            soft: "bg-[#F0FDF4]",
            text: "text-[#16A34A]",
        };
    }

    if (pct >= 50) {
        return {
            bg: "bg-[#FEF3C7]",
            dot: "bg-[#F59E0B]",
            soft: "bg-[#FFFBEB]",
            text: "text-[#B45309]",
        };
    }

    return {
        bg: "bg-[#FEE2E2]",
        dot: "bg-[#EF4444]",
        soft: "bg-[#FEF2F2]",
        text: "text-[#DC2626]",
    };
}

function isQuestionCorrect(question: QuizQuestion, selectedChoiceIds: string[]) {
    const correctChoiceIds = question.choices.filter((choice) => choice.isCorrect).map((choice) => choice.id);

    return (
        selectedChoiceIds.length === correctChoiceIds.length &&
        correctChoiceIds.every((choiceId) => selectedChoiceIds.includes(choiceId))
    );
}

function computeCompetenceScore(
    step: QuizStep,
    competenceId: string,
    selectedChoiceIdsByQuestionId: Record<string, string[]>,
) {
    const questions = step.questions.filter((question) => question.competenceId === competenceId);
    const maxPoints = questions.reduce((sum, question) => sum + question.points, 0);
    const earnedPoints = questions.reduce((sum, question) => {
        const selected = selectedChoiceIdsByQuestionId[question.id] ?? [];
        return sum + (isQuestionCorrect(question, selected) ? question.points : 0);
    }, 0);

    return maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;
}

/** Pastilles d'icône par étape (cycle), comme sur la page résultat MaiaCoach. */
const stepIconAccents: { color: string; icon: LucideIcon; wrap: string }[] = [
    { color: "text-[#3B5BDB]", icon: Phone, wrap: "bg-[#EEF1FE]" },
    { color: "text-[#9333EA]", icon: Target, wrap: "bg-[#F8F0FF]" },
    { color: "text-[#EA580C]", icon: Shield, wrap: "bg-[#FFF3E8]" },
    { color: "text-[#16A34A]", icon: CheckCircle2, wrap: "bg-[#ECFDF3]" },
];

const dimensionIcons: Record<QuizDimension, LucideIcon> = {
    savoir: BookOpen,
};

function computeCompetenceDimensionBreakdown(
    step: QuizStep,
    competenceId: string,
    selectedChoiceIdsByQuestionId: Record<string, string[]>,
) {
    const totalsByDimension = new Map<QuizDimension, { earnedPoints: number; maxPoints: number }>();

    for (const question of step.questions) {
        if (question.competenceId !== competenceId) continue;

        const totals = totalsByDimension.get(question.dimension) ?? { earnedPoints: 0, maxPoints: 0 };
        totals.maxPoints += question.points;
        const selected = selectedChoiceIdsByQuestionId[question.id] ?? [];
        if (isQuestionCorrect(question, selected)) {
            totals.earnedPoints += question.points;
        }
        totalsByDimension.set(question.dimension, totals);
    }

    return QUIZ_DIMENSIONS.flatMap((dimension) => {
        const totals = totalsByDimension.get(dimension);
        if (!totals) return [];

        return [
            {
                dimension,
                earnedPoints: totals.earnedPoints,
                maxPoints: totals.maxPoints,
                scorePercent: totals.maxPoints > 0 ? Math.round((totals.earnedPoints / totals.maxPoints) * 100) : 0,
            },
        ];
    });
}

interface ApiErrorPayload {
    error?: string;
}

function answersToRecord(answers: QuizAttemptAnswer[]) {
    return answers.reduce<Record<string, string[]>>((accumulator, answer) => {
        accumulator[answer.questionId] = answer.choiceIds;
        return accumulator;
    }, {});
}

function recordToAnswers(answers: Record<string, string[]>): QuizAttemptAnswer[] {
    return Object.entries(answers)
        .filter(([, choiceIds]) => choiceIds.length > 0)
        .map(([questionId, choiceIds]) => ({
            choiceIds,
            questionId,
        }));
}

async function parseJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
    const payload = (await response.json().catch(() => null)) as (ApiErrorPayload & T) | null;

    if (!response.ok) {
        throw new Error(payload?.error || fallbackMessage);
    }

    if (!payload) {
        throw new Error(fallbackMessage);
    }

    return payload as T;
}

export function EvaluationQuizPageContent({
    initialAttemptSession,
    initialRetryRequested,
    initialView,
    quiz,
    skillOptions,
}: EvaluationQuizPageContentProps) {
    const completionFallbackHref =
        quiz.kind === QUIZ_KIND.methodKnowledge && quiz.methodId
            ? METHOD_ROUTES.app.detail(quiz.methodId)
            : EVALUATION_ROUTES.app.detail(quiz.id);
    const completionHref = useContextualReturnHref(completionFallbackHref);
    const skillNameById = useMemo(
        () => new Map(skillOptions.map((skill) => [skill.id, skill.name])),
        [skillOptions],
    );
    const flatQuestions = useMemo(
        () =>
            quiz.steps.flatMap((step, stepIndex) =>
                step.questions.map((question) => ({
                    question,
                    step,
                    stepIndex,
                })),
            ),
        [quiz.steps],
    );
    const startsBlankRetry = initialRetryRequested && initialAttemptSession.canStartNewAttempt;
    const initialAttempt = startsBlankRetry ? null : initialAttemptSession.attempt;
    const initialAnswers = useMemo(
        () => (initialAttempt ? answersToRecord(initialAttempt.answers) : {}),
        [initialAttempt],
    );

    const [answers, setAnswers] = useState<Record<string, string[]>>(() => initialAnswers);
    const [currentIndex, setCurrentIndex] = useState(() =>
        initialAttempt?.status === "in_progress"
            ? getQuizResumeQuestionIndex({ steps: quiz.steps }, initialAnswers)
            : 0,
    );
    const [mode, setMode] = useState<QuizMode>(
        initialView === "results" || initialAttempt?.status === "completed" ? "results" : "quiz",
    );
    const [openStepId, setOpenStepId] = useState<string | null>(null);
    const [openCompetenceKey, setOpenCompetenceKey] = useState<string | null>(null);
    const [attempt, setAttempt] = useState<QuizAttemptDetail | null>(initialAttempt);
    const [attemptsRemaining, setAttemptsRemaining] = useState(initialAttemptSession.attemptsRemaining);
    const [canStartNewAttempt, setCanStartNewAttempt] = useState(initialAttemptSession.canStartNewAttempt);
    const [attemptError, setAttemptError] = useState<string | null>(null);
    const [loadingAttempt, setLoadingAttempt] = useState(false);
    const [savingAttempt, setSavingAttempt] = useState(false);
    const [showSavedFeedback, setShowSavedFeedback] = useState(false);
    const [submittingAttempt, setSubmittingAttempt] = useState(false);
    const saveQueueRef = useRef(Promise.resolve());
    const savedFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const skipInitialAttemptFetchRef = useRef(true);

    const clientScore = useMemo(() => scoreQuizAnswers(quiz, answers), [answers, quiz]);
    const completedAttempt = attempt?.status === "completed" ? attempt : null;
    const resultScore = completedAttempt?.scorePercent ?? clientScore.score;
    const resultPassed = completedAttempt?.passed ?? clientScore.passed;
    const threshold = quiz.validationThreshold ?? 70;
    const current = flatQuestions[currentIndex];
    const reviewing = mode === "review";
    const attemptStatus = attemptError
        ? { className: uiTokens.text.danger, label: attemptError }
        : loadingAttempt
          ? { className: uiTokens.text.muted, label: "Chargement de la tentative..." }
          : submittingAttempt
            ? { className: uiTokens.text.muted, label: "Validation du quiz..." }
            : savingAttempt
              ? { className: uiTokens.text.muted, label: "Sauvegarde des réponses..." }
              : showSavedFeedback
                ? { className: uiTokens.text.success, label: "Réponses sauvegardées" }
                : null;
    const persistedStepScoreById = useMemo(
        () => new Map((completedAttempt?.stepScores ?? []).map((stepScore) => [stepScore.stepId, stepScore])),
        [completedAttempt],
    );

    useEffect(() => {
        return () => {
            if (savedFeedbackTimeoutRef.current) {
                clearTimeout(savedFeedbackTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (skipInitialAttemptFetchRef.current) {
            skipInitialAttemptFetchRef.current = false;
            return;
        }

        let active = true;

        async function loadLatestAttempt() {
            setLoadingAttempt(true);
            setAttemptError(null);

            try {
                const resultRequested = new URLSearchParams(window.location.search).get("result") === "1";
                const response = await fetch(
                    resultRequested
                        ? EVALUATION_ROUTES.api.latestResultAttempt(quiz.id)
                        : EVALUATION_ROUTES.api.latestAttempt(quiz.id),
                    { cache: "no-store" },
                );
                const session = await parseJsonResponse<QuizAttemptSession>(
                    response,
                    "Impossible de charger la tentative du quiz.",
                );

                if (!active) return;

                setAttempt(session.attempt);
                setAttemptsRemaining(session.attemptsRemaining);
                setCanStartNewAttempt(session.canStartNewAttempt);

                const retryRequested = new URLSearchParams(window.location.search).get("retry") === "1";

                if (!session.attempt) {
                    setAnswers({});
                    setCurrentIndex(0);
                    setMode(resultRequested ? "results" : "quiz");
                } else if (
                    session.attempt.status === "completed" &&
                    retryRequested &&
                    session.canStartNewAttempt
                ) {
                    // Arrivée depuis « Retenter le quiz » : on repart sur une tentative vierge
                    // (une nouvelle tentative est créée côté serveur à la première réponse).
                    setAnswers({});
                    setCurrentIndex(0);
                    setMode("quiz");
                } else {
                    const restoredAnswers = answersToRecord(session.attempt.answers);
                    setAnswers(restoredAnswers);
                    if (session.attempt.status === "completed") {
                        setMode("results");
                    } else {
                        setMode("quiz");
                        setCurrentIndex(getQuizResumeQuestionIndex({ steps: quiz.steps }, restoredAnswers));
                    }
                }
            } catch (error) {
                if (active) {
                    setAttemptError(error instanceof Error ? error.message : "Impossible de charger la tentative du quiz.");
                }
            } finally {
                if (active) setLoadingAttempt(false);
            }
        }

        void loadLatestAttempt();

        return () => {
            active = false;
        };
    }, [quiz.id, quiz.steps]);

    if (flatQuestions.length === 0) {
        return (
            <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
                <Box className="mx-auto max-w-[820px]">
                    <CardSurface className={uiTokens.surface.formCard}>
                        <Text as="h1" className={cn("text-[24px] font-extrabold", uiTokens.text.heading)}>
                            Quiz vide
                        </Text>
                        <Text className={cn("mt-2 text-[14px] font-semibold", uiTokens.text.muted)}>
                            Ce quiz ne contient pas encore de question.
                        </Text>
                        <ContextualBackLink
                            fallbackHref={completionFallbackHref}
                            showLabel
                            className={cn(uiTokens.action.secondaryButton, "mt-5 w-fit")}
                        >
                        </ContextualBackLink>
                    </CardSurface>
                </Box>
            </Box>
        );
    }

    const selectedChoiceIds = answers[current.question.id] ?? [];
    const currentAnswered = selectedChoiceIds.length > 0;
    const isLastQuestion = currentIndex === flatQuestions.length - 1;
    const nextLabel = reviewing && isLastQuestion
        ? "Retour aux résultats"
        : isLastQuestion
          ? "Valider le quiz"
          : "Question suivante";
    const answerModeLabel =
        current.question.type === "QCM" ? "QCM - Plusieurs réponses possibles" : "QCU - Une seule réponse";

    function applyAttemptSession(session: QuizAttemptSession) {
        setAttempt(session.attempt);
        setAttemptsRemaining(session.attemptsRemaining);
        setCanStartNewAttempt(session.canStartNewAttempt);
    }

    async function startAttempt() {
        setSavingAttempt(true);
        setAttemptError(null);

        try {
            const response = await fetch(EVALUATION_ROUTES.api.attempts(quiz.id), { method: "POST" });
            const session = await parseJsonResponse<QuizAttemptSession>(
                response,
                "Impossible de démarrer la tentative.",
            );

            applyAttemptSession(session);

            return session.attempt;
        } catch (error) {
            setAttemptError(error instanceof Error ? error.message : "Impossible de démarrer la tentative.");
            return null;
        } finally {
            setSavingAttempt(false);
        }
    }

    async function ensureEditableAttempt() {
        if (attempt?.status === "in_progress") return attempt;
        return startAttempt();
    }

    function showAnswersSavedFeedback() {
        if (savedFeedbackTimeoutRef.current) {
            clearTimeout(savedFeedbackTimeoutRef.current);
        }

        setShowSavedFeedback(true);
        savedFeedbackTimeoutRef.current = setTimeout(() => {
            setShowSavedFeedback(false);
        }, 1200);
    }

    async function persistAnswers(nextAnswers: Record<string, string[]>) {
        const currentAttempt = await ensureEditableAttempt();
        if (!currentAttempt) return null;

        setSavingAttempt(true);
        setAttemptError(null);

        try {
            const response = await fetch(EVALUATION_ROUTES.api.attemptAnswers(quiz.id, currentAttempt.id), {
                body: JSON.stringify({ answers: recordToAnswers(nextAnswers) }),
                headers: { "Content-Type": "application/json" },
                method: "PATCH",
            });
            const payload = await parseJsonResponse<{ attempt: QuizAttemptDetail }>(
                response,
                "Impossible d'enregistrer les réponses.",
            );

            setAttempt(payload.attempt);
            showAnswersSavedFeedback();

            return payload.attempt;
        } catch (error) {
            setAttemptError(error instanceof Error ? error.message : "Impossible d'enregistrer les réponses.");
            return null;
        } finally {
            setSavingAttempt(false);
        }
    }

    function queuePersistAnswers(nextAnswers: Record<string, string[]>) {
        saveQueueRef.current = saveQueueRef.current
            .then(() => persistAnswers(nextAnswers))
            .then(() => undefined)
            .catch(() => undefined);
    }

    async function submitAttempt() {
        const currentAttempt = await ensureEditableAttempt();
        if (!currentAttempt) return;

        setSubmittingAttempt(true);
        setAttemptError(null);

        try {
            const response = await fetch(EVALUATION_ROUTES.api.attemptSubmit(quiz.id, currentAttempt.id), {
                body: JSON.stringify({ answers: recordToAnswers(answers) }),
                headers: { "Content-Type": "application/json" },
                method: "POST",
            });
            const session = await parseJsonResponse<QuizAttemptSession>(
                response,
                "Impossible de valider le quiz.",
            );

            applyAttemptSession(session);
            if (session.attempt) {
                setAnswers(answersToRecord(session.attempt.answers));
            }
            setMode("results");
        } catch (error) {
            setAttemptError(error instanceof Error ? error.message : "Impossible de valider le quiz.");
        } finally {
            setSubmittingAttempt(false);
        }
    }

    async function restartAttempt() {
        const nextAttempt = await startAttempt();
        if (!nextAttempt) return;

        setAnswers({});
        setCurrentIndex(0);
        setOpenStepId(null);
        setOpenCompetenceKey(null);
        setMode("quiz");
    }

    function toggleChoice(choiceId: string) {
        if (reviewing || loadingAttempt || submittingAttempt) return;

        const selected = answers[current.question.id] ?? [];
        const nextAnswers = {
            ...answers,
            [current.question.id]:
                current.question.type === "QCU"
                    ? [choiceId]
                    : selected.includes(choiceId)
                      ? selected.filter((id) => id !== choiceId)
                      : [...selected, choiceId],
        };

        setAnswers(nextAnswers);
        queuePersistAnswers(nextAnswers);
    }

    function goNext() {
        if (!reviewing && !currentAnswered) return;

        if (isLastQuestion) {
            if (reviewing) {
                setMode("results");
                return;
            }

            void submitAttempt();
            return;
        }

        setCurrentIndex((index) => index + 1);
    }

    function goPrevious() {
        setCurrentIndex((index) => Math.max(0, index - 1));
    }

    function goToStep(stepIndex: number) {
        const targetIndex = flatQuestions.findIndex((item) => item.stepIndex === stepIndex);
        if (targetIndex >= 0) {
            setCurrentIndex(targetIndex);
        }
    }

    if (mode === "results") {
        if (loadingAttempt) {
            return (
                <ResultStateCard quizId={quiz.id} title="Chargement des résultats">
                    <Text className={cn("mt-2 text-[14px] font-semibold", uiTokens.text.muted)}>
                        Récupération de la dernière tentative terminée...
                    </Text>
                </ResultStateCard>
            );
        }

        if (!completedAttempt) {
            return (
                <ResultStateCard quizId={quiz.id} title="Aucun résultat disponible">
                    <Text className={cn("mt-2 text-[14px] font-semibold", uiTokens.text.muted)}>
                        {"Aucune tentative terminée n'a encore été enregistrée pour ce quiz."}
                    </Text>
                </ResultStateCard>
            );
        }

        const tone = scoreTone(resultScore, threshold);

        return (
            <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
                <Box className="mx-auto max-w-[860px]">
                    <Box className="mb-5 flex items-center gap-3">
                        <ContextualBackLink
                            fallbackHref={completionFallbackHref}
                            aria-label="Retour"
                            className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white",
                                uiTokens.text.heading,
                            )}
                        >
                            <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                        </ContextualBackLink>
                        <Text as="h1" className={cn("text-[26px] font-extrabold", uiTokens.text.heading)}>
                            Résultat du quiz
                        </Text>
                    </Box>

                    <CardSurface className={uiTokens.surface.formCard}>
                        <Box className="flex items-center justify-between gap-3 rounded-[16px] bg-[#F4F3FE] px-5 py-4">
                            <Box className="flex items-center gap-3.5">
                                <Box className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white">
                                    <InlineIcon icon={ClipboardCheck} className={cn("h-6 w-6", uiTokens.text.primary)} />
                                </Box>
                                <Box>
                                    <Text className={cn("text-[12px] font-semibold", uiTokens.text.muted)}>
                                        Score du quiz
                                    </Text>
                                    <Text className={cn("text-[17px] font-extrabold", uiTokens.text.heading)}>
                                        {quiz.title}
                                    </Text>
                                </Box>
                            </Box>
                            <Box className={cn("inline-flex items-center rounded-lg px-3 py-1 text-[18px] font-extrabold", tone.bg, tone.text)}>
                                {resultScore}%
                            </Box>
                        </Box>

                        <Box className="mt-5 space-y-3">
                            {quiz.steps.map((step, stepIndex) => {
                                const accent = stepIconAccents[stepIndex % stepIconAccents.length];
                                const persistedStepScore = persistedStepScoreById.get(step.id);
                                const sectionScore = clientScore.sections.find((section) => section.stepId === step.id);
                                const stepScore = persistedStepScore?.scorePercent ?? sectionScore?.score ?? 0;
                                const stepTone = scoreTone(stepScore, threshold);
                                const open = openStepId === step.id;

                                return (
                                    <Box
                                        key={step.id}
                                        className="overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white"
                                    >
                                        <Button
                                            onClick={() => setOpenStepId(open ? null : step.id)}
                                            className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                                        >
                                            <Box className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", accent.wrap)}>
                                                <InlineIcon icon={accent.icon} className={cn("h-5 w-5", accent.color)} />
                                            </Box>
                                            <Text className="flex-1 text-[15px] font-bold leading-snug">
                                                <span className={uiTokens.text.muted}>Étape {stepIndex + 1} : </span>
                                                <span className={uiTokens.text.heading}>{step.name}</span>
                                            </Text>
                                            <Box className={cn("inline-flex items-center rounded-lg px-2.5 py-0.5 text-[13px] font-extrabold", stepTone.bg, stepTone.text)}>
                                                {stepScore}%
                                            </Box>
                                            <InlineIcon
                                                icon={open ? ChevronUp : ChevronDown}
                                                className={cn("h-4 w-4 shrink-0", uiTokens.text.muted)}
                                            />
                                        </Button>

                                        {open && step.competenceIds.length > 0 && (
                                            <Box className="border-t border-[#EEF0F4] px-4 py-4">
                                                <Text className={cn("text-[11px] font-extrabold uppercase tracking-[0.08em]", uiTokens.text.muted)}>
                                                    Compétences évaluées dans cette étape
                                                </Text>
                                                <Box className="mt-3 space-y-2.5">
                                                    {step.competenceIds.map((competenceId) => {
                                                        const competenceScore = computeCompetenceScore(step, competenceId, answers);
                                                        const competenceTone = scoreTone(competenceScore, threshold);
                                                        const competenceKey = `${step.id}:${competenceId}`;
                                                        const competenceOpen = openCompetenceKey === competenceKey;
                                                        const breakdown = computeCompetenceDimensionBreakdown(
                                                            step,
                                                            competenceId,
                                                            answers,
                                                        );

                                                        return (
                                                            <Box
                                                                key={competenceId}
                                                                className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]"
                                                            >
                                                                <Button
                                                                    onClick={() =>
                                                                        setOpenCompetenceKey(
                                                                            competenceOpen ? null : competenceKey,
                                                                        )
                                                                    }
                                                                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                                                                >
                                                                    <Box className={cn("h-2 w-2 shrink-0 rounded-full", competenceTone.dot)} />
                                                                    <Text className={cn("flex-1 text-[14px] font-bold", uiTokens.text.heading)}>
                                                                        {skillNameById.get(competenceId) ?? competenceId}
                                                                    </Text>
                                                                    <Box className={cn("inline-flex items-center rounded-lg px-2.5 py-0.5 text-[13px] font-extrabold", competenceTone.bg, competenceTone.text)}>
                                                                        {competenceScore}%
                                                                    </Box>
                                                                    <InlineIcon
                                                                        icon={competenceOpen ? ChevronUp : ChevronDown}
                                                                        className={cn("h-4 w-4 shrink-0", uiTokens.text.muted)}
                                                                    />
                                                                </Button>

                                                                {competenceOpen && breakdown.length > 0 && (
                                                                    <Box className="border-t border-[#EAECF0] bg-white px-4 py-3.5">
                                                                        <Box className="grid grid-cols-[110px_64px_72px_1fr] gap-3 border-b border-[#F1F2F5] pb-2 text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#9CA3AF]">
                                                                            <Text>Dimension</Text>
                                                                            <Text>Points</Text>
                                                                            <Text>Score</Text>
                                                                            <Text>Diagnostic IA</Text>
                                                                        </Box>
                                                                        <Box className="divide-y divide-[#F1F2F5]">
                                                                            {breakdown.map((row) => {
                                                                                const rowTone = scoreTone(
                                                                                    row.scorePercent,
                                                                                    threshold,
                                                                                );

                                                                                return (
                                                                                    <Box
                                                                                        key={row.dimension}
                                                                                        className="grid grid-cols-[110px_64px_72px_1fr] items-start gap-3 py-3"
                                                                                    >
                                                                                        <Box className="flex items-center gap-2">
                                                                                            <InlineIcon
                                                                                                icon={dimensionIcons[row.dimension]}
                                                                                                className={cn("h-4 w-4 shrink-0", uiTokens.text.primary)}
                                                                                            />
                                                                                            <Text className={cn("text-[13px] font-semibold", uiTokens.text.subtle)}>
                                                                                                {QUIZ_DIMENSION_LABELS[row.dimension]}
                                                                                            </Text>
                                                                                        </Box>
                                                                                        <Text className={cn("text-[13px] font-semibold", uiTokens.text.subtle)}>
                                                                                            {row.earnedPoints}/{row.maxPoints}
                                                                                        </Text>
                                                                                        <Box>
                                                                                            <Box className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-extrabold", rowTone.bg, rowTone.text)}>
                                                                                                {row.scorePercent}%
                                                                                            </Box>
                                                                                        </Box>
                                                                                        <Text className={cn("text-[13px] font-medium leading-5", uiTokens.text.muted)}>
                                                                                            {getQuizDimensionDiagnostic(row.scorePercent, threshold)}
                                                                                        </Text>
                                                                                    </Box>
                                                                                );
                                                                            })}
                                                                        </Box>
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                        );
                                                    })}
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>

                        {resultPassed ? (
                            <Box className="mt-5 flex items-start gap-2.5 rounded-[14px] border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3.5">
                                <InlineIcon icon={CheckCircle2} className="mt-0.5 h-5 w-5 shrink-0 text-[#16A34A]" />
                                <Text className="text-[13px] font-medium leading-6 text-[#15803D]">
                                    <span className="font-bold">Bravo : </span>
                                    votre score de {resultScore}% atteint le seuil recommandé de {threshold}%. Continuez sur
                                    cette lancée lors de vos prochains entraînements.
                                </Text>
                            </Box>
                        ) : (
                            <Box className="mt-5 flex items-start gap-2.5 rounded-[14px] border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3.5">
                                <InlineIcon icon={Info} className="mt-0.5 h-5 w-5 shrink-0 text-[#D97706]" />
                                <Text className="text-[13px] font-medium leading-6 text-[#92400E]">
                                    <span className="font-bold">Conseil : </span>
                                    Votre score de {resultScore}% est en dessous du seuil recommandé de {threshold}%. Nous
                                    vous recommandons de revoir les étapes en détail avant de retenter le quiz. Cliquez sur
                                    chaque étape pour identifier les compétences à renforcer.
                                </Text>
                            </Box>
                        )}
                    </CardSurface>

                    <Box className="mt-6 flex flex-wrap justify-center gap-3">
                        <Button
                            onClick={() => {
                                setMode("review");
                                setCurrentIndex(0);
                            }}
                            className={cn(uiTokens.action.secondaryButton, "gap-2")}
                        >
                            <InlineIcon icon={Eye} className="h-4 w-4" />
                            Revoir mes réponses
                        </Button>
                        {canStartNewAttempt && (
                            <Button
                                disabled={savingAttempt || submittingAttempt}
                                onClick={() => void restartAttempt()}
                                className={cn(uiTokens.action.secondaryButton, "gap-2 disabled:cursor-not-allowed disabled:opacity-60")}
                            >
                                Nouvelle tentative
                                {attemptsRemaining === null
                                    ? " (tentatives illimitées)"
                                    : attemptsRemaining > 0
                                      ? ` (${attemptsRemaining} restante${attemptsRemaining > 1 ? "s" : ""})`
                                      : ""}
                            </Button>
                        )}
                        <Button
                            onClick={() => window.location.assign(completionHref)}
                            className={cn("flex h-11 items-center justify-center rounded-xl px-5 text-[14px] font-bold text-white transition", uiTokens.action.primaryButton)}
                        >
                            Valider et continuer
                        </Button>
                    </Box>
                    {attemptError && (
                        <Text className={cn("mt-4 text-center text-[13px] font-semibold", uiTokens.text.danger)}>
                            {attemptError}
                        </Text>
                    )}
                </Box>
            </Box>
        );
    }

    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1120px]">
                <Box className="mb-5 flex items-center justify-between">
                    <ContextualBackLink
                        fallbackHref={completionFallbackHref}
                        aria-label="Retour"
                        className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white",
                            uiTokens.text.heading,
                        )}
                    >
                        <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                    </ContextualBackLink>
                    <Box className="flex min-w-0 flex-col items-end gap-1 text-right">
                        <Text className={cn("text-[13px] font-bold", uiTokens.text.muted)}>
                            Question {currentIndex + 1}/{flatQuestions.length}
                        </Text>
                        <Box aria-live="polite" className="min-h-[18px] max-w-[320px]">
                            {attemptStatus && (
                                <Text className={cn("truncate text-[12px] font-semibold", attemptStatus.className)}>
                                    {attemptStatus.label}
                                </Text>
                            )}
                        </Box>
                    </Box>
                </Box>

                <Box className="grid gap-5 lg:grid-cols-[300px_1fr]">
                    <QuizStepNav
                        steps={quiz.steps}
                        answers={answers}
                        currentStepIndex={current.stepIndex}
                        onSelectStep={goToStep}
                    />

                    <CardSurface className={cn(uiTokens.surface.formCard, "min-w-0")}>
                    <Box className="flex flex-wrap items-center gap-2">
                        <Badge>Étape {current.stepIndex + 1}</Badge>
                        <Badge>{current.step.name}</Badge>
                        <Badge>{QUIZ_DIMENSION_LABELS[current.question.dimension]}</Badge>
                        <Badge>{answerModeLabel}</Badge>
                    </Box>

                    <Text as="h1" className={cn("mt-5 text-[24px] font-extrabold leading-8", uiTokens.text.heading)}>
                        {current.question.prompt}
                    </Text>
                    <Text className={cn("mt-2 text-[13px] font-semibold", uiTokens.text.muted)}>
                        Compétence :{" "}
                        {(skillNameById.get(current.question.competenceId) ??
                            current.question.competenceId) ||
                            "Non renseignée"}
                    </Text>

                    <QuestionAttachments attachments={current.question.attachments} quizId={quiz.id} />

                    <Box className="mt-6 space-y-3">
                        {current.question.choices.map((choice) => {
                            const selected = selectedChoiceIds.includes(choice.id);
                            const showCorrection = reviewing;
                            const isRight = choice.isCorrect;
                            const isWrongSelected = showCorrection && selected && !isRight;
                            const isCorrectSelected = showCorrection && selected && isRight;
                            const isCorrectUnselected = showCorrection && !selected && isRight;
                            const reviewLabel = isWrongSelected
                                ? "Votre réponse incorrecte"
                                : isCorrectSelected
                                  ? "Votre réponse correcte"
                                  : isCorrectUnselected
                                    ? "Bonne réponse"
                                    : null;

                            return (
                                <Button
                                    key={choice.id}
                                    disabled={loadingAttempt || submittingAttempt}
                                    onClick={() => toggleChoice(choice.id)}
                                    className={cn(
                                        uiTokens.reviewAnswer.card,
                                        selected && !showCorrection
                                            ? uiTokens.reviewAnswer.selected
                                            : uiTokens.reviewAnswer.idle,
                                        showCorrection && isRight && uiTokens.reviewAnswer.correct,
                                        isWrongSelected && uiTokens.reviewAnswer.incorrect,
                                        (loadingAttempt || submittingAttempt) && "cursor-not-allowed opacity-70",
                                    )}
                                >
                                    <Box
                                        className={cn(
                                            uiTokens.reviewAnswer.indicator,
                                            current.question.type === "QCM" ? "rounded-md" : "rounded-full",
                                            selected || (showCorrection && isRight)
                                                ? isWrongSelected
                                                    ? uiTokens.reviewAnswer.indicatorIncorrect
                                                    : showCorrection
                                                      ? uiTokens.reviewAnswer.indicatorCorrect
                                                      : uiTokens.reviewAnswer.indicatorSelected
                                                : uiTokens.reviewAnswer.indicatorIdle,
                                        )}
                                    >
                                        {(selected || (showCorrection && isRight)) && (
                                            <InlineIcon
                                                icon={isWrongSelected ? X : Check}
                                                className={cn(
                                                    "h-3.5 w-3.5",
                                                    isWrongSelected
                                                        ? uiTokens.text.danger
                                                        : showCorrection
                                                          ? uiTokens.text.success
                                                          : uiTokens.text.primary,
                                                )}
                                            />
                                        )}
                                    </Box>
                                    <Box className="min-w-0 flex-1">
                                        <Text className={cn("text-[15px] font-semibold leading-6", uiTokens.text.heading)}>
                                            {choice.label}
                                        </Text>
                                        {reviewLabel && (
                                            <Text
                                                className={cn(
                                                    "mt-1 text-[12px] font-extrabold uppercase tracking-[0.06em]",
                                                    isWrongSelected ? uiTokens.text.danger : uiTokens.text.success,
                                                )}
                                            >
                                                {reviewLabel}
                                            </Text>
                                        )}
                                    </Box>
                                </Button>
                            );
                        })}
                    </Box>

                    {reviewing && (
                        <Box className={uiTokens.reviewAnswer.explanationCard}>
                            <Text className={uiTokens.reviewAnswer.explanationHeader}>
                                <InlineIcon icon={Info} className={uiTokens.reviewAnswer.explanationIcon} />
                                <span>Explication</span>
                            </Text>
                            <Text className={uiTokens.reviewAnswer.explanationText}>
                                {current.question.explanation ||
                                    "Aucune explication détaillée n'a été renseignée pour cette question."}
                            </Text>
                        </Box>
                    )}

                    <Box className="mt-7 flex items-center justify-between gap-3">
                        <Button
                            disabled={currentIndex === 0}
                            onClick={goPrevious}
                            className={cn(uiTokens.action.secondaryButton, "gap-2 disabled:cursor-not-allowed disabled:opacity-50")}
                        >
                            <InlineIcon icon={ChevronLeft} className="h-4 w-4" />
                            Précédent
                        </Button>
                        <Button
                            disabled={submittingAttempt || (!reviewing && !currentAnswered)}
                            onClick={goNext}
                            className={cn(
                                "flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-[14px] font-bold text-white transition disabled:cursor-not-allowed",
                                submittingAttempt || (!reviewing && !currentAnswered)
                                    ? uiTokens.action.primaryButtonDisabled
                                    : uiTokens.action.primaryButton,
                            )}
                        >
                            {submittingAttempt ? "Validation..." : nextLabel}
                            <InlineIcon icon={ChevronRight} className="h-4 w-4" />
                        </Button>
                    </Box>
                </CardSurface>
                </Box>
            </Box>
        </Box>
    );
}

function QuestionAttachments({
    attachments,
    quizId,
}: {
    attachments: QuizQuestionAttachment[];
    quizId: string;
}) {
    if (attachments.length === 0) return null;

    return (
        <Box className="mt-5 space-y-2">
            <Text className={cn("text-[13px] font-extrabold", uiTokens.text.heading)}>
                {attachments.length === 1 ? "Pièce jointe de la question" : "Pièces jointes de la question"}
            </Text>
            <Box className="space-y-2">
                {attachments.map((attachment) => {
                    const hasLocation =
                        Boolean(attachment.externalUrl) ||
                        Boolean(attachment.storageBucket && attachment.storagePath);
                    const meta = attachment.storagePath
                        ? getStoragePathFileName(attachment.storagePath)
                        : attachment.externalUrl
                          ? "URL"
                          : "";
                    const title = attachment.label || meta || "Document";

                    return (
                        <FilePreviewCard
                            key={attachment.id}
                            href={hasLocation ? EVALUATION_ROUTES.api.attachment(quizId, attachment.id) : undefined}
                            kind={attachment.type as FilePreviewKind}
                            meta={meta}
                            previewName={attachment.storagePath ?? attachment.externalUrl}
                            title={title}
                        />
                    );
                })}
            </Box>
        </Box>
    );
}

function QuizStepNav({
    answers,
    currentStepIndex,
    onSelectStep,
    steps,
}: {
    answers: Record<string, string[]>;
    currentStepIndex: number;
    onSelectStep: (stepIndex: number) => void;
    steps: QuizStep[];
}) {
    return (
        <Box className="space-y-3 self-start">
            {steps.map((step, stepIndex) => {
                const total = step.questions.length;
                const answered = step.questions.filter(
                    (question) => (answers[question.id] ?? []).length > 0,
                ).length;
                const percent = total > 0 ? Math.round((answered / total) * 100) : 0;
                const active = stepIndex === currentStepIndex;

                return (
                    <Button
                        key={step.id}
                        onClick={() => onSelectStep(stepIndex)}
                        disabled={total === 0}
                        className={cn(
                            active ? uiTokens.surface.rowCardActive : uiTokens.surface.rowCard,
                            "flex w-full items-start gap-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                        )}
                    >
                        <Box className={active ? uiTokens.badge.stepNumber : uiTokens.badge.stepNumberMuted}>
                            {stepIndex + 1}
                        </Box>
                        <Box className="min-w-0 flex-1">
                            <Text
                                className={cn(
                                    "text-[13px] font-bold leading-snug",
                                    active ? uiTokens.text.heading : uiTokens.text.subtle,
                                )}
                            >
                                {step.name || `Étape ${stepIndex + 1}`}
                            </Text>
                            <Text className={cn("mt-1 text-[12px] font-semibold", uiTokens.text.muted)}>
                                {answered}/{total} question{total > 1 ? "s" : ""}
                            </Text>
                            <Box className={cn("mt-2", uiTokens.progress.track)}>
                                <Box className={uiTokens.progress.fill} style={{ width: `${percent}%` }} />
                            </Box>
                        </Box>
                    </Button>
                );
            })}
        </Box>
    );
}

function ResultStateCard({
    children,
    quizId,
    title,
}: {
    children: ReactNode;
    quizId: string;
    title: string;
}) {
    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[820px]">
                <Box className="mb-5 flex items-center gap-3">
                    <ContextualBackLink
                        fallbackHref={EVALUATION_ROUTES.app.detail(quizId)}
                        aria-label="Retour"
                        className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white",
                            uiTokens.text.heading,
                        )}
                    >
                        <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                    </ContextualBackLink>
                    <Text as="h1" className={cn("text-[26px] font-extrabold", uiTokens.text.heading)}>
                        Résultat du quiz
                    </Text>
                </Box>
                <CardSurface className={uiTokens.surface.formCard}>
                    <Text as="h2" className={cn("text-[22px] font-extrabold", uiTokens.text.heading)}>
                        {title}
                    </Text>
                    {children}
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
