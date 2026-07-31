import { ArrowLeft, Check, Pencil, Power, Trash2, X } from "lucide-react";
import { ContextualBackLink } from "@/features/app-shell/components";
import {
    ORGANIZATION_REMOVAL_ACTION,
    type OrganizationRemovalAction,
} from "@/features/organizations/domain/organization-deletion";
import type { OrganizationStatus } from "@/features/organizations/domain/organization-list";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface OrganizationDetailHeaderProps {
    isEditing?: boolean;
    isSubmitting?: boolean;
    name: string;
    organizationStatus: OrganizationStatus;
    onCancelEdit?: () => void;
    onRemove?: () => void;
    onEdit?: () => void;
    onSave?: () => void;
    removalAction: OrganizationRemovalAction;
}

export function OrganizationDetailHeader({
    isEditing = false,
    isSubmitting = false,
    name,
    organizationStatus,
    onCancelEdit,
    onRemove,
    onEdit,
    onSave,
    removalAction,
}: OrganizationDetailHeaderProps) {
    const isDeactivation = removalAction === ORGANIZATION_REMOVAL_ACTION.deactivate;
    const isAlreadyDeactivated = isDeactivation && organizationStatus === "suspended";
    const RemovalIcon = isDeactivation ? Power : Trash2;

    return (
        <Box className={uiTokens.organizationDetail.header.root}>
            <Box className={uiTokens.organizationDetail.header.titleGroup}>
                <ContextualBackLink
                    fallbackHref="/organizations"
                    className={uiTokens.organizationDetail.header.back}
                    aria-label="Retour aux organisations"
                >
                    <InlineIcon
                        icon={ArrowLeft}
                        className={uiTokens.organizationDetail.header.backIcon}
                    />
                </ContextualBackLink>
                <Text as="h1" className={uiTokens.organizationDetail.header.title}>
                    {name}
                </Text>
            </Box>

            <Box className={uiTokens.organizationDetail.header.actions}>
                {isEditing ? (
                    <>
                        <Button
                            onClick={onCancelEdit}
                            disabled={isSubmitting}
                            className={cn(
                                uiTokens.organizationDetail.header.action,
                                uiTokens.organizationDetail.header.cancel,
                            )}
                        >
                            <InlineIcon
                                icon={X}
                                className={uiTokens.organizationDetail.header.actionIcon}
                            />
                            Annuler
                        </Button>
                        <Button
                            onClick={onSave}
                            disabled={isSubmitting}
                            className={cn(
                                uiTokens.organizationDetail.header.action,
                                uiTokens.organizationDetail.header.primary,
                            )}
                        >
                            <InlineIcon
                                icon={Check}
                                className={uiTokens.organizationDetail.header.actionIcon}
                            />
                            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                    </>
                ) : (
                    <Button
                        onClick={onEdit}
                        className={cn(
                            uiTokens.organizationDetail.header.action,
                            uiTokens.organizationDetail.header.primary,
                        )}
                    >
                        <InlineIcon
                            icon={Pencil}
                            className={uiTokens.organizationDetail.header.actionIcon}
                        />
                        Modifier
                    </Button>
                )}
                {!isAlreadyDeactivated && (
                    <Button
                        disabled={isEditing}
                        onClick={onRemove}
                        className={cn(
                            uiTokens.organizationDetail.header.action,
                            uiTokens.organizationDetail.header.danger,
                        )}
                    >
                        <InlineIcon
                            icon={RemovalIcon}
                            className={uiTokens.organizationDetail.header.actionIcon}
                        />
                        {isDeactivation ? "Désactiver" : "Supprimer"}
                    </Button>
                )}
            </Box>
        </Box>
    );
}
