"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Archive, Eye, Pencil, Plus, UsersRound } from "lucide-react";
import { ContextualLink } from "@/features/app-shell/components";
import { ArchiveContentConfirmationModal } from "@/features/content/components";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import {
    createFormSubmitApiError,
    getFormSubmitApiErrorMessage,
    notifyFormSubmitError,
    notifyFormSubmitSuccess,
} from "@/lib/ui/feedback/form-submit-feedback";
import { notify } from "@/lib/ui/feedback/toast";
import type { OrganizationGroupRow } from "@/features/organizations/domain/organization-detail";
import { getOrganizationGroupDetailHref } from "@/features/organizations/domain/organization-navigation";
import { ORGANIZATIONS_QUERY_KEY } from "@/features/organizations/domain/organization-query";
import { CreateGroupModal } from "./CreateGroupModal";

const columns = ["Groupe", "Membres", "Roleplays", "Quizzes", "Actions"];

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
        <Box className="px-7 py-7">
            <Box className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <Text as="h2" className="text-[18px] font-extrabold text-[#171B2A]">
                    {"Groupes de l'organisation"}
                </Text>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex h-10 items-center gap-3 rounded-lg bg-[#E5E9FF] px-5 text-[14px] font-bold text-[#5140F0] transition hover:bg-[#DBE0FF]"
                >
                    <InlineIcon icon={Plus} className="h-5 w-5" />
                    Créer un groupe
                </Button>
            </Box>

            {listError && (
                <Box
                    aria-live="polite"
                    className="mb-5 rounded-lg border border-[#F3C7C7] bg-[#FFF4F4] px-4 py-3 text-[13px] font-semibold text-[#A43A3A]"
                >
                    {listError}
                </Box>
            )}

            <CardSurface className="overflow-hidden rounded-[14px] border border-[#E1E4EB] shadow-none">
                <Box className="overflow-x-auto">
                    <Box as="table" className="w-full min-w-[920px] border-collapse">
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
                                <Box as="tr" key={group.id} className="border-b border-[#E7E9EF] last:border-b-0">
                                    <Box as="td" className="px-7 py-5">
                                        <Box className="flex items-center gap-4">
                                            <Box className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E7EAFF] text-[#5140F0]">
                                                <InlineIcon icon={UsersRound} className="h-5 w-5" />
                                            </Box>
                                            <Text className="text-[14px] font-extrabold text-[#171B2A]">{group.name}</Text>
                                        </Box>
                                    </Box>
                                    <Box as="td" className="px-7 py-5">
                                        <Text className="text-[14px] font-semibold text-[#202636]">
                                            {group.memberCount} membres
                                        </Text>
                                    </Box>
                                    <Box as="td" className="px-7 py-5">
                                        <Text className="text-[14px] font-semibold text-[#202636]">
                                            {group.roleplayCount}
                                        </Text>
                                    </Box>
                                    <Box as="td" className="px-7 py-5">
                                        <Text className="text-[14px] font-semibold text-[#202636]">
                                            {group.quizCount}
                                        </Text>
                                    </Box>
                                    <Box as="td" className="px-7 py-5">
                                        <Box className="flex items-center gap-5 text-[#9AA2B2]">
                                            <ContextualLink
                                                href={getOrganizationGroupDetailHref(organizationId, group.id)}
                                                aria-label={`Voir ${group.name}`}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[#F2F3FF] hover:text-[#5140F0]"
                                            >
                                                <InlineIcon icon={Eye} className="h-5 w-5" />
                                            </ContextualLink>
                                            <ContextualLink
                                                href={getOrganizationGroupDetailHref(
                                                    organizationId,
                                                    group.id,
                                                    { edit: true },
                                                )}
                                                aria-label={`Modifier ${group.name}`}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[#F2F3FF] hover:text-[#5140F0]"
                                            >
                                                <InlineIcon icon={Pencil} className="h-5 w-5" />
                                            </ContextualLink>
                                            <Button
                                                onClick={() => openArchiveDialog(group)}
                                                aria-label={`Archiver ${group.name}`}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[#F2F3FF] hover:text-[#5140F0]"
                                            >
                                                <InlineIcon icon={Archive} className="h-5 w-5" />
                                            </Button>
                                        </Box>
                                    </Box>
                                </Box>
                            ))}

                            {!isLoading && groups.length === 0 && (
                                <Box as="tr">
                                    <Box as="td" colSpan={columns.length} className="px-7 py-12 text-center">
                                        <Text className="text-[14px] font-bold text-[#171B2A]">
                                            Aucun groupe créé
                                        </Text>
                                        <Text className="mt-2 text-[14px] font-semibold text-[#A0A6B5]">
                                            Créez un groupe pour organiser les apprenants de cette organisation.
                                        </Text>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>
            </CardSurface>

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
