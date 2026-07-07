import { requireAuth } from "@/features/auth/server";
import type { SkillListItem, SkillOption } from "@/features/skills/domain/skills";
import { createClient } from "@/lib/supabase/server";
import {
    mapSkillDimensionItemRow,
    mapSkillRowToListItem,
    type SkillDimensionItemRow,
    type SkillRow,
} from "./skill.mapper";
import { SKILL_DIMENSION_ITEM_SELECT, SKILL_SELECT } from "./skills.persistence";

export async function listSkills(): Promise<SkillListItem[]> {
    await requireAuth();
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("skills")
        .select(SKILL_SELECT)
        .eq("is_active", true)
        .order("name", { ascending: true });

    if (error) {
        throw error;
    }

    return ((data ?? []) as SkillRow[]).map(mapSkillRowToListItem);
}

export async function listSkillOptions(): Promise<SkillOption[]> {
    const skills = await listSkills();
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
