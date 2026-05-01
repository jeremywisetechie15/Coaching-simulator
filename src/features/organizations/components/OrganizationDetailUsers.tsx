"use client";

import { useMemo, useState } from "react";
import { Eye, Pencil, Plus } from "lucide-react";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import {
    demoOrganizationGroups,
    demoOrganizationUsers,
} from "@/features/organizations/domain/organization-detail";
import { CreateUserModal, type CreateUserFormValues } from "./CreateUserModal";
import { OrganizationProgressBar } from "./OrganizationProgressBar";

const columns = ["Utilisateur", "Email", "Rôle", "Statut", "Formations", "Progression", "Actions"];

const initialCreateUserValues: CreateUserFormValues = {
    email: "",
    firstName: "",
    groupId: "",
    lastName: "",
    role: "member",
};

function getInitials(firstName: string, lastName: string) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

interface OrganizationDetailUsersProps {
    organizationId: string;
    organizationName?: string;
}

function getRoleLabel(role: CreateUserFormValues["role"]) {
    return role === "manager" ? "Manager" : "Learner";
}

export function OrganizationDetailUsers({
    organizationId,
    organizationName = "Organisation",
}: OrganizationDetailUsersProps) {
    const [users, setUsers] = useState(demoOrganizationUsers);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [createUserValues, setCreateUserValues] = useState<CreateUserFormValues>(initialCreateUserValues);

    const groupOptions = useMemo(
        () => demoOrganizationGroups.map((group) => ({ label: group.name, value: group.id })),
        []
    );

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        setInviteError(null);
        setCreateUserValues(initialCreateUserValues);
    };

    const updateCreateUserValue = (field: keyof CreateUserFormValues, value: string) => {
        setCreateUserValues((currentValues) => ({
            ...currentValues,
            [field]: field === "role" ? (value as CreateUserFormValues["role"]) : value,
        }));
        setInviteError(null);
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

        try {
            const response = await fetch(`/api/organizations/${organizationId}/users/invite`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...createUserValues,
                    email,
                    firstName,
                    lastName,
                }),
            });

            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                setInviteError(payload?.error ?? "Impossible d'envoyer l'invitation.");
                return;
            }
        } catch {
            setInviteError("Impossible d'envoyer l'invitation.");
            return;
        } finally {
            setIsInviting(false);
        }

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
                status: "active",
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
                                            Activé
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
                <CreateUserModal
                    formError={inviteError}
                    groupOptions={groupOptions}
                    isSubmitting={isInviting}
                    onClose={closeCreateModal}
                    onSubmit={createUser}
                    onValueChange={updateCreateUserValue}
                    organizationName={organizationName}
                    values={createUserValues}
                />
            )}
        </Box>
    );
}
