import { z } from "zod";

const uuid = z.string().uuid("L'identifiant est invalide.");

export const quizAttemptAnswersDto = z
    .object({
        answers: z
            .array(
                z.object({
                    choiceIds: z.array(uuid).optional().default([]),
                    questionId: uuid,
                }),
            )
            .optional()
            .default([]),
    })
    .strict();

export type QuizAttemptAnswersInput = z.input<typeof quizAttemptAnswersDto>;
export type QuizAttemptAnswersDto = z.output<typeof quizAttemptAnswersDto>;
