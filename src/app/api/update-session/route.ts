import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

        if (!session_id || !messages) {
            return NextResponse.json(
                { error: "session_id and messages are required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        const sessionUpdate = {
            duration_seconds: duration_seconds || 0,
            status: "completed",
            ...(user?.id ? { user_id: user.id } : {}),
        };

        // Update session status and duration
        const { error: sessionError } = await supabase
            .from("sessions")
            .update(sessionUpdate)
            .eq("id", session_id);

        if (sessionError) {
            console.error("Error updating session:", sessionError);
        }

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
            }
        }

        return NextResponse.json({
            success: true,
            messages_count: messages.length,
        });

    } catch (error) {
        console.error("Error updating session:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
