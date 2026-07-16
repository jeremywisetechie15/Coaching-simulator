"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ChevronDown,
    Eye,
    Pencil,
    Plus,
    Search,
    UserRound,
} from "lucide-react";
import { AppShell, ContextualLink } from "@/features/app-shell/components";
import { Box, Button, CardSurface, InlineIcon, SelectInput, Text, TextInput } from "@/lib/ui/atoms";
import { notifyFormSubmitError, notifyFormSubmitSuccess } from "@/lib/ui/feedback/form-submit-feedback";
import {
    getUserInvitationSuccessMessage,
    getUserStatusLabel,
    type PlatformRole,
    type UserListItem,
    type UserRole,
    USER_ROLE_FILTER_OPTIONS,
    USER_STATUS_FILTER_OPTIONS,
    type UserStatus,
} from "@/features/users/domain/users";
import type { OrganizationListItem } from "@/features/organizations/domain/organization-list";
import {
    initialUserInviteFormValues,
    UserInviteModal,
    type UserInviteFormValues,
} from "./UserInviteModal";

interface UsersPageProps {
    avatarUrl: string | null;
    initials: string;
    initialUsers: UserListItem[];
    organizations: OrganizationListItem[];
    platformRole: PlatformRole;
}

interface ApiValidationIssue {
    message: string;
    path: Array<string | number>;
}

interface ApiErrorPayload {
    code?: string;
    error?: string;
    issues?: ApiValidationIssue[];
}

interface UsersPayload {
    users?: UserListItem[];
}

interface OrganizationGroupOption {
    id: string;
    name: string;
}

interface GroupsPayload {
    groups?: OrganizationGroupOption[];
}

interface ApiRequestError extends Error {
    payload: ApiErrorPayload | null;
    status: number;
}

const usersQueryKey = ["users"] as const;

const columns = [
    "Utilisateur",
    "Email",
    "Entreprise",
    "Statut",
    "Dernière connexion",
    "Actions",
];

function getStatusClasses(status: UserStatus) {
    if (status === "active") return "bg-[#DDF8E6] text-[#2A8A41]";
    if (status === "pending") return "bg-[#FFF3D6] text-[#B77900]";
    return "bg-[#F1F2F5] text-[#697184]";
}

function UserStatusBadge({ status }: { status: UserStatus }) {
    return (
        <Box className={`inline-flex h-8 items-center rounded-lg px-3 text-[13px] font-bold ${getStatusClasses(status)}`}>
            {getUserStatusLabel(status)}
        </Box>
    );
}

function FilterSelect({
    ariaLabel,
    onChange,
    options,
    value,
}: {
    ariaLabel: string;
    onChange: (value: string) => void;
    options: Array<{ label: string; value: string }>;
    value: string;
}) {
    return (
        <Box className="relative min-w-[174px]">
            <SelectInput
                aria-label={ariaLabel}
                onChange={(event) => onChange(event.target.value)}
                value={value}
                className="h-11 rounded-lg border border-[#E1E4EB] bg-white px-4 pr-10 text-[14px] font-bold text-[#4F5868] shadow-none focus:bg-white"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </SelectInput>
            <InlineIcon
                icon={ChevronDown}
                className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8B93A4]"
            />
        </Box>
    );
}

function isApiRequestError(error: unknown): error is ApiRequestError {
    return error instanceof Error && "payload" in error && "status" in error;
}

async function readJsonPayload(response: Response) {
    return response.json().catch(() => null) as Promise<unknown>;
}

async function fetchUsers() {
    const response = await fetch("/api/users", {
        headers: { Accept: "application/json" },
    });
    const payload = (await readJsonPayload(response)) as UsersPayload | ApiErrorPayload | null;

    if (!response.ok) {
        throw new Error((payload as ApiErrorPayload | null)?.error ?? "Impossible de charger les utilisateurs.");
    }

    return (payload as UsersPayload | null)?.users ?? [];
}

async function fetchOrganizationGroups(organizationId: string) {
    const response = await fetch(`/api/organizations/${organizationId}/groups`, {
        headers: { Accept: "application/json" },
    });
    const payload = (await readJsonPayload(response)) as GroupsPayload | ApiErrorPayload | null;

    if (!response.ok) {
        throw new Error((payload as ApiErrorPayload | null)?.error ?? "Impossible de charger les groupes.");
    }

    return (payload as GroupsPayload | null)?.groups ?? [];
}

async function inviteUserRequest(values: UserInviteFormValues) {
    const response = await fetch(`/api/organizations/${values.organizationId}/users/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: values.email.trim(),
            firstName: values.firstName.trim(),
            groupId: values.groupId,
            lastName: values.lastName.trim(),
            role: values.role,
        }),
    });

    const payload = (await readJsonPayload(response)) as ApiErrorPayload | null;

    if (!response.ok) {
        const error = new Error("Impossible d'envoyer l'invitation.") as ApiRequestError;

        error.payload = payload;
        error.status = response.status;

        throw error;
    }

    return values.email.trim();
}

function getInviteErrorMessage(status: number, payload: ApiErrorPayload | null) {
    const validationMessage = payload?.issues?.map((issue) => issue.message).join(" ");
    const message = validationMessage || payload?.error || "Impossible d'envoyer l'invitation.";

    return `Erreur ${status} : ${message}`;
}

export function UsersPage({ avatarUrl, initials, initialUsers, organizations, platformRole }: UsersPageProps) {
    const queryClient = useQueryClient();
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
    const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
    const [organizationFilter, setOrganizationFilter] = useState("all");
    const [groupFilter, setGroupFilter] = useState("all");
    const [modalMode, setModalMode] = useState<"create" | null>(null);
    const [formValues, setFormValues] = useState<UserInviteFormValues>(initialUserInviteFormValues);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [inviteStatus, setInviteStatus] = useState<string | null>(null);
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
    const usersQuery = useQuery({
        queryKey: usersQueryKey,
        queryFn: fetchUsers,
        initialData: initialUsers,
    });
    const users = usersQuery.data;
    const inviteGroupsQuery = useQuery({
        enabled: modalMode === "create" && formValues.organizationId.length > 0,
        queryKey: ["organization-groups", formValues.organizationId],
        queryFn: () => fetchOrganizationGroups(formValues.organizationId),
    });

    const filteredUsers = useMemo(() => {
        const normalizedQuery = query.trim().toLocaleLowerCase("fr-FR");

        return users.filter((user) => {
            const matchesStatus = statusFilter === "all" || user.status === statusFilter;
            const matchesRole = roleFilter === "all" || user.role === roleFilter;
            const matchesOrganization = organizationFilter === "all" || user.organization === organizationFilter;
            const matchesGroup = groupFilter === "all" || user.group === groupFilter;
            const searchable = `${user.name} ${user.email} ${user.organization} ${user.group} ${user.role}`.toLocaleLowerCase("fr-FR");

            return matchesStatus && matchesRole && matchesOrganization && matchesGroup && (!normalizedQuery || searchable.includes(normalizedQuery));
        });
    }, [groupFilter, organizationFilter, query, roleFilter, statusFilter, users]);

    const organizationOptions = useMemo(
        () => [
            { label: "Toutes organisations", value: "all" },
            ...Array.from(new Set(users.map((user) => user.organization))).map((organization) => ({
                label: organization,
                value: organization,
            })),
        ],
        [users]
    );

    const groupOptions = useMemo(
        () => [
            { label: "Tous groupes", value: "all" },
            ...Array.from(new Set(users.map((user) => user.group).filter(Boolean))).map((group) => ({
                label: group,
                value: group,
            })),
        ],
        [users]
    );

    const openCreateModal = () => {
        setModalMode("create");
        setFormValues(initialUserInviteFormValues);
        setInviteError(null);
        setInviteStatus(null);
    };

    const closeModal = () => {
        setModalMode(null);
        setFormValues(initialUserInviteFormValues);
        setInviteError(null);
        setInviteStatus(null);
    };

    const inviteUserMutation = useMutation({
        mutationFn: inviteUserRequest,
        onError: (error) => {
            setInviteStatus(null);

            if (isApiRequestError(error)) {
                const message = getInviteErrorMessage(error.status, error.payload);
                setInviteError(notifyFormSubmitError(error, message));
                return;
            }

            setInviteError(notifyFormSubmitError(error, "Impossible d'envoyer l'invitation."));
        },
        onSuccess: (email) => {
            setInviteSuccess(getUserInvitationSuccessMessage(email));
            void queryClient.invalidateQueries({ queryKey: usersQueryKey });
            void queryClient.invalidateQueries({ queryKey: ["organizations"] });
            notifyFormSubmitSuccess();
            closeModal();
        },
    });

    const updateFormValue = (field: keyof UserInviteFormValues, value: string) => {
        setFormValues((current) => ({
            ...current,
            [field]: field === "role" ? (value as UserInviteFormValues["role"]) : value,
            ...(field === "organizationId" ? { groupId: "" } : {}),
        }));
        setInviteError(null);
        setInviteStatus(null);
        setInviteSuccess(null);
    };

    const submitModal = () => {
        if (!modalMode) {
            return;
        }

        setInviteError(null);
        setInviteSuccess(null);
        setInviteStatus("Envoi de la requête d'invitation...");
        inviteUserMutation.mutate(formValues);
    };

    return (
        <AppShell
            activePrimaryItem="Utilisateurs"
            avatarUrl={avatarUrl}
            initials={initials}
            platformRole={platformRole}
            searchPlaceholder="Rechercher..."
        >
            <Box as="main" className="px-5 pb-12 md:px-9 lg:px-14">
                <Box className="w-full">
                    <Box className="mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <Box>
                            <Text as="h1" className="text-[26px] font-extrabold tracking-[-0.02em] text-[#171B2A]">
                                Utilisateurs
                            </Text>
                            <Text className="mt-2 text-[14px] font-semibold text-[#697184]">
                                Gérez les accès, les rôles et le suivi des apprenants.
                            </Text>
                        </Box>
                        <Button
                            onClick={openCreateModal}
                            className="flex h-11 items-center justify-center gap-3 rounded-lg bg-[#5140F0] px-5 text-[14px] font-bold text-white shadow-[0_12px_24px_rgba(81,64,240,0.22)] transition hover:bg-[#4635E7]"
                        >
                            <InlineIcon icon={Plus} className="h-5 w-5" />
                            Ajouter un utilisateur
                        </Button>
                    </Box>

                    {inviteSuccess && (
                        <Box className="mb-5 rounded-lg border border-[#BFE8CB] bg-[#F0FBF3] px-4 py-3 text-[13px] font-semibold text-[#27743B]">
                            {inviteSuccess}
                        </Box>
                    )}

                    {usersQuery.isError && (
                        <Box className="mb-5 rounded-lg border border-[#F3C7C7] bg-[#FFF4F4] px-4 py-3 text-[13px] font-semibold text-[#A43A3A]">
                            {usersQuery.error.message}
                        </Box>
                    )}

                    <Box className="mb-5 space-y-3">
                        <Box className="relative">
                            <InlineIcon
                                icon={Search}
                                className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#99A1B2]"
                            />
                            <TextInput
                                aria-label="Rechercher un utilisateur"
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Rechercher par nom, email, groupe..."
                                value={query}
                                className="h-11 border-0 bg-white pl-12 shadow-none"
                            />
                        </Box>
                        <Box className="flex flex-wrap gap-3">
                            <FilterSelect
                                ariaLabel="Filtrer par statut"
                                onChange={(value) => setStatusFilter(value as "all" | UserStatus)}
                                options={[...USER_STATUS_FILTER_OPTIONS]}
                                value={statusFilter}
                            />
                            <FilterSelect
                                ariaLabel="Filtrer par rôle"
                                onChange={(value) => setRoleFilter(value as "all" | UserRole)}
                                options={[...USER_ROLE_FILTER_OPTIONS]}
                                value={roleFilter}
                            />
                            <FilterSelect
                                ariaLabel="Filtrer par organisation"
                                onChange={setOrganizationFilter}
                                options={organizationOptions}
                                value={organizationFilter}
                            />
                            <FilterSelect
                                ariaLabel="Filtrer par groupe"
                                onChange={setGroupFilter}
                                options={groupOptions}
                                value={groupFilter}
                            />
                        </Box>
                    </Box>

                    <CardSurface className="overflow-hidden rounded-[14px] border border-[#E1E4EB] shadow-none">
                        <Box className="overflow-x-auto">
                            <Box as="table" className="w-full border-collapse">
                                <Box as="thead">
                                    <Box as="tr" className="border-b border-[#E3E6EE] bg-[#FBFCFE]">
                                        {columns.map((column) => (
                                            <Box
                                                as="th"
                                                key={column}
                                                className="px-5 py-3 text-left text-[12px] font-extrabold uppercase leading-5 tracking-[0.08em] text-[#737B8E]"
                                            >
                                                {column}
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                                <Box as="tbody">
                                    {filteredUsers.map((user) => (
                                        <Box as="tr" key={user.id} className="border-b border-[#E7E9EF] last:border-b-0">
                                            <Box as="td" className="p-[17px]">
                                                <Box className="flex items-center gap-4">
                                                    <Box className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF0FF] text-[#5140F0]">
                                                        <Text as="span" className="text-[13px] font-extrabold">
                                                            {user.initials}
                                                        </Text>
                                                    </Box>
                                                    <Text className="text-[14px] font-extrabold text-[#171B2A]">
                                                        {user.name}
                                                    </Text>
                                                </Box>
                                            </Box>
                                            <Box as="td" className="p-[17px]">
                                                <Text className="text-[14px] font-semibold text-[#4F5868]">{user.email}</Text>
                                            </Box>
                                            <Box as="td" className="p-[17px]">
                                                <Text className="text-[14px] font-bold text-[#202636]">{user.organization}</Text>
                                            </Box>
                                            <Box as="td" className="p-[17px]">
                                                <UserStatusBadge status={user.status} />
                                            </Box>
                                            <Box as="td" className="p-[17px]">
                                                <Text className="text-[14px] font-semibold text-[#4F5868]">
                                                    {user.lastActiveAt}
                                                </Text>
                                            </Box>
                                            <Box as="td" className="p-[17px]">
                                                <Box className="flex items-center gap-2 text-[#4F5868]">
                                                    <ContextualLink
                                                        href={`/users/${user.id}`}
                                                        aria-label={`Voir ${user.name}`}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[#F2F3FF] hover:text-[#5140F0]"
                                                    >
                                                        <InlineIcon icon={Eye} className="h-5 w-5" />
                                                    </ContextualLink>
                                                    <ContextualLink
                                                        href={`/users/${user.id}?mode=edit`}
                                                        aria-label={`Modifier ${user.name}`}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[#F2F3FF] hover:text-[#5140F0]"
                                                    >
                                                        <InlineIcon icon={Pencil} className="h-5 w-5" />
                                                    </ContextualLink>
                                                </Box>
                                            </Box>
                                        </Box>
                                    ))}

                                    {filteredUsers.length === 0 && (
                                        <Box as="tr">
                                            <Box as="td" colSpan={columns.length} className="h-[260px] px-6 py-12">
                                                <Box className="flex flex-col items-center justify-center text-center">
                                                    <InlineIcon icon={UserRound} className="mb-5 h-14 w-14 text-[#D1D5DE]" />
                                                    <Text className="text-[14px] font-bold text-[#171B2A]">
                                                        Aucun utilisateur trouvé
                                                    </Text>
                                                    <Text className="mt-3 text-[14px] font-semibold text-[#A0A6B5]">
                                                        Essayez de modifier votre recherche ou vos filtres.
                                                    </Text>
                                                </Box>
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                        <Box className="flex flex-col gap-4 border-t border-[#E7E9EF] px-7 py-5 md:flex-row md:items-center md:justify-between">
                            <Text className="text-[14px] font-semibold text-[#737B8E]">
                                Affichage {filteredUsers.length > 0 ? `1-${filteredUsers.length}` : "0"} sur {users.length} utilisateurs
                            </Text>
                            <Box className="flex items-center gap-2">
                                <Box className="flex h-10 min-w-10 items-center justify-center rounded-lg bg-[#5140F0] px-4 text-[14px] font-bold text-white">
                                    1
                                </Box>
                            </Box>
                        </Box>
                    </CardSurface>
                </Box>
            </Box>

            {modalMode && (
                <UserInviteModal
                    formError={inviteError}
                    formStatus={inviteStatus}
                    groupOptions={(inviteGroupsQuery.data ?? []).map((group) => ({
                        label: group.name,
                        value: group.id,
                    }))}
                    groupSelectDisabled={!formValues.organizationId || inviteGroupsQuery.isPending || inviteGroupsQuery.isError}
                    groupSelectPlaceholder={
                        !formValues.organizationId
                            ? "Sélectionnez d'abord une organisation"
                            : inviteGroupsQuery.isPending
                              ? "Chargement des groupes..."
                              : inviteGroupsQuery.isError
                                ? "Impossible de charger les groupes"
                                : inviteGroupsQuery.data?.length
                                  ? "Sélectionnez un groupe"
                                  : "Aucun groupe disponible"
                    }
                    isSubmitting={inviteUserMutation.isPending}
                    onClose={closeModal}
                    onSubmit={submitModal}
                    onValueChange={updateFormValue}
                    organizationOptions={organizations.map((organization) => ({
                        label: organization.name,
                        value: organization.id,
                    }))}
                    values={formValues}
                />
            )}
        </AppShell>
    );
}
