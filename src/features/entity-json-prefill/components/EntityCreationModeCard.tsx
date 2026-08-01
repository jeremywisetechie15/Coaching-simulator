"use client";

import { ArrowRight, FileJson, PenLine } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
    ENTITY_CREATION_MODE,
    ENTITY_CREATION_MODE_DESCRIPTIONS,
    ENTITY_CREATION_MODE_LABELS,
    type EntityCreationMode,
} from "@/features/entity-json-prefill/domain";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

const MODE_ICON: Record<EntityCreationMode, LucideIcon> = {
    [ENTITY_CREATION_MODE.json]: FileJson,
    [ENTITY_CREATION_MODE.manual]: PenLine,
};

interface EntityCreationModeCardProps {
    mode: EntityCreationMode;
    onSelect: (mode: EntityCreationMode) => void;
}

export function EntityCreationModeCard({ mode, onSelect }: EntityCreationModeCardProps) {
    const Icon = MODE_ICON[mode];
    const isJsonImport = mode === ENTITY_CREATION_MODE.json;

    return (
        <Button
            onClick={() => onSelect(mode)}
            className={cn(
                uiTokens.jsonPrefill.modeCard,
                isJsonImport
                    ? uiTokens.jsonPrefill.modeCardImport
                    : uiTokens.jsonPrefill.modeCardManual,
            )}
        >
            <Box
                className={
                    isJsonImport
                        ? uiTokens.jsonPrefill.modeIconImport
                        : uiTokens.jsonPrefill.modeIconManual
                }
            >
                <InlineIcon icon={Icon} className="h-5 w-5" />
            </Box>
            <Text as="span" className={uiTokens.jsonPrefill.modeTitle}>
                {ENTITY_CREATION_MODE_LABELS[mode]}
            </Text>
            <Text as="span" className={uiTokens.jsonPrefill.modeDescription}>
                {ENTITY_CREATION_MODE_DESCRIPTIONS[mode]}
            </Text>
            <Text as="span" className={uiTokens.jsonPrefill.modeLink}>
                Continuer
                <InlineIcon
                    icon={ArrowRight}
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                />
            </Text>
        </Button>
    );
}

