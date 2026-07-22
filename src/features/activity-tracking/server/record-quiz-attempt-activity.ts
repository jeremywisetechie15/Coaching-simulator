import { requireAuth } from "@/features/auth/server";
import {
    getAcceptedActiveDurationIncrement,
} from "@/features/activity-tracking/domain";
import {
    activeDurationHeartbeatDto,
    type ActiveDurationHeartbeatDto,
} from "@/features/activity-tracking/dto";
import { ConflictError, NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";

interface QuizAttemptActivityRow {
    active_duration_seconds: number | null;
    last_activity_at: string | null;
    organization_id: string | null;
    status: string;
}

export async function recordQuizAttemptActivity(
    quizId: string,
    attemptId: string,
    input: ActiveDurationHeartbeatDto,
) {
    const context = await requireAuth();
    const payload = activeDurationHeartbeatDto.parse(input);
    const adminSupabase = createAdminClient();
    const { data: attempt, error: attemptError } = await adminSupabase
        .from("quiz_attempts")
        .select("active_duration_seconds, last_activity_at, organization_id, status")
        .eq("id", attemptId)
        .eq("quiz_id", quizId)
        .eq("user_id", context.userId)
        .maybeSingle<QuizAttemptActivityRow>();

    if (attemptError) throw attemptError;
    if (!attempt) throw new NotFoundError("Tentative de quiz introuvable.");
    if (attempt.status !== "in_progress") {
        throw new ConflictError("Cette tentative de quiz est déjà terminée.");
    }

    const now = new Date();
    const acceptedSeconds = getAcceptedActiveDurationIncrement({
        lastActivityAt: attempt.last_activity_at,
        now,
        requestedSeconds: payload.activeSeconds,
    });
    const activeDurationSeconds = (attempt.active_duration_seconds ?? 0) + acceptedSeconds;

    if (acceptedSeconds > 0 || !attempt.organization_id) {
        const { error: updateError } = await adminSupabase
            .from("quiz_attempts")
            .update({
                active_duration_seconds: activeDurationSeconds,
                last_activity_at: acceptedSeconds > 0 ? now.toISOString() : attempt.last_activity_at,
                organization_id: attempt.organization_id ?? context.activeOrganizationId,
            })
            .eq("id", attemptId)
            .eq("quiz_id", quizId)
            .eq("user_id", context.userId)
            .eq("status", "in_progress");

        if (updateError) throw updateError;
    }

    return { acceptedSeconds, activeDurationSeconds };
}
