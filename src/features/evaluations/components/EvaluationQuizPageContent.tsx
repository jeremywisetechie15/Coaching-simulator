"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Eye,
    FileText,
    Info,
    X,
} from "lucide-react";
import {
    EVALUATION_ROUTES,
    QUIZ_DIMENSION_LABELS,
    scoreQuizAnswers,
    type QuizDetail,
    type QuizQuestion,
    type QuizQuestionAttachment,
    type QuizStep,
} from "@/features/evaluations/domain";
import type { SkillOption } from "@/features/skills/domain/skills";
import { getStoragePathFileName } from "@/lib/uploads/content-upload";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { FilePreviewCard, type FilePreviewKind } from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface EvaluationQuizPageContentProps {
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

export function EvaluationQuizPageContent({ quiz, skillOptions }: EvaluationQuizPageContentProps) {
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

    const [answers, setAnswers] = useState<Record<string, string[]>>({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [mode, setMode] = useState<QuizMode>("quiz");
    const [openStepId, setOpenStepId] = useState<string | null>(null);

    const score = useMemo(() => scoreQuizAnswers(quiz, answers), [answers, quiz]);
    const threshold = quiz.validationThreshold ?? 70;
    const current = flatQuestions[currentIndex];
    const reviewing = mode === "review";

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
                        <Link
                            href={`/evaluations/${quiz.id}`}
                            className={cn(uiTokens.action.secondaryButton, "mt-5 w-fit")}
                        >
                            Retour au détail
                        </Link>
                    </CardSurface>
                </Box>
            </Box>
        );
    }

    const selectedChoiceIds = answers[current.question.id] ?? [];
    const currentAnswered = selectedChoiceIds.length > 0;
    const isLastQuestion = currentIndex === flatQuestions.length - 1;
    const nextLabel = isLastQuestion ? "Valider le quiz" : "Question suivante";

    function toggleChoice(choiceId: string) {
        if (reviewing) return;

        setAnswers((currentAnswers) => {
            const selected = currentAnswers[current.question.id] ?? [];

            if (current.question.type === "QCU") {
                return {
                    ...currentAnswers,
                    [current.question.id]: [choiceId],
                };
            }

            return {
                ...currentAnswers,
                [current.question.id]: selected.includes(choiceId)
                    ? selected.filter((id) => id !== choiceId)
                    : [...selected, choiceId],
            };
        });
    }

    function goNext() {
        if (!reviewing && !currentAnswered) return;

        if (isLastQuestion) {
            setMode("results");
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
        const tone = scoreTone(score.score, threshold);

        return (
            <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
                <Box className="mx-auto max-w-[860px]">
                    <Text as="h1" className={cn("mb-5 text-[26px] font-extrabold", uiTokens.text.heading)}>
                        Résultat du quiz
                    </Text>

                    <CardSurface className={uiTokens.surface.formCard}>
                        <Box className={cn("flex items-center justify-between rounded-[14px] px-5 py-4", tone.soft)}>
                            <Box className="flex items-center gap-3">
                                <InlineIcon icon={CheckCircle2} className={cn("h-6 w-6", tone.text)} />
                                <Box>
                                    <Text className={cn("text-[12px] font-semibold", uiTokens.text.muted)}>
                                        Score du quiz
                                    </Text>
                                    <Text className={cn("text-[16px] font-extrabold", uiTokens.text.heading)}>
                                        {quiz.title}
                                    </Text>
                                </Box>
                            </Box>
                            <Box className={cn("inline-flex items-center rounded-lg px-3 py-1 text-[18px] font-extrabold", tone.bg, tone.text)}>
                                {score.score}%
                            </Box>
                        </Box>

                        <Box className="mt-4 flex items-start gap-2.5 rounded-[14px] border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3.5">
                            <InlineIcon icon={Info} className="mt-0.5 h-5 w-5 shrink-0 text-[#D97706]" />
                            <Text className="text-[13px] font-medium leading-6 text-[#92400E]">
                                {score.passed
                                    ? `Le seuil recommandé de ${threshold}% est atteint.`
                                    : `Le score est sous le seuil recommandé de ${threshold}%. Revoir les étapes aide à cibler les compétences à renforcer.`}
                            </Text>
                        </Box>

                        <Box className="mt-5 space-y-3">
                            {quiz.steps.map((step) => {
                                const sectionScore = score.sections.find((section) => section.stepId === step.id);
                                const stepScore = sectionScore?.score ?? 0;
                                const stepTone = scoreTone(stepScore, threshold);
                                const open = openStepId === step.id;

                                return (
                                    <Box
                                        key={step.id}
                                        className="overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white"
                                    >
                                        <Button
                                            onClick={() => setOpenStepId(open ? null : step.id)}
                                            className="flex w-full items-center gap-3 px-5 py-4 text-left"
                                        >
                                            <InlineIcon icon={FileText} className={cn("h-5 w-5", uiTokens.text.primary)} />
                                            <Text className={cn("flex-1 text-[15px] font-bold", uiTokens.text.heading)}>
                                                {step.name}
                                            </Text>
                                            <Box className={cn("inline-flex items-center rounded-lg px-2.5 py-0.5 text-[13px] font-extrabold", stepTone.bg, stepTone.text)}>
                                                {stepScore}%
                                            </Box>
                                        </Button>

                                        {open && step.competenceIds.length > 0 && (
                                            <Box className="border-t border-[#EEF0F4] px-5 py-4">
                                                <Text className={cn("text-[11px] font-extrabold uppercase tracking-[0.08em]", uiTokens.text.muted)}>
                                                    Compétences évaluées
                                                </Text>
                                                <Box className="mt-3 flex flex-col gap-2.5">
                                                    {step.competenceIds.map((competenceId) => {
                                                        const competenceScore = computeCompetenceScore(step, competenceId, answers);
                                                        const competenceTone = scoreTone(competenceScore, threshold);

                                                        return (
                                                            <Box
                                                                key={competenceId}
                                                                className="flex items-center justify-between gap-4"
                                                            >
                                                                <Box className="flex items-center gap-2.5">
                                                                    <Box className={cn("h-2 w-2 rounded-full", competenceTone.dot)} />
                                                                    <Text className={cn("text-[14px] font-semibold", uiTokens.text.subtle)}>
                                                                        {skillNameById.get(competenceId) ?? competenceId}
                                                                    </Text>
                                                                </Box>
                                                                <Box className={cn("inline-flex items-center rounded-lg px-2.5 py-0.5 text-[13px] font-extrabold", competenceTone.bg, competenceTone.text)}>
                                                                    {competenceScore}%
                                                                </Box>
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
                        <Link
                            href={`/evaluations/${quiz.id}`}
                            className={cn("flex h-11 items-center justify-center rounded-xl px-5 text-[14px] font-bold text-white transition", uiTokens.action.primaryButton)}
                        >
                            Valider et continuer
                        </Link>
                    </Box>
                </Box>
            </Box>
        );
    }

    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1120px]">
                <Box className="mb-5 flex items-center justify-between">
                    <Link
                        href={`/evaluations/${quiz.id}`}
                        aria-label="Retour"
                        className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white",
                            uiTokens.text.heading,
                        )}
                    >
                        <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                    </Link>
                    <Text className={cn("text-[13px] font-bold", uiTokens.text.muted)}>
                        Question {currentIndex + 1}/{flatQuestions.length}
                    </Text>
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

                            return (
                                <Button
                                    key={choice.id}
                                    onClick={() => toggleChoice(choice.id)}
                                    className={cn(
                                        "flex w-full items-start gap-3 rounded-[14px] border px-4 py-3.5 text-left transition",
                                        selected && !showCorrection
                                            ? "border-[#5140F0] bg-[#F4F3FE]"
                                            : "border-[#E5E7EB] bg-white hover:border-[#D5D7DE]",
                                        showCorrection && isRight && "border-[#86EFAC] bg-[#F0FDF4]",
                                        isWrongSelected && "border-[#FCA5A5] bg-[#FEF2F2]",
                                    )}
                                >
                                    <Box
                                        className={cn(
                                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                                            selected || (showCorrection && isRight)
                                                ? "border-[#5140F0]"
                                                : "border-[#9CA3AF]",
                                        )}
                                    >
                                        {(selected || (showCorrection && isRight)) && (
                                            <InlineIcon
                                                icon={isWrongSelected ? X : Check}
                                                className={cn(
                                                    "h-3.5 w-3.5",
                                                    isWrongSelected ? uiTokens.text.danger : uiTokens.text.primary,
                                                )}
                                            />
                                        )}
                                    </Box>
                                    <Text className={cn("flex-1 text-[15px] font-semibold leading-6", uiTokens.text.heading)}>
                                        {choice.label}
                                    </Text>
                                </Button>
                            );
                        })}
                    </Box>

                    {reviewing && current.question.explanation && (
                        <Box className="mt-5 rounded-[14px] border border-[#E5E7EB] bg-[#F7F8FB] p-4">
                            <Text className={cn("text-[13px] font-extrabold", uiTokens.text.heading)}>
                                Explication
                            </Text>
                            <Text className={cn("mt-1 text-[14px] font-medium leading-6", uiTokens.text.muted)}>
                                {current.question.explanation}
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
                            disabled={!reviewing && !currentAnswered}
                            onClick={goNext}
                            className={cn(
                                "flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-[14px] font-bold text-white transition disabled:cursor-not-allowed",
                                !reviewing && !currentAnswered
                                    ? uiTokens.action.primaryButtonDisabled
                                    : uiTokens.action.primaryButton,
                            )}
                        >
                            {nextLabel}
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
                {attachments.length === 1 ? "Document de la question" : "Documents de la question"}
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

function Badge({ children }: { children: ReactNode }) {
    return (
        <Box className="inline-flex h-7 items-center rounded-md border border-[#E5E7EB] bg-[#F3F4F6] px-2.5 text-[12px] font-semibold text-[#4B5563]">
            {children}
        </Box>
    );
}
