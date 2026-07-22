import { z } from "zod";
import {
    ACTIVE_DURATION_MAX_INCREMENT_SECONDS,
    AI_CONVERSATION_STATUS,
    AI_CONVERSATION_TYPE,
} from "@/features/activity-tracking/domain";

export const activeDurationHeartbeatDto = z.object({
    activeSeconds: z.number().int().min(0).max(ACTIVE_DURATION_MAX_INCREMENT_SECONDS),
    aiMessageDelta: z.number().int().min(0).max(100).optional().default(0),
    userMessageDelta: z.number().int().min(0).max(100).optional().default(0),
}).strict();

export const createAiConversationDto = z.object({
    interactionType: z.enum([
        AI_CONVERSATION_TYPE.askPersona,
        AI_CONVERSATION_TYPE.coach,
    ]),
}).strict();

export const updateAiConversationDto = activeDurationHeartbeatDto.extend({
    status: z.enum([
        AI_CONVERSATION_STATUS.abandoned,
        AI_CONVERSATION_STATUS.active,
        AI_CONVERSATION_STATUS.completed,
        AI_CONVERSATION_STATUS.error,
        AI_CONVERSATION_STATUS.timedOut,
    ]).optional().default(AI_CONVERSATION_STATUS.active),
}).strict();

export type ActiveDurationHeartbeatDto = z.output<typeof activeDurationHeartbeatDto>;
export type CreateAiConversationDto = z.output<typeof createAiConversationDto>;
export type UpdateAiConversationDto = z.output<typeof updateAiConversationDto>;
