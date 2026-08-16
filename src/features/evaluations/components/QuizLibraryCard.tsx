import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpen, Clock, Eye, FileText, History, Info, Play, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
    ContentStatusBadge,
    LearnerContentStatusBadge,
} from "@/features/content/components";
import { isSelectableContent } from "@/features/content/domain";
import { getQuizTypeLabel, type QuizListItem } from "@/features/evaluations/domain";
import { Box, CardSurface, InlineIcon, Text, Tooltip } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import { QuizMetadataBadge } from "./QuizMetadataBadge";

interface QuizLibraryCardProps {
    actions?: ReactNode;
    detailHref: string;
    quiz: QuizListItem;
    showPublicationStatus?: boolean;
}

export function QuizLibraryCard({
    actions,
    detailHref,
    quiz,
    showPublicationStatus = false,
}: QuizLibraryCardProps) {
    const category = (quiz.categories[0] ?? quiz.domain) || "Non affecté";
    const bestScore = quiz.learnerStats.bestScore;
    const canStart = isSelectableContent(quiz.status, quiz.isActive);
    const hasCompletedAttempt = quiz.learnerStats.attemptCount > 0;
    const actionLabel = !canStart
        ? "Voir le quiz"
        : hasCompletedAttempt
          ? "Retenter le quiz"
          : "Commencer le quiz";
    const ActionIcon = !canStart ? Eye : hasCompletedAttempt ? RefreshCw : Play;

    return (
        <CardSurface className={uiTokens.quizLibraryCard.root}>
            <Box className={uiTokens.quizLibraryCard.header}>
                <Box className={uiTokens.quizLibraryCard.categoryPosition}>
                    <Text as="span" className={uiTokens.quizLibraryCard.category} title={category}>
                        {category}
                    </Text>
                </Box>
                <Box className={uiTokens.quizLibraryCard.menuPosition}>
                    <Tooltip
                        content={`${quiz.learnerStats.attemptCount} tentative${quiz.learnerStats.attemptCount === 1 ? "" : "s"} réalisée${quiz.learnerStats.attemptCount === 1 ? "" : "s"}`}
                    >
                        <Box
                            aria-label={`Nombre de tentatives : ${quiz.learnerStats.attemptCount}`}
                            className={uiTokens.quizLibraryCard.attemptBadge}
                            tabIndex={0}
                        >
                            <InlineIcon icon={History} className="h-3.5 w-3.5 shrink-0" />
                            <Text as="span">{quiz.learnerStats.attemptCount}</Text>
                        </Box>
                    </Tooltip>
                    {actions}
                </Box>
            </Box>

            <Box className={uiTokens.quizLibraryCard.body}>
                <Box className={uiTokens.quizLibraryCard.badgeRow}>
                    {showPublicationStatus ? (
                        <ContentStatusBadge
                            className={uiTokens.quizLibraryCard.badge}
                            status={quiz.status}
                        />
                    ) : (
                        <LearnerContentStatusBadge
                            className={uiTokens.quizLibraryCard.badge}
                            status={quiz.learnerStatus}
                        />
                    )}
                    <QuizMetadataBadge
                        className={uiTokens.quizLibraryCard.badge}
                        tone="type"
                    >
                        {getQuizTypeLabel(quiz.type)}
                    </QuizMetadataBadge>
                    {quiz.difficulty && (
                        <QuizMetadataBadge
                            className={uiTokens.quizLibraryCard.badge}
                            tone="difficulty"
                        >
                            {quiz.difficulty}
                        </QuizMetadataBadge>
                    )}
                </Box>

                <Text as="h3" className={uiTokens.quizLibraryCard.title}>
                    {quiz.title}
                </Text>
                <Text className={uiTokens.quizLibraryCard.description}>
                    {quiz.description || "Aucune description renseignée."}
                </Text>

                <Box className={uiTokens.quizLibraryCard.metadata}>
                    <MetadataLine
                        accent
                        icon={BookOpen}
                        label={quiz.methodName ?? "Aucune"}
                    />
                    <MetadataLine
                        icon={FileText}
                        label={`${quiz.questionCount} question${quiz.questionCount > 1 ? "s" : ""}`}
                    />
                    <MetadataLine
                        icon={Clock}
                        label={`${quiz.durationMinutes} min`}
                    />
                </Box>

                <Box className={uiTokens.quizLibraryCard.stats}>
                    <QuizStat
                        label="Tentatives"
                        tooltip="Nombre de tentatives terminées"
                        value={String(quiz.learnerStats.attemptCount)}
                    />
                    <QuizStat
                        label="Meilleur"
                        tooltip="Meilleur score obtenu"
                        value={bestScore === null ? "—" : `${Math.round(bestScore)}%`}
                    />
                </Box>

                <Link
                    href={detailHref}
                    className={uiTokens.quizLibraryCard.action}
                    aria-label={`${actionLabel} ${quiz.title}`}
                >
                    <InlineIcon
                        icon={ActionIcon}
                        className={uiTokens.quizLibraryCard.actionIcon}
                        strokeWidth={1.6}
                    />
                    {actionLabel}
                </Link>
            </Box>
        </CardSurface>
    );
}

function MetadataLine({
    accent = false,
    icon,
    label,
}: {
    accent?: boolean;
    icon: LucideIcon;
    label: string;
}) {
    return (
        <Box
            className={cn(
                uiTokens.quizLibraryCard.metadataRow,
                accent && uiTokens.quizLibraryCard.metadataMethod,
            )}
        >
            <InlineIcon icon={icon} className={uiTokens.quizLibraryCard.metadataIcon} />
            <Text as="span">{label}</Text>
        </Box>
    );
}

function QuizStat({
    label,
    tooltip,
    value,
}: {
    label: string;
    tooltip: string;
    value: string;
}) {
    return (
        <Box className={uiTokens.quizLibraryCard.stat}>
            <Box className={uiTokens.quizLibraryCard.statLabelRow}>
                <Text as="span" className={uiTokens.quizLibraryCard.statLabel}>
                    {label}
                </Text>
                <Tooltip content={tooltip}>
                    <Box
                        aria-label={tooltip}
                        className={uiTokens.quizLibraryCard.statInfo}
                        tabIndex={0}
                    >
                        <InlineIcon
                            icon={Info}
                            className={uiTokens.quizLibraryCard.statInfoIcon}
                        />
                    </Box>
                </Tooltip>
            </Box>
            <Text className={uiTokens.quizLibraryCard.statValue}>{value}</Text>
        </Box>
    );
}
