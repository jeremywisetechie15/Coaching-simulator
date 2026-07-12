import { z } from "zod";
import {
    ROLEPLAY_COACH_MODE,
    ROLEPLAY_COACH_NOTE_TYPES,
} from "@/features/roleplays/domain/coach-session-notes";

const coachNoteSchema = z.object({
    content: z.string().trim().min(1).max(10_000),
    createdAt: z.string().datetime(),
    id: z.string().uuid(),
    sourceMessageId: z.string().uuid().nullable(),
    type: z.enum(ROLEPLAY_COACH_NOTE_TYPES),
}).strict();

export const roleplayCoachNotesArraySchema = z.array(coachNoteSchema).max(200);

const roleplayCoachNotesContextSchema = z.object({
    coachMode: z.enum([ROLEPLAY_COACH_MODE.beforeTraining, ROLEPLAY_COACH_MODE.afterTraining]),
    methodStepId: z.string().uuid().nullable(),
    stepOrder: z.number().int().positive(),
});

export const getRoleplayCoachNotesContextSchema = roleplayCoachNotesContextSchema.extend({
    methodStepId: z.string().uuid().optional().transform((value) => value ?? null),
    stepOrder: z.coerce.number().int().positive(),
}).strict();

export const saveRoleplayCoachNotesSchema = roleplayCoachNotesContextSchema.extend({
    notes: roleplayCoachNotesArraySchema,
}).strict();

export type SaveRoleplayCoachNotesInput = z.infer<typeof saveRoleplayCoachNotesSchema>;
export type RoleplayCoachNotesContextInput = z.infer<typeof getRoleplayCoachNotesContextSchema>;
