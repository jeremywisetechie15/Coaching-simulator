"use client";

import {
    Award,
    CalendarDays,
    Clock,
    Hash,
    Info,
    UsersRound,
} from "lucide-react";
import { DiscProfileBadge } from "@/features/content/components";
import {
    categoryBadgeStyles,
    defaultCategoryBadgeStyle,
    difficultyBadgeStyles,
    type RoleplayItem,
} from "@/features/roleplays/data/roleplays";
import type { RoleplaySession } from "@/features/roleplays/data/sessions";
import { getRoleplayDisplayTitle, scoreLevel } from "@/features/roleplays/domain";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface EvaluationSessionOverviewProps {
    context: string;
    onOpenScoreDetails: () => void;
    roleplay: RoleplayItem;
    session: RoleplaySession;
}

const t = uiTokens.roleplayEvaluation.sessionOverview;

export function EvaluationSessionOverview({
    context,
    onOpenScoreDetails,
    roleplay,
    session,
}: EvaluationSessionOverviewProps) {
    const categoryStyle = categoryBadgeStyles[roleplay.category] ?? defaultCategoryBadgeStyle;
    const difficultyStyle = difficultyBadgeStyles[roleplay.difficulty];
    const roleplayTitle = getRoleplayDisplayTitle(roleplay);
    const scoreTone = t.scoreTone[scoreLevel(session.score)];

    return (
        <>
            <Box className={t.statusRow}>
                <Box className={t.statusDot} />
                <Text className={t.statusLabel}>Données synchronisées</Text>
            </Box>

            <Box className={t.grid}>
                <CardSurface className={t.metadataCard}>
                    <Box className={t.metadataList}>
                        <Box className={t.metadataItem}>
                            <InlineIcon icon={Hash} className={t.metadataIcon} />
                            Session n°{session.attemptNumber}
                        </Box>
                        <Box className={t.metadataItem}>
                            <InlineIcon icon={CalendarDays} className={t.metadataIcon} />
                            Réalisé le {session.date} à {session.time}
                        </Box>
                        <Box className={t.metadataItem}>
                            <InlineIcon icon={Clock} className={t.metadataIcon} />
                            Durée session: {session.duration}
                        </Box>
                    </Box>
                    <Box
                        className={t.categoryBadge}
                        style={{ backgroundColor: categoryStyle.bg, color: categoryStyle.text }}
                    >
                        {roleplay.category}
                    </Box>
                </CardSurface>

                <CardSurface className={cn(t.scoreCard, scoreTone)}>
                    <Box className={t.scoreIdentity}>
                        <InlineIcon icon={Award} className={t.scoreIcon} />
                        <Text as="h3" className={t.scoreTitle}>
                            Score
                        </Text>
                        <Button
                            aria-label="Détail du score global"
                            onClick={onOpenScoreDetails}
                            className={t.scoreDetailButton}
                        >
                            <InlineIcon icon={Info} className={t.scoreDetailIcon} />
                        </Button>
                    </Box>
                    <Text className={t.scoreValue}>{session.score}%</Text>
                </CardSurface>

                <CardSurface className={t.detailCard}>
                    <Box className={t.detailHeader}>
                        <Box className={cn(t.detailIcon, t.situationIcon)}>
                            <InlineIcon icon={Info} className={t.detailIconGlyph} />
                        </Box>
                        <Text as="h3" className={t.detailTitle}>
                            {roleplayTitle}
                        </Text>
                    </Box>
                    <Box className={t.situationContent}>
                        <Box className={t.situationRow}>
                            <Text className={t.situationLabel}>Contexte</Text>
                            <Text className={t.situationText}>{context}</Text>
                        </Box>
                        <Box className={t.situationRow}>
                            <Text className={t.situationLabel}>Objectif</Text>
                            <Text className={t.situationText}>{roleplay.description}</Text>
                        </Box>
                    </Box>
                </CardSurface>

                <CardSurface className={cn(t.detailCard, t.personaCard)}>
                    <Box className={t.detailHeader}>
                        <Box className={cn(t.detailIcon, t.personaIcon)}>
                            <InlineIcon icon={UsersRound} className={t.detailIconGlyph} />
                        </Box>
                        <Text as="h3" className={t.detailTitle}>
                            Persona
                        </Text>
                    </Box>
                    <Box className={t.personaAvatar}>
                        <Box
                            aria-label={roleplay.name}
                            role="img"
                            className={t.personaAvatarImage}
                            style={{ backgroundImage: `url(${roleplay.avatarSrc})` }}
                        />
                    </Box>
                    <Box className={t.personaNameRow}>
                        <Text className={t.personaName}>{roleplay.name}</Text>
                        <Box className={t.aiBadge}>AI</Box>
                    </Box>
                    <Text className={t.personaMeta}>
                        {roleplay.role}
                        <br />@ {roleplay.company}
                    </Text>
                    <Box className={t.personaBadges}>
                        <DiscProfileBadge
                            profile={roleplay.disc}
                            className={t.discBadge}
                        />
                        <Box
                            className={t.difficultyBadge}
                            style={{
                                backgroundColor: difficultyStyle.bg,
                                borderColor: difficultyStyle.border,
                                color: difficultyStyle.text,
                            }}
                        >
                            {roleplay.difficulty}
                        </Box>
                    </Box>
                </CardSurface>
            </Box>
        </>
    );
}
