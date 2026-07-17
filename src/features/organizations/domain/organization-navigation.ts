import { withSearchParam, withSearchParams } from "@/features/app-shell/domain";

interface OrganizationGroupDetailHrefOptions {
    edit?: boolean;
    tab?: string;
}

export function getOrganizationGroupsHref(organizationId: string) {
    return withSearchParam(
        `/organizations/${encodeURIComponent(organizationId)}`,
        "tab",
        "groups",
    );
}

export function getOrganizationGroupDetailHref(
    organizationId: string,
    groupId: string,
    options: OrganizationGroupDetailHrefOptions = {},
) {
    return withSearchParams(
        `/organizations/${encodeURIComponent(organizationId)}/groups/${encodeURIComponent(groupId)}`,
        {
            edit: options.edit ? "1" : null,
            tab: options.tab,
        },
    );
}
