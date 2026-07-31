"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Archive, Eye, Pencil, Plus, UsersRound } from "lucide-react";
import { ContextualLink } from "@/features/app-shell/components";
import { ArchiveContentConfirmationModal } from "@/features/content/components";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
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
    getFormSubmitApiErrorMessage,
    notifyFormSubmitError,
    notifyFormSubmitSuccess,
} from "@/lib/ui/feedback/form-submit-feedback";
import { notify } from "@/lib/ui/feedback/toast";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import type { OrganizationGroupRow } from "@/features/organizations/domain/organization-detail";
import { getOrganizationGroupDetailHref } from "@/features/organizations/domain/organization-navigation";
import { ORGANIZATIONS_QUERY_KEY } from "@/features/organizations/domain/organization-query";
import { CreateGroupModal } from "./CreateGroupModal";

const columns = ["Groupe", "Membres", "Roleplays", "Quiz", "Actions"];

interface OrganizationDetailGroupsProps {
    onGroupsChanged?: () => void;
    organizationId: string;
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

interface GroupsPayload {
    group?: OrganizationGroupRow;
    groups?: OrganizationGroupRow[];
}

export function OrganizationDetailGroups({ onGroupsChanged, organizationId }: OrganizationDetailGroupsProps) {
    const queryClient = useQueryClient();
    const [groups, setGroups] = useState<OrganizationGroupRow[]>([]);
    const [groupToArchive, setGroupToArchive] = useState<OrganizationGroupRow | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [archiveError, setArchiveError] = useState<string | null>(null);
    const [listError, setListError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [groupName, setGroupName] = useState("");
    const [groupDescription, setGroupDescription] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function loadGroups() {
            setIsLoading(true);
            setListError(null);

            try {
                const response = await fetch(`/api/organizations/${organizationId}/groups`, {
                    headers: { Accept: "application/json" },
                });
                const payload = (await response.json().catch(() => null)) as GroupsPayload | ApiErrorPayload | null;

                if (!response.ok) {
                    setListError(getFormSubmitApiErrorMessage(
                        payload as ApiErrorPayload | null,
                        response.status,
                        "Impossible de charger les groupes.",
                    ));
                    return;
                }

                if (isMounted) {
                    setGroups((payload as GroupsPayload | null)?.groups ?? []);
                }
            } catch {
                if (isMounted) {
                    setListError("Impossible de charger les groupes.");
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
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
        setFormError(null);
        setGroupName("");
        setGroupDescription("");
    };

    const createGroup = async () => {
        const trimmedGroupName = groupName.trim();

        if (!trimmedGroupName || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        setFormError(null);

        try {
            const response = await fetch(`/api/organizations/${organizationId}/groups`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description: groupDescription,
                    name: trimmedGroupName,
                }),
            });
            const payload = (await response.json().catch(() => null)) as GroupsPayload | ApiErrorPayload | null;

            if (!response.ok) {
                const errorPayload = payload as ApiErrorPayload | null;
                const fallback = "Impossible de créer le groupe.";
                setFormError(notifyFormSubmitError(
                    createFormSubmitApiError(errorPayload, response.status, fallback),
                    fallback,
                ));
                return;
            }

            const createdGroup = (payload as GroupsPayload | null)?.group;

            if (!createdGroup) {
                const message = "Réponse invalide du serveur.";
                setFormError(notifyFormSubmitError(new Error(message), message));
                return;
            }

            setGroups((currentGroups) => [...currentGroups, createdGroup]);
            void queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });
            onGroupsChanged?.();
            notifyFormSubmitSuccess();
        } catch (error) {
            setFormError(notifyFormSubmitError(error, "Impossible de créer le groupe."));
            return;
        } finally {
            setIsSubmitting(false);
        }

        closeCreateModal();
    };

    const openArchiveDialog = (group: OrganizationGroupRow) => {
        setArchiveError(null);
        setGroupToArchive(group);
    };

    const closeArchiveDialog = () => {
        if (isArchiving) return;

        setArchiveError(null);
        setGroupToArchive(null);
    };

    const archiveGroup = async () => {
        if (!groupToArchive || isArchiving) return;

        setIsArchiving(true);
        setArchiveError(null);

        try {
            const response = await fetch(
                `/api/organizations/${organizationId}/groups/${groupToArchive.id}`,
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

            setGroups((currentGroups) => currentGroups.filter((group) => group.id !== groupToArchive.id));
            setGroupToArchive(null);
            void queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });
            onGroupsChanged?.();
            notify.success("Groupe archivé");
        } catch (error) {
            const fallback = "Impossible d'archiver le groupe.";
            setArchiveError(notifyFormSubmitError(error, fallback));
        } finally {
            setIsArchiving(false);
        }
    };

    return (
        <Box className={uiTokens.organizationDetail.content.root}>
            <Box className={uiTokens.organizationDetail.content.sectionHeader}>
                <Text as="h2" className={uiTokens.organizationDetail.content.sectionTitle}>
                    {"Groupes de l'organisation"}
                </Text>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className={uiTokens.organizationDetail.content.subtleAction}
                >
                    <InlineIcon
                        icon={Plus}
                        className={uiTokens.organizationDetail.content.subtleActionIcon}
                    />
                    Créer un groupe
                </Button>
            </Box>

            {listError && (
                <Box
                    aria-live="polite"
                    className={uiTokens.organizationDetail.content.error}
                >
                    {listError}
                </Box>
            )}

            <DataTableFrame>
                <DataTable width="wide">
                    <DataTableHead>
                        <DataTableRow>
                            {columns.map((column) => (
                                <DataTableHeaderCell key={column}>
                                    {column}
                                </DataTableHeaderCell>
                            ))}
                        </DataTableRow>
                    </DataTableHead>
                    <Box as="tbody">
                        {isLoading && (
                            <DataTableRow>
                                <DataTableCell
                                    colSpan={columns.length}
                                    className={uiTokens.dataTable.emptyCell}
                                >
                                    <Text className={uiTokens.organizationDetail.content.loading}>
                                        Chargement des groupes...
                                    </Text>
                                </DataTableCell>
                            </DataTableRow>
                        )}

                        {!isLoading && groups.map((group) => (
                            <DataTableRow
                                key={group.id}
                                className={uiTokens.organizationDetail.table.row}
                            >
                                <DataTableCell nowrap>
                                    <Box className={uiTokens.organizationDetail.table.companyLayout}>
                                        <Box className={uiTokens.organizationDetail.table.groupIcon}>
                                            <InlineIcon
                                                icon={UsersRound}
                                                className={uiTokens.organizationDetail.table.groupIconGlyph}
                                            />
                                        </Box>
                                        <Text className={uiTokens.dataTable.text.primary}>
                                            {group.name}
                                        </Text>
                                    </Box>
                                </DataTableCell>
                                <DataTableCell nowrap>
                                    <PeopleCountTooltip
                                        count={group.memberCount}
                                        names={group.memberNames}
                                        pluralLabel="membres"
                                        singularLabel="membre"
                                    />
                                </DataTableCell>
                                <DataTableCell nowrap>
                                    <Text className={uiTokens.dataTable.text.body}>
                                        {group.roleplayCount}
                                    </Text>
                                </DataTableCell>
                                <DataTableCell nowrap>
                                    <Text className={uiTokens.dataTable.text.body}>
                                        {group.quizCount}
                                    </Text>
                                </DataTableCell>
                                <DataTableCell nowrap>
                                    <Box className={uiTokens.organizationDetail.table.actions}>
                                        <ContextualLink
                                            href={getOrganizationGroupDetailHref(organizationId, group.id)}
                                            aria-label={`Voir ${group.name}`}
                                            className={uiTokens.organizationDetail.table.action}
                                        >
                                            <InlineIcon
                                                icon={Eye}
                                                className={uiTokens.organizationDetail.table.actionIcon}
                                            />
                                        </ContextualLink>
                                        <ContextualLink
                                            href={getOrganizationGroupDetailHref(
                                                organizationId,
                                                group.id,
                                                { edit: true },
                                            )}
                                            aria-label={`Modifier ${group.name}`}
                                            className={uiTokens.organizationDetail.table.action}
                                        >
                                            <InlineIcon
                                                icon={Pencil}
                                                className={uiTokens.organizationDetail.table.actionIcon}
                                            />
                                        </ContextualLink>
                                        <Button
                                            onClick={() => openArchiveDialog(group)}
                                            aria-label={`Archiver ${group.name}`}
                                            className={cn(
                                                uiTokens.organizationDetail.table.action,
                                                uiTokens.organizationDetail.table.dangerAction,
                                            )}
                                        >
                                            <InlineIcon
                                                icon={Archive}
                                                className={uiTokens.organizationDetail.table.actionIcon}
                                            />
                                        </Button>
                                    </Box>
                                </DataTableCell>
                            </DataTableRow>
                        ))}

                        {!isLoading && groups.length === 0 && (
                            <DataTableRow>
                                <DataTableCell
                                    colSpan={columns.length}
                                    className={uiTokens.dataTable.emptyCell}
                                >
                                    <Text className={uiTokens.organizationDetail.content.emptyTitle}>
                                        Aucun groupe créé
                                    </Text>
                                    <Text className={uiTokens.organizationDetail.content.emptyDescription}>
                                        Créez un groupe pour organiser les apprenants de cette organisation.
                                    </Text>
                                </DataTableCell>
                            </DataTableRow>
                        )}
                    </Box>
                </DataTable>
            </DataTableFrame>

            {isCreateModalOpen && (
                <CreateGroupModal
                    description={groupDescription}
                    formError={formError}
                    groupName={groupName}
                    isSubmitting={isSubmitting}
                    onClose={closeCreateModal}
                    onDescriptionChange={setGroupDescription}
                    onGroupNameChange={setGroupName}
                    onSubmit={createGroup}
                />
            )}

            {groupToArchive && (
                <ArchiveContentConfirmationModal
                    busy={isArchiving}
                    entityLabel="le groupe"
                    error={archiveError}
                    name={groupToArchive.name}
                    onCancel={closeArchiveDialog}
                    onConfirm={() => void archiveGroup()}
                />
            )}
        </Box>
    );
}
