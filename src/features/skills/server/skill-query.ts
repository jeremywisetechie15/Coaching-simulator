import type { SupabaseClient } from "@supabase/supabase-js";
import type { SkillDetail } from "@/features/skills/domain/skills";
import { NotFoundError } from "@/lib/server/errors";
import { mapSkillRowsToDetail, type SkillDimensionItemRow, type SkillRow } from "./skill.mapper";
import { SKILL_DIMENSION_ITEM_SELECT, SKILL_SELECT } from "./skills.persistence";

export async function fetchSkillDetail(supabase: SupabaseClient, skillId: string): Promise<SkillDetail> {
    const [{ data: skillRow, error: skillError }, { data: dimensionRows, error: dimensionsError }] =
        await Promise.all([
            supabase
                .from("skills")
                .select(SKILL_SELECT)
                .eq("id", skillId)
                .maybeSingle<SkillRow>(),
            supabase
                .from("skill_dimension_items")
                .select(SKILL_DIMENSION_ITEM_SELECT)
                .eq("skill_id", skillId)
                .eq("is_active", true)
                .order("dimension", { ascending: true })
                .order("item_order", { ascending: true }),
        ]);

    if (skillError) {
        throw skillError;
    }

    if (dimensionsError) {
        throw dimensionsError;
    }

    if (!skillRow) {
        throw new NotFoundError("Compétence introuvable.");
    }

    return mapSkillRowsToDetail(skillRow, (dimensionRows ?? []) as SkillDimensionItemRow[]);
}
