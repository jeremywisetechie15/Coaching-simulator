import { requireAdmin } from "@/features/auth/server";
import type { SkillEditorDetail } from "@/features/skills/domain/skills";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchSkillDetail } from "./skill-query";
import { hasSkillProtectedUsage } from "./skill-usage-edit-policy";

export async function getSkillEditorById(
    skillId: string,
): Promise<SkillEditorDetail> {
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const [skill, hasProtectedUsage] = await Promise.all([
        fetchSkillDetail(adminSupabase, skillId),
        hasSkillProtectedUsage(adminSupabase, skillId),
    ]);

    return {
        ...skill,
        hasProtectedUsage,
    };
}
