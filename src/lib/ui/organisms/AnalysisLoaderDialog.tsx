"use client";

import { useEffect } from "react";
import { AudioLines, X } from "lucide-react";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { AnalysisStepRow, type AnalysisStepStatus } from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

export interface AnalysisLoaderStep {
    label: string;
    status: AnalysisStepStatus;
}

interface AnalysisLoaderDialogProps {
    description: string;
    onClose: () => void;
    steps: AnalysisLoaderStep[];
    title: string;
}

/** Loader plein écran d'analyse : badge animé, titre/description et checklist d'étapes. */
export function AnalysisLoaderDialog({ description, onClose, steps, title }: AnalysisLoaderDialogProps) {
    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    return (
        <Box className={uiTokens.modal.overlay} role="presentation">
            <Box
                role="dialog"
                aria-modal="true"
                aria-busy="true"
                aria-label={title}
                className={cn(uiTokens.modal.panel, "relative max-w-[520px] text-center")}
            >
                <Button
                    aria-label="Fermer"
                    onClick={onClose}
                    className={cn(uiTokens.modal.closeButton, "absolute right-5 top-5")}
                >
                    <InlineIcon icon={X} className="h-5 w-5" />
                </Button>

                <Box className="flex flex-col items-center">
                    <Box className={uiTokens.analysisLoader.badge}>
                        <Box className={uiTokens.analysisLoader.badgeRing} />
                        <Box className={uiTokens.analysisLoader.badgeCore}>
                            <InlineIcon icon={AudioLines} className="h-8 w-8" />
                        </Box>
                    </Box>
                    <Text as="h2" className={uiTokens.analysisLoader.title}>
                        {title}
                    </Text>
                    <Text className={uiTokens.analysisLoader.description}>{description}</Text>
                </Box>

                <Box className={uiTokens.analysisLoader.list}>
                    {steps.map((step) => (
                        <AnalysisStepRow key={step.label} label={step.label} status={step.status} />
                    ))}
                </Box>
            </Box>
        </Box>
    );
}
