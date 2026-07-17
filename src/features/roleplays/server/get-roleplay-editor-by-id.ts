import { requireAdmin } from "@/features/auth/server";
import type { RoleplayEditorDetail } from "@/features/roleplays/domain";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchRoleplayDetail } from "./roleplay-query";
import { getScenarioAiInstructions } from "./scenario-ai-context";

export async function getRoleplayEditorById(roleplayId: string): Promise<RoleplayEditorDetail> {
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const [roleplay, aiInstructions] = await Promise.all([
        fetchRoleplayDetail(adminSupabase, roleplayId),
        getScenarioAiInstructions(adminSupabase, roleplayId),
    ]);

    return {
        ...roleplay,
        aiInstructions,
    };
}
