import { requireAuth } from "@/features/auth/server";
import type { RoleplayListItem } from "@/features/roleplays/domain";
import { createClient } from "@/lib/supabase/server";
import { fetchRoleplayList } from "./roleplay-query";

export async function listRoleplays(): Promise<RoleplayListItem[]> {
    await requireAuth();
    const supabase = await createClient();

    return fetchRoleplayList(supabase);
}
