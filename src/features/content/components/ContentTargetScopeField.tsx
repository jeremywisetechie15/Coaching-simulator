"use client";

import {
    CONTENT_VISIBILITY_SCOPE,
    type ContentTargetGroupOption,
    type ContentTargetOrganizationOption,
    type ContentTargetUserOption,
    type ContentVisibilityScope,
} from "@/features/content/domain";
import { Box, Button, FieldLabel, Text } from "@/lib/ui/atoms";
import { SingleSelectField } from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

export interface ContentTargetScopeValue {
    assignedUserId: string;
    groupId: string;
    organizationId: string | null;
    scope: ContentVisibilityScope;
}

interface ContentTargetScopeFieldProps {
    groupOptions: ContentTargetGroupOption[];
    onChange: (value: ContentTargetScopeValue) => void;
    organizationOptions: ContentTargetOrganizationOption[];
    userOptions: ContentTargetUserOption[];
    value: ContentTargetScopeValue;
}

function VisibilityRadio({
    description,
    onSelect,
    selected,
    title,
}: {
    description: string;
    onSelect: () => void;
    selected: boolean;
    title: string;
}) {
    return (
        <Button
            onClick={onSelect}
            className={cn(
                uiTokens.radio.option,
                selected ? uiTokens.radio.optionSelected : uiTokens.radio.optionIdle,
            )}
        >
            <Box
                className={cn(
                    uiTokens.radio.ring,
                    selected ? uiTokens.radio.ringSelected : uiTokens.radio.ringIdle,
                )}
            >
                {selected && <Box className={uiTokens.radio.dot} />}
            </Box>
            <Box className="min-w-0">
                <Text className={cn("text-[14px] font-bold", uiTokens.text.heading)}>{title}</Text>
                <Text className={cn("mt-0.5 text-[12px] font-semibold leading-5", uiTokens.text.muted)}>
                    {description}
                </Text>
            </Box>
        </Button>
    );
}

export function ContentTargetScopeField({
    groupOptions,
    onChange,
    organizationOptions,
    userOptions,
    value,
}: ContentTargetScopeFieldProps) {
    const isPrivate = value.scope !== CONTENT_VISIBILITY_SCOPE.public;
    const groupSelectOptions = value.organizationId
        ? groupOptions
              .filter((group) => group.organizationId === value.organizationId)
              .map((group) => ({ label: group.name, value: group.id }))
        : [];
    const userSelectOptions = value.groupId
        ? userOptions
              .filter((user) => user.groupIds.includes(value.groupId))
              .map((user) => ({ label: user.name, value: user.id }))
        : value.organizationId
          ? userOptions
                .filter((user) => user.organizationIds.includes(value.organizationId ?? ""))
                .map((user) => ({ label: user.name, value: user.id }))
          : [];

    function selectPublic() {
        onChange({
            assignedUserId: "",
            groupId: "",
            organizationId: null,
            scope: CONTENT_VISIBILITY_SCOPE.public,
        });
    }

    function selectPrivate() {
        onChange({
            ...value,
            scope: value.scope === CONTENT_VISIBILITY_SCOPE.public ? CONTENT_VISIBILITY_SCOPE.organization : value.scope,
        });
    }

    function selectOrganization(organizationId: string) {
        onChange({
            assignedUserId: "",
            groupId: "",
            organizationId: organizationId || null,
            scope: organizationId ? CONTENT_VISIBILITY_SCOPE.organization : CONTENT_VISIBILITY_SCOPE.public,
        });
    }

    function selectGroup(groupId: string) {
        onChange({
            ...value,
            assignedUserId: "",
            groupId,
            scope: groupId ? CONTENT_VISIBILITY_SCOPE.group : CONTENT_VISIBILITY_SCOPE.organization,
        });
    }

    function selectUser(assignedUserId: string) {
        onChange({
            ...value,
            assignedUserId,
            scope: assignedUserId ? CONTENT_VISIBILITY_SCOPE.user : value.groupId ? CONTENT_VISIBILITY_SCOPE.group : CONTENT_VISIBILITY_SCOPE.organization,
        });
    }

    return (
        <Box>
            <FieldLabel className={uiTokens.form.label}>Visibilité</FieldLabel>
            <Box className="space-y-2.5">
                <VisibilityRadio
                    selected={!isPrivate}
                    title="Public"
                    description="Visible par tous les utilisateurs de la plateforme"
                    onSelect={selectPublic}
                />
                <VisibilityRadio
                    selected={isPrivate}
                    title="Privé"
                    description="Visible uniquement par une organisation, un groupe ou un utilisateur"
                    onSelect={selectPrivate}
                />
            </Box>

            {isPrivate && (
                <Box className="mt-3 space-y-4">
                    <Box>
                        <FieldLabel required className={uiTokens.form.label}>Organisation</FieldLabel>
                        <SingleSelectField
                            options={organizationOptions.map((organization) => ({
                                label: organization.name,
                                value: organization.id,
                            }))}
                            value={value.organizationId}
                            placeholder="Sélectionner une organisation..."
                            onChange={selectOrganization}
                        />
                    </Box>
                    {value.organizationId && (
                        <Box>
                            <FieldLabel className={uiTokens.form.label}>Groupe</FieldLabel>
                            <SingleSelectField
                                options={[
                                    { label: "Toute l'organisation", value: "" },
                                    ...groupSelectOptions,
                                ]}
                                value={value.groupId}
                                placeholder="Toute l'organisation"
                                onChange={selectGroup}
                            />
                        </Box>
                    )}
                    {value.organizationId && (
                        <Box>
                            <FieldLabel className={uiTokens.form.label}>Utilisateur</FieldLabel>
                            <SingleSelectField
                                options={[
                                    { label: value.groupId ? "Tout le groupe" : "Toute l'organisation", value: "" },
                                    ...userSelectOptions,
                                ]}
                                value={value.assignedUserId}
                                placeholder={value.groupId ? "Tout le groupe" : "Toute l'organisation"}
                                onChange={selectUser}
                            />
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
}
