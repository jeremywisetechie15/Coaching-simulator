import { requireAuth } from "@/features/auth/server";
import type { MethodDetail } from "@/features/methods/domain/method";
import { createClient } from "@/lib/supabase/server";
import { fetchMethodDetail } from "./method-query";

export async function getMethodById(methodId: string): Promise<MethodDetail> {
    await requireAuth();
    const supabase = await createClient();

    return fetchMethodDetail(supabase, methodId);
}
