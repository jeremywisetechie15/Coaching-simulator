import type { SupabaseClient } from "@supabase/supabase-js";
import type { SaveSkillDto } from "@/features/skills/dto";
import { createSkillDimensionItemRows } from "./skills.persistence";

export async function replaceSkillDimensionItems(
    supabase: SupabaseClient,
    skillId: string,
    input: SaveSkillDto,
) {
    const { error: deactivateError } = await supabase
        .from("skill_dimension_items")
        .update({
            is_active: false,
            updated_at: new Date().toISOString(),
        })
        .eq("skill_id", skillId);

    if (deactivateError) {
        throw deactivateError;
    }

    const rows = createSkillDimensionItemRows(skillId, input);
    if (rows.length === 0) {
        return;
    }

    const rowsWithIds = rows.flatMap((row) => (row.id ? [{ ...row, id: row.id }] : []));
    const rowsWithoutIds = rows.filter((row) => !row.id);

    if (rowsWithIds.length > 0) {
        const { error: upsertError } = await supabase
            .from("skill_dimension_items")
            .upsert(rowsWithIds, { onConflict: "id" });

        if (upsertError) {
            throw upsertError;
        }
    }

    if (rowsWithoutIds.length === 0) {
        return;
    }

    const { error: insertError } = await supabase
        .from("skill_dimension_items")
        .insert(rowsWithoutIds);

    if (insertError) {
        throw insertError;
    }
}
