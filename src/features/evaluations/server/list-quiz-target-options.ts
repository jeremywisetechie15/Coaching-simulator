import {
    listContentTargetOptions,
    type ContentTargetCurrentSelection,
} from "@/features/content/server";
import type {
    QuizGroupOption,
    QuizOrganizationOption,
    QuizUserOption,
} from "@/features/evaluations/domain/quiz";

export interface QuizTargetOptions {
    groups: QuizGroupOption[];
    organizations: QuizOrganizationOption[];
    users: QuizUserOption[];
}

export async function listQuizTargetOptions(
    current: ContentTargetCurrentSelection = {},
): Promise<QuizTargetOptions> {
    return listContentTargetOptions(current);
}

/** @deprecated Chargez les trois collections en une fois avec listQuizTargetOptions. */
export async function listQuizGroupOptions(): Promise<QuizGroupOption[]> {
    return (await listQuizTargetOptions()).groups;
}

/** @deprecated Chargez les trois collections en une fois avec listQuizTargetOptions. */
export async function listQuizUserOptions(): Promise<QuizUserOption[]> {
    return (await listQuizTargetOptions()).users;
}
