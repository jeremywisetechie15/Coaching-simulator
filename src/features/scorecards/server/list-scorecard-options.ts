import { CONTENT_STATUS } from "@/features/content/domain";
import { listMethods } from "@/features/methods/server";
import { listOrganizations } from "@/features/organizations/server";
import type { ScorecardMethodOption, ScorecardOrganizationOption } from "@/features/scorecards/domain";

export async function listScorecardMethodOptions(): Promise<ScorecardMethodOption[]> {
    const methods = await listMethods();

    return methods
        .filter((method) => method.status !== CONTENT_STATUS.archived)
        .map((method) => ({
            id: method.id,
            name: method.name,
            shortName: method.code || method.name,
        }));
}

export async function listScorecardOrganizationOptions(): Promise<ScorecardOrganizationOption[]> {
    const organizations = await listOrganizations();

    return organizations.map((organization) => ({
        id: organization.id,
        name: organization.name,
    }));
}
