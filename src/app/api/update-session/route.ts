import { NextRequest, NextResponse } from "next/server";
import {
    getRoleplaySessionEvaluationDecision,
    ROLEPLAY_NOTATION_STATUS,
} from "@/features/roleplays/domain";
import { requireAuth } from "@/features/auth/server";
import { NotFoundError } from "@/lib/server/errors";
import { jsonError } from "@/lib/server/http";
import { createAdminClient } from "@/lib/supabase/admin";

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: string;
}

interface RequestBody {
    session_id: string;
    duration_seconds: number;
    messages: Message[];
}

// Add messages to an existing session (used by iframe)
export async function POST(request: NextRequest) {
    try {
        const body: RequestBody = await request.json();
        const { session_id, duration_seconds, messages } = body;
        const evaluationDecision = getRoleplaySessionEvaluationDecision(duration_seconds);

        if (!session_id || !messages) {
            return NextResponse.json(
                { error: "session_id and messages are required" },
                { status: 400 }
            );
        }

        const context = await requireAuth();
        const supabase = createAdminClient();
        const sessionUpdate = {
            duration_seconds: duration_seconds || 0,
            ended_at: new Date().toISOString(),
            notation_error: null,
            notation_status: evaluationDecision.eligible
                ? ROLEPLAY_NOTATION_STATUS.notStarted
                : ROLEPLAY_NOTATION_STATUS.skipped,
            organization_id: context.activeOrganizationId,
            status: "completed",
            technical_error: false,
            user_id: context.userId,
        };

        // Update session status and duration
        const { data: updatedSession, error: sessionError } = await supabase
            .from("sessions")
            .update(sessionUpdate)
            .eq("id", session_id)
            .eq("user_id", context.userId)
            .select("id")
            .maybeSingle<{ id: string }>();

        if (sessionError) {
            console.error("Error updating session:", sessionError);
            return NextResponse.json(
                { error: "Impossible de terminer la session." },
                { status: 500 },
            );
        }
        if (!updatedSession) throw new NotFoundError("Session introuvable.");

        // Insert messages if any
        if (messages.length > 0) {
            const messagesData = messages.map((msg) => ({
                session_id,
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp,
            }));

            const { error: messagesError } = await supabase
                .from("messages")
                .insert(messagesData);

            if (messagesError) {
                console.error("Error saving messages:", messagesError);
                await supabase
                    .from("sessions")
                    .update({ technical_error: true })
                    .eq("id", session_id)
                    .eq("user_id", context.userId);
                return NextResponse.json(
                    { error: "Impossible de sauvegarder la transcription de la session." },
                    { status: 500 },
                );
            }
        }

        return NextResponse.json({
            success: true,
            evaluation_eligible: evaluationDecision.eligible,
            minimum_duration_seconds: evaluationDecision.minimumDurationSeconds,
            skip_reason: evaluationDecision.skipReason,
            messages_count: messages.length,
        });

    } catch (error) {
        return jsonError(error);
    }
}
