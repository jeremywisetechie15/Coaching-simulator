import { requireAdmin } from "@/features/auth/server";
import type { SkillDetail } from "@/features/skills/domain/skills";
import type { SaveSkillDto } from "@/features/skills/dto";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchSkillDetail } from "./skill-query";
import { createSkillInsert, createUniqueSkillId, SKILL_SELECT } from "./skills.persistence";
import { replaceSkillDimensionItems } from "./replace-skill-dimension-items";
import type { SkillRow } from "./skill.mapper";
import { assertInitialContentStatus } from "@/features/content/server";

export async function createSkill(input: SaveSkillDto): Promise<SkillDetail> {
    const context = await requireAdmin();
    const adminSupabase = createAdminClient();
    const skillId = await createUniqueSkillId(adminSupabase, input.name, input.id);
    let createdSkillId: string | null = null;

    assertInitialContentStatus(input.status);

    try {
        const { data: skillRow, error } = await adminSupabase
            .from("skills")
            .insert(createSkillInsert(input, skillId, context.userId))
            .select(SKILL_SELECT)
            .single<SkillRow>();

        if (error) {
            throw error;
        }

        createdSkillId = skillRow.id;
        await replaceSkillDimensionItems(adminSupabase, skillRow.id, input);

        return fetchSkillDetail(adminSupabase, skillRow.id);
    } catch (error) {
        if (createdSkillId) {
            await adminSupabase.from("skills").delete().eq("id", createdSkillId);
        }

        throw error;
    }
}
