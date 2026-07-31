"use client";

import { useRouter } from "next/navigation";
import { Fragment, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    Check,
    ChevronDown,
    ChevronRight,
    Clock3,
    Info,
    Mail,
    MessageSquare,
    Pencil,
    Phone,
    Plus,
    Sparkles,
    Trash2,
    UserCheck,
    UsersRound,
    UserX,
    X,
} from "lucide-react";
import { AppShell, ContextualBackLink, useCurrentAppHref } from "@/features/app-shell/components";
import {
    Box,
    Button,
    CardSurface,
    FieldLabel,
    InlineIcon,
    SelectInput,
    Text,
    TextInput,
    Tooltip,
} from "@/lib/ui/atoms";
import {
    DataTable,
    DataTableCell,
    DataTableFrame,
    DataTableHead,
    DataTableHeaderCell,
    DataTableRow,
} from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import {
    createFormSubmitError,
    notifyFormSubmitError,
    notifyFormSubmitSuccess,
} from "@/lib/ui/feedback/form-submit-feedback";
import { notify } from "@/lib/ui/feedback/toast";
import {
    getRoleplayIndexDisplayState,
    ROLEPLAY_INDEX_DESCRIPTION,
    ROLEPLAY_INDEX_LABEL,
} from "@/features/roleplays/domain";
import {
    getSkillLevel,
    SKILL_LEVEL,
} from "@/features/skills/domain/skills";
import { OrganizationInvitationResendConfirmationModal } from "@/features/organizations/components";
import {
    getOrganizationInvitationResendSuccessMessage,
    ORGANIZATION_INVITATION_RESEND_LABEL,
    type OrganizationInvitationResendTarget,
} from "@/features/organizations/domain/organization-invitation";
import {
    getAvailableUserStatusAction,
    getEditableUserRoleOptions,
    getUserRoleLabel,
    getUserStatusLabel,
    withoutUserDetailMode,
    type PlatformRole,
    type UserAssignedQuiz,
    type UserAssignedRoleplay,
    type UserAiInteractions,
    type UserAssignmentStatus,
    type UserContentAssignmentCandidate,
    type UserListItem,
    type UserRole,
    type UserSkillProgress,
    type UserStatus,
    USER_AI_INTERACTION_TYPE,
    USER_STATUS_ACTION,
    USER_STATUS_ACTION_LABELS,
    type UserStatusAction,
} from "@/features/users/domain";
import type { UserAssignedGroup, UserAvailableGroup, UserGroupsResult } from "@/features/users/domain/user-groups";
import { AddUserGroupDialog, RemoveUserGroupDialog } from "./UserGroupDialogs";
import {
    UserContentAssignmentDialog,
    type UserAssignableContentKind,
} from "./UserContentAssignmentDialog";
import { UserStatusDialog } from "./UserStatusDialog";
import { createLatestAbortableRequestCoordinator } from "./latest-abortable-request";
import { refreshUserViews } from "./user-detail-refresh";
import { shouldResetUserDraft } from "./user-detail-state";

type UserDetailTab = "profile" | "groups" | "roleplays" | "evaluations" | "ai-interactions" | "skills";

interface UserDetailPageProps {
    aiInteractions: UserAiInteractions;
    assignedQuizzes?: UserAssignedQuiz[];
    assignedRoleplays?: UserAssignedRoleplay[];
    avatarUrl: string | null;
    initialMode?: "edit" | "view";
    initials: string;
    invitationResendTargets?: OrganizationInvitationResendTarget[];
    platformRole: PlatformRole;
    skills?: UserSkillProgress[];
    user: UserListItem;
}

interface DetailFormValues {
    firstName: string;
    lastName: string;
    role: UserRole;
}

const tabs: Array<{ id: UserDetailTab; label: string }> = [
    { id: "profile", label: "Informations de base" },
    { id: "groups", label: "Groupes" },
    { id: "roleplays", label: "Roleplays" },
    { id: "evaluations", label: "Évaluations" },
    { id: "ai-interactions", label: "Interaction IA" },
    { id: "skills", label: "Compétences" },
];

function splitName(name: string) {
    const [firstName = "", ...rest] = name.split(" ");

    return {
        firstName,
        lastName: rest.join(" "),
    };
}

function getUsernameFromEmail(email: string) {
    return email.split("@")[0] ?? email;
}

function getFormValuesFromUser(user: UserListItem): DetailFormValues {
    const { firstName, lastName } = splitName(user.name);

    return {
        firstName,
        lastName,
        role: user.role,
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

interface InvitationResendPayload extends ApiErrorPayload {
    invitation?: {
        email?: string;
    };
}

interface UserContentAssignmentApiPayload extends ApiErrorPayload {
    candidates?: UserContentAssignmentCandidate[];
    quizzes?: UserAssignedQuiz[];
    roleplays?: UserAssignedRoleplay[];
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
    if (status === "active") return uiTokens.userDetail.profile.status.active;
    if (status === "pending") return uiTokens.userDetail.profile.status.pending;
    return uiTokens.userDetail.profile.status.inactive;
}

function StatusBadge({ status }: { status: UserStatus }) {
    return (
        <Box className={cn(uiTokens.userDetail.profile.status.base, getStatusClasses(status))}>
            {getUserStatusLabel(status)}
        </Box>
    );
}

function RolePill({ role }: { role: UserRole }) {
    return (
        <Box className={uiTokens.userDetail.profile.role}>
            {getUserRoleLabel(role)}
        </Box>
    );
}

function GroupChip({ label }: { label: string }) {
    return (
        <Box className={uiTokens.userDetail.pill.group}>
            {label}
        </Box>
    );
}

function PersonaPill({ label }: { label: string }) {
    return (
        <Box className={uiTokens.userDetail.pill.persona}>
            {label}
        </Box>
    );
}

function QuizTypePill({ label }: { label: string }) {
    return (
        <Box className={uiTokens.userDetail.pill.quiz}>
            {label}
        </Box>
    );
}

function ScoreBadge({
    emptyLabel = "—",
    score,
    validationThreshold,
}: {
    emptyLabel?: string;
    score: number | null;
    validationThreshold: number;
}) {
    const thresholdTooltip = `Seuil recommandé pour être validé : ${validationThreshold}%`;

    if (score === null) {
        return (
            <Tooltip content={thresholdTooltip}>
                <Text
                    className={uiTokens.userDetail.pill.scoreEmpty}
                    tabIndex={0}
                >
                    {emptyLabel}
                </Text>
            </Tooltip>
        );
    }

    const isValidated = score >= validationThreshold;

    return (
        <Tooltip content={thresholdTooltip}>
            <Box
                className={cn(
                    uiTokens.userDetail.pill.score,
                    isValidated
                        ? uiTokens.userDetail.pill.scoreSuccess
                        : uiTokens.userDetail.pill.scoreWarning,
                )}
                tabIndex={0}
            >
                {score}%
            </Box>
        </Tooltip>
    );
}

export function getAssignedRoleplayIndexEmptyLabel(sessionCount: number) {
    return getRoleplayIndexDisplayState(sessionCount) === "empty"
        ? "N/A"
        : "En cours";
}

function InfoBlock({ label, value }: { label: string; value: string }) {
    return (
        <Box>
            <Text className={uiTokens.userDetail.profile.infoLabel}>{label}</Text>
            <Text className={uiTokens.userDetail.profile.infoValue}>{value || "-"}</Text>
        </Box>
    );
}

function DetailInput({
    disabled = false,
    id,
    label,
    onChange,
    type = "text",
    value,
}: {
    disabled?: boolean;
    id: string;
    label: string;
    onChange?: (value: string) => void;
    type?: "email" | "text";
    value: string;
}) {
    return (
        <Box className="space-y-2">
            <FieldLabel htmlFor={id} className={uiTokens.userDetail.profile.fieldLabel}>
                {label}
            </FieldLabel>
            <TextInput
                disabled={disabled}
                id={id}
                hasLeadingIcon={false}
                onChange={(event) => onChange?.(event.target.value)}
                type={type}
                value={value}
                className={
                    disabled
                        ? `${uiTokens.form.controlReadonly} !h-10 !cursor-not-allowed`
                        : uiTokens.userDetail.profile.input
                }
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
            <FieldLabel htmlFor={id} className={uiTokens.userDetail.profile.fieldLabel}>
                {label}
            </FieldLabel>
            <Box className="relative">
                <SelectInput
                    id={id}
                    onChange={(event) => onChange(event.target.value)}
                    value={value}
                    className={uiTokens.userDetail.profile.input}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </SelectInput>
                <InlineIcon
                    icon={ChevronDown}
                    className={uiTokens.userDetail.profile.selectChevron}
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
    const roleOptions = getEditableUserRoleOptions(currentUser.platformRole);

    return (
        <Box className={uiTokens.userDetail.section.content}>
            <Text as="h2" className={uiTokens.userDetail.profile.sectionTitle}>
                Informations de base
            </Text>

            <Box className="mt-6 grid gap-6 xl:grid-cols-[112px_minmax(0,1fr)]">
                <Box className={uiTokens.userDetail.profile.avatar}>
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
                                disabled
                                id="detail-email"
                                label="Email"
                                type="email"
                                value={currentUser.email}
                            />
                            <InfoBlock label="Entreprise" value={currentUser.organization} />
                            <DetailSelect
                                id="detail-role"
                                label="Rôle"
                                onChange={(value) => onDraftChange("role", value)}
                                options={roleOptions}
                                value={draft.role}
                            />
                            <Box>
                                <Text className={uiTokens.userDetail.profile.infoLabel}>Statut</Text>
                                <Box className="mt-2">
                                    <StatusBadge status={currentUser.status} />
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
                                <Text className={uiTokens.userDetail.profile.infoLabel}>Rôle</Text>
                                <Box className="mt-2">
                                    <RolePill role={currentUser.role} />
                                </Box>
                            </Box>
                            <Box>
                                <Text className={uiTokens.userDetail.profile.infoLabel}>Statut</Text>
                                <Box className="mt-2">
                                    <StatusBadge status={currentUser.status} />
                                </Box>
                            </Box>
                        </>
                    )}

                    <InfoBlock label="Roleplays" value={`${roleplayCount} roleplays`} />
                    <InfoBlock label="Évaluations" value={`${quizCount} quizzes`} />

                    <Box className="lg:col-span-2">
                        <Text className={uiTokens.userDetail.profile.infoLabel}>Groupe(s)</Text>
                        <Box className="mt-3 flex flex-wrap gap-2.5">
                            {groups.length > 0 ? (
                                groups.map((group) => (
                                    <GroupChip key={group.id} label={group.name} />
                                ))
                            ) : (
                                <Text className={uiTokens.userDetail.profile.empty}>Aucun groupe assigné</Text>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Box className={uiTokens.userDetail.profile.divider}>
                <Text as="h3" className={uiTokens.userDetail.profile.sectionTitle}>
                    Dates importantes
                </Text>
                <Box className="mt-5 grid gap-7 lg:grid-cols-2">
                    <InfoBlock label="Date d'inscription" value={currentUser.joinedAt} />
                    <InfoBlock label="Dernière connexion" value={currentUser.lastActiveAt} />
                </Box>
            </Box>

            <Box className={uiTokens.userDetail.profile.divider}>
                <Text as="h3" className={uiTokens.userDetail.profile.sectionTitle}>
                    Identifiants de connexion
                </Text>
                <Box className="mt-5">
                    <InfoBlock label="Nom d'utilisateur" value={getUsernameFromEmail(currentUser.email)} />
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
        <Box className={uiTokens.userDetail.section.headingRow}>
            <Text as="h2" className={uiTokens.userDetail.section.heading}>
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
            className={uiTokens.userDetail.action.light}
        >
            <InlineIcon icon={Plus} className={uiTokens.userDetail.action.icon} />
            {children}
        </Button>
    );
}

function UserTableSectionHeader({
    colSpan,
    count,
    isCollapsed,
    label,
    onToggle,
}: {
    colSpan: number;
    count: number;
    isCollapsed: boolean;
    label: string;
    onToggle: () => void;
}) {
    return (
        <Box as="tr" className={uiTokens.userDetail.groupHeader.row}>
            <Box as="td" colSpan={colSpan} className={uiTokens.userDetail.groupHeader.cell}>
                <Button
                    aria-expanded={!isCollapsed}
                    className={uiTokens.userDetail.groupHeader.button}
                    onClick={onToggle}
                >
                    <InlineIcon
                        icon={isCollapsed ? ChevronRight : ChevronDown}
                        className={uiTokens.userDetail.groupHeader.icon}
                    />
                    {label} ({count})
                </Button>
            </Box>
        </Box>
    );
}

function IconGroupBadge() {
    return (
        <Box className={uiTokens.userDetail.group.icon}>
            <InlineIcon icon={UsersRound} className={uiTokens.userDetail.group.iconGlyph} />
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
        <Box className={uiTokens.userDetail.section.content}>
            <SectionHeading
                title="Groupes assignés"
                action={<LightActionButton disabled={isLoading || isActionPending} onClick={onAddGroup}>Ajouter au groupe</LightActionButton>}
            />

            {error && (
                <Box
                    aria-live="polite"
                    className={uiTokens.userDetail.group.error}
                >
                    {error}
                </Box>
            )}

            <DataTableFrame>
                <DataTable>
                    <DataTableHead>
                        <Box as="tr">
                            {columns.map((column) => (
                                <DataTableHeaderCell key={column}>
                                    {column}
                                </DataTableHeaderCell>
                            ))}
                        </Box>
                    </DataTableHead>
                        <Box as="tbody">
                            {isLoading && (
                                <Box as="tr">
                                    <DataTableCell colSpan={columns.length} className={uiTokens.dataTable.emptyCell}>
                                        <Text className={uiTokens.dataTable.text.secondary}>
                                            Chargement des groupes...
                                        </Text>
                                    </DataTableCell>
                                </Box>
                            )}

                            {!isLoading && groups.map((group) => (
                                <DataTableRow key={group.id}>
                                    <DataTableCell>
                                        <Box className={uiTokens.userDetail.group.nameLayout}>
                                            <IconGroupBadge />
                                            <Text className={uiTokens.dataTable.text.primary}>{group.name}</Text>
                                        </Box>
                                    </DataTableCell>
                                    <DataTableCell>
                                        <Text className={uiTokens.dataTable.text.secondary}>{group.description}</Text>
                                    </DataTableCell>
                                    <DataTableCell>
                                        <Text className={uiTokens.dataTable.text.secondary}>{group.assignedAt}</Text>
                                    </DataTableCell>
                                    <DataTableCell>
                                        <Button
                                            disabled={isActionPending}
                                            onClick={() => onRemoveGroup(group)}
                                            className={uiTokens.userDetail.group.removeAction}
                                        >
                                            <InlineIcon icon={Trash2} className={uiTokens.userDetail.group.removeIcon} />
                                            Retirer
                                        </Button>
                                    </DataTableCell>
                                </DataTableRow>
                            ))}

                            {!isLoading && groups.length === 0 && (
                                <Box as="tr">
                                    <DataTableCell colSpan={columns.length} className={uiTokens.dataTable.emptyCell}>
                                        <Text className={uiTokens.dataTable.text.primary}>
                                            Aucun groupe assigné
                                        </Text>
                                        <Text className={cn("mt-2", uiTokens.dataTable.text.muted)}>
                                            Ajoutez cet utilisateur à un groupe de son organisation.
                                        </Text>
                                    </DataTableCell>
                                </Box>
                            )}
                        </Box>
                </DataTable>
            </DataTableFrame>
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
            <DataTableRow key={roleplay.id}>
                <DataTableCell nowrap>
                    <Text className={uiTokens.dataTable.text.primary}>{roleplay.title}</Text>
                </DataTableCell>
                <DataTableCell nowrap>
                    <PersonaPill label={roleplay.persona} />
                </DataTableCell>
                <DataTableCell nowrap>
                    <ScoreBadge
                        emptyLabel={getAssignedRoleplayIndexEmptyLabel(roleplay.sessions)}
                        score={roleplay.index}
                        validationThreshold={roleplay.validationThreshold}
                    />
                </DataTableCell>
                <DataTableCell nowrap>
                    <Text className={uiTokens.dataTable.text.secondary}>
                        {roleplay.sessions} session{roleplay.sessions > 1 ? "s" : ""}
                    </Text>
                </DataTableCell>
                <DataTableCell nowrap>
                    <Text className={uiTokens.dataTable.text.secondary}>{roleplay.assignedAt}</Text>
                </DataTableCell>
            </DataTableRow>
        ));

    return (
        <Box className={uiTokens.userDetail.section.content}>
            <SectionHeading
                title="Roleplays assignés"
                action={<LightActionButton onClick={onAssign}>Assigner un roleplay</LightActionButton>}
            />

            <DataTableFrame>
                <DataTable>
                    <DataTableHead>
                        <Box as="tr">
                                {["Roleplay", "Persona", ROLEPLAY_INDEX_LABEL, "Sessions", "Date d'assignation"].map((column) => (
                                    <DataTableHeaderCell
                                        key={column}
                                    >
                                        {column === ROLEPLAY_INDEX_LABEL ? (
                                            <Box className={uiTokens.dataTable.headerLabelWithInfo}>
                                                {column}
                                                <Tooltip
                                                    className="normal-case tracking-normal"
                                                    content={ROLEPLAY_INDEX_DESCRIPTION}
                                                >
                                                    <button
                                                        type="button"
                                                        aria-label={`Afficher la règle de calcul du ${ROLEPLAY_INDEX_LABEL}`}
                                                        className={uiTokens.dataTable.headerInfoButton}
                                                    >
                                                        <InlineIcon icon={Info} className={uiTokens.dataTable.headerInfoIcon} />
                                                    </button>
                                                </Tooltip>
                                            </Box>
                                        ) : column}
                                    </DataTableHeaderCell>
                                ))}
                        </Box>
                    </DataTableHead>
                        <Box as="tbody">
                            {sections.map((section) => (
                                <Fragment key={section.status}>
                                    <UserTableSectionHeader
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
                </DataTable>
            </DataTableFrame>
        </Box>
    );
}

export function EvaluationsTab({
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
        { items: notStarted, label: "Quiz non commencés", status: "not_started" },
        { items: inProgress, label: "Quiz en cours", status: "in_progress" },
        { items: completed, label: "Quiz terminés", status: "completed" },
    ];

    const toggleSection = (status: UserAssignmentStatus) => {
        setCollapsedSections((current) => ({
            ...current,
            [status]: !current[status],
        }));
    };

    const renderRows = (items: UserAssignedQuiz[]) =>
        items.map((quiz) => (
            <DataTableRow key={quiz.id}>
                <DataTableCell nowrap>
                    <Text className={uiTokens.dataTable.text.primary}>{quiz.title}</Text>
                </DataTableCell>
                <DataTableCell nowrap>
                    <QuizTypePill label={quiz.type} />
                </DataTableCell>
                <DataTableCell nowrap>
                    <Text className={uiTokens.dataTable.text.secondary}>
                        {quiz.attempts} tentative{quiz.attempts === 1 ? "" : "s"}
                    </Text>
                </DataTableCell>
                <DataTableCell nowrap>
                    <ScoreBadge
                        score={quiz.score}
                        validationThreshold={quiz.validationThreshold}
                    />
                </DataTableCell>
                <DataTableCell nowrap>
                    <Text className={uiTokens.dataTable.text.secondary}>{quiz.assignedAt}</Text>
                </DataTableCell>
            </DataTableRow>
        ));

    return (
        <Box className={uiTokens.userDetail.section.content}>
            <SectionHeading
                title="Quiz assignés"
                action={<LightActionButton onClick={onAssign}>Assigner un quiz</LightActionButton>}
            />

            <DataTableFrame>
                <DataTable>
                    <DataTableHead>
                        <Box as="tr">
                                {["Titre du quiz", "Type", "Tentatives", "Score", "Date d'assignation"].map((column) => (
                                    <DataTableHeaderCell
                                        key={column}
                                    >
                                        {column === "Score" ? (
                                            <Box className={uiTokens.dataTable.headerLabelWithInfo}>
                                                {column}
                                                <Tooltip
                                                    className="normal-case tracking-normal"
                                                    content="Meilleur score obtenu sur les tentatives terminées."
                                                >
                                                    <button
                                                        type="button"
                                                        aria-label="Précision sur le score du quiz"
                                                        className={uiTokens.dataTable.headerInfoButton}
                                                    >
                                                        <InlineIcon icon={Info} className={uiTokens.dataTable.headerInfoIcon} />
                                                    </button>
                                                </Tooltip>
                                            </Box>
                                        ) : column}
                                    </DataTableHeaderCell>
                                ))}
                        </Box>
                    </DataTableHead>
                        <Box as="tbody">
                            {sections.map((section) => (
                                <Fragment key={section.status}>
                                    <UserTableSectionHeader
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
                </DataTable>
            </DataTableFrame>
        </Box>
    );
}

type UserAiInteractionView = UserAiInteractions["items"][number];

const aiInteractionStyles = {
    [USER_AI_INTERACTION_TYPE.askPersona]: {
        cardIcon: uiTokens.userDetail.aiInteraction.tone.askPersona.card,
        icon: MessageSquare,
        tableIcon: uiTokens.userDetail.aiInteraction.tone.askPersona.table,
    },
    [USER_AI_INTERACTION_TYPE.coach]: {
        cardIcon: uiTokens.userDetail.aiInteraction.tone.coach.card,
        icon: Sparkles,
        tableIcon: uiTokens.userDetail.aiInteraction.tone.coach.table,
    },
    [USER_AI_INTERACTION_TYPE.simulation]: {
        cardIcon: uiTokens.userDetail.aiInteraction.tone.simulation.card,
        icon: Phone,
        tableIcon: uiTokens.userDetail.aiInteraction.tone.simulation.table,
    },
} as const;

const userAiInteractionDateFormatter = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Paris",
    year: "numeric",
});

export function formatUserAiInteractionDuration(totalSeconds: number) {
    const safeSeconds = Math.max(0, Math.round(totalSeconds));
    const hours = Math.floor(safeSeconds / 3_600);
    const minutes = Math.floor((safeSeconds % 3_600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes.toString().padStart(2, "0")}min`;
    }

    return `${minutes}min`;
}

function formatUserAiInteractionDate(value: string | null) {
    if (!value) return "—";

    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "—"
        : userAiInteractionDateFormatter.format(date);
}

function AiInteractionCard({ interaction }: { interaction: UserAiInteractionView }) {
    const styles = aiInteractionStyles[interaction.type];

    return (
        <Box className={uiTokens.userDetail.aiInteraction.card}>
            <Box className={cn(uiTokens.userDetail.aiInteraction.cardIcon, styles.cardIcon)}>
                <InlineIcon icon={styles.icon} className={uiTokens.userDetail.aiInteraction.icon} />
            </Box>
            <Text className={uiTokens.userDetail.aiInteraction.cardValue}>
                {formatUserAiInteractionDuration(interaction.durationSeconds)}
            </Text>
            <Text className={uiTokens.userDetail.aiInteraction.cardLabel}>{interaction.label}</Text>
        </Box>
    );
}

export function AiInteractionsTab({
    interactions,
}: {
    interactions: UserAiInteractions;
}) {
    return (
        <Box className={uiTokens.userDetail.aiInteraction.content}>
            <Box className={uiTokens.userDetail.aiInteraction.cardGrid}>
                {interactions.items.map((interaction) => (
                    <AiInteractionCard interaction={interaction} key={interaction.type} />
                ))}
                <Box className={uiTokens.userDetail.aiInteraction.card}>
                    <Box
                        className={cn(
                            uiTokens.userDetail.aiInteraction.cardIcon,
                            uiTokens.userDetail.aiInteraction.tone.total.card,
                        )}
                    >
                        <InlineIcon icon={Clock3} className={uiTokens.userDetail.aiInteraction.icon} />
                    </Box>
                    <Text className={uiTokens.userDetail.aiInteraction.cardValue}>
                        {formatUserAiInteractionDuration(interactions.totalDurationSeconds)}
                    </Text>
                    <Text className={uiTokens.userDetail.aiInteraction.cardLabel}>Total IA</Text>
                </Box>
            </Box>

            <DataTableFrame>
                <DataTable width="standard">
                    <DataTableHead>
                        <Box as="tr">
                                {["Type d'interaction", "Sessions", "Temps", "Dernière utilisation"].map((column) => (
                                    <DataTableHeaderCell key={column}>
                                        {column}
                                    </DataTableHeaderCell>
                                ))}
                        </Box>
                    </DataTableHead>
                        <Box as="tbody">
                            {interactions.items.map((interaction) => {
                                const styles = aiInteractionStyles[interaction.type];

                                return (
                                    <DataTableRow key={interaction.type}>
                                        <DataTableCell nowrap>
                                            <Box className={cn(
                                                uiTokens.userDetail.aiInteraction.tableTypeLayout,
                                                uiTokens.dataTable.text.body,
                                            )}>
                                                <InlineIcon
                                                    icon={styles.icon}
                                                    className={cn(
                                                        uiTokens.userDetail.aiInteraction.icon,
                                                        styles.tableIcon,
                                                    )}
                                                />
                                                {interaction.label}
                                            </Box>
                                        </DataTableCell>
                                        <DataTableCell nowrap className={uiTokens.dataTable.text.secondary}>
                                            {interaction.sessions}
                                        </DataTableCell>
                                        <DataTableCell nowrap className={uiTokens.dataTable.text.secondary}>
                                            {formatUserAiInteractionDuration(interaction.durationSeconds)}
                                        </DataTableCell>
                                        <DataTableCell nowrap className={uiTokens.dataTable.text.muted}>
                                            {formatUserAiInteractionDate(interaction.lastUsedAt)}
                                        </DataTableCell>
                                    </DataTableRow>
                                );
                            })}
                        </Box>
                </DataTable>
            </DataTableFrame>
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
    return getSkillLevel(score) === SKILL_LEVEL.mastered ? "success" : "warning";
}

function SkillScoreBadge({ score }: { score: number | null }) {
    const tone = getSkillProgressTone(score);
    const toneClass = tone === "success"
        ? uiTokens.userDetail.skill.scoreSuccess
        : tone === "warning"
            ? uiTokens.userDetail.skill.scoreWarning
            : uiTokens.userDetail.skill.scoreNeutral;

    return (
        <Box className={cn(uiTokens.userDetail.skill.score, toneClass)}>
            {formatSkillProgress(score)}
        </Box>
    );
}

function SkillProgressBar({
    initialScore,
    score,
}: {
    initialScore: number | null;
    score: number | null;
}) {
    const tone = getSkillProgressTone(score);
    const fillColor = tone === "success"
        ? uiTokens.progression.level.green.fill
        : tone === "warning"
            ? uiTokens.progression.level.yellow.fill
            : uiTokens.progression.level.neutral.fill;

    return (
        <Box className={uiTokens.userDetail.skill.progressTrack}>
            <Box
                className={uiTokens.userDetail.skill.progressInitial}
                style={{ width: `${getProgressWidth(initialScore)}%` }}
            />
            <Box
                className={uiTokens.userDetail.skill.progressValue}
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
            <Box className={uiTokens.userDetail.section.content}>
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
        <Box className={uiTokens.userDetail.section.content}>
            <DataTableFrame className={uiTokens.userDetail.skill.tableFrame}>
                <DataTable>
                    <DataTableHead>
                        <Box as="tr">
                                <DataTableHeaderCell className={uiTokens.userDetail.skill.nameHeader}>
                                    Compétence
                                </DataTableHeaderCell>
                                <DataTableHeaderCell>
                                    Progression
                                </DataTableHeaderCell>
                        </Box>
                    </DataTableHead>
                        <Box as="tbody">
                            {skills.map((skill) => {
                                const isExpanded = expandedSkillIds.includes(skill.id);
                                const tone = getSkillProgressTone(skill.score);
                                const dotClass = tone === "success"
                                    ? uiTokens.progression.level.green.dot
                                    : tone === "warning"
                                        ? uiTokens.progression.level.yellow.dot
                                        : uiTokens.progression.level.neutral.dot;

                                return (
                                    <Fragment key={skill.id}>
                                        <DataTableRow
                                            aria-expanded={isExpanded}
                                            className={uiTokens.userDetail.skill.row}
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
                                            <DataTableCell className={uiTokens.userDetail.skill.nameCell}>
                                                <Box className={uiTokens.userDetail.skill.nameLayout}>
                                                    <Box className={cn(uiTokens.userDetail.skill.statusDot, dotClass)} />
                                                    <Text className={uiTokens.userDetail.skill.name}>
                                                        {skill.label}
                                                    </Text>
                                                </Box>
                                            </DataTableCell>
                                            <DataTableCell className={uiTokens.userDetail.skill.progressCell}>
                                                <Box className={uiTokens.userDetail.skill.progressLayout}>
                                                    <SkillScoreBadge score={skill.score} />
                                                    <Box className={uiTokens.userDetail.skill.progressMiddle}>
                                                        <SkillProgressBar
                                                            initialScore={skill.initialScore}
                                                            score={skill.score}
                                                        />
                                                        <Box className={uiTokens.userDetail.skill.progressMeta}>
                                                            <Text className={uiTokens.userDetail.skill.initialLabel}>
                                                                Initial :{" "}
                                                                <Text as="span" className={uiTokens.userDetail.skill.initialValue}>
                                                                    {formatSkillProgress(skill.initialScore)}
                                                                </Text>
                                                            </Text>
                                                            <Box className={uiTokens.userDetail.skill.acquired}>
                                                                Acquis : {formatSkillProgress(skill.score)}
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                    <Text className={uiTokens.userDetail.skill.delta}>
                                                        {formatSkillDelta(skill.delta)}
                                                    </Text>
                                                    <InlineIcon
                                                        icon={isExpanded ? ChevronDown : ChevronRight}
                                                        className={uiTokens.userDetail.skill.chevron}
                                                    />
                                                </Box>
                                            </DataTableCell>
                                        </DataTableRow>

                                        {isExpanded && (
                                            <Box as="tr" className={uiTokens.userDetail.skill.detailRow}>
                                                <Box as="td" colSpan={2} className={uiTokens.userDetail.skill.detailCell}>
                                                    <Box className="space-y-3">
                                                        <Box className={uiTokens.userDetail.skill.detailSummary}>
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
                </DataTable>
            </DataTableFrame>
        </Box>
    );
}

export function UserDetailPage({
    aiInteractions,
    assignedQuizzes = [],
    assignedRoleplays = [],
    avatarUrl,
    initialMode = "view",
    initials,
    invitationResendTargets = [],
    platformRole,
    skills = [],
    user,
}: UserDetailPageProps) {
    const router = useRouter();
    const currentHref = useCurrentAppHref();
    const queryClient = useQueryClient();
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
    const [isEditing, setIsEditing] = useState(initialMode === "edit");
    const [isSaving, setIsSaving] = useState(false);
    const [draft, setDraft] = useState<DetailFormValues>(() => getFormValuesFromUser(user));
    const [pendingStatusAction, setPendingStatusAction] = useState<UserStatusAction | null>(null);
    const [statusActionError, setStatusActionError] = useState<string | null>(null);
    const [isStatusActionPending, setIsStatusActionPending] = useState(false);
    const [invitationResendTarget, setInvitationResendTarget] =
        useState<OrganizationInvitationResendTarget | null>(null);
    const [isInvitationResending, setIsInvitationResending] = useState(false);
    const [roleplayAssignments, setRoleplayAssignments] = useState<UserAssignedRoleplay[]>(assignedRoleplays);
    const [quizAssignments, setQuizAssignments] = useState<UserAssignedQuiz[]>(assignedQuizzes);
    const [assignmentDialogKind, setAssignmentDialogKind] = useState<UserAssignableContentKind | null>(null);
    const [assignmentCandidates, setAssignmentCandidates] = useState<UserContentAssignmentCandidate[]>([]);
    const [selectedAssignmentContentId, setSelectedAssignmentContentId] = useState("");
    const [assignmentDialogError, setAssignmentDialogError] = useState<string | null>(null);
    const [isAssignmentDialogLoading, setIsAssignmentDialogLoading] = useState(false);
    const [isAssignmentPending, setIsAssignmentPending] = useState(false);
    const previousUserIdRef = useRef(user.id);
    const isEditingRef = useRef(isEditing);
    const assignmentCandidatesRequestCoordinatorRef = useRef<ReturnType<
        typeof createLatestAbortableRequestCoordinator
    > | null>(null);

    if (!assignmentCandidatesRequestCoordinatorRef.current) {
        assignmentCandidatesRequestCoordinatorRef.current = createLatestAbortableRequestCoordinator();
    }

    const assignmentCandidatesRequestCoordinator = assignmentCandidatesRequestCoordinatorRef.current;
    isEditingRef.current = isEditing;

    const pageTitle = useMemo(() => "Détail de l'utilisateur", []);
    const availableStatusAction = getAvailableUserStatusAction({
        isSuspended: currentUser.isSuspended,
        status: currentUser.status,
        targetPlatformRole: currentUser.platformRole,
    });

    const refreshUserData = useCallback(() => {
        void refreshUserViews(queryClient, router);
    }, [queryClient, router]);

    useEffect(() => {
        const hrefWithoutMode = withoutUserDetailMode(currentHref);

        if (initialMode === "edit" && hrefWithoutMode !== currentHref) {
            router.replace(hrefWithoutMode, { scroll: false });
        }
    }, [currentHref, initialMode, router]);

    useEffect(() => {
        const previousUserId = previousUserIdRef.current;
        previousUserIdRef.current = user.id;
        setCurrentUser(user);

        if (shouldResetUserDraft({
            isEditing: isEditingRef.current,
            nextUserId: user.id,
            previousUserId,
        })) {
            setDraft(getFormValuesFromUser(user));
        }
    }, [user]);

    useEffect(() => () => {
        assignmentCandidatesRequestCoordinator.cancel();
    }, [assignmentCandidatesRequestCoordinator]);

    useEffect(() => {
        setRoleplayAssignments(assignedRoleplays);
    }, [assignedRoleplays]);

    useEffect(() => {
        setQuizAssignments(assignedQuizzes);
    }, [assignedQuizzes]);

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

    const saveEditing = async () => {
        if (isSaving) return;

        setIsSaving(true);

        try {
            const response = await fetch(`/api/users/${currentUser.id}`, {
                body: JSON.stringify(draft),
                headers: { "Content-Type": "application/json" },
                method: "PATCH",
            });
            const payload = (await response.json().catch(() => null)) as
                | { error?: string; issues?: ApiValidationIssue[]; user?: UserListItem }
                | null;

            if (!response.ok || !payload?.user) {
                const message = getApiErrorMessage(payload, "Impossible de modifier l'utilisateur.");
                notifyFormSubmitError(createFormSubmitError(message, response.status), message);
                return;
            }

            setCurrentUser(payload.user);
            setDraft(getFormValuesFromUser(payload.user));
            setIsEditing(false);
            notifyFormSubmitSuccess();
            refreshUserData();
        } catch (error) {
            notifyFormSubmitError(error, "Impossible de modifier l'utilisateur.");
        } finally {
            setIsSaving(false);
        }
    };

    const requestStatusChange = () => {
        if (!availableStatusAction) return;
        setStatusActionError(null);
        setPendingStatusAction(availableStatusAction);
    };

    const closeStatusDialog = () => {
        if (isStatusActionPending) return;
        setPendingStatusAction(null);
        setStatusActionError(null);
    };

    const confirmStatusChange = async () => {
        if (!pendingStatusAction || isStatusActionPending) return;

        setIsStatusActionPending(true);
        setStatusActionError(null);

        try {
            const response = await fetch(`/api/users/${currentUser.id}/status`, {
                body: JSON.stringify({ action: pendingStatusAction }),
                headers: { "Content-Type": "application/json" },
                method: "PATCH",
            });
            const payload = (await response.json().catch(() => null)) as
                | { error?: string; isSuspended?: boolean; status?: UserStatus }
                | null;

            if (!response.ok || !payload?.status || typeof payload.isSuspended !== "boolean") {
                const message = getApiErrorMessage(payload, "Impossible de modifier le statut de l'utilisateur.");
                setStatusActionError(notifyFormSubmitError(createFormSubmitError(message, response.status), message));
                return;
            }

            setCurrentUser((current) => ({
                ...current,
                isSuspended: payload.isSuspended!,
                status: payload.status!,
            }));
            notify.success(
                pendingStatusAction === USER_STATUS_ACTION.suspend
                    ? "Utilisateur suspendu"
                    : "Utilisateur réactivé",
            );
            setPendingStatusAction(null);
            refreshUserData();
        } catch (error) {
            setStatusActionError(notifyFormSubmitError(error, "Impossible de modifier le statut de l'utilisateur."));
        } finally {
            setIsStatusActionPending(false);
        }
    };

    const confirmInvitationResend = async () => {
        if (!invitationResendTarget || isInvitationResending) {
            return;
        }

        setIsInvitationResending(true);

        try {
            const response = await fetch(
                `/api/organizations/${invitationResendTarget.organizationId}/users/${currentUser.id}/resend-invitation`,
                { method: "POST" },
            );
            const payload = (await response.json().catch(() => null)) as InvitationResendPayload | null;

            if (!response.ok) {
                notify.error(getApiErrorMessage(
                    payload,
                    "Impossible de renvoyer l’invitation.",
                ));
                return;
            }

            const recipientEmail = payload?.invitation?.email ?? currentUser.email;

            notify.success(getOrganizationInvitationResendSuccessMessage(recipientEmail));
            setInvitationResendTarget(null);
            refreshUserData();
        } catch {
            notify.error("Impossible de renvoyer l’invitation.");
        } finally {
            setIsInvitationResending(false);
        }
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
                const message = getApiErrorMessage(payload as ApiErrorPayload | null, "Impossible d'ajouter l'utilisateur au groupe.");
                setGroupDialogError(notifyFormSubmitError(createFormSubmitError(message, response.status), message));
                return;
            }

            applyUserGroupsResult(payload as UserGroupsResult | null);
            setIsAddGroupOpen(false);
            setSelectedGroupId("");
            notifyFormSubmitSuccess();
            refreshUserData();
        } catch (error) {
            setGroupDialogError(notifyFormSubmitError(error, "Impossible d'ajouter l'utilisateur au groupe."));
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
                const message = getApiErrorMessage(payload as ApiErrorPayload | null, "Impossible de retirer l'utilisateur du groupe.");
                setGroupDialogError(notifyFormSubmitError(createFormSubmitError(message, response.status), message));
                return;
            }

            applyUserGroupsResult(payload as UserGroupsResult | null);
            setGroupPendingRemoval(null);
            notifyFormSubmitSuccess();
            refreshUserData();
        } catch (error) {
            setGroupDialogError(notifyFormSubmitError(error, "Impossible de retirer l'utilisateur du groupe."));
        } finally {
            setIsGroupActionPending(false);
        }
    };

    const getAssignmentEndpoint = (kind: UserAssignableContentKind) =>
        `/api/users/${user.id}/assignments/${kind === "roleplay" ? "roleplays" : "quizzes"}`;

    const openAssignmentDialog = async (kind: UserAssignableContentKind) => {
        const assignmentCandidatesRequest = assignmentCandidatesRequestCoordinator.start();
        setAssignmentDialogKind(kind);
        setAssignmentCandidates([]);
        setSelectedAssignmentContentId("");
        setAssignmentDialogError(null);
        setIsAssignmentDialogLoading(true);

        try {
            const response = await fetch(getAssignmentEndpoint(kind), {
                headers: { Accept: "application/json" },
                signal: assignmentCandidatesRequest.signal,
            });
            const payload = (await response.json().catch(() => null)) as UserContentAssignmentApiPayload | null;

            if (!assignmentCandidatesRequest.isCurrent()) {
                return;
            }

            if (!response.ok) {
                setAssignmentDialogError(getApiErrorMessage(payload, "Impossible de charger les contenus assignables."));
                return;
            }

            const candidates = payload?.candidates ?? [];
            setAssignmentCandidates(candidates);
            setSelectedAssignmentContentId(candidates[0]?.id ?? "");
        } catch {
            if (!assignmentCandidatesRequest.isCurrent()) {
                return;
            }

            setAssignmentDialogError("Impossible de charger les contenus assignables.");
        } finally {
            if (assignmentCandidatesRequest.isCurrent()) {
                setIsAssignmentDialogLoading(false);
                assignmentCandidatesRequest.finish();
            }
        }
    };

    const closeAssignmentDialog = () => {
        if (isAssignmentPending) return;
        assignmentCandidatesRequestCoordinator.cancel();
        setAssignmentDialogKind(null);
        setAssignmentCandidates([]);
        setSelectedAssignmentContentId("");
        setAssignmentDialogError(null);
        setIsAssignmentDialogLoading(false);
    };

    const assignSelectedContent = async () => {
        if (!assignmentDialogKind || !selectedAssignmentContentId || isAssignmentPending) return;

        setIsAssignmentPending(true);
        setAssignmentDialogError(null);

        try {
            const response = await fetch(getAssignmentEndpoint(assignmentDialogKind), {
                body: JSON.stringify({ contentId: selectedAssignmentContentId }),
                headers: { "Content-Type": "application/json" },
                method: "POST",
            });
            const payload = (await response.json().catch(() => null)) as UserContentAssignmentApiPayload | null;

            if (!response.ok) {
                const message = getApiErrorMessage(payload, "Impossible d'affecter ce contenu à l'utilisateur.");
                setAssignmentDialogError(notifyFormSubmitError(createFormSubmitError(message, response.status), message));
                return;
            }

            if (payload?.roleplays) setRoleplayAssignments(payload.roleplays);
            if (payload?.quizzes) setQuizAssignments(payload.quizzes);
            notify.success(assignmentDialogKind === "roleplay" ? "Roleplay assigné" : "Quiz assigné");
            setAssignmentDialogKind(null);
            setAssignmentCandidates([]);
            setSelectedAssignmentContentId("");
            refreshUserData();
        } catch (error) {
            setAssignmentDialogError(notifyFormSubmitError(error, "Impossible d'affecter ce contenu à l'utilisateur."));
        } finally {
            setIsAssignmentPending(false);
        }
    };

    const assignRoleplay = () => void openAssignmentDialog("roleplay");

    const assignQuiz = () => void openAssignmentDialog("quiz");
    const invitationResendActions = invitationResendTargets.map((target) => {
        const label = invitationResendTargets.length > 1
            ? `${ORGANIZATION_INVITATION_RESEND_LABEL} · ${target.organizationName}`
            : ORGANIZATION_INVITATION_RESEND_LABEL;

        return (
            <Button
                key={target.organizationId}
                aria-label={`${label} à ${currentUser.name}`}
                disabled={isInvitationResending}
                onClick={() => setInvitationResendTarget(target)}
                className={uiTokens.organizationInvitation.detailAction}
            >
                <InlineIcon icon={Mail} className={uiTokens.organizationInvitation.detailActionIcon} />
                {label}
            </Button>
        );
    });

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
                            <ContextualBackLink
                                fallbackHref="/users"
                                aria-label="Retour aux utilisateurs"
                                className={uiTokens.userDetail.header.back}
                            >
                                <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                            </ContextualBackLink>
                            <Text as="h1" className={uiTokens.userDetail.header.title}>
                                {pageTitle}
                            </Text>
                        </Box>

                        {isEditing ? (
                            <Box className="flex flex-wrap gap-4">
                                {invitationResendActions}
                                <Button
                                    onClick={cancelEditing}
                                    disabled={isSaving}
                                    className={uiTokens.userDetail.action.cancel}
                                >
                                    <InlineIcon icon={X} className="h-5 w-5" />
                                    Annuler
                                </Button>
                                <Button
                                    onClick={() => void saveEditing()}
                                    disabled={isSaving}
                                    className={uiTokens.userDetail.action.primary}
                                >
                                    <InlineIcon icon={Check} className="h-5 w-5" />
                                    {isSaving ? "Enregistrement..." : "Sauvegarder"}
                                </Button>
                            </Box>
                        ) : (
                            <Box className="flex flex-wrap gap-4">
                                {invitationResendActions}
                                <Button
                                    onClick={startEditing}
                                    className={uiTokens.userDetail.action.primaryWide}
                                >
                                    <InlineIcon icon={Pencil} className="h-5 w-5" />
                                    Modifier
                                </Button>
                                {availableStatusAction && (
                                    <Button
                                        onClick={requestStatusChange}
                                        className={
                                            availableStatusAction === USER_STATUS_ACTION.suspend
                                                ? uiTokens.action.dangerButton
                                                : `flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-[14px] font-bold transition ${uiTokens.action.successButton}`
                                        }
                                    >
                                        <InlineIcon
                                            icon={
                                                availableStatusAction === USER_STATUS_ACTION.suspend
                                                    ? UserX
                                                    : UserCheck
                                            }
                                            className="h-5 w-5"
                                        />
                                        {USER_STATUS_ACTION_LABELS[availableStatusAction]}
                                    </Button>
                                )}
                            </Box>
                        )}
                    </Box>

                    <CardSurface className={uiTokens.userDetail.card}>
                        <Box className={uiTokens.userDetail.tabs.scroll}>
                            <Box className={uiTokens.userDetail.tabs.list}>
                                {tabs.map((tab) => {
                                    const isActive = activeTab === tab.id;

                                    return (
                                        <Button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={cn(
                                                uiTokens.userDetail.tabs.item,
                                                isActive
                                                    ? uiTokens.userDetail.tabs.active
                                                    : uiTokens.userDetail.tabs.idle,
                                            )}
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
                                quizCount={quizAssignments.length}
                                roleplayCount={roleplayAssignments.length}
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
                            <RoleplaysTab onAssign={assignRoleplay} roleplays={roleplayAssignments} />
                        )}
                        {activeTab === "evaluations" && (
                            <EvaluationsTab onAssign={assignQuiz} quizzes={quizAssignments} />
                        )}
                        {activeTab === "ai-interactions" && (
                            <AiInteractionsTab interactions={aiInteractions} />
                        )}
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

            {invitationResendTarget && (
                <OrganizationInvitationResendConfirmationModal
                    isSending={isInvitationResending}
                    onCancel={() => setInvitationResendTarget(null)}
                    onConfirm={() => void confirmInvitationResend()}
                    organizationName={invitationResendTarget.organizationName}
                    userEmail={currentUser.email}
                    userName={currentUser.name}
                />
            )}

            {pendingStatusAction && (
                <UserStatusDialog
                    action={pendingStatusAction}
                    error={statusActionError}
                    isSubmitting={isStatusActionPending}
                    onClose={closeStatusDialog}
                    onConfirm={confirmStatusChange}
                    userName={currentUser.name}
                />
            )}

            {assignmentDialogKind && (
                <UserContentAssignmentDialog
                    candidates={assignmentCandidates}
                    error={assignmentDialogError}
                    isLoading={isAssignmentDialogLoading}
                    isSubmitting={isAssignmentPending}
                    kind={assignmentDialogKind}
                    onClose={closeAssignmentDialog}
                    onContentChange={setSelectedAssignmentContentId}
                    onSubmit={() => void assignSelectedContent()}
                    selectedContentId={selectedAssignmentContentId}
                />
            )}
        </AppShell>
    );
}
