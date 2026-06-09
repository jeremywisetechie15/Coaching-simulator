"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Minus } from "lucide-react";
import { AppShell } from "@/features/app-shell/components";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";

type PermissionRole = "admin" | "learner";
type ToggleState = "checked" | "mixed" | "unchecked";

interface RolesPermissionsPageProps {
    avatarUrl: string | null;
    initials: string;
}

interface PermissionGroup {
    id: string;
    label: string;
    actions: string[];
}

type PermissionState = Record<string, Record<PermissionRole, Record<string, boolean>>>;

const roles: Array<{ key: PermissionRole; label: string }> = [
    { key: "admin", label: "Admin" },
    { key: "learner", label: "Learner" },
];

const permissionGroups: PermissionGroup[] = [
    { id: "formations", label: "Formations", actions: ["Voir", "Créer", "Mettre à jour", "Supprimer"] },
    { id: "roleplays", label: "Roleplays", actions: ["Voir", "Créer", "Mettre à jour", "Supprimer"] },
    {
        id: "methodes-playbook",
        label: "Méthodes et Playbook",
        actions: ["Voir", "Créer", "Mettre à jour", "Assigner/ Retirer", "Supprimer"],
    },
    {
        id: "competences",
        label: "Compétences",
        actions: ["Voir", "Créer", "Mettre à jour", "Assigner/ Retirer", "Supprimer"],
    },
    { id: "coachs-ia", label: "Mes Coachs IA", actions: ["Voir", "Créer", "Mettre à jour", "Supprimer"] },
    { id: "personas-ia", label: "Mes Personas IA", actions: ["Voir", "Créer", "Mettre à jour", "Supprimer"] },
    { id: "organisations", label: "Organisations", actions: ["Voir", "Créer", "Mettre à jour", "Supprimer"] },
    { id: "utilisateurs", label: "Utilisateurs", actions: ["Voir", "Créer", "Mettre à jour", "Supprimer"] },
];

function createInitialPermissions(): PermissionState {
    return permissionGroups.reduce<PermissionState>((groupState, group) => {
        groupState[group.id] = {
            admin: {},
            learner: {},
        };

        for (const action of group.actions) {
            groupState[group.id].admin[action] = true;
            groupState[group.id].learner[action] = action === "Voir";
        }

        return groupState;
    }, {});
}

function getGroupToggleState(group: PermissionGroup, permissions: PermissionState, role: PermissionRole): ToggleState {
    const values = group.actions.map((action) => permissions[group.id]?.[role]?.[action] ?? false);

    if (values.every(Boolean)) {
        return "checked";
    }

    if (values.some(Boolean)) {
        return "mixed";
    }

    return "unchecked";
}

function PermissionToggle({
    label,
    onToggle,
    state,
}: {
    label: string;
    onToggle: () => void;
    state: ToggleState;
}) {
    const isActive = state === "checked" || state === "mixed";

    return (
        <Button
            aria-label={label}
            aria-pressed={isActive}
            onClick={onToggle}
            className={[
                "inline-flex h-4 w-4 items-center justify-center rounded-[4px] border transition",
                isActive
                    ? "border-[#5140F0] bg-[#5140F0] text-white shadow-[0_4px_10px_rgba(81,64,240,0.16)]"
                    : "border-[#CCD2DC] bg-white text-transparent hover:border-[#5140F0]",
            ].join(" ")}
        >
            <InlineIcon icon={state === "mixed" ? Minus : Check} className="h-3 w-3 stroke-[3]" />
        </Button>
    );
}

export function RolesPermissionsPage({ avatarUrl, initials }: RolesPermissionsPageProps) {
    const [permissions, setPermissions] = useState<PermissionState>(() => createInitialPermissions());

    const totalPermissionCount = useMemo(
        () => permissionGroups.reduce((total, group) => total + group.actions.length * roles.length, 0),
        []
    );

    const toggleAction = (group: PermissionGroup, role: PermissionRole, action: string) => {
        setPermissions((current) => ({
            ...current,
            [group.id]: {
                ...current[group.id],
                [role]: {
                    ...current[group.id][role],
                    [action]: !current[group.id][role][action],
                },
            },
        }));
    };

    const toggleGroup = (group: PermissionGroup, role: PermissionRole) => {
        setPermissions((current) => {
            const currentState = getGroupToggleState(group, current, role);
            const nextValue = currentState !== "checked";

            return {
                ...current,
                [group.id]: {
                    ...current[group.id],
                    [role]: group.actions.reduce<Record<string, boolean>>((nextRoleState, action) => {
                        nextRoleState[action] = nextValue;
                        return nextRoleState;
                    }, {}),
                },
            };
        });
    };

    return (
        <AppShell
            activeAccountItem="Rôles & Permissions"
            avatarUrl={avatarUrl}
            initials={initials}
            searchPlaceholder="Rechercher..."
        >
            <Box as="main" className="px-5 pb-12 md:px-9 lg:px-14">
                <Box className="max-w-[833px]">
                    <Box className="mb-9 flex items-center gap-6">
                        <Button className="flex h-10 w-10 items-center justify-center rounded-full text-[#171B2A] transition hover:bg-white">
                            <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                        </Button>
                        <Text as="h1" className="text-[26px] font-extrabold tracking-[-0.02em] text-[#171B2A]">
                            Rôles & Permissions
                        </Text>
                    </Box>

                    <CardSurface className="rounded-[14px] border border-[#E1E4EB] p-8 shadow-none">
                        <Box className="overflow-hidden rounded-[9px] border border-[#DDE1E8] bg-white">
                            <Box
                                role="table"
                                aria-label={`Matrice de ${totalPermissionCount} permissions`}
                                className="min-w-[700px]"
                            >
                                <Box
                                    role="row"
                                    className="grid h-[58px] grid-cols-[1fr_192px_192px] items-center border-b border-[#DDE1E8] bg-[#F6F7FA]"
                                >
                                    <Text
                                        role="columnheader"
                                        className="px-8 text-[12px] font-bold uppercase tracking-[0.08em] text-[#697184]"
                                    >
                                        Permissions
                                    </Text>
                                    {roles.map((role) => (
                                        <Text
                                            key={role.key}
                                            role="columnheader"
                                            className="border-l border-[#EEF0F4] px-8 text-center text-[12px] font-bold uppercase tracking-[0.08em] text-[#697184]"
                                        >
                                            {role.label}
                                        </Text>
                                    ))}
                                </Box>

                                {permissionGroups.map((group) => (
                                    <Box role="rowgroup" key={group.id}>
                                        <Box className="grid min-h-[56px] grid-cols-[1fr_192px_192px] items-center border-b border-[#EEF0F4] bg-[#FCFCFD]">
                                            <Box role="rowheader" className="flex items-center gap-4 px-8">
                                                <InlineIcon
                                                    icon={ChevronDown}
                                                    className="h-4 w-4 shrink-0 text-[#5140F0]"
                                                />
                                                <Text as="span" className="text-[15px] font-extrabold text-[#171B2A]">
                                                    {group.label}
                                                </Text>
                                            </Box>

                                            {roles.map((role) => (
                                                <Box
                                                    key={`${group.id}-${role.key}`}
                                                    role="cell"
                                                    className="flex h-full items-center justify-center border-l border-[#F1F2F5]"
                                                >
                                                    <PermissionToggle
                                                        label={`Toggle toutes les permissions ${group.label} pour ${role.label}`}
                                                        onToggle={() => toggleGroup(group, role.key)}
                                                        state={getGroupToggleState(group, permissions, role.key)}
                                                    />
                                                </Box>
                                            ))}
                                        </Box>

                                        {group.actions.map((action) => (
                                            <Box
                                                role="row"
                                                key={`${group.id}-${action}`}
                                                className="grid min-h-[61px] grid-cols-[1fr_192px_192px] items-center border-b border-[#EEF0F4] last:border-b-0"
                                            >
                                                <Box role="rowheader" className="flex items-center gap-5 px-8">
                                                    <Box className="h-7 w-1 rounded-full bg-[#CBD2FF]" />
                                                    <Text as="span" className="text-[15px] font-semibold text-[#2D3545]">
                                                        {action}
                                                    </Text>
                                                </Box>

                                                {roles.map((role) => {
                                                    const isEnabled = permissions[group.id]?.[role.key]?.[action] ?? false;
                                                    const actionLabel = `${isEnabled ? "Désactiver" : "Activer"} ${action} pour ${role.label}`;

                                                    return (
                                                        <Box
                                                            key={`${group.id}-${action}-${role.key}`}
                                                            role="cell"
                                                            className="flex h-full items-center justify-center border-l border-[#F1F2F5]"
                                                        >
                                                            <PermissionToggle
                                                                label={actionLabel}
                                                                onToggle={() => toggleAction(group, role.key, action)}
                                                                state={isEnabled ? "checked" : "unchecked"}
                                                            />
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                        ))}
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </CardSurface>
                </Box>
            </Box>
        </AppShell>
    );
}
