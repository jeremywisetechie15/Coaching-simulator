import { NextRequest, NextResponse } from "next/server";
import { updateAiConversation } from "@/features/activity-tracking/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface AiConversationRouteContext {
    params: Promise<{ conversationId: string }>;
}

export async function PATCH(request: NextRequest, context: AiConversationRouteContext) {
    try {
        const { conversationId } = await context.params;
        const conversation = await updateAiConversation(conversationId, await request.json());
        return NextResponse.json({ conversation });
    } catch (error) {
        return jsonError(error);
    }
}
