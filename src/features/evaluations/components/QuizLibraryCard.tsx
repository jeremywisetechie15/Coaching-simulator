import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpen, Clock, FileText, Info, Play } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LearnerContentStatusBadge } from "@/features/content/components";
import { getQuizTypeLabel, type QuizListItem } from "@/features/evaluations/domain";
import { Box, CardSurface, InlineIcon, Text, Tooltip } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import { QuizMetadataBadge } from "./QuizMetadataBadge";

interface QuizLibraryCardProps {
    actions?: ReactNode;
    detailHref: string;
    quiz: QuizListItem;
}

export function QuizLibraryCard({
    actions,
    detailHref,
    quiz,
}: QuizLibraryCardProps) {
    const category = (quiz.categories[0] ?? quiz.domain) || "Non affecté";
    const bestScore = quiz.learnerStats.bestScore;

    return (
        <CardSurface className={uiTokens.quizLibraryCard.root}>
            <Box className={uiTokens.quizLibraryCard.header}>
                <Box className={uiTokens.quizLibraryCard.categoryPosition}>
                    <Text as="span" className={uiTokens.quizLibraryCard.category} title={category}>
                        {category}
                    </Text>
                </Box>
                {actions && (
                    <Box className={uiTokens.quizLibraryCard.menuPosition}>
                        {actions}
                    </Box>
                )}
            </Box>

            <Box className={uiTokens.quizLibraryCard.body}>
                <Box className={uiTokens.quizLibraryCard.badgeRow}>
                    <LearnerContentStatusBadge
                        className={uiTokens.quizLibraryCard.badge}
                        status={quiz.learnerStatus}
                    />
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
                    aria-label={`Commencer le quiz ${quiz.title}`}
                >
                    <InlineIcon icon={Play} className={uiTokens.quizLibraryCard.actionIcon} />
                    Commencer le quiz
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
