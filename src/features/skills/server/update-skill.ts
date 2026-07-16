import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/features/auth/server";
import type { SkillDetail } from "@/features/skills/domain/skills";
import type { SaveSkillDto } from "@/features/skills/dto";
import { mapDatabaseError, NotFoundError } from "@/lib/server/errors";
import { assertContentStatusTransition } from "@/features/content/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchSkillDetail } from "./skill-query";
import { createSkillDimensionItemRows, createSkillUpdate } from "./skills.persistence";

export async function updateSkill(skillId: string, input: SaveSkillDto): Promise<SkillDetail> {
    await requireAdmin();
    const adminSupabase = createAdminClient();

    const { data: existingSkill, error: existingError } = await adminSupabase
        .from("skills")
        .select("id, status")
        .eq("id", skillId)
        .maybeSingle<{ id: string; status: SaveSkillDto["status"] }>();

    if (existingError) {
        throw existingError;
    }

    if (!existingSkill) {
        throw new NotFoundError("Compétence introuvable.");
    }

    assertContentStatusTransition(existingSkill.status, input.status);

    const items = createSkillDimensionItemRows(skillId, input).map((item) => ({
        ...item,
        id: item.id ?? randomUUID(),
    }));
    const { error } = await adminSupabase.rpc("admin_update_skill_aggregate", {
        p_items: items,
        p_skill: createSkillUpdate(input),
        p_skill_id: skillId,
    });

    if (error) throw mapDatabaseError(error);

    return fetchSkillDetail(adminSupabase, skillId);
}
