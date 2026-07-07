"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    BarChart3,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock3,
    Eye,
    Pencil,
    Plus,
    Target,
    TrendingUp,
    Trash2,
    UsersRound,
    UserX,
    X,
} from "lucide-react";
import { AppShell } from "@/features/app-shell/components";
import {
    Box,
    Button,
    CardSurface,
    FieldLabel,
    InlineIcon,
    SelectInput,
    Text,
    TextInput,
} from "@/lib/ui/atoms";
import { GroupedTableSectionHeader } from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import {
    getUserRoleLabel,
    getUserStatusLabel,
    type PlatformRole,
    type UserAssignedQuiz,
    type UserAssignedRoleplay,
    type UserAssignmentStatus,
    type UserListItem,
    type UserRole,
    type UserSkillProgress,
    type UserStatistics,
    USER_ROLE_OPTIONS,
    type UserStatus,
} from "@/features/users/domain/users";
import type { UserAssignedGroup, UserAvailableGroup, UserGroupsResult } from "@/features/users/domain/user-groups";
import { AddUserGroupDialog, RemoveUserGroupDialog } from "./UserGroupDialogs";

type UserDetailTab = "profile" | "groups" | "roleplays" | "evaluations" | "statistics" | "skills";

interface UserDetailPageProps {
    assignedQuizzes?: UserAssignedQuiz[];
    assignedRoleplays?: UserAssignedRoleplay[];
    avatarUrl: string | null;
    initialMode?: "edit" | "view";
    initials: string;
    platformRole: PlatformRole;
    skills?: UserSkillProgress[];
    statistics?: UserStatistics;
    user: UserListItem;
}

interface DetailFormValues {
    city: string;
    email: string;
    firstName: string;
    group: string;
    lastName: string;
    organization: string;
    phone: string;
    role: UserRole;
    status: UserStatus;
    username: string;
}

const tabs: Array<{ id: UserDetailTab; label: string }> = [
    { id: "profile", label: "Informations de base" },
    { id: "groups", label: "Groupes" },
    { id: "roleplays", label: "Roleplays" },
    { id: "evaluations", label: "Évaluations" },
    { id: "statistics", label: "Statistiques" },
    { id: "skills", label: "Compétences" },
];

const emptyUserStatistics: UserStatistics = {
    averageQuizScore: "N/A",
    averageRoleplayScore: "N/A",
    bestRoleplayScore: "N/A",
    completedQuizzes: "0/0",
    completedRoleplays: "0/0",
    completionRate: "N/A",
    lastActivity: "Aucune",
    latestRoleplayScore: "N/A",
    quizVsRoleplayGap: "N/A",
    roleplayProgressLast30Days: "N/A",
    roleplayProgressSinceFirst: "N/A",
    targetScore: "80%",
    targetScoreGap: "N/A",
    topMasteredSkills: [],
    topSkillsToImprove: [],
    trainingTime: "0min",
};

function splitName(name: string) {
    const [firstName = "", ...rest] = name.split(" ");

    return {
        firstName,
        lastName: rest.join(" "),
    };
}

function getInitials(firstName: string, lastName: string) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getUsernameFromEmail(email: string) {
    return email.split("@")[0] ?? email;
}

function getFormValuesFromUser(user: UserListItem): DetailFormValues {
    const { firstName, lastName } = splitName(user.name);

    return {
        city: user.city,
        email: user.email,
        firstName,
        group: user.group,
        lastName,
        organization: user.organization,
        phone: user.phone,
        role: user.role,
        status: user.status,
        username: getUsernameFromEmail(user.email),
    };
}

interface ApiValidationIssue {
    message: string;
    path: Array<string | number>;
}

interface ApiErrorPayload {
    error?: string;
    issues?: ApiValidationIssue[];
}

function getApiErrorMessage(payload: ApiErrorPayload | null, fallback: string) {
    const validationMessage = payload?.issues?.map((issue) => issue.message).join(" ");

    return validationMessage || payload?.error || fallback;
}

function normalizeUserGroupsPayload(payload: UserGroupsResult | null): UserGroupsResult {
    return {
        availableGroups: payload?.availableGroups ?? [],
        groups: payload?.groups ?? [],
    };
}

function getStatusClasses(status: UserStatus) {
    if (status === "active") return "bg-[#DDF8E6] text-[#17A34A]";
    if (status === "pending") return "bg-[#FFF3D6] text-[#B77900]";
    return "bg-[#F1F2F5] text-[#697184]";
}

function StatusBadge({ status }: { status: UserStatus }) {
    return (
        <Box className={`inline-flex h-[28px] items-center rounded-[9px] px-3 text-[13px] font-bold ${getStatusClasses(status)}`}>
            {getUserStatusLabel(status)}
        </Box>
    );
}

function RolePill({ role }: { role: UserRole }) {
    return (
        <Box className="inline-flex h-[28px] items-center rounded-[8px] border border-[#CBD2DC] bg-white px-3 text-[13px] font-semibold text-[#344054]">
            {getUserRoleLabel(role)}
        </Box>
    );
}

function GroupChip({ label }: { label: string }) {
    return (
        <Box className="inline-flex h-[28px] items-center rounded-full border border-[#C8D2FF] bg-[#E8ECFF] px-4 text-[13px] font-extrabold text-[#5140F0]">
            {label}
        </Box>
    );
}

function PersonaPill({ label }: { label: string }) {
    return (
        <Box className="inline-flex items-center rounded-full border border-[#D9DEF0] bg-[#F1F3FB] px-3 py-1 text-[13px] font-semibold text-[#3B4358]">
            {label}
        </Box>
    );
}

function QuizTypePill({ label }: { label: string }) {
    return (
        <Box className="inline-flex items-center rounded-lg bg-[#E8ECFF] px-3 py-1 text-[13px] font-semibold text-[#5140F0]">
            {label}
        </Box>
    );
}

function ScoreBadge({ score }: { score: number | null }) {
    if (score === null) {
        return <Text className="text-[15px] font-semibold text-[#9AA2B2]">—</Text>;
    }

    const isStrong = score >= 80;

    return (
        <Box
            className={[
                "inline-flex h-7 items-center justify-center rounded-[8px] px-2.5 text-[13px] font-extrabold",
                isStrong ? "bg-[#D9FBE8] text-[#048A45]" : "bg-[#FFF1C8] text-[#C76000]",
            ].join(" ")}
        >
            {score}%
        </Box>
    );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
    return (
        <Box>
            <Text className="text-[15px] font-extrabold leading-6 text-[#171B2A]">{label}</Text>
            <Text className="mt-1.5 text-[15px] font-semibold leading-6 text-[#4F5868]">{value || "-"}</Text>
        </Box>
    );
}

function PasswordBlock() {
    return (
        <Box>
            <Text className="text-[15px] font-extrabold leading-6 text-[#171B2A]">Mot de passe</Text>
            <Box className="mt-1.5 flex items-center gap-3 text-[#4F5868]">
                <Text className="text-[15px] font-semibold leading-6 tracking-[0.16em]">••••••••••••</Text>
                <Button
                    aria-label="Afficher"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8C94A4] transition hover:bg-[#F2F3FF] hover:text-[#5140F0]"
                >
                    <InlineIcon icon={Eye} className="h-4 w-4" />
                </Button>
            </Box>
        </Box>
    );
}

function DetailInput({
    id,
    label,
    onChange,
    type = "text",
    value,
}: {
    id: string;
    label: string;
    onChange: (value: string) => void;
    type?: "email" | "text";
    value: string;
}) {
    return (
        <Box className="space-y-2">
            <FieldLabel htmlFor={id} className="text-[14px] font-extrabold text-[#171B2A]">
                {label}
            </FieldLabel>
            <TextInput
                id={id}
                hasLeadingIcon={false}
                onChange={(event) => onChange(event.target.value)}
                type={type}
                value={value}
                className="h-10 rounded-[8px] border border-[#D6DAE3] bg-white text-[14px] font-semibold text-[#4F5868] shadow-none"
            />
        </Box>
    );
}

function DetailSelect({
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
            <FieldLabel htmlFor={id} className="text-[14px] font-extrabold text-[#171B2A]">
                {label}
            </FieldLabel>
            <Box className="relative">
                <SelectInput
                    id={id}
                    onChange={(event) => onChange(event.target.value)}
                    value={value}
                    className="h-10 rounded-[8px] border border-[#D6DAE3] bg-white text-[14px] font-semibold text-[#4F5868] shadow-none"
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </SelectInput>
                <InlineIcon
                    icon={ChevronDown}
                    className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8C94A4]"
                />
            </Box>
        </Box>
    );
}

function ProfileTab({
    currentUser,
    draft,
    groups,
    isEditing,
    onDraftChange,
    quizCount,
    roleplayCount,
}: {
    currentUser: UserListItem;
    draft: DetailFormValues;
    groups: UserAssignedGroup[];
    isEditing: boolean;
    onDraftChange: (field: keyof DetailFormValues, value: string) => void;
    quizCount: number;
    roleplayCount: number;
}) {
    return (
        <Box className="px-6 pb-7 pt-7 md:px-7">
            <Text as="h2" className="text-[20px] font-extrabold tracking-[-0.02em] text-[#171B2A]">
                Informations de base
            </Text>

            <Box className="mt-6 grid gap-6 xl:grid-cols-[112px_minmax(0,1fr)]">
                <Box className="flex h-[92px] w-[92px] items-center justify-center rounded-full bg-[#E4E6EB] text-[#344054]">
                    <Text as="span" className="text-[24px] font-extrabold tracking-[-0.02em]">
                        {currentUser.initials}
                    </Text>
                </Box>

                <Box className="grid gap-x-20 gap-y-6 lg:grid-cols-2">
                    {isEditing ? (
                        <>
                            <DetailInput
                                id="detail-first-name"
                                label="Prénom"
                                onChange={(value) => onDraftChange("firstName", value)}
                                value={draft.firstName}
                            />
                            <DetailInput
                                id="detail-last-name"
                                label="Nom"
                                onChange={(value) => onDraftChange("lastName", value)}
                                value={draft.lastName}
                            />
                            <DetailInput
                                id="detail-email"
                                label="Email"
                                onChange={(value) => onDraftChange("email", value)}
                                type="email"
                                value={draft.email}
                            />
                            <InfoBlock label="Entreprise" value={draft.organization} />
                            <DetailSelect
                                id="detail-role"
                                label="Rôle"
                                onChange={(value) => onDraftChange("role", value)}
                                options={USER_ROLE_OPTIONS}
                                value={draft.role}
                            />
                            <Box>
                                <Text className="text-[15px] font-extrabold leading-6 text-[#171B2A]">Statut</Text>
                                <Box className="mt-2">
                                    <StatusBadge status={draft.status} />
                                </Box>
                            </Box>
                        </>
                    ) : (
                        <>
                            <InfoBlock label="Prénom" value={splitName(currentUser.name).firstName} />
                            <InfoBlock label="Nom" value={splitName(currentUser.name).lastName} />
                            <InfoBlock label="Email" value={currentUser.email} />
                            <InfoBlock label="Entreprise" value={currentUser.organization} />
                            <Box>
                                <Text className="text-[15px] font-extrabold leading-6 text-[#171B2A]">Rôle</Text>
                                <Box className="mt-2">
                                    <RolePill role={currentUser.role} />
                                </Box>
                            </Box>
                            <Box>
                                <Text className="text-[15px] font-extrabold leading-6 text-[#171B2A]">Statut</Text>
                                <Box className="mt-2">
                                    <StatusBadge status={currentUser.status} />
                                </Box>
                            </Box>
                        </>
                    )}

                    <InfoBlock label="Roleplays" value={`${roleplayCount} roleplays`} />
                    <InfoBlock label="Évaluations" value={`${quizCount} quizzes`} />

                    <Box className="lg:col-span-2">
                        <Text className="text-[15px] font-extrabold leading-6 text-[#171B2A]">Groupe(s)</Text>
                        <Box className="mt-3 flex flex-wrap gap-2.5">
                            {groups.length > 0 ? (
                                groups.map((group) => (
                                    <GroupChip key={group.id} label={group.name} />
                                ))
                            ) : (
                                <Text className="text-[14px] font-semibold text-[#8C94A4]">Aucun groupe assigné</Text>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Box className="mt-8 border-t border-[#DDE1E8] pt-7">
                <Text as="h3" className="text-[20px] font-extrabold tracking-[-0.02em] text-[#171B2A]">
                    Dates importantes
                </Text>
                <Box className="mt-5 grid gap-7 lg:grid-cols-2">
                    <InfoBlock label="Date d'inscription" value={currentUser.joinedAt} />
                    <InfoBlock label="Dernière connexion" value={currentUser.lastActiveAt} />
                </Box>
            </Box>

            <Box className="mt-8 border-t border-[#DDE1E8] pt-7">
                <Text as="h3" className="text-[20px] font-extrabold tracking-[-0.02em] text-[#171B2A]">
                    Identifiants de connexion
                </Text>
                <Box className="mt-5 grid gap-7 lg:grid-cols-2">
                    {isEditing ? (
                        <DetailInput
                            id="detail-username"
                            label="Nom d'utilisateur"
                            onChange={(value) => onDraftChange("username", value)}
                            value={draft.username}
                        />
                    ) : (
                        <InfoBlock label="Nom d'utilisateur" value={getUsernameFromEmail(currentUser.email)} />
                    )}
                    <PasswordBlock />
                </Box>
            </Box>
        </Box>
    );
}

function SectionHeading({
    action,
    title,
}: {
    action?: ReactNode;
    title: string;
}) {
    return (
        <Box className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Text as="h2" className="text-[19px] font-extrabold tracking-[-0.02em] text-[#171B2A]">
                {title}
            </Text>
            {action}
        </Box>
    );
}

function LightActionButton({
    children,
    disabled = false,
    onClick,
}: {
    children: ReactNode;
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <Button
            disabled={disabled}
            onClick={onClick}
            className="inline-flex h-10 items-center justify-center gap-3 rounded-[10px] bg-[#EEF2FF] px-5 text-[15px] font-extrabold text-[#5140F0] transition hover:bg-[#E5EAFF] disabled:cursor-not-allowed disabled:opacity-60"
        >
            <InlineIcon icon={Plus} className="h-5 w-5" />
            {children}
        </Button>
    );
}

function IconGroupBadge() {
    return (
        <Box className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#E6EBFF] text-[#5140F0]">
            <InlineIcon icon={UsersRound} className="h-5 w-5" />
        </Box>
    );
}

function GroupsTab({
    error,
    groups,
    isActionPending,
    isLoading,
    onAddGroup,
    onRemoveGroup,
}: {
    error: string | null;
    groups: UserAssignedGroup[];
    isActionPending: boolean;
    isLoading: boolean;
    onAddGroup: () => void;
    onRemoveGroup: (group: UserAssignedGroup) => void;
}) {
    const columns = ["Groupe", "Description", "Date d'assignation", "Actions"];

    return (
        <Box className="px-6 pb-7 pt-7 md:px-7">
            <SectionHeading
                title="Groupes assignés"
                action={<LightActionButton disabled={isLoading || isActionPending} onClick={onAddGroup}>Ajouter au groupe</LightActionButton>}
            />

            {error && (
                <Box
                    aria-live="polite"
                    className="mb-5 rounded-lg border border-[#F3C7C7] bg-[#FFF4F4] px-4 py-3 text-[13px] font-semibold text-[#A43A3A]"
                >
                    {error}
                </Box>
            )}

            <Box className="overflow-hidden rounded-[12px] border border-[#E1E4EB]">
                <Box className="overflow-x-auto">
                    <Box as="table" className="w-full min-w-[920px] border-collapse">
                        <Box as="thead">
                            <Box as="tr" className="h-[48px] border-b border-[#E6E9F0] bg-[#F7F8FA]">
                                {columns.map((column) => (
                                    <Box
                                        as="th"
                                        key={column}
                                        className="px-7 text-left text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#737B8E]"
                                    >
                                        {column}
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                        <Box as="tbody">
                            {isLoading && (
                                <Box as="tr">
                                    <Box as="td" colSpan={columns.length} className="px-7 py-12 text-center">
                                        <Text className="text-[14px] font-semibold text-[#737B8E]">
                                            Chargement des groupes...
                                        </Text>
                                    </Box>
                                </Box>
                            )}

                            {!isLoading && groups.map((group) => (
                                <Box as="tr" key={group.id} className="border-b border-[#EEF0F4] last:border-b-0">
                                    <Box as="td" className="px-7 py-[17px]">
                                        <Box className="flex items-center gap-4">
                                            <IconGroupBadge />
                                            <Text className="text-[15px] font-extrabold text-[#171B2A]">{group.name}</Text>
                                        </Box>
                                    </Box>
                                    <Box as="td" className="px-7 py-[17px]">
                                        <Text className="text-[15px] font-semibold text-[#4F5868]">{group.description}</Text>
                                    </Box>
                                    <Box as="td" className="px-7 py-[17px]">
                                        <Text className="text-[15px] font-semibold text-[#4F5868]">{group.assignedAt}</Text>
                                    </Box>
                                    <Box as="td" className="px-7 py-[17px]">
                                        <Button
                                            disabled={isActionPending}
                                            onClick={() => onRemoveGroup(group)}
                                            className="inline-flex items-center gap-2 text-[15px] font-extrabold text-[#F00613] transition hover:text-[#C8000B] disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <InlineIcon icon={Trash2} className="h-4 w-4" />
                                            Retirer
                                        </Button>
                                    </Box>
                                </Box>
                            ))}

                            {!isLoading && groups.length === 0 && (
                                <Box as="tr">
                                    <Box as="td" colSpan={columns.length} className="px-7 py-12 text-center">
                                        <Text className="text-[14px] font-bold text-[#171B2A]">
                                            Aucun groupe assigné
                                        </Text>
                                        <Text className="mt-2 text-[14px] font-semibold text-[#A0A6B5]">
                                            Ajoutez cet utilisateur à un groupe de son organisation.
                                        </Text>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

function RoleplaysTab({
    onAssign,
    roleplays,
}: {
    onAssign: () => void;
    roleplays: UserAssignedRoleplay[];
}) {
    const [collapsedSections, setCollapsedSections] = useState<Record<UserAssignmentStatus, boolean>>({
        completed: false,
        in_progress: false,
        not_started: false,
    });
    const notStarted = roleplays.filter((roleplay) => roleplay.status === "not_started");
    const inProgress = roleplays.filter((roleplay) => roleplay.status === "in_progress");
    const completed = roleplays.filter((roleplay) => roleplay.status === "completed");
    const sections: Array<{ items: UserAssignedRoleplay[]; label: string; status: UserAssignmentStatus }> = [
        { items: notStarted, label: "Roleplays non commencés", status: "not_started" },
        { items: inProgress, label: "Roleplays en cours", status: "in_progress" },
        { items: completed, label: "Roleplays terminés", status: "completed" },
    ];

    const toggleSection = (status: UserAssignmentStatus) => {
        setCollapsedSections((current) => ({
            ...current,
            [status]: !current[status],
        }));
    };

    const renderRows = (items: UserAssignedRoleplay[]) =>
        items.map((roleplay) => (
            <Box as="tr" key={roleplay.id} className="border-b border-[#EEF0F4] last:border-b-0">
                <Box as="td" className="px-7 py-[17px]">
                    <Text className="text-[15px] font-extrabold text-[#171B2A]">{roleplay.title}</Text>
                </Box>
                <Box as="td" className="px-7 py-[17px]">
                    <PersonaPill label={roleplay.persona} />
                </Box>
                <Box as="td" className="px-7 py-[17px]">
                    <ScoreBadge score={roleplay.score} />
                </Box>
                <Box as="td" className="px-7 py-[17px]">
                    <Text className="text-[15px] font-semibold text-[#4F5868]">
                        {roleplay.sessions} session{roleplay.sessions > 1 ? "s" : ""}
                    </Text>
                </Box>
                <Box as="td" className="px-7 py-[17px]">
                    <Text className="text-[15px] font-semibold text-[#4F5868]">{roleplay.assignedAt}</Text>
                </Box>
            </Box>
        ));

    return (
        <Box className="px-6 pb-7 pt-7 md:px-7">
            <SectionHeading
                title="Roleplays assignés"
                action={<LightActionButton onClick={onAssign}>Assigner un roleplay</LightActionButton>}
            />

            <Box className="overflow-hidden rounded-[12px] border border-[#DDE1E8]">
                <Box className="overflow-x-auto">
                    <Box as="table" className="w-full min-w-[1000px] border-collapse">
                        <Box as="thead">
                            <Box as="tr" className="h-[48px] border-b border-[#E3E6EE] bg-[#F7F8FA]">
                                {["Roleplay", "Persona", "Score", "Sessions", "Date d'assignation"].map((column) => (
                                    <Box
                                        as="th"
                                        key={column}
                                        className="px-7 text-left text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#737B8E]"
                                    >
                                        {column}
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                        <Box as="tbody">
                            {sections.map((section) => (
                                <Fragment key={section.status}>
                                    <GroupedTableSectionHeader
                                        colSpan={5}
                                        count={section.items.length}
                                        isCollapsed={collapsedSections[section.status]}
                                        label={section.label}
                                        onToggle={() => toggleSection(section.status)}
                                    />
                                    {!collapsedSections[section.status] && renderRows(section.items)}
                                </Fragment>
                            ))}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

function EvaluationsTab({
    onAssign,
    quizzes,
}: {
    onAssign: () => void;
    quizzes: UserAssignedQuiz[];
}) {
    const [collapsedSections, setCollapsedSections] = useState<Record<UserAssignmentStatus, boolean>>({
        completed: false,
        in_progress: false,
        not_started: false,
    });
    const notStarted = quizzes.filter((quiz) => quiz.status === "not_started");
    const inProgress = quizzes.filter((quiz) => quiz.status === "in_progress");
    const completed = quizzes.filter((quiz) => quiz.status === "completed");
    const sections: Array<{ items: UserAssignedQuiz[]; label: string; status: UserAssignmentStatus }> = [
        { items: notStarted, label: "Quizzes non commencés", status: "not_started" },
        { items: inProgress, label: "Quizzes en cours", status: "in_progress" },
        { items: completed, label: "Quizzes terminés", status: "completed" },
    ];

    const toggleSection = (status: UserAssignmentStatus) => {
        setCollapsedSections((current) => ({
            ...current,
            [status]: !current[status],
        }));
    };

    const renderRows = (items: UserAssignedQuiz[]) =>
        items.map((quiz) => (
            <Box as="tr" key={quiz.id} className="border-b border-[#EEF0F4] last:border-b-0">
                <Box as="td" className="px-7 py-[17px]">
                    <Text className="text-[15px] font-extrabold text-[#171B2A]">{quiz.title}</Text>
                </Box>
                <Box as="td" className="px-7 py-[17px]">
                    <QuizTypePill label={quiz.type} />
                </Box>
                <Box as="td" className="px-7 py-[17px]">
                    <Text className="text-[15px] font-semibold text-[#4F5868]">
                        {quiz.attempts} tentative{quiz.attempts > 1 ? "s" : ""}
                    </Text>
                </Box>
                <Box as="td" className="px-7 py-[17px]">
                    <ScoreBadge score={quiz.score} />
                </Box>
                <Box as="td" className="px-7 py-[17px]">
                    <Text className="text-[15px] font-semibold text-[#4F5868]">{quiz.assignedAt}</Text>
                </Box>
            </Box>
        ));

    return (
        <Box className="px-6 pb-7 pt-7 md:px-7">
            <SectionHeading
                title="Quizzes assignés"
                action={<LightActionButton onClick={onAssign}>Assigner un quiz</LightActionButton>}
            />

            <Box className="overflow-hidden rounded-[12px] border border-[#DDE1E8]">
                <Box className="overflow-x-auto">
                    <Box as="table" className="w-full min-w-[1000px] border-collapse">
                        <Box as="thead">
                            <Box as="tr" className="h-[48px] border-b border-[#E3E6EE] bg-[#F7F8FA]">
                                {["Titre du quiz", "Type", "Tentatives", "Score", "Date d'assignation"].map((column) => (
                                    <Box
                                        as="th"
                                        key={column}
                                        className="px-7 text-left text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#737B8E]"
                                    >
                                        {column}
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                        <Box as="tbody">
                            {sections.map((section) => (
                                <Fragment key={section.status}>
                                    <GroupedTableSectionHeader
                                        colSpan={5}
                                        count={section.items.length}
                                        isCollapsed={collapsedSections[section.status]}
                                        label={section.label}
                                        onToggle={() => toggleSection(section.status)}
                                    />
                                    {!collapsedSections[section.status] && renderRows(section.items)}
                                </Fragment>
                            ))}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

const statToneClasses: Record<string, string> = {
    amber: "bg-[#FEF0CD] text-[#C98A00]",
    blue: "bg-[#DCE9FF] text-[#245DFF]",
    cyan: "bg-[#D4F5F2] text-[#0E9E94]",
    green: "bg-[#DCFCE7] text-[#17A34A]",
    orange: "bg-[#FFE7D6] text-[#E2640E]",
    purple: "bg-[#F2E2FF] text-[#B139FF]",
};

function StatTile({
    badge,
    icon,
    label,
    tone,
    value,
}: {
    badge?: string;
    icon: typeof BarChart3;
    label: string;
    tone: keyof typeof statToneClasses;
    value: string;
}) {
    return (
        <Box className="rounded-[12px] border border-[#E1E4EB] bg-white p-5">
            <Box className={`mb-5 flex h-10 w-10 items-center justify-center rounded-lg ${statToneClasses[tone]}`}>
                <InlineIcon icon={icon} className="h-5 w-5" />
            </Box>
            <Box className="flex items-baseline gap-2">
                <Text className="text-[24px] font-extrabold tracking-[-0.03em] text-[#171B2A]">{value}</Text>
                {badge && <Text className="text-[12px] font-bold text-[#E2640E]">{badge}</Text>}
            </Box>
            <Text className="mt-2 text-[14px] font-semibold text-[#697184]">{label}</Text>
        </Box>
    );
}

const progressionTones = {
    blue: { bg: "bg-[#EAF1FF]", icon: "bg-[#D4E2FF] text-[#245DFF]", value: "text-[#245DFF]" },
    green: { bg: "bg-[#EAFBF1]", icon: "bg-[#CFF5DE] text-[#0E9E5B]", value: "text-[#0E9E5B]" },
    grey: { bg: "bg-[#F4F5F8]", icon: "bg-[#E4E7EE] text-[#697184]", value: "text-[#697184]" },
} as const;

function ProgressionTile({
    label,
    subtitle,
    tone,
    value,
}: {
    label: string;
    subtitle?: string;
    tone: keyof typeof progressionTones;
    value: string;
}) {
    const styles = progressionTones[tone];

    return (
        <Box className={`rounded-[12px] p-5 ${styles.bg}`}>
            <Box className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${styles.icon}`}>
                <InlineIcon icon={TrendingUp} className="h-5 w-5" />
            </Box>
            <Text className={`text-[24px] font-extrabold tracking-[-0.03em] ${styles.value}`}>{value}</Text>
            <Text className="mt-2 text-[14px] font-semibold text-[#697184]">
                {label}
                {subtitle && <Text as="span" className="text-[#9AA2B2]"> {subtitle}</Text>}
            </Text>
        </Box>
    );
}

function StatGroupTitle({ children }: { children: ReactNode }) {
    return (
        <Text as="h3" className="mb-4 text-[13px] font-extrabold uppercase tracking-[0.12em] text-[#737B8E]">
            {children}
        </Text>
    );
}

function TopSkillCard({
    items,
    title,
    tone,
}: {
    items: Array<{ label: string; score: number }>;
    title: string;
    tone: "green" | "orange";
}) {
    const dotClass = tone === "green" ? "bg-[#10C55B]" : "bg-[#F46E12]";
    const badgeClass = tone === "green" ? "bg-[#D9FBE8] text-[#048A45]" : "bg-[#FFF1C8] text-[#C76000]";

    return (
        <Box className="rounded-[12px] border border-[#E1E4EB] bg-white p-5">
            <Box className="mb-4 flex items-center gap-2.5">
                <Box className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
                <Text className="text-[15px] font-extrabold text-[#171B2A]">{title}</Text>
            </Box>
            <Box className="space-y-3">
                {items.length > 0 ? (
                    items.map((item) => (
                        <Box key={item.label} className="flex items-center justify-between">
                            <Text className="text-[14px] font-semibold text-[#4F5868]">{item.label}</Text>
                            <Box className={`inline-flex h-7 items-center justify-center rounded-[8px] px-2.5 text-[13px] font-extrabold ${badgeClass}`}>
                                {item.score}%
                            </Box>
                        </Box>
                    ))
                ) : (
                    <Text className="text-[14px] font-semibold text-[#8C94A4]">Aucune donnée disponible</Text>
                )}
            </Box>
        </Box>
    );
}

function StatisticsTab({ statistics }: { statistics: UserStatistics }) {
    return (
        <Box className="space-y-8 px-6 pb-7 pt-7 md:px-7">
            <Box>
                <StatGroupTitle>Engagement</StatGroupTitle>
                <Box className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <StatTile icon={Clock3} label="Temps d'entraînement" tone="blue" value={statistics.trainingTime} />
                    <StatTile icon={CheckCircle2} label="Roleplays terminés" tone="green" value={statistics.completedRoleplays} />
                    <StatTile icon={CheckCircle2} label="Quizzes terminés" tone="cyan" value={statistics.completedQuizzes} />
                    <StatTile icon={BarChart3} label="Taux de complétion" tone="amber" value={statistics.completionRate} />
                    <StatTile icon={Clock3} label="Dernière activité" tone="purple" value={statistics.lastActivity} />
                </Box>
            </Box>

            <Box>
                <StatGroupTitle>Performance</StatGroupTitle>
                <Box className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <StatTile icon={TrendingUp} label="Score moyen roleplays" tone="orange" value={statistics.averageRoleplayScore} />
                    <StatTile icon={TrendingUp} label="Score moyen quizzes" tone="blue" value={statistics.averageQuizScore} />
                    <StatTile icon={TrendingUp} label="Meilleur score roleplay" tone="green" value={statistics.bestRoleplayScore} />
                    <StatTile icon={TrendingUp} label="Dernier score roleplay" tone="orange" value={statistics.latestRoleplayScore} />
                    <StatTile badge={statistics.targetScoreGap} icon={Target} label="Score cible" tone="green" value={statistics.targetScore} />
                </Box>
            </Box>

            <Box>
                <StatGroupTitle>Progression</StatGroupTitle>
                <Box className="grid gap-4 md:grid-cols-3">
                    <ProgressionTile
                        label="Progression roleplay depuis la première tentative"
                        tone="green"
                        value={statistics.roleplayProgressSinceFirst}
                    />
                    <ProgressionTile
                        label="Progression roleplay sur les 30 derniers jours"
                        tone="blue"
                        value={statistics.roleplayProgressLast30Days}
                    />
                    <ProgressionTile
                        label="Écart Quiz vs Roleplay"
                        subtitle="(Écart théorie / pratique)"
                        tone="grey"
                        value={statistics.quizVsRoleplayGap}
                    />
                </Box>
            </Box>

            <Box>
                <StatGroupTitle>Compétences</StatGroupTitle>
                <Box className="grid gap-4 md:grid-cols-2">
                    <TopSkillCard
                        title="Top 3 compétences maîtrisées"
                        tone="green"
                        items={statistics.topMasteredSkills}
                    />
                    <TopSkillCard
                        title="Top 3 compétences à renforcer"
                        tone="orange"
                        items={statistics.topSkillsToImprove}
                    />
                </Box>
            </Box>
        </Box>
    );
}

type SkillDimensionView = UserSkillProgress["dimensions"][number];
type SkillDimensionItemView = UserSkillProgress["items"][number];

const skillDimensionToneClasses: Record<SkillDimensionView["key"], string> = {
    savoir: uiTokens.tone.info.soft,
    savoir_etre: uiTokens.tone.success.soft,
    savoir_faire: uiTokens.tone.primary.soft,
};

const skillDimensionLabels: Record<SkillDimensionItemView["dimension"], string> = {
    savoir: "Savoir",
    savoir_etre: "Savoir-être",
    savoir_faire: "Savoir-faire",
};

function formatSkillProgress(score: number | null) {
    return score === null ? "N/A" : `${score}%`;
}

function formatSkillDelta(delta: number | null) {
    if (delta === null) return "N/A";
    if (delta > 0) return `+${delta}%`;
    if (delta < 0) return `${delta}%`;
    return "0%";
}

function getProgressWidth(score: number | null) {
    if (score === null) return 0;
    return Math.max(0, Math.min(100, score));
}

function SkillDimensionSummary({ dimension }: { dimension: SkillDimensionView }) {
    return (
        <Box className={`inline-flex h-8 min-w-[124px] items-center justify-center gap-2 rounded-[9px] border px-3 text-[13px] font-extrabold ${skillDimensionToneClasses[dimension.key]}`}>
            <Text as="span" className="truncate">
                {dimension.label}
            </Text>
            <Text as="span" className="shrink-0">
                {formatSkillProgress(dimension.score)}
            </Text>
        </Box>
    );
}

function SkillItemProgressBar({ score }: { score: number | null }) {
    return (
        <Box className={uiTokens.progress.track}>
            <Box className={uiTokens.progress.fill} style={{ width: `${getProgressWidth(score)}%` }} />
        </Box>
    );
}

function SkillItemRow({ item }: { item: SkillDimensionItemView }) {
    return (
        <Box className={`grid gap-3 ${uiTokens.surface.mutedPanel} md:grid-cols-[140px_minmax(0,1fr)_64px_minmax(160px,220px)] md:items-center`}>
            <Box className={`inline-flex h-7 w-fit items-center rounded-[8px] border px-2.5 text-[12px] font-extrabold ${skillDimensionToneClasses[item.dimension]}`}>
                {skillDimensionLabels[item.dimension]}
            </Box>
            <Text className={`min-w-0 text-[14px] font-semibold leading-6 ${uiTokens.text.subtle}`}>
                {item.label}
            </Text>
            <Text className={`text-[14px] font-extrabold ${item.score === null ? uiTokens.text.muted : uiTokens.text.primary}`}>
                {formatSkillProgress(item.score)}
            </Text>
            <SkillItemProgressBar score={item.score} />
        </Box>
    );
}

function getSkillProgressTone(score: number | null) {
    if (score === null) return "neutral";
    return score >= 80 ? "success" : "warning";
}

function SkillScoreBadge({ score }: { score: number | null }) {
    const tone = getSkillProgressTone(score);
    const toneClass = tone === "success"
        ? uiTokens.tone.success.soft
        : tone === "warning"
            ? uiTokens.tone.warning.soft
            : uiTokens.tone.neutral.soft;

    return (
        <Box className={`inline-flex h-9 w-[62px] items-center justify-center rounded-[10px] border text-[15px] font-extrabold ${toneClass}`}>
            {formatSkillProgress(score)}
        </Box>
    );
}

function SkillProgressBar({ score }: { score: number | null }) {
    const tone = getSkillProgressTone(score);
    const fillColor = tone === "success"
        ? uiTokens.progression.level.green.fill
        : tone === "warning"
            ? uiTokens.progression.level.yellow.fill
            : "#D1D5DB";

    return (
        <Box className={uiTokens.progress.track}>
            <Box
                className={uiTokens.progress.fillBase}
                style={{
                    backgroundColor: fillColor,
                    width: `${getProgressWidth(score)}%`,
                }}
            />
        </Box>
    );
}

function SkillsTab({ skills }: { skills: UserSkillProgress[] }) {
    const [expandedSkillIds, setExpandedSkillIds] = useState<string[]>(() => skills[0] ? [skills[0].id] : []);

    const toggleSkill = (skillId: string) => {
        setExpandedSkillIds((current) =>
            current.includes(skillId)
                ? current.filter((id) => id !== skillId)
                : [...current, skillId],
        );
    };

    if (skills.length === 0) {
        return (
            <Box className="px-6 pb-7 pt-7 md:px-7">
                <Box className={uiTokens.surface.emptyState}>
                    <Text className={`text-[15px] font-extrabold ${uiTokens.text.heading}`}>
                        Aucune compétence évaluée
                    </Text>
                    <Text className={`mt-2 text-[14px] font-semibold ${uiTokens.text.muted}`}>
                        Les progressions apparaîtront après une session notée avec une scorecard reliée aux compétences.
                    </Text>
                </Box>
            </Box>
        );
    }

    return (
        <Box className="px-6 pb-7 pt-7 md:px-7">
            <Box className="overflow-hidden rounded-[12px] border border-[#E1E4EB]">
                <Box className="overflow-x-auto">
                    <Box as="table" className="w-full min-w-[1040px] border-collapse">
                        <Box as="thead">
                            <Box as="tr" className="h-[48px] border-b border-[#E6E9F0] bg-[#F7F8FA]">
                                <Box as="th" className="w-[26%] px-7 text-left text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#737B8E]">
                                    Compétence
                                </Box>
                                <Box as="th" className="px-7 text-left text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#737B8E]">
                                    Progression
                                </Box>
                            </Box>
                        </Box>
                        <Box as="tbody">
                            {skills.map((skill) => {
                                const isExpanded = expandedSkillIds.includes(skill.id);
                                const tone = getSkillProgressTone(skill.score);
                                const dotClass = tone === "success"
                                    ? uiTokens.progression.level.green.dot
                                    : tone === "warning"
                                        ? uiTokens.progression.level.yellow.dot
                                        : "bg-[#D1D5DB]";

                                return (
                                    <Fragment key={skill.id}>
                                        <Box
                                            as="tr"
                                            aria-expanded={isExpanded}
                                            className="cursor-pointer border-b border-[#EEF0F4] transition hover:bg-[#FBFCFE] last:border-b-0"
                                            onClick={() => toggleSkill(skill.id)}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter" || event.key === " ") {
                                                    event.preventDefault();
                                                    toggleSkill(skill.id);
                                                }
                                            }}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <Box as="td" className="px-7 py-[18px]">
                                                <Box className="flex items-center gap-4">
                                                    <Box className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
                                                    <Text className="max-w-[250px] text-[15px] font-extrabold leading-6 text-[#171B2A]">
                                                        {skill.label}
                                                    </Text>
                                                </Box>
                                            </Box>
                                            <Box as="td" className="px-7 py-[18px]">
                                                <Box className="grid grid-cols-[78px_minmax(180px,1fr)_92px_112px_58px_32px] items-center gap-4">
                                                    <SkillScoreBadge score={skill.score} />
                                                    <SkillProgressBar score={skill.score} />
                                                    <Text className="text-[13px] font-extrabold text-[#737B8E]">
                                                        Initial : {formatSkillProgress(skill.initialScore)}
                                                    </Text>
                                                    <Box className="inline-flex h-7 items-center justify-center rounded-[7px] bg-[#D9FBE8] px-3 text-[13px] font-extrabold text-[#057A3A]">
                                                        Acquis : {formatSkillProgress(skill.score)}
                                                    </Box>
                                                    <Text className="text-right text-[15px] font-extrabold text-[#009A94]">
                                                        {formatSkillDelta(skill.delta)}
                                                    </Text>
                                                    <Box className="flex h-8 w-8 items-center justify-center rounded-lg text-[#B7BDCB]">
                                                        <InlineIcon icon={isExpanded ? ChevronDown : ChevronRight} className="h-5 w-5" />
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Box>

                                        {isExpanded && (
                                            <Box as="tr" className="border-b border-[#EEF0F4] bg-[#FBFCFE]">
                                                <Box as="td" colSpan={2} className="px-7 py-5">
                                                    <Box className="space-y-3">
                                                        <Box className="flex min-w-0 flex-wrap gap-2 rounded-[12px] border border-[#E6E9F0] bg-white p-4">
                                                            {skill.dimensions.map((dimension) => (
                                                                <SkillDimensionSummary key={dimension.key} dimension={dimension} />
                                                            ))}
                                                        </Box>
                                                        {skill.items.length > 0 ? (
                                                            skill.items.map((item) => <SkillItemRow key={item.id} item={item} />)
                                                        ) : (
                                                            <Box className={uiTokens.surface.mutedPanel}>
                                                                <Text className={`text-[14px] font-semibold ${uiTokens.text.muted}`}>
                                                                    Aucun item actif rattaché à cette compétence.
                                                                </Text>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

export function UserDetailPage({
    assignedQuizzes: initialQuizzes = [],
    assignedRoleplays: initialRoleplays = [],
    avatarUrl,
    initialMode = "view",
    initials,
    platformRole,
    skills = [],
    statistics = emptyUserStatistics,
    user,
}: UserDetailPageProps) {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<UserListItem>(user);
    const [activeTab, setActiveTab] = useState<UserDetailTab>("profile");
    const [assignedGroups, setAssignedGroups] = useState<UserAssignedGroup[]>([]);
    const [availableGroups, setAvailableGroups] = useState<UserAvailableGroup[]>([]);
    const [isGroupsLoading, setIsGroupsLoading] = useState(true);
    const [groupsError, setGroupsError] = useState<string | null>(null);
    const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [groupPendingRemoval, setGroupPendingRemoval] = useState<UserAssignedGroup | null>(null);
    const [groupDialogError, setGroupDialogError] = useState<string | null>(null);
    const [isGroupActionPending, setIsGroupActionPending] = useState(false);
    const [assignedRoleplays] = useState<UserAssignedRoleplay[]>(initialRoleplays);
    const [assignedQuizzes] = useState<UserAssignedQuiz[]>(initialQuizzes);
    const [isEditing, setIsEditing] = useState(initialMode === "edit");
    const [draft, setDraft] = useState<DetailFormValues>(() => getFormValuesFromUser(user));

    const pageTitle = useMemo(() => "Détail de l'utilisateur", []);

    useEffect(() => {
        if (initialMode === "edit") {
            router.replace(`/users/${user.id}`, { scroll: false });
        }
    }, [initialMode, router, user.id]);

    const applyUserGroupsResult = useCallback((payload: UserGroupsResult | null) => {
        const nextGroupsPayload = normalizeUserGroupsPayload(payload);
        const groupLabel = nextGroupsPayload.groups.map((group) => group.name).join(", ");

        setAssignedGroups(nextGroupsPayload.groups);
        setAvailableGroups(nextGroupsPayload.availableGroups);
        setCurrentUser((current) => ({
            ...current,
            group: groupLabel,
        }));
        setDraft((current) => ({
            ...current,
            group: groupLabel,
        }));
    }, []);

    const loadUserGroups = useCallback(async () => {
        setIsGroupsLoading(true);
        setGroupsError(null);

        try {
            const response = await fetch(`/api/users/${user.id}/groups`, {
                headers: { Accept: "application/json" },
            });
            const payload = (await response.json().catch(() => null)) as UserGroupsResult | ApiErrorPayload | null;

            if (!response.ok) {
                setGroupsError(getApiErrorMessage(payload as ApiErrorPayload | null, "Impossible de charger les groupes."));
                return;
            }

            applyUserGroupsResult(payload as UserGroupsResult | null);
        } catch {
            setGroupsError("Impossible de charger les groupes.");
        } finally {
            setIsGroupsLoading(false);
        }
    }, [applyUserGroupsResult, user.id]);

    useEffect(() => {
        void loadUserGroups();
    }, [loadUserGroups]);

    const updateDraft = (field: keyof DetailFormValues, value: string) => {
        setDraft((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const startEditing = () => {
        setDraft(getFormValuesFromUser(currentUser));
        setActiveTab("profile");
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setDraft(getFormValuesFromUser(currentUser));
        setIsEditing(false);
    };

    const saveEditing = () => {
        const firstName = draft.firstName.trim();
        const lastName = draft.lastName.trim();
        const name = `${firstName} ${lastName}`.trim() || currentUser.name;

        setCurrentUser((current) => ({
            ...current,
            city: draft.city,
            email: draft.email,
            group: draft.group,
            initials: getInitials(firstName, lastName) || current.initials,
            name,
            organization: draft.organization,
            phone: draft.phone,
            role: draft.role,
            status: draft.status,
        }));
        setIsEditing(false);
    };

    const suspendUser = () => {
        setCurrentUser((current) => ({
            ...current,
            status: "inactive",
        }));
        setIsEditing(false);
    };

    const openAddGroupDialog = () => {
        setSelectedGroupId(availableGroups[0]?.id ?? "");
        setGroupDialogError(null);
        setIsAddGroupOpen(true);
    };

    const closeAddGroupDialog = () => {
        if (isGroupActionPending) {
            return;
        }

        setIsAddGroupOpen(false);
        setGroupDialogError(null);
        setSelectedGroupId("");
    };

    const assignSelectedGroup = async () => {
        if (!selectedGroupId || isGroupActionPending) {
            return;
        }

        setIsGroupActionPending(true);
        setGroupDialogError(null);

        try {
            const response = await fetch(`/api/users/${user.id}/groups`, {
                body: JSON.stringify({ groupId: selectedGroupId }),
                headers: { "Content-Type": "application/json" },
                method: "POST",
            });
            const payload = (await response.json().catch(() => null)) as UserGroupsResult | ApiErrorPayload | null;

            if (!response.ok) {
                setGroupDialogError(getApiErrorMessage(payload as ApiErrorPayload | null, "Impossible d'ajouter l'utilisateur au groupe."));
                return;
            }

            applyUserGroupsResult(payload as UserGroupsResult | null);
            setIsAddGroupOpen(false);
            setSelectedGroupId("");
        } catch {
            setGroupDialogError("Impossible d'ajouter l'utilisateur au groupe.");
        } finally {
            setIsGroupActionPending(false);
        }
    };

    const requestRemoveGroup = (group: UserAssignedGroup) => {
        setGroupPendingRemoval(group);
        setGroupDialogError(null);
    };

    const closeRemoveGroupDialog = () => {
        if (isGroupActionPending) {
            return;
        }

        setGroupPendingRemoval(null);
        setGroupDialogError(null);
    };

    const confirmRemoveGroup = async () => {
        if (!groupPendingRemoval || isGroupActionPending) {
            return;
        }

        setIsGroupActionPending(true);
        setGroupDialogError(null);

        try {
            const response = await fetch(`/api/users/${user.id}/groups`, {
                body: JSON.stringify({ groupId: groupPendingRemoval.id }),
                headers: { "Content-Type": "application/json" },
                method: "DELETE",
            });
            const payload = (await response.json().catch(() => null)) as UserGroupsResult | ApiErrorPayload | null;

            if (!response.ok) {
                setGroupDialogError(getApiErrorMessage(payload as ApiErrorPayload | null, "Impossible de retirer l'utilisateur du groupe."));
                return;
            }

            applyUserGroupsResult(payload as UserGroupsResult | null);
            setGroupPendingRemoval(null);
        } catch {
            setGroupDialogError("Impossible de retirer l'utilisateur du groupe.");
        } finally {
            setIsGroupActionPending(false);
        }
    };

    const assignRoleplay = () => undefined;

    const assignQuiz = () => undefined;

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
                    <Box className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <Box className="flex items-center gap-5">
                            <Link
                                href="/users"
                                aria-label="Retour aux utilisateurs"
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#111827] transition hover:bg-white"
                            >
                                <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                            </Link>
                            <Text as="h1" className="text-[26px] font-extrabold tracking-[-0.03em] text-[#171B2A]">
                                {pageTitle}
                            </Text>
                        </Box>

                        {isEditing ? (
                            <Box className="flex flex-wrap gap-4">
                                <Button
                                    onClick={cancelEditing}
                                    className="flex h-[42px] items-center justify-center gap-2.5 rounded-[10px] border border-[#DADDE4] bg-white px-5 text-[15px] font-extrabold text-[#111827] transition hover:bg-[#F7F8FB]"
                                >
                                    <InlineIcon icon={X} className="h-5 w-5" />
                                    Annuler
                                </Button>
                                <Button
                                    onClick={saveEditing}
                                    className="flex h-[42px] items-center justify-center gap-2.5 rounded-[10px] bg-[#5140F0] px-5 text-[15px] font-extrabold text-white shadow-[0_12px_24px_rgba(81,64,240,0.22)] transition hover:bg-[#4635E7]"
                                >
                                    <InlineIcon icon={Check} className="h-5 w-5" />
                                    Sauvegarder
                                </Button>
                            </Box>
                        ) : (
                            <Box className="flex flex-wrap gap-4">
                                <Button
                                    onClick={startEditing}
                                    className="flex h-[42px] items-center justify-center gap-3 rounded-[10px] bg-[#5140F0] px-5 text-[15px] font-extrabold text-white shadow-[0_12px_24px_rgba(81,64,240,0.22)] transition hover:bg-[#4635E7]"
                                >
                                    <InlineIcon icon={Pencil} className="h-5 w-5" />
                                    Modifier
                                </Button>
                                <Button
                                    onClick={suspendUser}
                                    className="flex h-[42px] items-center justify-center gap-3 rounded-[10px] bg-[#F00613] px-5 text-[15px] font-extrabold text-white shadow-[0_12px_24px_rgba(240,6,19,0.18)] transition hover:bg-[#D90510]"
                                >
                                    <InlineIcon icon={UserX} className="h-5 w-5" />
                                    Suspendre
                                </Button>
                            </Box>
                        )}
                    </Box>

                    <CardSurface className="overflow-hidden rounded-[16px] border border-[#DDE1E8] shadow-none">
                        <Box className="overflow-x-auto border-b border-[#DDE1E8]">
                            <Box className="flex min-w-[760px]">
                                {tabs.map((tab) => {
                                    const isActive = activeTab === tab.id;

                                    return (
                                        <Button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={[
                                                "relative flex h-[58px] items-center justify-center px-7 text-[15px] font-extrabold transition",
                                                isActive
                                                    ? "text-[#5140F0] after:absolute after:bottom-0 after:left-7 after:right-7 after:h-[2px] after:rounded-full after:bg-[#5140F0]"
                                                    : "text-[#697184] hover:bg-[#FBFCFE] hover:text-[#171B2A]",
                                            ].join(" ")}
                                        >
                                            {tab.label}
                                        </Button>
                                    );
                                })}
                            </Box>
                        </Box>

                        {activeTab === "profile" && (
                            <ProfileTab
                                currentUser={currentUser}
                                draft={draft}
                                groups={assignedGroups}
                                isEditing={isEditing}
                                onDraftChange={updateDraft}
                                quizCount={assignedQuizzes.length}
                                roleplayCount={assignedRoleplays.length}
                            />
                        )}
                        {activeTab === "groups" && (
                            <GroupsTab
                                error={groupsError}
                                groups={assignedGroups}
                                isActionPending={isGroupActionPending}
                                isLoading={isGroupsLoading}
                                onAddGroup={openAddGroupDialog}
                                onRemoveGroup={requestRemoveGroup}
                            />
                        )}
                        {activeTab === "roleplays" && (
                            <RoleplaysTab onAssign={assignRoleplay} roleplays={assignedRoleplays} />
                        )}
                        {activeTab === "evaluations" && (
                            <EvaluationsTab onAssign={assignQuiz} quizzes={assignedQuizzes} />
                        )}
                        {activeTab === "statistics" && <StatisticsTab statistics={statistics} />}
                        {activeTab === "skills" && <SkillsTab skills={skills} />}
                    </CardSurface>
                </Box>
            </Box>

            {isAddGroupOpen && (
                <AddUserGroupDialog
                    availableGroups={availableGroups}
                    error={groupDialogError}
                    isSubmitting={isGroupActionPending}
                    onClose={closeAddGroupDialog}
                    onGroupChange={setSelectedGroupId}
                    onSubmit={assignSelectedGroup}
                    selectedGroupId={selectedGroupId}
                />
            )}

            {groupPendingRemoval && (
                <RemoveUserGroupDialog
                    error={groupDialogError}
                    group={groupPendingRemoval}
                    isSubmitting={isGroupActionPending}
                    onClose={closeRemoveGroupDialog}
                    onConfirm={confirmRemoveGroup}
                />
            )}
        </AppShell>
    );
}
