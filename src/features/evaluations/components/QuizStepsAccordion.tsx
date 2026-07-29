"use client";

import { ChevronDown, Star } from "lucide-react";
import { useState } from "react";
import {
    getQuizStepCompetenceIds,
    type QuizStep,
} from "@/features/evaluations/domain";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface QuizStepsAccordionProps {
    competenceCount: number;
    skillNameById: ReadonlyMap<string, string>;
    steps: QuizStep[];
}

export function QuizStepsAccordion({
    competenceCount,
    skillNameById,
    steps,
}: QuizStepsAccordionProps) {
    const [open, setOpen] = useState(false);

    return (
        <Box className={uiTokens.quizDetail.stepsAccordion}>
            <Box className={uiTokens.quizDetail.stepsHeader}>
                <Text className={uiTokens.quizDetail.stepsHeading}>
                    <span className={uiTokens.quizDetail.stepsHeadingStrong}>Étapes évaluées</span>
                    {" · "}
                    {steps.length} étape{steps.length > 1 ? "s" : ""}
                    {" · "}
                    {competenceCount} compétence{competenceCount > 1 ? "s" : ""}
                </Text>
                <Button
                    aria-expanded={open}
                    onClick={() => setOpen((current) => !current)}
                    className={uiTokens.quizDetail.stepsToggle}
                >
                    {open ? "Masquer les étapes" : "Voir les étapes"}
                    <InlineIcon
                        icon={ChevronDown}
                        className={cn(
                            uiTokens.quizDetail.stepsToggleIcon,
                            open && "rotate-180",
                        )}
                    />
                </Button>
            </Box>

            {open && (
                <Box className={uiTokens.quizDetail.stepsBody}>
                    <Text className={uiTokens.quizDetail.stepsDescription}>
                        Ce quiz évalue les compétences suivantes, réparties par étape. Chaque
                        étape a un poids dans votre score final.
                    </Text>

                    {steps.length > 0 ? (
                        <Box className={uiTokens.quizDetail.stepList}>
                            {steps.map((step, index) => {
                                const competenceIds = getQuizStepCompetenceIds(step);

                                return (
                                    <Box key={step.id} className={uiTokens.quizDetail.stepItem}>
                                        <Box className={uiTokens.quizDetail.stepItemHeader}>
                                            <Box className={uiTokens.quizDetail.stepNumber}>
                                                {index + 1}
                                            </Box>
                                            <Text className={uiTokens.quizDetail.stepTitle}>
                                                {step.name}
                                            </Text>
                                            <Box className={uiTokens.quizDetail.stepWeight}>
                                                {step.weight}%
                                            </Box>
                                        </Box>
                                        <Box className={uiTokens.quizDetail.stepCompetencies}>
                                            <Text className={uiTokens.quizDetail.stepCompetenciesLabel}>
                                                Compétences :
                                            </Text>
                                            <Box className={uiTokens.quizDetail.stepCompetencyList}>
                                                {competenceIds.length > 0 ? (
                                                    competenceIds.map((competenceId) => (
                                                        <Box
                                                            key={competenceId}
                                                            className={uiTokens.quizDetail.stepCompetency}
                                                        >
                                                            <InlineIcon
                                                                icon={Star}
                                                                className={
                                                                    uiTokens.quizDetail.stepCompetencyIcon
                                                                }
                                                            />
                                                            {skillNameById.get(competenceId)
                                                                ?? competenceId}
                                                        </Box>
                                                    ))
                                                ) : (
                                                    <Text
                                                        className={
                                                            uiTokens.quizDetail.stepCompetencyEmpty
                                                        }
                                                    >
                                                        Aucune compétence renseignée
                                                    </Text>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    ) : (
                        <Text className={uiTokens.quizDetail.stepsEmpty}>
                            Aucune étape renseignée.
                        </Text>
                    )}
                </Box>
            )}
        </Box>
    );
}
