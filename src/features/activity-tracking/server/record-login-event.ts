import { requireAuth } from "@/features/auth/server";
import { PLATFORM_ROLE } from "@/features/users/domain";
import { createAdminClient } from "@/lib/supabase/admin";

export type LoginEventSource = "mobile_web" | "web";

export async function recordLoginEvent(source: LoginEventSource) {
    const context = await requireAuth();
    if (context.platformRole !== PLATFORM_ROLE.user) return { recorded: false };

    const { error } = await createAdminClient()
        .from("user_login_events")
        .insert({
            organization_id: context.activeOrganizationId,
            source,
            user_id: context.userId,
        });

    if (error) throw error;
    return { recorded: true };
}
