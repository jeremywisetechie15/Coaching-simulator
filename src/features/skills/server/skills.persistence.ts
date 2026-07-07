import type { SupabaseClient } from "@supabase/supabase-js";
import type { SaveSkillDto } from "@/features/skills/dto";
import { SKILL_DIMENSIONS, type SkillDimension } from "@/features/skills/domain/skills";

export const SKILL_SELECT =
    "id, name, description, category, domain, functions, visibility_scope, organization_id, group_id, assigned_user_id, status, is_active";

export const SKILL_DIMENSION_ITEM_SELECT =
    "id, skill_id, dimension, label, item_order, is_active";

export function nullableText(value: string | null | undefined) {
    const trimmed = value?.trim() ?? "";
    return trimmed.length > 0 ? trimmed : null;
}

export function slugifySkillValue(value: string, fallback = "competence") {
    const slug = value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return slug || fallback;
}

function createSkillBasePayload(input: SaveSkillDto) {
    return {
        category: input.category,
        description: nullableText(input.description),
        domain: nullableText(input.domain),
        functions: input.functions,
        assigned_user_id: input.scope === "user" ? input.assignedUserId : null,
        group_id: input.scope === "group" ? input.groupId : null,
        is_active: input.status !== "archived",
        name: input.name,
        organization_id:
            input.scope === "organization" || input.scope === "group" ? input.organizationId : null,
        visibility_scope: input.scope,
        status: input.status,
    };
}

export function createSkillInsert(input: SaveSkillDto, skillId: string, createdBy: string) {
    const now = new Date().toISOString();

    return {
        ...createSkillBasePayload(input),
        created_at: now,
        created_by: createdBy,
        id: skillId,
        updated_at: now,
    };
}

export function createSkillUpdate(input: SaveSkillDto) {
    return {
        ...createSkillBasePayload(input),
        updated_at: new Date().toISOString(),
    };
}

export function createSkillDimensionItemRows(skillId: string, input: SaveSkillDto) {
    return SKILL_DIMENSIONS.flatMap((dimension) =>
        input.dimensionItems[dimension].map((item, index) => ({
            ...(item.id ? { id: item.id } : {}),
            dimension,
            is_active: true,
            item_order: index + 1,
            label: item.label,
            skill_id: skillId,
        })),
    );
}

export async function createUniqueSkillId(
    supabase: SupabaseClient,
    name: string,
    requestedId?: string | null,
) {
    const baseId = slugifySkillValue(requestedId || name);
    const { data, error } = await supabase
        .from("skills")
        .select("id")
        .like("id", `${baseId}%`);

    if (error) {
        throw error;
    }

    const existingIds = new Set((data ?? []).map((row: { id?: string | null }) => row.id).filter(Boolean));

    if (!existingIds.has(baseId)) {
        return baseId;
    }

    for (let suffix = 2; suffix < 1000; suffix += 1) {
        const candidate = `${baseId}-${suffix}`;
        if (!existingIds.has(candidate)) {
            return candidate;
        }
    }

    return `${baseId}-${Date.now().toString(36)}`;
}

export function groupDimensionLabels(input: SaveSkillDto) {
    return SKILL_DIMENSIONS.reduce(
        (accumulator, dimension) => ({
            ...accumulator,
            [dimension]: input.dimensionItems[dimension].map((item) => item.label),
        }),
        {} as Record<SkillDimension, string[]>,
    );
}
