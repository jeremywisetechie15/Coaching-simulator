import { CalendarDays, ChevronRight, Clock, FileText } from "lucide-react";
import { ContextualLink } from "@/features/app-shell/components";
import { ContentStatusBadge } from "@/features/content/components";
import {
    CONTENT_STATUS,
    getContentScoreStatus,
} from "@/features/content/domain";
import { EVALUATION_ROUTES } from "@/features/evaluations/domain";
import type { QuizAttemptHistoryItem } from "@/features/evaluations/server";
import { Box, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { formatLongDateTime } from "@/lib/date/format-date-time";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import { QuizMetadataBadge } from "./QuizMetadataBadge";

function formatDuration(seconds: number | null) {
    if (seconds === null) return null;

    const safeSeconds = Math.max(0, Math.round(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;

    return minutes > 0
        ? `${minutes} min ${remainingSeconds.toString().padStart(2, "0")} s`
        : `${remainingSeconds} s`;
}

function ScoreRing({
    score,
    validationThreshold,
}: {
    score: number;
    validationThreshold: number;
}) {
    const radius = 25;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - score / 100);
    const tone = uiTokens.tone[
        getContentScoreStatus(score, validationThreshold)
    ].text;

    return (
        <Box className={cn(uiTokens.quizHistory.scoreRing, tone)}>
            <svg className="h-full w-full -rotate-90" viewBox="0 0 66 66" aria-hidden="true">
                <circle
                    className={uiTokens.quizHistory.scoreTrack}
                    cx="33"
                    cy="33"
                    fill="none"
                    r={radius}
                    strokeWidth="6"
                />
                <circle
                    className="stroke-current"
                    cx="33"
                    cy="33"
                    fill="none"
                    r={radius}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    strokeWidth="6"
                />
            </svg>
            <Text className={uiTokens.quizHistory.scoreValue}>{score}%</Text>
        </Box>
    );
}

interface QuizAttemptHistoryCardProps {
    item: QuizAttemptHistoryItem;
}

export function QuizAttemptHistoryCard({ item }: QuizAttemptHistoryCardProps) {
    const { attempt, occurredAt, quiz } = item;
    const duration = formatDuration(attempt.activeDurationSeconds);
    const category = quiz.categories[0] ?? quiz.domain;
    const isArchived = quiz.status === CONTENT_STATUS.archived;

    return (
        <CardSurface className={uiTokens.quizHistory.card}>
            <Box className={uiTokens.quizHistory.content}>
                <Box className={uiTokens.quizHistory.icon}>
                    <InlineIcon icon={FileText} className={uiTokens.quizHistory.iconGlyph} />
                </Box>
                <Box className="min-w-0">
                    <Text as="h2" className={uiTokens.quizHistory.title} title={quiz.title}>
                        {quiz.title}
                    </Text>
                    <Box className={uiTokens.quizHistory.meta}>
                        <Box className="flex items-center gap-1.5">
                            <InlineIcon icon={CalendarDays} className={uiTokens.quizHistory.metaIcon} />
                            {formatLongDateTime(occurredAt, "Date indisponible")}
                        </Box>
                        {duration && (
                            <Box className="flex items-center gap-1.5">
                                <InlineIcon icon={Clock} className={uiTokens.quizHistory.metaIcon} />
                                {duration}
                            </Box>
                        )}
                    </Box>
                    <Box className={uiTokens.quizHistory.badgeRow}>
                        {category && (
                            <QuizMetadataBadge className={uiTokens.quizHistory.badge} tone="category">
                                {category}
                            </QuizMetadataBadge>
                        )}
                        <QuizMetadataBadge className={uiTokens.quizHistory.badge} tone="type">
                            {quiz.typeLabel}
                        </QuizMetadataBadge>
                        {quiz.difficulty && (
                            <QuizMetadataBadge className={uiTokens.quizHistory.badge} tone="difficulty">
                                {quiz.difficulty}
                            </QuizMetadataBadge>
                        )}
                        <Text as="span" className={uiTokens.quizHistory.attemptBadge}>
                            Tentative {attempt.number}
                        </Text>
                        {isArchived && <ContentStatusBadge status={quiz.status} />}
                    </Box>
                </Box>
            </Box>

            <Box className={uiTokens.quizHistory.result}>
                <ScoreRing
                    score={attempt.score}
                    validationThreshold={quiz.validationThreshold}
                />
                {isArchived ? (
                    <Text className={uiTokens.quizHistory.archivedResult}>
                        Résultat conservé
                    </Text>
                ) : (
                    <ContextualLink
                        href={EVALUATION_ROUTES.app.attemptResults(quiz.id, attempt.id)}
                        className={uiTokens.quizHistory.action}
                    >
                        Voir les résultats
                        <InlineIcon
                            icon={ChevronRight}
                            className={uiTokens.quizHistory.actionIcon}
                        />
                    </ContextualLink>
                )}
            </Box>
        </CardSurface>
    );
}
