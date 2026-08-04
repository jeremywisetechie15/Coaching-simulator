"use client";

import { Braces } from "lucide-react";
import {
    ENTITY_CREATION_MODES,
    type EntityCreationMode,
} from "@/features/entity-json-prefill/domain";
import { Box, InlineIcon, Text } from "@/lib/ui/atoms";
import { Modal } from "@/lib/ui/organisms";
import { uiTokens } from "@/lib/ui/tokens";
import { EntityCreationModeCard } from "./EntityCreationModeCard";

interface EntityCreationModeDialogProps {
    entityLabel: string;
    onClose: () => void;
    onSelect: (mode: EntityCreationMode) => void;
}

export function EntityCreationModeDialog({
    entityLabel,
    onClose,
    onSelect,
}: EntityCreationModeDialogProps) {
    return (
        <Modal
            className={uiTokens.jsonPrefill.dialogPanel}
            description="Choisissez votre point de départ. Vous pourrez vérifier chaque valeur avant l’enregistrement."
            onClose={onClose}
            title={`Nouvelle création — ${entityLabel}`}
        >
            <Box className={uiTokens.jsonPrefill.shell}>
                <Text className={uiTokens.jsonPrefill.eyebrow}>
                    <InlineIcon icon={Braces} className="h-3.5 w-3.5" />
                    Deux parcours, un même formulaire
                </Text>
                <Box className={uiTokens.jsonPrefill.actionGrid}>
                    {ENTITY_CREATION_MODES.map((mode) => (
                        <EntityCreationModeCard key={mode} mode={mode} onSelect={onSelect} />
                    ))}
                </Box>
            </Box>
        </Modal>
    );
}

