import type { SupabaseClient } from "@supabase/supabase-js";
import {
    hasSkillUsageLockedConfigurationChanged,
    SKILL_USAGE_EDIT_RESTRICTION_MESSAGE,
    type SkillUsageLockedConfiguration,
} from "@/features/skills/domain/skill-usage-edit-policy";
import {
    SKILL_DIMENSIONS,
    type SkillDetail,
} from "@/features/skills/domain/skills";
import type { SaveSkillDto } from "@/features/skills/dto";
import { ConflictError } from "@/lib/server/errors";
import { fetchSkillDetail } from "./skill-query";

function nullableText(value: string | null | undefined) {
    const normalized = value?.trim() ?? "";
    return normalized || null;
}

function currentConfiguration(
    skill: SkillDetail,
): SkillUsageLockedConfiguration {
    return {
        assignedUserId:
            skill.scope === "user" ? skill.assignedUserId : null,
        category: nullableText(skill.category),
        dimensionItems: SKILL_DIMENSIONS.flatMap((dimension) =>
            skill.dimensionItems
                .filter((item) => item.dimension === dimension && item.isActive)
                .sort((first, second) => first.order - second.order)
                .map((item) => ({
                    dimension,
                    id: item.id,
                    label: item.label.trim(),
                    order: item.order,
                })),
        ),
        domain: nullableText(skill.domain),
        groupId: skill.scope === "group" ? skill.groupId : null,
        organizationId:
            skill.scope === "organization" || skill.scope === "group"
                ? skill.organizationId
                : null,
        scope: skill.scope,
        type: skill.type,
    };
}

function nextConfiguration(
    input: SaveSkillDto,
): SkillUsageLockedConfiguration {
    return {
        assignedUserId:
            input.scope === "user" ? input.assignedUserId : null,
        category: nullableText(input.category),
        dimensionItems: SKILL_DIMENSIONS.flatMap((dimension) =>
            input.dimensionItems[dimension].map((item, index) => ({
                dimension,
                id: item.id ?? null,
                label: item.label.trim(),
                order: index + 1,
            })),
        ),
        domain: nullableText(input.domain),
        groupId: input.scope === "group" ? input.groupId : null,
        organizationId:
            input.scope === "organization" || input.scope === "group"
                ? input.organizationId
                : null,
        scope: input.scope,
        type: input.type,
    };
}

export async function hasSkillProtectedUsage(
    supabase: SupabaseClient,
    skillId: string,
) {
    const { data, error } = await supabase.rpc(
        "admin_skill_has_protected_usage",
        { p_skill_id: skillId },
    );

    if (error) throw error;

    return data === true;
}

export async function assertSkillUsageEditPolicy(
    supabase: SupabaseClient,
    skillId: string,
    input: SaveSkillDto,
) {
    if (!(await hasSkillProtectedUsage(supabase, skillId))) return;

    const currentSkill = await fetchSkillDetail(supabase, skillId);
    if (
        hasSkillUsageLockedConfigurationChanged(
            currentConfiguration(currentSkill),
            nextConfiguration(input),
        )
    ) {
        throw new ConflictError(SKILL_USAGE_EDIT_RESTRICTION_MESSAGE);
    }
}
