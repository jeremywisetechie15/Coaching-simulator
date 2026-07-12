import { NextRequest, NextResponse } from "next/server";
import {
    getRoleplaySessionEvaluationDecision,
    ROLEPLAY_NOTATION_STATUS,
} from "@/features/roleplays/domain";
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

        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        // Create the session
        const { data: session, error: sessionError } = await supabase
            .from("sessions")
            .insert({
                scenario_id,
                duration_seconds: duration_seconds || 0,
                notation_status: evaluationDecision.eligible
                    ? ROLEPLAY_NOTATION_STATUS.notStarted
                    : ROLEPLAY_NOTATION_STATUS.skipped,
                status: "completed",
                user_id: user?.id ?? null,
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
            // Still return success for session, just log the error
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
        console.error("Error saving session:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
