import type { QuizMethodOption, QuizOrganizationOption } from "@/features/evaluations/domain/quiz";
import { listMethodSelectionOptionsWithSteps } from "@/features/methods/server";
import { listOrganizationSelectionOptions } from "@/features/organizations/server";

export async function listQuizMethodOptions({
    includeUnavailableIds = [],
}: {
    includeUnavailableIds?: readonly string[];
} = {}): Promise<QuizMethodOption[]> {
    return listMethodSelectionOptionsWithSteps({ includeUnavailableIds });
}

export async function listQuizOrganizationOptions(): Promise<QuizOrganizationOption[]> {
    const organizations = await listOrganizationSelectionOptions();

    return organizations.map((organization) => ({
        id: organization.id,
        isSelectable: organization.isSelectable,
        name: organization.name,
    }));
}
