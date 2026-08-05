import type {
    SkillDimension,
    SkillType,
    SkillVisibilityScope,
} from "./skills";

export const SKILL_USAGE_EDIT_RESTRICTION_MESSAGE =
    "Cette compétence est utilisée par un scénario ou un quiz qui n’est plus en brouillon. Son libellé et sa description peuvent être modifiés. Dupliquez-la pour modifier sa configuration.";

export interface SkillUsageLockedDimensionItem {
    dimension: SkillDimension;
    id: string | null;
    label: string;
    order: number;
}

export interface SkillUsageLockedConfiguration {
    assignedUserId: string | null;
    category: string | null;
    dimensionItems: SkillUsageLockedDimensionItem[];
    domain: string | null;
    groupId: string | null;
    organizationId: string | null;
    scope: SkillVisibilityScope;
    type: SkillType;
}

export function hasSkillUsageLockedConfigurationChanged(
    current: SkillUsageLockedConfiguration,
    next: SkillUsageLockedConfiguration,
) {
    return JSON.stringify(current) !== JSON.stringify(next);
}
