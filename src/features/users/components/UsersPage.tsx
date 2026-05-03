"use client";

import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";
import {
    ChevronDown,
    Eye,
    Pencil,
    Plus,
    Search,
    UserRound,
    X,
} from "lucide-react";
import { AppShell } from "@/features/app-shell/components";
import { Box, Button, CardSurface, FieldLabel, FormRoot, InlineIcon, SelectInput, Text, TextInput } from "@/lib/ui/atoms";
import { demoUsers, type UserListItem, type UserRole, type UserStatus } from "@/features/users/domain/users";

interface UsersPageProps {
    avatarUrl: string | null;
    initials: string;
}

interface UserFormValues {
    city: string;
    email: string;
    firstName: string;
    group: string;
    lastName: string;
    organization: string;
    phone: string;
    role: UserRole;
    status: UserStatus;
}

const emptyUserForm: UserFormValues = {
    city: "",
    email: "",
    firstName: "",
    group: "Sales",
    lastName: "",
    organization: "Deepmark",
    phone: "",
    role: "Learner",
    status: "pending",
};

const columns = [
    "Utilisateur",
    "Email",
    "Rôle",
    "Organisation",
    "Groupe",
    "Statut",
    "Progression",
    "Dernière activité",
    "Actions",
];

function getInitials(firstName: string, lastName: string) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getStatusLabel(status: UserStatus) {
    if (status === "active") return "Activé";
    if (status === "pending") return "En attente";
    return "Désactivé";
}

function getStatusClasses(status: UserStatus) {
    if (status === "active") return "bg-[#DDF8E6] text-[#2A8A41]";
    if (status === "pending") return "bg-[#FFF3D6] text-[#B77900]";
    return "bg-[#F1F2F5] text-[#697184]";
}

function UserStatusBadge({ status }: { status: UserStatus }) {
    return (
        <Box className={`inline-flex h-8 items-center rounded-lg px-3 text-[13px] font-bold ${getStatusClasses(status)}`}>
            {getStatusLabel(status)}
        </Box>
    );
}

function ProgressBar({ progress }: { progress: number }) {
    return (
        <Box className="flex items-center gap-3">
            <Box className="h-2 w-[116px] overflow-hidden rounded-full bg-[#EEF0F4]">
                <Box className="h-full rounded-full bg-[#5140F0]" style={{ width: `${progress}%` }} />
            </Box>
            <Text as="span" className="w-10 text-[14px] font-extrabold text-[#5140F0]">
                {progress}%
            </Text>
        </Box>
    );
}

function ModalField({
    autoFocus = false,
    id,
    label,
    onChange,
    required = false,
    type = "text",
    value,
}: {
    autoFocus?: boolean;
    id: string;
    label: string;
    onChange: (value: string) => void;
    required?: boolean;
    type?: "email" | "text";
    value: string;
}) {
    return (
        <Box className="space-y-2">
            <FieldLabel htmlFor={id} className="text-[14px] font-bold text-[#111827]">
                {label} {required && <Text as="span" className="text-[#FF4E68]">*</Text>}
            </FieldLabel>
            <TextInput
                id={id}
                autoFocus={autoFocus}
                hasLeadingIcon={false}
                onChange={(event) => onChange(event.target.value)}
                type={type}
                value={value}
                className="!h-10 rounded-lg border border-[#DADDE4] bg-[#F8F9FB] text-[14px] font-semibold shadow-none focus:bg-white"
            />
        </Box>
    );
}

function ModalSelect({
    id,
    label,
    onChange,
    options,
    value,
}: {
    id: string;
    label: string;
    onChange: (value: string) => void;
    options: Array<{ label: string; value: string }>;
    value: string;
}) {
    return (
        <Box className="space-y-2">
            <FieldLabel htmlFor={id} className="text-[14px] font-bold text-[#111827]">
                {label}
            </FieldLabel>
            <Box className="relative">
                <SelectInput
                    id={id}
                    onChange={(event) => onChange(event.target.value)}
                    value={value}
                    className="!h-10 rounded-lg border border-[#DADDE4] bg-[#F8F9FB] text-[14px] font-semibold shadow-none focus:bg-white"
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </SelectInput>
                <InlineIcon
                    icon={ChevronDown}
                    className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#B7BBC5]"
                />
            </Box>
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

function UserModal({
    onClose,
    onSubmit,
    onValueChange,
    values,
}: {
    onClose: () => void;
    onSubmit: () => void;
    onValueChange: (field: keyof UserFormValues, value: string) => void;
    values: UserFormValues;
}) {
    const canSubmit = values.firstName.trim() && values.lastName.trim() && values.email.trim();

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (canSubmit) {
            onSubmit();
        }
    };

    return (
        <Box className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#111827]/55 px-4 py-5 backdrop-blur-[1px]">
            <CardSurface className="w-full max-w-[520px] rounded-[14px] px-6 py-6 shadow-[0_22px_60px_rgba(17,24,39,0.26)]">
                <Box className="mb-5 flex items-start justify-between gap-4">
                    <Text as="h2" className="text-[20px] font-extrabold text-[#111827]">
                        Ajouter un utilisateur
                    </Text>
                    <Button
                        aria-label="Fermer"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[#F3F4F7] hover:text-[#111827]"
                    >
                        <InlineIcon icon={X} className="h-5 w-5" />
                    </Button>
                </Box>

                <FormRoot onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <Box className="grid gap-4 sm:grid-cols-2">
                        <ModalField
                            autoFocus
                            id="first-name"
                            label="Prénom"
                            onChange={(value) => onValueChange("firstName", value)}
                            required
                            value={values.firstName}
                        />
                        <ModalField
                            id="last-name"
                            label="Nom"
                            onChange={(value) => onValueChange("lastName", value)}
                            required
                            value={values.lastName}
                        />
                    </Box>
                    <ModalField
                        id="email"
                        label="Email"
                        onChange={(value) => onValueChange("email", value)}
                        required
                        type="email"
                        value={values.email}
                    />
                    <ModalField
                        id="phone"
                        label="Téléphone"
                        onChange={(value) => onValueChange("phone", value)}
                        value={values.phone}
                    />
                    <Box className="grid gap-4 sm:grid-cols-2">
                        <ModalSelect
                            id="role"
                            label="Rôle"
                            onChange={(value) => onValueChange("role", value)}
                            options={[
                                { label: "SuperAdmin", value: "SuperAdmin" },
                                { label: "Learner", value: "Learner" },
                            ]}
                            value={values.role}
                        />
                        <ModalSelect
                            id="status"
                            label="Statut"
                            onChange={(value) => onValueChange("status", value)}
                            options={[
                                { label: "Activé", value: "active" },
                                { label: "En attente", value: "pending" },
                                { label: "Désactivé", value: "inactive" },
                            ]}
                            value={values.status}
                        />
                    </Box>
                    <ModalField
                        id="organization"
                        label="Organisation"
                        onChange={(value) => onValueChange("organization", value)}
                        value={values.organization}
                    />
                    <Box className="grid gap-4 sm:grid-cols-2">
                        <ModalField
                            id="group"
                            label="Groupe"
                            onChange={(value) => onValueChange("group", value)}
                            value={values.group}
                        />
                        <ModalField
                            id="city"
                            label="Ville"
                            onChange={(value) => onValueChange("city", value)}
                            value={values.city}
                        />
                    </Box>

                    <Box className="grid gap-3 pt-2 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)]">
                        <Button
                            onClick={onClose}
                            className="flex h-10 items-center justify-center rounded-lg border border-[#DADDE4] bg-white text-[13px] font-bold text-[#111827] transition hover:bg-[#F7F8FB]"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={!canSubmit}
                            className="flex h-10 items-center justify-center rounded-lg bg-[#5140F0] text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(81,64,240,0.16)] transition hover:bg-[#4635E7] disabled:cursor-not-allowed disabled:bg-[#E3E5EA]"
                        >
                            Créer l&apos;utilisateur
                        </Button>
                    </Box>
                </FormRoot>
            </CardSurface>
        </Box>
    );
}

function createUserFromForm(values: UserFormValues): UserListItem {
    const id = `${values.firstName}-${values.lastName}-${Date.now()}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    return {
        activity: [{ date: "Maintenant", id: `${id}-activity`, label: "Utilisateur créé", type: "Compte" }],
        city: values.city,
        email: values.email,
        group: values.group,
        id,
        initials: getInitials(values.firstName, values.lastName),
        joinedAt: "Aujourd'hui",
        lastActiveAt: values.status === "active" ? "Aujourd'hui" : "Jamais connecté",
        name: `${values.firstName} ${values.lastName}`,
        organization: values.organization,
        phone: values.phone,
        progress: 0,
        role: values.role,
        roleplays: [],
        skills: [],
        status: values.status,
        trainings: [],
    };
}

export function UsersPage({ avatarUrl, initials }: UsersPageProps) {
    const [users, setUsers] = useState<UserListItem[]>(demoUsers);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
    const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
    const [organizationFilter, setOrganizationFilter] = useState("all");
    const [groupFilter, setGroupFilter] = useState("all");
    const [modalMode, setModalMode] = useState<"create" | null>(null);
    const [formValues, setFormValues] = useState<UserFormValues>(emptyUserForm);

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
            ...Array.from(new Set(users.map((user) => user.group))).map((group) => ({
                label: group,
                value: group,
            })),
        ],
        [users]
    );

    const openCreateModal = () => {
        setModalMode("create");
        setFormValues(emptyUserForm);
    };

    const closeModal = () => {
        setModalMode(null);
        setFormValues(emptyUserForm);
    };

    const updateFormValue = (field: keyof UserFormValues, value: string) => {
        setFormValues((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const submitModal = () => {
        if (modalMode) {
            setUsers((current) => [createUserFromForm(formValues), ...current]);
            closeModal();
        }
    };

    return (
        <AppShell
            activePrimaryItem="Utilisateurs"
            avatarUrl={avatarUrl}
            initials={initials}
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
                                options={[
                                    { label: "Tous statuts", value: "all" },
                                    { label: "Actifs", value: "active" },
                                    { label: "En attente", value: "pending" },
                                    { label: "Inactifs", value: "inactive" },
                                ]}
                                value={statusFilter}
                            />
                            <FilterSelect
                                ariaLabel="Filtrer par rôle"
                                onChange={(value) => setRoleFilter(value as "all" | UserRole)}
                                options={[
                                    { label: "Tous rôles", value: "all" },
                                    { label: "SuperAdmin", value: "SuperAdmin" },
                                    { label: "Learner", value: "Learner" },
                                ]}
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
                            <Box as="table" className="w-full min-w-[1080px] border-collapse">
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
                                                    <Box>
                                                        <Text className="text-[14px] font-extrabold text-[#171B2A]">
                                                            {user.name}
                                                        </Text>
                                                        <Text className="mt-1 text-[12px] font-semibold text-[#8C94A4]">
                                                            {user.city}
                                                        </Text>
                                                    </Box>
                                                </Box>
                                            </Box>
                                            <Box as="td" className="p-[17px]">
                                                <Text className="text-[14px] font-semibold text-[#4F5868]">{user.email}</Text>
                                            </Box>
                                            <Box as="td" className="p-[17px]">
                                                <Box className="inline-flex h-8 items-center rounded-lg border border-[#D5DAE3] px-3 text-[13px] font-bold text-[#4F5868]">
                                                    {user.role}
                                                </Box>
                                            </Box>
                                            <Box as="td" className="p-[17px]">
                                                <Text className="text-[14px] font-bold text-[#202636]">{user.organization}</Text>
                                            </Box>
                                            <Box as="td" className="p-[17px]">
                                                <Text className="text-[14px] font-bold text-[#202636]">{user.group}</Text>
                                            </Box>
                                            <Box as="td" className="p-[17px]">
                                                <UserStatusBadge status={user.status} />
                                            </Box>
                                            <Box as="td" className="p-[17px]">
                                                <ProgressBar progress={user.progress} />
                                            </Box>
                                            <Box as="td" className="p-[17px]">
                                                <Text className="text-[14px] font-semibold text-[#4F5868]">
                                                    {user.lastActiveAt}
                                                </Text>
                                            </Box>
                                            <Box as="td" className="p-[17px]">
                                                <Box className="flex items-center gap-2 text-[#4F5868]">
                                                    <Link
                                                        href={`/users/${user.id}`}
                                                        aria-label={`Voir ${user.name}`}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[#F2F3FF] hover:text-[#5140F0]"
                                                    >
                                                        <InlineIcon icon={Eye} className="h-5 w-5" />
                                                    </Link>
                                                    <Link
                                                        href={`/users/${user.id}?mode=edit`}
                                                        aria-label={`Modifier ${user.name}`}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[#F2F3FF] hover:text-[#5140F0]"
                                                    >
                                                        <InlineIcon icon={Pencil} className="h-5 w-5" />
                                                    </Link>
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
                <UserModal
                    onClose={closeModal}
                    onSubmit={submitModal}
                    onValueChange={updateFormValue}
                    values={formValues}
                />
            )}
        </AppShell>
    );
}
