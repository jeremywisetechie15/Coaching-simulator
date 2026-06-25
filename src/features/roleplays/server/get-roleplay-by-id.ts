import { requireAuth } from "@/features/auth/server";
import type { RoleplayDetail } from "@/features/roleplays/domain";
import { createClient } from "@/lib/supabase/server";
import { fetchRoleplayDetail } from "./roleplay-query";

export async function getRoleplayById(roleplayId: string): Promise<RoleplayDetail> {
    await requireAuth();
    const supabase = await createClient();

    return fetchRoleplayDetail(supabase, roleplayId);
}
