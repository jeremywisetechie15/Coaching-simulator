"use client";

import { CheckCircle2, ChevronDown, Clock3, Zap } from "lucide-react";
import { useState } from "react";
import type { EvaluationKeyMoment } from "@/features/roleplays/data/evaluation";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

const t = uiTokens.evaluationKeyMoments;

function KeyMomentAccordion({ moment }: { moment: EvaluationKeyMoment }) {
    const [open, setOpen] = useState(false);
    const impactTone = t.impactTone[moment.impactType];

    return (
        <Box className={t.card}>
            <Button
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                className={t.header}
            >
                <Box className={t.headerIdentity}>
                    <Text as="span" className={t.number}>
                        Moment clé n°{moment.number}
                    </Text>
                    <Text as="span" className={t.title}>
                        {moment.title}
                    </Text>
                </Box>
                <Box className={t.headerMeta}>
                    <Text as="span" className={cn(t.impact, impactTone)}>
                        {moment.impact}
                    </Text>
                    <Text as="span" className={t.time}>
                        <InlineIcon icon={Clock3} className="h-3.5 w-3.5" />
                        {moment.time}
                    </Text>
                    <InlineIcon icon={ChevronDown} className={cn(t.chevron, open && "rotate-180")} />
                </Box>
            </Button>

            <Text className={t.step}>{moment.stepLabel}</Text>

            {open && (
                <Box className={t.detail}>
                    <Box>
                        <Text className={t.detailLabel}>Extrait du transcript</Text>
                        {moment.transcript.map((excerpt, index) => (
                            <Box key={`${excerpt.time}-${excerpt.speaker}-${index}`} className={t.transcript}>
                                <Text as="span" className={t.speaker}>
                                    {excerpt.speaker} :
                                </Text>
                                <Text className={t.transcriptText}>« {excerpt.text} »</Text>
                            </Box>
                        ))}
                    </Box>

                    <Box>
                        <Text className={t.detailLabel}>Pourquoi c&apos;est un moment clé</Text>
                        <Text className={t.detailText}>{moment.reason}</Text>
                    </Box>

                    <Box>
                        <Text className={t.detailLabel}>Perception probable du client</Text>
                        <Text className={t.detailText}>{moment.clientPerception}</Text>
                    </Box>

                    <Box className={t.recommendation}>
                        <Text className={t.recommendationLabel}>
                            <InlineIcon icon={CheckCircle2} className="h-4 w-4 shrink-0" />
                            Réponse alternative recommandée
                        </Text>
                        <Text className={t.recommendationText}>« {moment.recommendedResponse} »</Text>
                    </Box>
                </Box>
            )}
        </Box>
    );
}

export function EvaluationKeyMomentsSection({ moments }: { moments: EvaluationKeyMoment[] }) {
    const countLabel = moments.length > 1 ? "moments détectés" : "moment détecté";

    return (
        <CardSurface className={t.section}>
            <Box className={t.sectionHeader}>
                <Box className={t.sectionTitle}>
                    <Box className={t.icon}>
                        <InlineIcon icon={Zap} className="h-[18px] w-[18px]" />
                    </Box>
                    <Text as="h3" className={t.sectionHeading}>
                        Moments clés de l&apos;échange
                    </Text>
                </Box>
                <Text className={t.count}>{moments.length} {countLabel}</Text>
            </Box>

            <Box className={t.list}>
                {moments.map((moment) => (
                    <KeyMomentAccordion key={moment.id} moment={moment} />
                ))}
            </Box>
        </CardSurface>
    );
}
