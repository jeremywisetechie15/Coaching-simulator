import { requireAuth } from "@/features/auth/server";
import {
    AI_CONVERSATION_STATUS,
    getAcceptedActiveDurationIncrement,
    type AiConversationStatus,
} from "@/features/activity-tracking/domain";
import {
    createAiConversationDto,
    updateAiConversationDto,
    type CreateAiConversationDto,
    type UpdateAiConversationDto,
} from "@/features/activity-tracking/dto";
import { NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";

interface AiConversationRow {
    active_duration_seconds: number;
    ai_message_count: number;
    id: string;
    last_activity_at: string | null;
    status: AiConversationStatus;
    user_message_count: number;
}

export async function createAiConversation(input: CreateAiConversationDto) {
    const context = await requireAuth();
    const payload = createAiConversationDto.parse(input);
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from("ai_conversation_sessions")
        .insert({
            interaction_type: payload.interactionType,
            last_activity_at: new Date().toISOString(),
            organization_id: context.activeOrganizationId,
            user_id: context.userId,
        })
        .select("id")
        .single<{ id: string }>();

    if (error) throw error;
    return data;
}

export async function updateAiConversation(
    conversationId: string,
    input: UpdateAiConversationDto,
) {
    const context = await requireAuth();
    const payload = updateAiConversationDto.parse(input);
    const adminSupabase = createAdminClient();
    const { data: conversation, error: conversationError } = await adminSupabase
        .from("ai_conversation_sessions")
        .select("id, status, active_duration_seconds, last_activity_at, user_message_count, ai_message_count")
        .eq("id", conversationId)
        .eq("user_id", context.userId)
        .maybeSingle<AiConversationRow>();

    if (conversationError) throw conversationError;
    if (!conversation) throw new NotFoundError("Conversation IA introuvable.");
    if (conversation.status !== AI_CONVERSATION_STATUS.active) return conversation;

    const now = new Date();
    const acceptedSeconds = getAcceptedActiveDurationIncrement({
        lastActivityAt: conversation.last_activity_at,
        now,
        requestedSeconds: payload.activeSeconds,
    });
    const isTerminal = payload.status !== AI_CONVERSATION_STATUS.active;
    const hasActivity = acceptedSeconds > 0
        || payload.aiMessageDelta > 0
        || payload.userMessageDelta > 0;
    const { data: updatedConversation, error: updateError } = await adminSupabase
        .from("ai_conversation_sessions")
        .update({
            active_duration_seconds: conversation.active_duration_seconds + acceptedSeconds,
            ai_message_count: conversation.ai_message_count + payload.aiMessageDelta,
            ended_at: isTerminal ? now.toISOString() : null,
            last_activity_at: hasActivity ? now.toISOString() : conversation.last_activity_at,
            status: payload.status,
            technical_error: payload.status === AI_CONVERSATION_STATUS.error,
            user_message_count: conversation.user_message_count + payload.userMessageDelta,
        })
        .eq("id", conversationId)
        .eq("user_id", context.userId)
        .eq("status", AI_CONVERSATION_STATUS.active)
        .select("id, status, active_duration_seconds, last_activity_at, user_message_count, ai_message_count")
        .single<AiConversationRow>();

    if (updateError) throw updateError;
    return updatedConversation;
}
