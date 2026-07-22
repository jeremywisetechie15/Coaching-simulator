import { NextRequest, NextResponse } from "next/server";
import {
    getRoleplaySessionEvaluationDecision,
    ROLEPLAY_NOTATION_STATUS,
} from "@/features/roleplays/domain";
import { requireAuth } from "@/features/auth/server";
import { NotFoundError } from "@/lib/server/errors";
import { jsonError } from "@/lib/server/http";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: string;
}

interface RequestBody {
    scenario_id: string;
    duration_seconds: number;
    messages: Message[];
}

export async function POST(request: NextRequest) {
    try {
        const body: RequestBody = await request.json();
        const { scenario_id, duration_seconds, messages } = body;
        const evaluationDecision = getRoleplaySessionEvaluationDecision(duration_seconds);

        if (!scenario_id || !messages || messages.length === 0) {
            return NextResponse.json(
                { error: "scenario_id and messages are required" },
                { status: 400 }
            );
        }

        const context = await requireAuth();
        const authenticatedSupabase = await createClient();
        const { data: accessibleScenario, error: scenarioError } = await authenticatedSupabase
            .from("scenarios")
            .select("id")
            .eq("id", scenario_id)
            .maybeSingle<{ id: string }>();

        if (scenarioError) throw scenarioError;
        if (!accessibleScenario) throw new NotFoundError("Roleplay introuvable.");

        const supabase = createAdminClient();
        const endedAt = new Date().toISOString();

        // Create the session
        const { data: session, error: sessionError } = await supabase
            .from("sessions")
            .insert({
                scenario_id,
                duration_seconds: duration_seconds || 0,
                ended_at: endedAt,
                notation_status: evaluationDecision.eligible
                    ? ROLEPLAY_NOTATION_STATUS.notStarted
                    : ROLEPLAY_NOTATION_STATUS.skipped,
                organization_id: context.activeOrganizationId,
                status: "completed",
                technical_error: false,
                user_id: context.userId,
            })
            .select()
            .single();

        if (sessionError || !session) {
            console.error("Error creating session:", sessionError);
            return NextResponse.json(
                { error: `Failed to create session: ${sessionError?.message}` },
                { status: 500 }
            );
        }

        // Insert all messages
        const messagesData = messages.map((msg) => ({
            session_id: session.id,
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
                .eq("id", session.id)
                .eq("user_id", context.userId);
            return NextResponse.json(
                { error: "Impossible de sauvegarder la transcription de la session." },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            evaluation_eligible: evaluationDecision.eligible,
            minimum_duration_seconds: evaluationDecision.minimumDurationSeconds,
            session_id: session.id,
            skip_reason: evaluationDecision.skipReason,
            messages_count: messages.length,
        });

    } catch (error) {
        return jsonError(error);
    }
}
