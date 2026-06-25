"use client";

import Link from "next/link";
import { type ReactNode, useMemo, useState } from "react";
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
import {
    getUserRoleLabel,
    getUserStatusLabel,
    type UserListItem,
    type UserRole,
    USER_ROLE_OPTIONS,
    type UserStatus,
} from "@/features/users/domain/users";

type UserDetailTab = "profile" | "groups" | "roleplays" | "evaluations" | "statistics" | "skills";

type ActivityStatus = "not_started" | "in_progress" | "completed";

interface UserDetailPageProps {
    avatarUrl: string | null;
    initialMode?: "edit" | "view";
    initials: string;
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

interface AssignedGroup {
    assignedAt: string;
    description: string;
    id: string;
    name: string;
}

interface AssignedRoleplay {
    assignedAt: string;
    id: string;
    persona: string;
    score: number | null;
    sessions: number;
    status: ActivityStatus;
    title: string;
}

interface AssignedQuiz {
    assignedAt: string;
    attempts: number;
    id: string;
    score: number | null;
    status: ActivityStatus;
    title: string;
    type: string;
}

interface SkillProgress {
    delta: number;
    id: string;
    initial: number;
    label: string;
    score: number;
}

const tabs: Array<{ id: UserDetailTab; label: string }> = [
    { id: "profile", label: "Informations de base" },
    { id: "groups", label: "Groupes" },
    { id: "roleplays", label: "Roleplays" },
    { id: "evaluations", label: "Évaluations" },
    { id: "statistics", label: "Statistiques" },
    { id: "skills", label: "Compétences" },
];

const initialAssignedGroups: AssignedGroup[] = [
    {
        assignedAt: "15 janvier 2024",
        description: "Équipe en charge du marketing digital et de la communication",
        id: "marketing",
        name: "Marketing",
    },
    {
        assignedAt: "1 février 2024",
        description: "Force de vente et développement commercial",
        id: "sales",
        name: "Sales",
    },
    {
        assignedAt: "15 février 2024",
        description: "Comité de direction et management stratégique",
        id: "direction",
        name: "Direction",
    },
];

const extraAssignedGroup: AssignedGroup = {
    assignedAt: "Aujourd'hui",
    description: "Équipe support et suivi opérationnel",
    id: "support",
    name: "Support",
};

const initialAssignedRoleplays: AssignedRoleplay[] = [
    {
        assignedAt: "10 mars 2024",
        id: "demonstration-produit",
        persona: "Marc Dubois",
        score: null,
        sessions: 0,
        status: "not_started",
        title: "Convaincre avec une démonstration produit",
    },
    {
        assignedAt: "15 mars 2024",
        id: "qualifier-besoin",
        persona: "Thomas Lion",
        score: null,
        sessions: 0,
        status: "not_started",
        title: "Qualifier un besoin de formation",
    },
    {
        assignedAt: "1 février 2024",
        id: "premier-rdv",
        persona: "Rachid HAMRANI",
        score: 68,
        sessions: 3,
        status: "in_progress",
        title: "Décrocher un premier rendez-vous",
    },
    {
        assignedAt: "20 février 2024",
        id: "recadrer-collaborateur",
        persona: "Claude SAVARY",
        score: 54,
        sessions: 1,
        status: "in_progress",
        title: "Recadrer et remobiliser un collaborateur",
    },
    {
        assignedAt: "10 janvier 2024",
        id: "conclure-negociation",
        persona: "Sophie Martin",
        score: 82,
        sessions: 5,
        status: "completed",
        title: "Conclure une négociation commerciale",
    },
];

const extraAssignedRoleplay: AssignedRoleplay = {
    assignedAt: "Aujourd'hui",
    id: "objection-prix",
    persona: "Jean Petit",
    score: null,
    sessions: 0,
    status: "not_started",
    title: "Traiter une objection prix",
};

const initialAssignedQuizzes: AssignedQuiz[] = [
    {
        assignedAt: "10 mars 2024",
        attempts: 0,
        id: "quiz-deepmark",
        score: null,
        status: "not_started",
        title: "Quiz - DEEPMARK",
        type: "Quiz de Connaissance",
    },
    {
        assignedAt: "15 février 2024",
        attempts: 2,
        id: "entretien-commercial",
        score: 61,
        status: "in_progress",
        title: "Entretien Commercial",
        type: "Quiz de Connaissance",
    },
    {
        assignedAt: "20 février 2024",
        attempts: 1,
        id: "decouverte-besoins",
        score: 48,
        status: "in_progress",
        title: "Découverte des besoins",
        type: "Quiz d'Auto-Positionnement",
    },
    {
        assignedAt: "15 janvier 2024",
        attempts: 3,
        id: "prise-rendez-vous",
        score: 84,
        status: "completed",
        title: "Prise de rendez-vous",
        type: "Quiz de Connaissance",
    },
];

const extraAssignedQuiz: AssignedQuiz = {
    assignedAt: "Aujourd'hui",
    attempts: 0,
    id: "objections-quiz",
    score: null,
    status: "not_started",
    title: "Traitement des objections",
    type: "Quiz de Connaissance",
};

const skillProgressRows: SkillProgress[] = [
    { delta: 33, id: "decouverte", initial: 45, label: "Découverte des besoins", score: 78 },
    { delta: 33, id: "argumentation", initial: 52, label: "Argumentation commerciale", score: 85 },
    { delta: 30, id: "objections", initial: 38, label: "Traitement des objections", score: 68 },
    { delta: 24, id: "closing", initial: 48, label: "Closing", score: 72 },
    { delta: 27, id: "prospection", initial: 55, label: "Prospection téléphonique", score: 82 },
    { delta: 25, id: "presentation", initial: 50, label: "Présentation commerciale", score: 75 },
    { delta: 28, id: "negociation", initial: 42, label: "Négociation", score: 70 },
];

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
    groups: AssignedGroup[];
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
                            {groups.map((group) => (
                                <GroupChip key={group.id} label={group.name} />
                            ))}
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
    onClick,
}: {
    children: ReactNode;
    onClick: () => void;
}) {
    return (
        <Button
            onClick={onClick}
            className="inline-flex h-10 items-center justify-center gap-3 rounded-[10px] bg-[#EEF2FF] px-5 text-[15px] font-extrabold text-[#5140F0] transition hover:bg-[#E5EAFF]"
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

function TableGroupHeader({ count, label }: { count: number; label: string }) {
    return (
        <Box as="tr" className="h-[50px] border-b border-[#E6E9F0] bg-[#F7F8FA]">
            <Box as="td" colSpan={5} className="px-7">
                <Box className="flex items-center gap-3">
                    <InlineIcon icon={ChevronDown} className="h-4 w-4 text-[#4F5868]" />
                    <Text className="text-[15px] font-extrabold text-[#171B2A]">
                        {label} ({count})
                    </Text>
                </Box>
            </Box>
        </Box>
    );
}

function GroupsTab({
    groups,
    onAddGroup,
    onRemoveGroup,
}: {
    groups: AssignedGroup[];
    onAddGroup: () => void;
    onRemoveGroup: (groupId: string) => void;
}) {
    return (
        <Box className="px-6 pb-7 pt-7 md:px-7">
            <SectionHeading
                title="Groupes assignés"
                action={<LightActionButton onClick={onAddGroup}>Ajouter au groupe</LightActionButton>}
            />

            <Box className="overflow-hidden rounded-[12px] border border-[#E1E4EB]">
                <Box className="overflow-x-auto">
                    <Box as="table" className="w-full min-w-[920px] border-collapse">
                        <Box as="thead">
                            <Box as="tr" className="h-[48px] border-b border-[#E6E9F0] bg-[#F7F8FA]">
                                {["Groupe", "Description", "Date d'assignation", "Actions"].map((column) => (
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
                            {groups.map((group) => (
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
                                            onClick={() => onRemoveGroup(group.id)}
                                            className="inline-flex items-center gap-2 text-[15px] font-extrabold text-[#F00613] transition hover:text-[#C8000B]"
                                        >
                                            <InlineIcon icon={Trash2} className="h-4 w-4" />
                                            Retirer
                                        </Button>
                                    </Box>
                                </Box>
                            ))}
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
    roleplays: AssignedRoleplay[];
}) {
    const notStarted = roleplays.filter((roleplay) => roleplay.status === "not_started");
    const inProgress = roleplays.filter((roleplay) => roleplay.status === "in_progress");
    const completed = roleplays.filter((roleplay) => roleplay.status === "completed");

    const renderRows = (items: AssignedRoleplay[]) =>
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
                            <TableGroupHeader count={notStarted.length} label="Roleplays non commencés" />
                            {renderRows(notStarted)}
                            <TableGroupHeader count={inProgress.length} label="Roleplays en cours" />
                            {renderRows(inProgress)}
                            <TableGroupHeader count={completed.length} label="Roleplays terminés" />
                            {renderRows(completed)}
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
    quizzes: AssignedQuiz[];
}) {
    const notStarted = quizzes.filter((quiz) => quiz.status === "not_started");
    const inProgress = quizzes.filter((quiz) => quiz.status === "in_progress");
    const completed = quizzes.filter((quiz) => quiz.status === "completed");

    const renderRows = (items: AssignedQuiz[]) =>
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
                            <TableGroupHeader count={notStarted.length} label="Quizzes non commencés" />
                            {renderRows(notStarted)}
                            <TableGroupHeader count={inProgress.length} label="Quizzes en cours" />
                            {renderRows(inProgress)}
                            <TableGroupHeader count={completed.length} label="Quizzes terminés" />
                            {renderRows(completed)}
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
                {items.map((item) => (
                    <Box key={item.label} className="flex items-center justify-between">
                        <Text className="text-[14px] font-semibold text-[#4F5868]">{item.label}</Text>
                        <Box className={`inline-flex h-7 items-center justify-center rounded-[8px] px-2.5 text-[13px] font-extrabold ${badgeClass}`}>
                            {item.score}%
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

function StatisticsTab() {
    return (
        <Box className="space-y-8 px-6 pb-7 pt-7 md:px-7">
            <Box>
                <StatGroupTitle>Engagement</StatGroupTitle>
                <Box className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <StatTile icon={Clock3} label="Temps d'entraînement" tone="blue" value="4h 20min" />
                    <StatTile icon={CheckCircle2} label="Roleplays terminés" tone="green" value="1/5" />
                    <StatTile icon={CheckCircle2} label="Quizzes terminés" tone="cyan" value="1/4" />
                    <StatTile icon={BarChart3} label="Taux de complétion" tone="amber" value="42%" />
                    <StatTile icon={Clock3} label="Dernière activité" tone="purple" value="Il y a 2j" />
                </Box>
            </Box>

            <Box>
                <StatGroupTitle>Performance</StatGroupTitle>
                <Box className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <StatTile icon={TrendingUp} label="Score moyen roleplays" tone="orange" value="68%" />
                    <StatTile icon={TrendingUp} label="Score moyen quizzes" tone="blue" value="64%" />
                    <StatTile icon={TrendingUp} label="Meilleur score roleplay" tone="green" value="82%" />
                    <StatTile icon={TrendingUp} label="Dernier score roleplay" tone="orange" value="68%" />
                    <StatTile badge="Écart : -12 pts" icon={Target} label="Score cible" tone="green" value="80%" />
                </Box>
            </Box>

            <Box>
                <StatGroupTitle>Progression</StatGroupTitle>
                <Box className="grid gap-4 md:grid-cols-3">
                    <ProgressionTile
                        label="Progression roleplay depuis la première tentative"
                        tone="green"
                        value="+23 pts"
                    />
                    <ProgressionTile
                        label="Progression roleplay sur les 30 derniers jours"
                        tone="blue"
                        value="+8 pts"
                    />
                    <ProgressionTile
                        label="Écart Quiz vs Roleplay"
                        subtitle="(Écart théorie / pratique)"
                        tone="grey"
                        value="−4 pts"
                    />
                </Box>
            </Box>

            <Box>
                <StatGroupTitle>Compétences</StatGroupTitle>
                <Box className="grid gap-4 md:grid-cols-2">
                    <TopSkillCard
                        title="Top 3 compétences maîtrisées"
                        tone="green"
                        items={[
                            { label: "Argumentation commerciale", score: 85 },
                            { label: "Prospection téléphonique", score: 82 },
                            { label: "Présentation commerciale", score: 75 },
                        ]}
                    />
                    <TopSkillCard
                        title="Top 3 compétences à renforcer"
                        tone="orange"
                        items={[
                            { label: "Traitement des objections", score: 68 },
                            { label: "Négociation", score: 70 },
                            { label: "Closing", score: 72 },
                        ]}
                    />
                </Box>
            </Box>
        </Box>
    );
}

function getSkillTone(score: number) {
    return score >= 80 ? "green" : "yellow";
}

function SkillScoreBadge({ score }: { score: number }) {
    const tone = getSkillTone(score);

    return (
        <Box className={[
            "inline-flex h-9 w-[62px] items-center justify-center rounded-[10px] text-[15px] font-extrabold",
            tone === "green" ? "bg-[#D9FBE8] text-[#048A45]" : "bg-[#FFF1C8] text-[#C76000]",
        ].join(" ")}
        >
            {score}%
        </Box>
    );
}

function SkillProgressBar({ score }: { score: number }) {
    const tone = getSkillTone(score);

    return (
        <Box className="h-2 w-full overflow-hidden rounded-full bg-[#E2E4EA]">
            <Box
                className={`h-full rounded-full ${tone === "green" ? "bg-[#10C55B]" : "bg-[#FFC300]"}`}
                style={{ width: `${score}%` }}
            />
        </Box>
    );
}

function SkillsTab() {
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
                            {skillProgressRows.map((skill) => {
                                const tone = getSkillTone(skill.score);

                                return (
                                    <Box as="tr" key={skill.id} className="border-b border-[#EEF0F4] last:border-b-0">
                                        <Box as="td" className="px-7 py-[18px]">
                                            <Box className="flex items-center gap-4">
                                                <Box className={`h-2.5 w-2.5 rounded-full ${tone === "green" ? "bg-[#10C55B]" : "bg-[#FFC300]"}`} />
                                                <Text className="max-w-[210px] text-[15px] font-extrabold leading-6 text-[#171B2A]">
                                                    {skill.label}
                                                </Text>
                                            </Box>
                                        </Box>
                                        <Box as="td" className="px-7 py-[18px]">
                                            <Box className="grid grid-cols-[78px_minmax(180px,1fr)_92px_112px_58px_24px] items-center gap-4">
                                                <SkillScoreBadge score={skill.score} />
                                                <SkillProgressBar score={skill.score} />
                                                <Text className="text-[13px] font-extrabold text-[#737B8E]">
                                                    Initial : {skill.initial}%
                                                </Text>
                                                <Box className="inline-flex h-7 items-center justify-center rounded-[7px] bg-[#D9FBE8] px-3 text-[13px] font-extrabold text-[#057A3A]">
                                                    Acquis : {skill.score}%
                                                </Box>
                                                <Text className="text-right text-[15px] font-extrabold text-[#009A94]">
                                                    +{skill.delta}%
                                                </Text>
                                                <InlineIcon icon={ChevronRight} className="h-5 w-5 justify-self-end text-[#B7BDCB]" />
                                            </Box>
                                        </Box>
                                    </Box>
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
    avatarUrl,
    initialMode = "view",
    initials,
    user,
}: UserDetailPageProps) {
    const [currentUser, setCurrentUser] = useState<UserListItem>(user);
    const [activeTab, setActiveTab] = useState<UserDetailTab>("profile");
    const [assignedGroups, setAssignedGroups] = useState<AssignedGroup[]>(initialAssignedGroups);
    const [assignedRoleplays, setAssignedRoleplays] = useState<AssignedRoleplay[]>(initialAssignedRoleplays);
    const [assignedQuizzes, setAssignedQuizzes] = useState<AssignedQuiz[]>(initialAssignedQuizzes);
    const [isEditing, setIsEditing] = useState(initialMode === "edit");
    const [draft, setDraft] = useState<DetailFormValues>(() => getFormValuesFromUser(user));

    const pageTitle = useMemo(() => "Détail de l'utilisateur", []);

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

    const addGroup = () => {
        setAssignedGroups((current) => {
            if (current.some((group) => group.id === extraAssignedGroup.id)) {
                return current;
            }

            return [...current, extraAssignedGroup];
        });
    };

    const removeGroup = (groupId: string) => {
        setAssignedGroups((current) => current.filter((group) => group.id !== groupId));
    };

    const assignRoleplay = () => {
        setAssignedRoleplays((current) => {
            if (current.some((roleplay) => roleplay.id === extraAssignedRoleplay.id)) {
                return current;
            }

            return [...current, extraAssignedRoleplay];
        });
    };

    const assignQuiz = () => {
        setAssignedQuizzes((current) => {
            if (current.some((quiz) => quiz.id === extraAssignedQuiz.id)) {
                return current;
            }

            return [...current, extraAssignedQuiz];
        });
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
                            <GroupsTab groups={assignedGroups} onAddGroup={addGroup} onRemoveGroup={removeGroup} />
                        )}
                        {activeTab === "roleplays" && (
                            <RoleplaysTab onAssign={assignRoleplay} roleplays={assignedRoleplays} />
                        )}
                        {activeTab === "evaluations" && (
                            <EvaluationsTab onAssign={assignQuiz} quizzes={assignedQuizzes} />
                        )}
                        {activeTab === "statistics" && <StatisticsTab />}
                        {activeTab === "skills" && <SkillsTab />}
                    </CardSurface>
                </Box>
            </Box>
        </AppShell>
    );
}
