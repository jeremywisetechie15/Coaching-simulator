import { requireAdmin } from "@/features/auth/server";
import type { SkillDetail } from "@/features/skills/domain/skills";
import type { SaveSkillDto } from "@/features/skills/dto";
import { NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchSkillDetail } from "./skill-query";
import { createSkillUpdate, SKILL_SELECT } from "./skills.persistence";
import { replaceSkillDimensionItems } from "./replace-skill-dimension-items";
import type { SkillRow } from "./skill.mapper";

export async function updateSkill(skillId: string, input: SaveSkillDto): Promise<SkillDetail> {
    await requireAdmin();
    const adminSupabase = createAdminClient();

    const { data: existingSkill, error: existingError } = await adminSupabase
        .from("skills")
        .select("id")
        .eq("id", skillId)
        .maybeSingle<{ id: string }>();

    if (existingError) {
        throw existingError;
    }

    if (!existingSkill) {
        throw new NotFoundError("Compétence introuvable.");
    }

    const { error } = await adminSupabase
        .from("skills")
        .update(createSkillUpdate(input))
        .eq("id", skillId)
        .select(SKILL_SELECT)
        .single<SkillRow>();

    if (error) {
        throw error;
    }

    await replaceSkillDimensionItems(adminSupabase, skillId, input);

    return fetchSkillDetail(adminSupabase, skillId);
}
