import { requireAuth } from "@/features/auth/server";
import type { SkillDetail } from "@/features/skills/domain/skills";
import { createClient } from "@/lib/supabase/server";
import { fetchSkillDetail } from "./skill-query";

export async function getSkillById(skillId: string): Promise<SkillDetail> {
    await requireAuth();
    const supabase = await createClient();

    return fetchSkillDetail(supabase, skillId);
}
