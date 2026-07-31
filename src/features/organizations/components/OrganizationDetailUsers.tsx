"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, UserMinus } from "lucide-react";
import { ContextualLink } from "@/features/app-shell/components";
import { DeleteContentConfirmationModal } from "@/features/content/components";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import {
    DataTable,
    DataTableCell,
    DataTableFrame,
    DataTableHead,
    DataTableHeaderCell,
    DataTableRow,
} from "@/lib/ui/molecules";
import { ENTITY_ACTION_LABELS } from "@/lib/ui/domain/entity-action";
import {
    createFormSubmitError,
    notifyFormSubmitError,
    notifyFormSubmitSuccess,
} from "@/lib/ui/feedback/form-submit-feedback";
import { notify } from "@/lib/ui/feedback/toast";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import {
    type OrganizationGroupRow,
    type OrganizationUserRow,
} from "@/features/organizations/domain/organization-detail";
import {
    ORGANIZATION_MEMBER_STATUS_LABELS,
} from "@/features/organizations/domain/organization-member";
import { ORGANIZATIONS_QUERY_KEY } from "@/features/organizations/domain/organization-query";
import {
    ORGANIZATION_USER_REMOVAL_SUCCESS_MESSAGE,
    removeOrganizationUserRow,
} from "@/features/organizations/domain/organization-user-removal";
import {
    initialUserInviteFormValues,
    UserInviteModal,
    type UserInviteFormValues,
} from "@/features/users/components/UserInviteModal";
import { getUserInvitationSuccessMessage } from "@/features/users/domain/users";
import { getUserDetailHref } from "@/features/users/domain/user-navigation";
import { USERS_QUERY_KEY } from "@/features/users/domain/user-query";
import {
    getOrganizationInvitationResendSuccessMessage,
} from "@/features/organizations/domain/organization-invitation";
import { OrganizationInvitationResendAction } from "./OrganizationInvitationResendAction";
import { OrganizationInvitationResendConfirmationModal } from "./OrganizationInvitationResendConfirmationModal";

const columns = ["Utilisateur", "Email", "Rôle", "Statut", "Roleplays", "Quiz", "Actions"];

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

interface UsersPayload {
    users?: OrganizationUserRow[];
}

interface InvitationResendPayload {
    invitation?: {
        email?: string;
    };
}

function getInitialCreateUserValues(organizationId: string): UserInviteFormValues {
    return {
        ...initialUserInviteFormValues,
        organizationId,
    };
}

interface OrganizationDetailUsersProps {
    onUserInvited?: () => void;
    onUserRemoved?: () => void;
    organizationId: string;
    organizationName?: string;
}

function getInviteErrorMessage(status: number, payload: ApiErrorPayload | null) {
    const validationMessage = payload?.issues?.map((issue) => issue.message).join(" ");
    const message = validationMessage || payload?.error || "Impossible d'envoyer l'invitation.";

    return `Erreur ${status} : ${message}`;
}

function getApiErrorMessage(payload: ApiErrorPayload | null, fallback: string) {
    const validationMessage = payload?.issues?.map((issue) => issue.message).join(" ");

    return validationMessage || payload?.error || fallback;
}

export function OrganizationDetailUsers({
    onUserInvited,
    onUserRemoved,
    organizationId,
    organizationName = "Organisation",
}: OrganizationDetailUsersProps) {
    const queryClient = useQueryClient();
    const [users, setUsers] = useState<OrganizationUserRow[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isInviting, setIsInviting] = useState(false);
    const [isRemovingUser, setIsRemovingUser] = useState(false);
    const [resendingInvitationUserId, setResendingInvitationUserId] = useState<string | null>(null);
    const [listError, setListError] = useState<string | null>(null);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
    const [inviteStatus, setInviteStatus] = useState<string | null>(null);
    const [removalError, setRemovalError] = useState<string | null>(null);
    const [invitationResendUser, setInvitationResendUser] = useState<OrganizationUserRow | null>(null);
    const [userToRemove, setUserToRemove] = useState<OrganizationUserRow | null>(null);
    const [organizationGroups, setOrganizationGroups] = useState<OrganizationGroupRow[]>([]);
    const [createUserValues, setCreateUserValues] = useState<UserInviteFormValues>(() =>
        getInitialCreateUserValues(organizationId)
    );

    const groupOptions = organizationGroups.map((group) => ({ label: group.name, value: group.id }));

    const loadUsers = useCallback(async () => {
        setIsLoadingUsers(true);
        setListError(null);

        try {
            const response = await fetch(`/api/organizations/${organizationId}/users`, {
                headers: { Accept: "application/json" },
            });
            const payload = (await response.json().catch(() => null)) as UsersPayload | ApiErrorPayload | null;

            if (!response.ok) {
                setListError(getApiErrorMessage(payload as ApiErrorPayload | null, "Impossible de charger les utilisateurs."));
                return;
            }

            setUsers((payload as UsersPayload | null)?.users ?? []);
        } catch {
            setListError("Impossible de charger les utilisateurs.");
        } finally {
            setIsLoadingUsers(false);
        }
    }, [organizationId]);

    useEffect(() => {
        void loadUsers();
    }, [loadUsers]);

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
        setListError(null);
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
                const message = getInviteErrorMessage(response.status, payload as ApiErrorPayload | null);
                setInviteError(notifyFormSubmitError(createFormSubmitError(message, response.status), message));
                return;
            }
        } catch (error) {
            setInviteStatus(null);
            setInviteError(notifyFormSubmitError(error, "Impossible d'envoyer l'invitation."));
            return;
        } finally {
            setIsInviting(false);
        }

        setInviteSuccess(getUserInvitationSuccessMessage(email));
        notifyFormSubmitSuccess();
        void queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });
        void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
        void loadUsers();
        onUserInvited?.();
        closeCreateModal();
    };

    const openRemovalDialog = (user: OrganizationUserRow) => {
        setRemovalError(null);
        setUserToRemove(user);
    };

    const closeRemovalDialog = () => {
        if (isRemovingUser) return;

        setRemovalError(null);
        setUserToRemove(null);
    };

    const removeUser = async () => {
        if (!userToRemove || isRemovingUser) return;

        const removedUser = userToRemove;
        setIsRemovingUser(true);
        setRemovalError(null);

        try {
            const response = await fetch(
                `/api/organizations/${organizationId}/users/${removedUser.id}`,
                { method: "DELETE" },
            );
            const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

            if (!response.ok) {
                setRemovalError(getApiErrorMessage(
                    payload,
                    "Impossible de retirer cet utilisateur de l’organisation.",
                ));
                return;
            }

            setUsers((currentUsers) => removeOrganizationUserRow(currentUsers, removedUser.id));
            setUserToRemove(null);
            notify.success(ORGANIZATION_USER_REMOVAL_SUCCESS_MESSAGE);
            void queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });
            void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
            onUserRemoved?.();
        } catch {
            setRemovalError("Impossible de retirer cet utilisateur de l’organisation.");
        } finally {
            setIsRemovingUser(false);
        }
    };

    const resendInvitation = async (user: OrganizationUserRow) => {
        if (resendingInvitationUserId) {
            return false;
        }

        setResendingInvitationUserId(user.id);

        try {
            const response = await fetch(
                `/api/organizations/${organizationId}/users/${user.id}/resend-invitation`,
                { method: "POST" },
            );
            const payload = (await response.json().catch(() => null)) as
                | ApiErrorPayload
                | InvitationResendPayload
                | null;

            if (!response.ok) {
                notify.error(getApiErrorMessage(
                    payload as ApiErrorPayload | null,
                    "Impossible de renvoyer l’invitation.",
                ));
                return false;
            }

            const recipientEmail =
                (payload as InvitationResendPayload | null)?.invitation?.email ?? user.email;
            notify.success(getOrganizationInvitationResendSuccessMessage(recipientEmail));
            void queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });
            void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
            return true;
        } catch {
            notify.error("Impossible de renvoyer l’invitation.");
            return false;
        } finally {
            setResendingInvitationUserId(null);
        }
    };

    const confirmInvitationResend = async () => {
        if (!invitationResendUser) {
            return;
        }

        const wasSent = await resendInvitation(invitationResendUser);

        if (wasSent) {
            setInvitationResendUser(null);
        }
    };

    return (
        <Box className={uiTokens.organizationDetail.content.root}>
            <Box className={uiTokens.organizationDetail.content.sectionHeader}>
                <Text as="h2" className={uiTokens.organizationDetail.content.sectionTitle}>
                    {"Utilisateurs de l'organisation"}
                </Text>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className={uiTokens.organizationDetail.content.subtleAction}
                >
                    <InlineIcon
                        icon={Plus}
                        className={uiTokens.organizationDetail.content.subtleActionIcon}
                    />
                    Ajouter des utilisateurs
                </Button>
            </Box>

            {inviteSuccess && (
                <Box
                    aria-live="polite"
                    className={uiTokens.organizationDetail.content.success}
                >
                    {inviteSuccess}
                </Box>
            )}

            {listError && (
                <Box
                    aria-live="polite"
                    className={uiTokens.organizationDetail.content.error}
                >
                    {listError}
                </Box>
            )}

            <DataTableFrame>
                <DataTable width="extraWide">
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
                        {isLoadingUsers && (
                            <DataTableRow>
                                <DataTableCell
                                    colSpan={columns.length}
                                    className={uiTokens.dataTable.emptyCell}
                                >
                                    <Text className={uiTokens.organizationDetail.content.loading}>
                                        Chargement des utilisateurs...
                                    </Text>
                                </DataTableCell>
                            </DataTableRow>
                        )}

                        {!isLoadingUsers && users.map((user) => (
                            <DataTableRow
                                key={user.id}
                                className={uiTokens.organizationDetail.table.row}
                            >
                                <DataTableCell nowrap>
                                    <Box className={uiTokens.organizationDetail.table.companyLayout}>
                                        <Box className={uiTokens.organizationDetail.table.userAvatar}>
                                            <Text
                                                as="span"
                                                className={uiTokens.organizationDetail.table.userInitials}
                                            >
                                                {user.initials}
                                            </Text>
                                        </Box>
                                        <Text className={uiTokens.dataTable.text.primary}>
                                            {user.name}
                                        </Text>
                                    </Box>
                                </DataTableCell>
                                <DataTableCell nowrap>
                                    <Text className={uiTokens.dataTable.text.secondary}>
                                        {user.email}
                                    </Text>
                                </DataTableCell>
                                <DataTableCell nowrap>
                                    <Box className={uiTokens.organizationDetail.table.roleBadge}>
                                        {user.role}
                                    </Box>
                                </DataTableCell>
                                <DataTableCell nowrap>
                                    <Box className={uiTokens.organizationDetail.table.statusBadge}>
                                        {ORGANIZATION_MEMBER_STATUS_LABELS[user.status]}
                                    </Box>
                                </DataTableCell>
                                <DataTableCell nowrap>
                                    <Text className={uiTokens.dataTable.text.body}>
                                        {user.roleplayCount}
                                    </Text>
                                </DataTableCell>
                                <DataTableCell nowrap>
                                    <Text className={uiTokens.dataTable.text.body}>
                                        {user.quizCount}
                                    </Text>
                                </DataTableCell>
                                <DataTableCell nowrap>
                                    <Box className={uiTokens.organizationDetail.table.actions}>
                                        <ContextualLink
                                            href={getUserDetailHref(user.id)}
                                            aria-label={`${ENTITY_ACTION_LABELS.view} ${user.name}`}
                                            className={uiTokens.organizationDetail.table.action}
                                        >
                                            <InlineIcon
                                                icon={Eye}
                                                className={uiTokens.organizationDetail.table.actionIcon}
                                            />
                                        </ContextualLink>
                                        <ContextualLink
                                            href={getUserDetailHref(user.id, "edit")}
                                            aria-label={`${ENTITY_ACTION_LABELS.modify} ${user.name}`}
                                            className={uiTokens.organizationDetail.table.action}
                                        >
                                            <InlineIcon
                                                icon={Pencil}
                                                className={uiTokens.organizationDetail.table.actionIcon}
                                            />
                                        </ContextualLink>
                                        <OrganizationInvitationResendAction
                                            isDisabled={Boolean(resendingInvitationUserId)}
                                            isSending={resendingInvitationUserId === user.id}
                                            onRequestResend={() => setInvitationResendUser(user)}
                                            status={user.status}
                                            userName={user.name}
                                        />
                                        <Button
                                            aria-label={`Retirer ${user.name} de l'organisation`}
                                            className={cn(
                                                uiTokens.organizationDetail.table.action,
                                                uiTokens.organizationDetail.table.dangerAction,
                                            )}
                                            onClick={() => openRemovalDialog(user)}
                                        >
                                            <InlineIcon
                                                icon={UserMinus}
                                                className={uiTokens.organizationDetail.table.actionIcon}
                                            />
                                        </Button>
                                    </Box>
                                </DataTableCell>
                            </DataTableRow>
                        ))}

                        {!isLoadingUsers && users.length === 0 && (
                            <DataTableRow>
                                <DataTableCell
                                    colSpan={columns.length}
                                    className={uiTokens.dataTable.emptyCell}
                                >
                                    <Text className={uiTokens.organizationDetail.content.emptyTitle}>
                                        Aucun utilisateur
                                    </Text>
                                    <Text className={uiTokens.organizationDetail.content.emptyDescription}>
                                        Ajoutez des utilisateurs à cette organisation.
                                    </Text>
                                </DataTableCell>
                            </DataTableRow>
                        )}
                    </Box>
                </DataTable>
            </DataTableFrame>

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

            {userToRemove && (
                <DeleteContentConfirmationModal
                    busy={isRemovingUser}
                    busyLabel="Retrait..."
                    confirmLabel="Retirer"
                    description={`Confirmez le retrait de ${userToRemove.name} de ${organizationName}.`}
                    entityLabel="le rattachement utilisateur"
                    error={removalError}
                    name={userToRemove.name}
                    onCancel={closeRemovalDialog}
                    onConfirm={() => void removeUser()}
                    title="Retirer de l'organisation"
                    warning="Le compte et le profil seront conservés. L'utilisateur sera également retiré des groupes de cette organisation."
                />
            )}

            {invitationResendUser && (
                <OrganizationInvitationResendConfirmationModal
                    isSending={resendingInvitationUserId === invitationResendUser.id}
                    onCancel={() => setInvitationResendUser(null)}
                    onConfirm={() => void confirmInvitationResend()}
                    organizationName={organizationName}
                    userEmail={invitationResendUser.email}
                    userName={invitationResendUser.name}
                />
            )}
        </Box>
    );
}
