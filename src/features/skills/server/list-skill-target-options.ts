import type {
    ContentTargetGroupOption,
    ContentTargetOrganizationOption,
    ContentTargetUserOption,
} from "@/features/content/domain";
import {
    listContentTargetOptions,
    type ContentTargetCurrentSelection,
} from "@/features/content/server";

export interface SkillTargetOptions {
    groups: ContentTargetGroupOption[];
    organizations: ContentTargetOrganizationOption[];
    users: ContentTargetUserOption[];
}

export async function listSkillTargetOptions(
    current: ContentTargetCurrentSelection = {},
): Promise<SkillTargetOptions> {
    return listContentTargetOptions(current);
}

/** @deprecated Chargez les trois collections en une fois avec listSkillTargetOptions. */
export async function listSkillOrganizationOptions(): Promise<ContentTargetOrganizationOption[]> {
    return (await listSkillTargetOptions()).organizations;
}

/** @deprecated Chargez les trois collections en une fois avec listSkillTargetOptions. */
export async function listSkillGroupOptions(): Promise<ContentTargetGroupOption[]> {
    return (await listSkillTargetOptions()).groups;
}

/** @deprecated Chargez les trois collections en une fois avec listSkillTargetOptions. */
export async function listSkillUserOptions(): Promise<ContentTargetUserOption[]> {
    return (await listSkillTargetOptions()).users;
}
