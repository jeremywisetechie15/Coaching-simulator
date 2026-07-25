import { requireAuth } from "@/features/auth/server";
import { CONTENT_STATUS, isSelectableContent } from "@/features/content/domain";
import type { SkillListItem, SkillOption } from "@/features/skills/domain/skills";
import { createClient } from "@/lib/supabase/server";
import {
    mapSkillDimensionItemRow,
    mapSkillRowToListItem,
    type SkillDimensionItemRow,
    type SkillRow,
} from "./skill.mapper";
import { SKILL_DIMENSION_ITEM_SELECT, SKILL_SELECT } from "./skills.persistence";
import { getSkillById } from "./get-skill-by-id";

interface ListSkillSelectionOptionsParams {
    includeUnavailableIds?: readonly string[];
}

export async function listSkills(): Promise<SkillListItem[]> {
    await requireAuth();
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("skills")
        .select(SKILL_SELECT)
        .neq("status", CONTENT_STATUS.archived)
        .eq("is_active", true)
        .order("name", { ascending: true });

    if (error) {
        throw error;
    }

    return ((data ?? []) as SkillRow[]).map(mapSkillRowToListItem);
}

async function buildSkillOptions(skills: SkillListItem[]): Promise<SkillOption[]> {
    if (skills.length === 0) {
        return [];
    }

    const supabase = await createClient();
    const { data, error } = await supabase
        .from("skill_dimension_items")
        .select(SKILL_DIMENSION_ITEM_SELECT)
        .in("skill_id", skills.map((skill) => skill.id))
        .eq("is_active", true)
        .order("skill_id", { ascending: true })
        .order("dimension", { ascending: true })
        .order("item_order", { ascending: true });

    if (error) {
        throw error;
    }

    const itemsBySkillId = new Map<string, ReturnType<typeof mapSkillDimensionItemRow>[]>();
    for (const row of (data ?? []) as SkillDimensionItemRow[]) {
        const item = mapSkillDimensionItemRow(row);
        const current = itemsBySkillId.get(item.skillId) ?? [];
        current.push(item);
        itemsBySkillId.set(item.skillId, current);
    }

    return skills.map((skill) => ({
        dimensionItems: itemsBySkillId.get(skill.id) ?? [],
        domain: skill.domain,
        id: skill.id,
        name: skill.name,
    }));
}

export async function listSkillOptions(): Promise<SkillOption[]> {
    return buildSkillOptions(await listSkills());
}

export async function listSkillSelectionOptions({
    includeUnavailableIds = [],
}: ListSkillSelectionOptionsParams = {}): Promise<SkillOption[]> {
    const skills = await listSkills();
    const skillById = new Map(skills.map((skill) => [skill.id, skill]));
    const missingCurrentIds = [...new Set(includeUnavailableIds)]
        .filter((skillId) => skillId && !skillById.has(skillId));

    if (missingCurrentIds.length > 0) {
        const currentSkills = await Promise.all(missingCurrentIds.map((skillId) => getSkillById(skillId)));
        currentSkills.forEach((skill) => skillById.set(skill.id, skill));
    }

    const selectableSkills = [...skillById.values()]
        .filter((skill) =>
            isSelectableContent(skill.status, skill.isActive) || includeUnavailableIds.includes(skill.id)
        );
    const options = await buildSkillOptions(selectableSkills);

    return options.map((option) => {
        const skill = skillById.get(option.id);
        return {
            ...option,
            isSelectable: Boolean(skill && isSelectableContent(skill.status, skill.isActive)),
        };
    });
}
