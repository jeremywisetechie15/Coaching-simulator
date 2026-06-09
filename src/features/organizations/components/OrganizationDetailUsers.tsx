"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus } from "lucide-react";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import {
    demoOrganizationUsers,
    type OrganizationGroupRow,
} from "@/features/organizations/domain/organization-detail";
import { ORGANIZATION_MEMBER_STATUS_LABELS } from "@/features/organizations/domain/organization-member";
import {
    initialUserInviteFormValues,
    UserInviteModal,
    type UserInviteFormValues,
} from "@/features/users/components/UserInviteModal";
import { OrganizationProgressBar } from "./OrganizationProgressBar";

const columns = ["Utilisateur", "Email", "Rôle", "Statut", "Formations", "Progression", "Actions"];

interface ApiValidationIssue {
    message: string;
    path: Array<string | number>;
}

interface ApiErrorPayload {
    code?: string;
    error?: string;
    issues?: ApiValidationIssue[];
}

interface GroupsPayload {
    groups?: OrganizationGroupRow[];
}

function getInitials(firstName: string, lastName: string) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getInitialCreateUserValues(organizationId: string): UserInviteFormValues {
    return {
        ...initialUserInviteFormValues,
        organizationId,
    };
}

interface OrganizationDetailUsersProps {
    organizationId: string;
    organizationName?: string;
}

function getRoleLabel(role: UserInviteFormValues["role"]) {
    return role === "manager" ? "Manager" : "Learner";
}

function getInviteErrorMessage(status: number, payload: ApiErrorPayload | null) {
    const validationMessage = payload?.issues?.map((issue) => issue.message).join(" ");
    const message = validationMessage || payload?.error || "Impossible d'envoyer l'invitation.";

    return `Erreur ${status} : ${message}`;
}

export function OrganizationDetailUsers({
    organizationId,
    organizationName = "Organisation",
}: OrganizationDetailUsersProps) {
    const queryClient = useQueryClient();
    const [users, setUsers] = useState(demoOrganizationUsers);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
    const [inviteStatus, setInviteStatus] = useState<string | null>(null);
    const [organizationGroups, setOrganizationGroups] = useState<OrganizationGroupRow[]>([]);
    const [createUserValues, setCreateUserValues] = useState<UserInviteFormValues>(() =>
        getInitialCreateUserValues(organizationId)
    );

    const groupOptions = organizationGroups.map((group) => ({ label: group.name, value: group.id }));

    useEffect(() => {
        let isMounted = true;

        async function loadGroups() {
            try {
                const response = await fetch(`/api/organizations/${organizationId}/groups`, {
                    headers: { Accept: "application/json" },
                });
                const payload = (await response.json().catch(() => null)) as GroupsPayload | null;

                if (response.ok && isMounted) {
                    setOrganizationGroups(payload?.groups ?? []);
                }
            } catch {
                if (isMounted) {
                    setOrganizationGroups([]);
                }
            }
        }

        void loadGroups();

        return () => {
            isMounted = false;
        };
    }, [organizationId]);

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        setInviteError(null);
        setInviteStatus(null);
        setCreateUserValues(getInitialCreateUserValues(organizationId));
    };

    const updateCreateUserValue = (field: keyof UserInviteFormValues, value: string) => {
        setCreateUserValues((currentValues) => ({
            ...currentValues,
            [field]: field === "role" ? (value as UserInviteFormValues["role"]) : value,
        }));
        setInviteError(null);
        setInviteSuccess(null);
        setInviteStatus(null);
    };

    const createUser = async () => {
        const firstName = createUserValues.firstName.trim();
        const lastName = createUserValues.lastName.trim();
        const email = createUserValues.email.trim();

        if (!firstName || !lastName || !email) {
            return;
        }

        setIsInviting(true);
        setInviteError(null);
        setInviteSuccess(null);
        setInviteStatus("Envoi de la requête d'invitation...");

        try {
            const response = await fetch(`/api/organizations/${organizationId}/users/invite`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    firstName,
                    groupId: createUserValues.groupId,
                    lastName,
                    role: createUserValues.role,
                }),
            });

            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                setInviteStatus(null);
                setInviteError(getInviteErrorMessage(response.status, payload as ApiErrorPayload | null));
                return;
            }
        } catch {
            setInviteStatus(null);
            setInviteError("Impossible d'envoyer l'invitation.");
            return;
        } finally {
            setIsInviting(false);
        }

        setInviteSuccess(`Invitation envoyée à ${email}.`);
        void queryClient.invalidateQueries({ queryKey: ["organizations"] });
        void queryClient.invalidateQueries({ queryKey: ["users"] });
        setUsers((currentUsers) => [
            ...currentUsers,
            {
                email,
                formationCount: 0,
                id: `${firstName.toLowerCase()}-${lastName.toLowerCase()}-${Date.now()}`,
                initials: getInitials(firstName, lastName),
                name: `${firstName} ${lastName}`,
                progress: 0,
                role: getRoleLabel(createUserValues.role),
                status: "invited",
            },
        ]);
        closeCreateModal();
    };

    return (
        <Box className="px-7 py-7">
            <Box className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <Text as="h2" className="text-[18px] font-extrabold text-[#171B2A]">
                    {"Utilisateurs de l'organisation"}
                </Text>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex h-10 items-center gap-3 rounded-lg bg-[#E5E9FF] px-5 text-[14px] font-bold text-[#5140F0] transition hover:bg-[#DBE0FF]"
                >
                    <InlineIcon icon={Plus} className="h-5 w-5" />
                    Ajouter des utilisateurs
                </Button>
            </Box>

            {inviteSuccess && (
                <Box
                    aria-live="polite"
                    className="mb-5 rounded-lg border border-[#BFE8CB] bg-[#F0FBF3] px-4 py-3 text-[13px] font-semibold text-[#27743B]"
                >
                    {inviteSuccess}
                </Box>
            )}

            <CardSurface className="overflow-hidden rounded-[14px] border border-[#E1E4EB] shadow-none">
                <Box className="overflow-x-auto">
                    <Box as="table" className="w-full min-w-[1080px] border-collapse">
                        <Box as="thead">
                            <Box as="tr" className="border-b border-[#E4E7EE] bg-[#FBFCFE]">
                                {columns.map((column) => (
                                    <Box
                                        as="th"
                                        key={column}
                                        className="px-7 py-4 text-left text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#737B8E]"
                                    >
                                        {column}
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                        <Box as="tbody">
                            {users.map((user) => (
                                <Box as="tr" key={user.id} className="border-b border-[#E7E9EF] last:border-b-0">
                                    <Box as="td" className="px-7 py-5">
                                        <Box className="flex items-center gap-4">
                                            <Box className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1F2F5] text-[#4F5868]">
                                                <Text as="span" className="text-[13px] font-bold">
                                                    {user.initials}
                                                </Text>
                                            </Box>
                                            <Text className="text-[14px] font-extrabold text-[#171B2A]">{user.name}</Text>
                                        </Box>
                                    </Box>
                                    <Box as="td" className="px-7 py-5">
                                        <Text className="text-[14px] font-semibold text-[#4F5868]">{user.email}</Text>
                                    </Box>
                                    <Box as="td" className="px-7 py-5">
                                        <Box className="inline-flex h-8 items-center rounded-lg border border-[#D5DAE3] px-3 text-[13px] font-semibold text-[#4F5868]">
                                            {user.role}
                                        </Box>
                                    </Box>
                                    <Box as="td" className="px-7 py-5">
                                        <Box className="inline-flex h-8 items-center rounded-lg bg-[#DDF8E6] px-3 text-[13px] font-bold text-[#2A8A41]">
                                            {ORGANIZATION_MEMBER_STATUS_LABELS[user.status]}
                                        </Box>
                                    </Box>
                                    <Box as="td" className="px-7 py-5">
                                        <Text className="text-[14px] font-extrabold text-[#171B2A]">
                                            {user.formationCount} formations
                                        </Text>
                                    </Box>
                                    <Box as="td" className="px-7 py-5">
                                        <OrganizationProgressBar progress={user.progress} size="sm" />
                                    </Box>
                                    <Box as="td" className="px-7 py-5">
                                        <Box className="flex items-center gap-5 text-[#9AA2B2]">
                                            {[Eye, Pencil].map((icon) => (
                                                <Button
                                                    key={icon.displayName ?? icon.name}
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[#F2F3FF] hover:text-[#5140F0]"
                                                >
                                                    <InlineIcon icon={icon} className="h-5 w-5" />
                                                </Button>
                                            ))}
                                        </Box>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>
            </CardSurface>

            {isCreateModalOpen && (
                <UserInviteModal
                    formError={inviteError}
                    formStatus={inviteStatus}
                    groupOptions={groupOptions}
                    isSubmitting={isInviting}
                    onClose={closeCreateModal}
                    onSubmit={createUser}
                    onValueChange={updateCreateUserValue}
                    organizationOptions={[{ label: organizationName, value: organizationId }]}
                    organizationSelectDisabled
                    values={createUserValues}
                />
            )}
        </Box>
    );
}
