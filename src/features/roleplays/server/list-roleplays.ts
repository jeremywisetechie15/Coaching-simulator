import { requireAuth } from "@/features/auth/server";
import { isPlatformAdmin } from "@/features/auth/domain/access-control";
import { CONTENT_STATUS } from "@/features/content/domain";
import type { RoleplayListItem } from "@/features/roleplays/domain";
import { createClient } from "@/lib/supabase/server";
import { fetchRoleplayList } from "./roleplay-query";

export async function listRoleplays(): Promise<RoleplayListItem[]> {
    const context = await requireAuth();
    const supabase = await createClient();

    return fetchRoleplayList(
        supabase,
        context.userId,
        isPlatformAdmin(context.platformRole)
            ? {}
            : { status: CONTENT_STATUS.published },
    );
}
