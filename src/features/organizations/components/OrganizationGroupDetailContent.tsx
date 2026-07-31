"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Archive, ArrowLeft, Check, Eye, Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
    ContextualBackLink,
    ContextualLink,
    useContextualReturnHref,
    useCurrentAppHref,
} from "@/features/app-shell/components";
import { withSearchParam, withoutSearchParam } from "@/features/app-shell/domain";
import { ArchiveContentConfirmationModal } from "@/features/content/components";
import { getUserDetailHref } from "@/features/users/domain/user-navigation";
import type {
    OrganizationEvaluationRow,
    OrganizationGroupDetail,
    OrganizationRoleplayRow,
    OrganizationUserRow,
} from "@/features/organizations/domain/organization-detail";
import { ORGANIZATION_MEMBER_STATUS_LABELS } from "@/features/organizations/domain/organization-member";
import { getOrganizationGroupsHref } from "@/features/organizations/domain/organization-navigation";
import { ORGANIZATIONS_QUERY_KEY } from "@/features/organizations/domain/organization-query";
import {
    Box,
    Button,
    CardSurface,
    FieldLabel,
    FormRoot,
    InlineIcon,
    Text,
    TextArea,
    TextInput,
} from "@/lib/ui/atoms";
import {
    DataTable,
    DataTableCell,
    DataTableFrame,
    DataTableHead,
    DataTableHeaderCell,
    DataTableRow,
    PeopleCountTooltip,
} from "@/lib/ui/molecules";
import {
    createFormSubmitApiError,
    notifyFormSubmitError,
    notifyFormSubmitSuccess,
} from "@/lib/ui/feedback/form-submit-feedback";
import { notify } from "@/lib/ui/feedback/toast";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import { OrganizationDetailEvaluations } from "./OrganizationDetailEvaluations";
import { OrganizationDetailRoleplays } from "./OrganizationDetailRoleplays";

type GroupDetailTab = "overview" | "members" | "roleplays" | "evaluations";

interface OrganizationGroupDetailContentProps {
    evaluations: OrganizationEvaluationRow[];
    group: OrganizationGroupDetail;
    initialIsEditing?: boolean;
    members: OrganizationUserRow[];
    roleplays: OrganizationRoleplayRow[];
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

interface GroupPayload {
    group?: OrganizationGroupDetail;
}

const tabs: Array<{ label: string; value: GroupDetailTab }> = [
    { label: "Informations de base", value: "overview" },
    { label: "Membres", value: "members" },
    { label: "Roleplays", value: "roleplays" },
    { label: "Évaluations", value: "evaluations" },
];

function isGroupDetailTab(value: string | null): value is GroupDetailTab {
    return tabs.some((tab) => tab.value === value);
}

const memberColumns = ["Utilisateur", "Email", "Rôle", "Statut", "Roleplays", "Quiz", "Actions"];

function GroupDetailTabs({
    activeTab,
    onTabChange,
}: {
    activeTab: GroupDetailTab;
    onTabChange: (tab: GroupDetailTab) => void;
}) {
    return (
        <Box className={uiTokens.organizationDetail.tabs.scroll}>
            <Box className={uiTokens.organizationDetail.tabs.list}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.value;

                    return (
                        <Button
                            key={tab.value}
                            aria-pressed={isActive}
                            onClick={() => onTabChange(tab.value)}
                            className={cn(
                                uiTokens.organizationDetail.tabs.item,
                                isActive
                                    ? uiTokens.organizationDetail.tabs.active
                                    : uiTokens.organizationDetail.tabs.idle,
                            )}
                        >
                            <Text as="span">{tab.label}</Text>
                        </Button>
                    );
                })}
            </Box>
        </Box>
    );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
    return (
        <Box>
            <Text className={uiTokens.organizationDetail.overview.label}>{label}</Text>
            <Text className={uiTokens.organizationDetail.overview.value}>{value || "-"}</Text>
        </Box>
    );
}

function MemberInfoBlock({ group }: { group: OrganizationGroupDetail }) {
    return (
        <Box>
            <Text className={uiTokens.organizationDetail.overview.label}>
                Nombre de membres
            </Text>
            <PeopleCountTooltip
                count={group.memberCount}
                names={group.memberNames}
                pluralLabel="membres"
                singularLabel="membre"
                variant="detail"
            />
        </Box>
    );
}

function GroupOverview({
    formError,
    formValues,
    group,
    isEditing,
    isSubmitting,
    onSubmit,
    onValueChange,
}: {
    formError: string | null;
    formValues: { description: string; name: string };
    group: OrganizationGroupDetail;
    isEditing: boolean;
    isSubmitting: boolean;
    onSubmit: () => void;
    onValueChange: (field: "description" | "name", value: string) => void;
}) {
    if (isEditing) {
        return (
            <Box className={uiTokens.organizationDetail.overview.form}>
                <FormRoot
                    className={uiTokens.organizationDetail.groupOverview.grid}
                    onSubmit={(event) => {
                        event.preventDefault();
                        onSubmit();
                    }}
                    noValidate
                >
                    <Box className={uiTokens.organizationDetail.overview.editField}>
                        <FieldLabel
                            htmlFor="group-name"
                            className={uiTokens.organizationDetail.overview.editLabel}
                        >
                            Nom du groupe
                        </FieldLabel>
                        <TextInput
                            id="group-name"
                            hasLeadingIcon={false}
                            value={formValues.name}
                            onChange={(event) => onValueChange("name", event.target.value)}
                            className={uiTokens.organizationDetail.overview.editControl}
                        />
                    </Box>
                    <InfoBlock label="Organisation" value={group.organizationName} />
                    <InfoBlock label="Date de création" value={group.createdAt ?? ""} />
                    <MemberInfoBlock group={group} />
                    <InfoBlock
                        label="Nombre de Roleplays assignés"
                        value={`${group.roleplayCount} roleplay${group.roleplayCount > 1 ? "s" : ""}`}
                    />
                    <Box
                        className={cn(
                            uiTokens.organizationDetail.overview.editField,
                            uiTokens.organizationDetail.groupOverview.fullSpan,
                        )}
                    >
                        <FieldLabel
                            htmlFor="group-description"
                            className={uiTokens.organizationDetail.overview.editLabel}
                        >
                            Description
                        </FieldLabel>
                        <TextArea
                            id="group-description"
                            rows={4}
                            value={formValues.description}
                            onChange={(event) => onValueChange("description", event.target.value)}
                            className={uiTokens.organizationDetail.groupOverview.textArea}
                        />
                    </Box>
                    {formError && (
                        <Box
                            aria-live="polite"
                            className={uiTokens.organizationDetail.groupOverview.error}
                        >
                            {formError}
                        </Box>
                    )}
                    <Button type="submit" disabled={isSubmitting || !formValues.name.trim()} className="sr-only">
                        Enregistrer
                    </Button>
                </FormRoot>
            </Box>
        );
    }

    return (
        <Box className={uiTokens.organizationDetail.groupOverview.readGrid}>
            <InfoBlock label="Nom du groupe" value={group.name} />
            <InfoBlock label="Organisation" value={group.organizationName} />
            <InfoBlock label="Date de création" value={group.createdAt ?? ""} />
            <MemberInfoBlock group={group} />
            <InfoBlock
                label="Nombre de Roleplays assignés"
                value={`${group.roleplayCount} roleplay${group.roleplayCount > 1 ? "s" : ""}`}
            />
            <Box className={uiTokens.organizationDetail.groupOverview.fullSpan}>
                <InfoBlock label="Description" value={group.description ?? ""} />
            </Box>
        </Box>
    );
}

function GroupMembersTable({ members }: { members: OrganizationUserRow[] }) {
    return (
        <Box className={uiTokens.organizationDetail.content.root}>
            <Text
                as="h2"
                className={uiTokens.organizationDetail.content.standaloneTitle}
            >
                Membres du groupe
            </Text>
            <DataTableFrame>
                <DataTable width="extraWide">
                    <DataTableHead>
                        <DataTableRow>
                            {memberColumns.map((column) => (
                                <DataTableHeaderCell key={column}>
                                    {column}
                                </DataTableHeaderCell>
                            ))}
                        </DataTableRow>
                    </DataTableHead>
                    <Box as="tbody">
                        {members.map((member) => (
                            <DataTableRow
                                key={member.id}
                                className={uiTokens.organizationDetail.table.row}
                            >
                                <DataTableCell nowrap>
                                    <Box className={uiTokens.organizationDetail.table.companyLayout}>
                                        <Box className={uiTokens.organizationDetail.table.userAvatar}>
                                            <Text
                                                as="span"
                                                className={uiTokens.organizationDetail.table.userInitials}
                                            >
                                                {member.initials}
                                            </Text>
                                        </Box>
                                        <Text className={uiTokens.dataTable.text.primary}>
                                            {member.name}
                                        </Text>
                                    </Box>
                                </DataTableCell>
                                <DataTableCell nowrap>
                                    <Text className={uiTokens.dataTable.text.secondary}>
                                        {member.email}
                                    </Text>
                                </DataTableCell>
                                <DataTableCell nowrap>
                                    <Box className={uiTokens.organizationDetail.table.roleBadge}>
                                        {member.role}
                                    </Box>
                                </DataTableCell>
                                <DataTableCell nowrap>
                                    <Box className={uiTokens.organizationDetail.table.statusBadge}>
                                        {ORGANIZATION_MEMBER_STATUS_LABELS[member.status]}
                                    </Box>
                                </DataTableCell>
                                <DataTableCell nowrap>
                                    <Text className={uiTokens.dataTable.text.body}>
                                        {member.roleplayCount}
                                    </Text>
                                </DataTableCell>
                                <DataTableCell nowrap>
                                    <Text className={uiTokens.dataTable.text.body}>
                                        {member.quizCount}
                                    </Text>
                                </DataTableCell>
                                <DataTableCell nowrap>
                                    <Box className={uiTokens.organizationDetail.table.actions}>
                                        <ContextualLink
                                            href={getUserDetailHref(member.id)}
                                            aria-label={`Voir ${member.name}`}
                                            className={uiTokens.organizationDetail.table.action}
                                        >
                                            <InlineIcon
                                                icon={Eye}
                                                className={uiTokens.organizationDetail.table.actionIcon}
                                            />
                                        </ContextualLink>
                                    </Box>
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                        {members.length === 0 && (
                            <DataTableRow>
                                <DataTableCell
                                    colSpan={memberColumns.length}
                                    className={uiTokens.dataTable.emptyCell}
                                >
                                    <Text className={uiTokens.organizationDetail.content.emptyTitle}>
                                        Aucun membre
                                    </Text>
                                    <Text className={uiTokens.organizationDetail.content.emptyDescription}>
                                        Aucun utilisateur n&apos;est assigné à ce groupe.
                                    </Text>
                                </DataTableCell>
                            </DataTableRow>
                        )}
                    </Box>
                </DataTable>
            </DataTableFrame>
        </Box>
    );
}

export function OrganizationGroupDetailContent({
    evaluations,
    group,
    initialIsEditing = false,
    members,
    roleplays,
}: OrganizationGroupDetailContentProps) {
    const queryClient = useQueryClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentHref = useCurrentAppHref();
    const organizationGroupsHref = getOrganizationGroupsHref(group.organizationId);
    const returnHref = useContextualReturnHref(organizationGroupsHref);
    const [activeTab, setActiveTab] = useState<GroupDetailTab>(() => {
        if (initialIsEditing) return "overview";

        const tab = searchParams.get("tab");
        return isGroupDetailTab(tab) ? tab : "overview";
    });
    const [currentGroup, setCurrentGroup] = useState(group);
    const [isArchiveOpen, setIsArchiveOpen] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    const [isEditing, setIsEditing] = useState(initialIsEditing);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [archiveError, setArchiveError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [formValues, setFormValues] = useState({
        description: group.description ?? "",
        name: group.name,
    });

    useEffect(() => {
        if (initialIsEditing && searchParams.has("edit")) {
            router.replace(withoutSearchParam(currentHref, "edit"), { scroll: false });
        }
    }, [currentHref, initialIsEditing, router, searchParams]);

    const selectTab = (tab: GroupDetailTab) => {
        setActiveTab(tab);
        router.replace(
            tab === "overview"
                ? withoutSearchParam(currentHref, "tab")
                : withSearchParam(currentHref, "tab", tab),
            { scroll: false },
        );
    };

    const startEditing = () => {
        selectTab("overview");
        setFormValues({
            description: currentGroup.description ?? "",
            name: currentGroup.name,
        });
        setFormError(null);
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setFormValues({
            description: currentGroup.description ?? "",
            name: currentGroup.name,
        });
        setFormError(null);
        setIsEditing(false);
    };

    const updateFormValue = (field: "description" | "name", value: string) => {
        setFormValues((currentValues) => ({
            ...currentValues,
            [field]: value,
        }));
        setFormError(null);
    };

    const saveGroup = async () => {
        if (isSubmitting) {
            return;
        }

        if (!formValues.name.trim()) {
            setFormError(notifyFormSubmitError(new Error("Le nom du groupe est obligatoire."), "Le nom du groupe est obligatoire."));
            return;
        }

        setIsSubmitting(true);
        setFormError(null);

        try {
            const response = await fetch(`/api/organizations/${currentGroup.organizationId}/groups/${currentGroup.id}`, {
                body: JSON.stringify(formValues),
                headers: { "Content-Type": "application/json" },
                method: "PATCH",
            });
            const payload = (await response.json().catch(() => null)) as ApiErrorPayload | GroupPayload | null;

            if (!response.ok) {
                const fallback = "Impossible de modifier le groupe.";
                setFormError(notifyFormSubmitError(
                    createFormSubmitApiError(payload as ApiErrorPayload | null, response.status, fallback),
                    fallback,
                ));
                return;
            }

            const updatedGroup = (payload as GroupPayload | null)?.group;

            if (!updatedGroup) {
                const message = "Réponse invalide du serveur.";
                setFormError(notifyFormSubmitError(new Error(message), message));
                return;
            }

            setCurrentGroup(updatedGroup);
            setFormValues({
                description: updatedGroup.description ?? "",
                name: updatedGroup.name,
            });
            setIsEditing(false);
            void queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });
            router.refresh();
            notifyFormSubmitSuccess();
        } catch (error) {
            setFormError(notifyFormSubmitError(error, "Impossible de modifier le groupe."));
        } finally {
            setIsSubmitting(false);
        }
    };

    const openArchiveDialog = () => {
        setArchiveError(null);
        setIsArchiveOpen(true);
    };

    const closeArchiveDialog = () => {
        if (isArchiving) return;

        setArchiveError(null);
        setIsArchiveOpen(false);
    };

    const archiveGroup = async () => {
        if (isArchiving) return;

        setIsArchiving(true);
        setArchiveError(null);

        try {
            const response = await fetch(
                `/api/organizations/${currentGroup.organizationId}/groups/${currentGroup.id}`,
                { method: "DELETE" },
            );
            const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

            if (!response.ok) {
                const fallback = "Impossible d'archiver le groupe.";
                setArchiveError(notifyFormSubmitError(
                    createFormSubmitApiError(payload, response.status, fallback),
                    fallback,
                ));
                return;
            }

            void queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });
            notify.success("Groupe archivé");
            router.push(returnHref);
            router.refresh();
        } catch (error) {
            const fallback = "Impossible d'archiver le groupe.";
            setArchiveError(notifyFormSubmitError(error, fallback));
        } finally {
            setIsArchiving(false);
        }
    };

    return (
        <Box as="main" className={uiTokens.organizationDetail.page}>
            <Box className={uiTokens.organizationDetail.container}>
                <Box className={uiTokens.organizationDetail.header.root}>
                    <Box className={uiTokens.organizationDetail.header.titleGroup}>
                        <ContextualBackLink
                            fallbackHref={organizationGroupsHref}
                            className={uiTokens.organizationDetail.header.back}
                            aria-label="Retour à l'organisation"
                        >
                            <InlineIcon
                                icon={ArrowLeft}
                                className={uiTokens.organizationDetail.header.backIcon}
                            />
                        </ContextualBackLink>
                        <Text
                            as="h1"
                            className={uiTokens.organizationDetail.header.title}
                        >
                            Détail du groupe
                        </Text>
                    </Box>

                    <Box className={uiTokens.organizationDetail.header.actions}>
                        {isEditing ? (
                            <>
                                <Button
                                    onClick={cancelEditing}
                                    disabled={isSubmitting}
                                    className={cn(
                                        uiTokens.organizationDetail.header.action,
                                        uiTokens.organizationDetail.header.cancel,
                                    )}
                                >
                                    <InlineIcon
                                        icon={X}
                                        className={uiTokens.organizationDetail.header.actionIcon}
                                    />
                                    Annuler
                                </Button>
                                <Button
                                    onClick={saveGroup}
                                    disabled={isSubmitting || !formValues.name.trim()}
                                    className={cn(
                                        uiTokens.organizationDetail.header.action,
                                        uiTokens.organizationDetail.header.primary,
                                    )}
                                >
                                    <InlineIcon
                                        icon={Check}
                                        className={uiTokens.organizationDetail.header.actionIcon}
                                    />
                                    {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={startEditing}
                                className={cn(
                                    uiTokens.organizationDetail.header.action,
                                    uiTokens.organizationDetail.header.primary,
                                )}
                            >
                                <InlineIcon
                                    icon={Pencil}
                                    className={uiTokens.organizationDetail.header.actionIcon}
                                />
                                Modifier
                            </Button>
                        )}
                        <Button
                            disabled={isEditing || isArchiving}
                            onClick={openArchiveDialog}
                            className={cn(
                                uiTokens.organizationDetail.header.action,
                                uiTokens.organizationDetail.header.danger,
                            )}
                        >
                            <InlineIcon
                                icon={Archive}
                                className={uiTokens.organizationDetail.header.actionIcon}
                            />
                            Archiver
                        </Button>
                    </Box>
                </Box>

                <CardSurface className={uiTokens.organizationDetail.surface}>
                    <GroupDetailTabs activeTab={activeTab} onTabChange={selectTab} />
                    {activeTab === "overview" && (
                        <GroupOverview
                            formError={formError}
                            formValues={formValues}
                            group={currentGroup}
                            isEditing={isEditing}
                            isSubmitting={isSubmitting}
                            onSubmit={saveGroup}
                            onValueChange={updateFormValue}
                        />
                    )}
                    {activeTab === "members" && <GroupMembersTable members={members} />}
                    {activeTab === "roleplays" && (
                        <OrganizationDetailRoleplays
                            roleplays={roleplays}
                            title={`Roleplays assignés à ${currentGroup.name}`}
                        />
                    )}
                    {activeTab === "evaluations" && (
                        <OrganizationDetailEvaluations
                            evaluations={evaluations}
                            title={`Évaluations assignées à ${currentGroup.name}`}
                        />
                    )}
                </CardSurface>

                {isArchiveOpen && (
                    <ArchiveContentConfirmationModal
                        busy={isArchiving}
                        entityLabel="le groupe"
                        error={archiveError}
                        name={currentGroup.name}
                        onCancel={closeArchiveDialog}
                        onConfirm={() => void archiveGroup()}
                    />
                )}
            </Box>
        </Box>
    );
}
