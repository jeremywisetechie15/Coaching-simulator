import { ArrowLeft, Check, Pencil, Power, Trash2, X } from "lucide-react";
import { ContextualBackLink } from "@/features/app-shell/components";
import {
    ORGANIZATION_REMOVAL_ACTION,
    type OrganizationRemovalAction,
} from "@/features/organizations/domain/organization-deletion";
import type { OrganizationStatus } from "@/features/organizations/domain/organization-list";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";

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
        <Box className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <Box className="flex items-center gap-7">
                <ContextualBackLink
                    fallbackHref="/organizations"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[#171B2A] transition hover:bg-white"
                    aria-label="Retour aux organisations"
                >
                    <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                </ContextualBackLink>
                <Text as="h1" className="text-[26px] font-extrabold tracking-[-0.02em] text-[#171B2A]">
                    {name}
                </Text>
            </Box>

            <Box className="flex flex-wrap items-center gap-4">
                {isEditing ? (
                    <>
                        <Button
                            onClick={onCancelEdit}
                            disabled={isSubmitting}
                            className="flex h-10 items-center gap-3 rounded-lg border border-[#DADDE4] bg-white px-5 text-[14px] font-bold text-[#171B2A] transition hover:bg-[#F7F8FB] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <InlineIcon icon={X} className="h-5 w-5" />
                            Annuler
                        </Button>
                        <Button
                            onClick={onSave}
                            disabled={isSubmitting}
                            className="flex h-10 items-center gap-3 rounded-lg bg-[#5140F0] px-5 text-[14px] font-bold text-white shadow-[0_12px_24px_rgba(81,64,240,0.20)] transition hover:bg-[#4635E7] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            <InlineIcon icon={Check} className="h-5 w-5" />
                            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                    </>
                ) : (
                    <Button
                        onClick={onEdit}
                        className="flex h-10 items-center gap-3 rounded-lg bg-[#5140F0] px-5 text-[14px] font-bold text-white shadow-[0_12px_24px_rgba(81,64,240,0.20)] transition hover:bg-[#4635E7]"
                    >
                        <InlineIcon icon={Pencil} className="h-5 w-5" />
                        Modifier
                    </Button>
                )}
                {!isAlreadyDeactivated && (
                    <Button
                        disabled={isEditing}
                        onClick={onRemove}
                        className="flex h-10 items-center gap-3 rounded-lg bg-[#DC2027] px-5 text-[14px] font-bold text-white shadow-[0_12px_24px_rgba(220,32,39,0.18)] transition hover:bg-[#C91C22] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <InlineIcon icon={RemovalIcon} className="h-5 w-5" />
                        {isDeactivation ? "Désactiver" : "Supprimer"}
                    </Button>
                )}
            </Box>
        </Box>
    );
}
