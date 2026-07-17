import type { OrganizationDetail, OrganizationUserRow } from "./organization-detail";

export const ORGANIZATION_USER_REMOVAL_HISTORY_MESSAGE =
    "Cet utilisateur ne peut pas être retiré de l’organisation car son historique doit être conservé.";

export const ORGANIZATION_USER_REMOVAL_SUCCESS_MESSAGE =
    "Utilisateur retiré de l’organisation.";

export function removeOrganizationUserRow(
    users: OrganizationUserRow[],
    removedUserId: string,
) {
    return users.filter((user) => user.id !== removedUserId);
}

export function decrementOrganizationUserCount(
    organization: OrganizationDetail,
): OrganizationDetail {
    return {
        ...organization,
        userCount: Math.max(0, organization.userCount - 1),
    };
}
