import { z } from "zod";
import {
    ACTIVE_DURATION_MAX_INCREMENT_SECONDS,
    AI_CONVERSATION_STATUS,
    AI_CONVERSATION_TYPE,
} from "@/features/activity-tracking/domain";
import { ROLEPLAY_COACH_MODE } from "@/features/roleplays/domain";

export const activeDurationHeartbeatDto = z.object({
    activeSeconds: z.number().int().min(0).max(ACTIVE_DURATION_MAX_INCREMENT_SECONDS),
    aiMessageDelta: z.number().int().min(0).max(100).optional().default(0),
    userMessageDelta: z.number().int().min(0).max(100).optional().default(0),
}).strict();

export const createAiConversationDto = z.object({
    coachMode: z.enum([
        ROLEPLAY_COACH_MODE.afterTraining,
        ROLEPLAY_COACH_MODE.beforeTraining,
        ROLEPLAY_COACH_MODE.feedback,
        ROLEPLAY_COACH_MODE.notation,
    ]).optional(),
    interactionType: z.enum([
        AI_CONVERSATION_TYPE.askPersona,
        AI_CONVERSATION_TYPE.coach,
    ]),
}).strict().superRefine((value, context) => {
    if (
        value.interactionType === AI_CONVERSATION_TYPE.askPersona
        && value.coachMode !== undefined
    ) {
        context.addIssue({
            code: "custom",
            message: "Le mode coach est réservé aux conversations Coach IA.",
            path: ["coachMode"],
        });
    }
});

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
