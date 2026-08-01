import { z } from "zod";
import {
    ROLEPLAY_COACH_MODE,
    ROLEPLAY_COACH_MODES,
    ROLEPLAY_COACH_NOTE_TYPES,
} from "@/features/roleplays/domain/coach-session-notes";

const coachNoteSchema = z.object({
    content: z.string().trim().min(1).max(10_000),
    createdAt: z.string().datetime(),
    id: z.string().uuid(),
    sourceMessageId: z.string().trim().min(1).max(200).nullable(),
    type: z.enum(ROLEPLAY_COACH_NOTE_TYPES),
}).strict();

export const roleplayCoachNotesArraySchema = z.array(coachNoteSchema).max(200);

const stepCoachModes = [
    ROLEPLAY_COACH_MODE.beforeTraining,
    ROLEPLAY_COACH_MODE.afterTraining,
] as const;
const evaluationCoachModes = [
    ROLEPLAY_COACH_MODE.feedback,
    ROLEPLAY_COACH_MODE.notation,
    ROLEPLAY_COACH_MODE.personaFeedback,
] as const;

function isStepCoachMode(value: string) {
    return stepCoachModes.some((mode) => mode === value);
}

function isEvaluationCoachMode(value: string) {
    return evaluationCoachModes.some((mode) => mode === value);
}

const roleplayCoachNotesContextSchema = z.object({
    coachMode: z.enum(ROLEPLAY_COACH_MODES),
    methodStepId: z.string().uuid().nullable().optional().default(null),
    sessionId: z.string().uuid().nullable().optional().default(null),
    stepOrder: z.number().int().positive().nullable().optional().default(null),
});

function validateRoleplayCoachNotesContext(
    context: z.infer<typeof roleplayCoachNotesContextSchema>,
    ctx: z.RefinementCtx,
) {
    if (isStepCoachMode(context.coachMode)) {
        if (context.sessionId !== null) {
            ctx.addIssue({
                code: "custom",
                message: "Une note par étape ne doit pas être liée à une session évaluée.",
                path: ["sessionId"],
            });
        }
        if (context.stepOrder === null) {
            ctx.addIssue({
                code: "custom",
                message: "L’étape est requise pour les notes de préparation ou d’amélioration.",
                path: ["stepOrder"],
            });
        }
        return;
    }

    if (isEvaluationCoachMode(context.coachMode)) {
        if (context.sessionId === null) {
            ctx.addIssue({
                code: "custom",
                message: "La session évaluée est requise pour ces notes.",
                path: ["sessionId"],
            });
        }
        if (context.methodStepId !== null || context.stepOrder !== null) {
            ctx.addIssue({
                code: "custom",
                message: "Une note d’évaluation globale ne doit pas cibler une étape.",
                path: ["methodStepId"],
            });
        }
    }
}

export const getRoleplayCoachNotesContextSchema = roleplayCoachNotesContextSchema.extend({
    methodStepId: z.string().uuid().optional().transform((value) => value ?? null),
    sessionId: z.string().uuid().optional().transform((value) => value ?? null),
    stepOrder: z.coerce.number().int().positive().optional().transform((value) => value ?? null),
}).strict().superRefine(validateRoleplayCoachNotesContext);

export const saveRoleplayCoachNotesSchema = roleplayCoachNotesContextSchema.extend({
    notes: roleplayCoachNotesArraySchema,
}).strict().superRefine(validateRoleplayCoachNotesContext);

export type SaveRoleplayCoachNotesInput = z.infer<typeof saveRoleplayCoachNotesSchema>;
export type RoleplayCoachNotesContextInput = z.infer<typeof getRoleplayCoachNotesContextSchema>;
