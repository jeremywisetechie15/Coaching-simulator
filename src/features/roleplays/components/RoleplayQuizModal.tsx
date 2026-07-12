"use client";

import { ArrowRight, Check } from "lucide-react";
import { ContextualLink } from "@/features/app-shell/components";
import { QUIZ_PARTICIPATION, QUIZ_PARTICIPATION_LABELS, type QuizParticipation } from "@/features/evaluations/domain";
import type { PrepQuiz, PrepQuizStatus } from "@/features/roleplays/data/preparation";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { Modal } from "@/lib/ui/organisms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

type ToneKey = keyof typeof uiTokens.tone;

const statusConfig: Record<PrepQuizStatus, { actionLabel: string; primary: boolean; tone: ToneKey }> = {
    completed: { actionLabel: "Refaire", primary: false, tone: "success" },
    in_progress: { actionLabel: "Reprendre", primary: true, tone: "warning" },
    not_started: { actionLabel: "Commencer", primary: true, tone: "neutral" },
};

function statusLabel(quiz: PrepQuiz) {
    if (quiz.status === "completed") return `Terminé (${quiz.scorePercent ?? 0}%)`;
    if (quiz.status === "in_progress") return `En cours (${quiz.scorePercent ?? 0}%)`;
    return "Non commencé";
}

function participationTone(participation: QuizParticipation) {
    return participation === QUIZ_PARTICIPATION.mandatory ? uiTokens.tone.primary.soft : uiTokens.tone.neutral.soft;
}

interface RoleplayQuizModalProps {
    onClose: () => void;
    quizzes: PrepQuiz[];
    returnHref: string;
}

export function RoleplayQuizModal({ onClose, quizzes, returnHref }: RoleplayQuizModalProps) {
    return (
        <Modal title="Choisissez un quiz" onClose={onClose} className="max-w-[560px]">
            <Box className="max-h-[min(58vh,520px)] space-y-3 overflow-y-auto pr-1">
                {quizzes.length === 0 && (
                    <Box className={cn(uiTokens.surface.rowCard, "px-4 py-5 text-center")}>
                        <Text className={cn("text-[14px] font-semibold", uiTokens.text.muted)}>
                            Aucun quiz de préparation n&apos;est associé à ce scénario.
                        </Text>
                    </Box>
                )}
                {quizzes.map((quiz) => {
                    const config = statusConfig[quiz.status];
                    const actionClassName = cn(
                        "flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-4 text-[13px] font-bold transition",
                        config.primary
                            ? cn("text-white", uiTokens.action.primaryButton)
                            : uiTokens.action.addButton,
                    );

                    return (
                        <Box
                            key={quiz.id}
                            className={cn(
                                quiz.recommended ? uiTokens.surface.rowCardActive : uiTokens.surface.rowCard,
                                "flex items-start justify-between gap-4",
                            )}
                        >
                            <Box className="min-w-0">
                                <Box className="flex flex-wrap items-center gap-2">
                                    <Text className={cn("text-[15px] font-bold", uiTokens.text.heading)}>
                                        {quiz.title}
                                    </Text>
                                    {quiz.recommended && (
                                        <Box
                                            className={cn(
                                                "inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-bold",
                                                uiTokens.tone.primary.soft,
                                            )}
                                        >
                                            Recommandé
                                        </Box>
                                    )}
                                    {quiz.participation && (
                                        <Box
                                            className={cn(
                                                "inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-bold",
                                                participationTone(quiz.participation),
                                            )}
                                        >
                                            {QUIZ_PARTICIPATION_LABELS[quiz.participation]}
                                        </Box>
                                    )}
                                </Box>
                                <Text className={cn("mt-1 text-[13px] font-medium", uiTokens.text.muted)}>
                                    Type : {quiz.type}
                                </Text>
                                <Text className={cn("text-[13px] font-medium", uiTokens.text.muted)}>
                                    {quiz.questionCount} questions • ~{quiz.durationMinutes} min
                                </Text>
                                <Box
                                    className={cn(
                                        "mt-1.5 flex items-center gap-1.5 text-[13px] font-semibold",
                                        uiTokens.tone[config.tone].text,
                                    )}
                                >
                                    {quiz.status === "completed" && <InlineIcon icon={Check} className="h-4 w-4" />}
                                    {statusLabel(quiz)}
                                </Box>
                            </Box>

                            {quiz.url ? (
                                <ContextualLink href={quiz.url} returnHref={returnHref} className={actionClassName}>
                                    {config.actionLabel}
                                    <InlineIcon icon={ArrowRight} className="h-4 w-4" />
                                </ContextualLink>
                            ) : (
                                <Button disabled className={cn(actionClassName, "cursor-not-allowed opacity-60")}>
                                    {config.actionLabel}
                                    <InlineIcon icon={ArrowRight} className="h-4 w-4" />
                                </Button>
                            )}
                        </Box>
                    );
                })}
            </Box>
        </Modal>
    );
}
