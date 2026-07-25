import { listMethodSelectionOptions } from "@/features/methods/server";
import { listOrganizationSelectionOptions } from "@/features/organizations/server";
import type { ScorecardMethodOption, ScorecardOrganizationOption } from "@/features/scorecards/domain";

interface IncludeUnavailableIdsParams {
    includeUnavailableIds?: readonly string[];
}

export async function listScorecardMethodOptions(
    params: IncludeUnavailableIdsParams = {},
): Promise<ScorecardMethodOption[]> {
    const methods = await listMethodSelectionOptions(params);

    return methods.map((method) => ({
            id: method.id,
            isSelectable: method.isSelectable,
            name: method.name,
        }));
}

export async function listScorecardOrganizationOptions(
    params: IncludeUnavailableIdsParams = {},
): Promise<ScorecardOrganizationOption[]> {
    const organizations = await listOrganizationSelectionOptions(params);

    return organizations.map((organization) => ({
        id: organization.id,
        isSelectable: organization.isSelectable,
        name: organization.name,
    }));
}
