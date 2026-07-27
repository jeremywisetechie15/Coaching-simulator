import { requireAdmin } from "@/features/auth/server";
import type { MethodEditorDetail } from "@/features/methods/domain/method";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchMethodDetail } from "./method-query";
import { hasMethodUsage } from "./method-usage-edit-policy";

export async function getMethodEditorById(methodId: string): Promise<MethodEditorDetail> {
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const [method, hasUsage] = await Promise.all([
        fetchMethodDetail(adminSupabase, methodId),
        hasMethodUsage(adminSupabase, methodId),
    ]);

    return {
        ...method,
        hasUsage,
    };
}
