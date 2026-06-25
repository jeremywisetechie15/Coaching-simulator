import { requireAdmin } from "@/features/auth/server";
import { CONTENT_STATUS } from "@/features/content/domain";
import { NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";

export async function archiveQuiz(quizId: string) {
    await requireAdmin();
    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
        .from("quizzes")
        .update({
            is_active: false,
            status: CONTENT_STATUS.archived,
            updated_at: new Date().toISOString(),
        })
        .eq("id", quizId)
        .select("id")
        .maybeSingle<{ id: string }>();

    if (error) {
        throw error;
    }

    if (!data) {
        throw new NotFoundError("Quiz introuvable.");
    }
}
