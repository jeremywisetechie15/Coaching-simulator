import type { QuizParticipation } from "@/features/evaluations/domain";

/**
 * Types pour la préparation d'un roleplay.
 * Les roleplays DB remplissent ces modèles depuis scenario_resources et les quiz associés.
 */

export type PrepResourceKind = "article" | "audio" | "document" | "image" | "pdf" | "video";

export interface PrepDocument {
    id: string;
    kind: PrepResourceKind;
    /** Taille (PDF/doc) ou durée (vidéo), affiché tel quel. */
    meta?: string;
    title: string;
    url?: string;
}

export type PrepQuizStatus = "not_started" | "in_progress" | "completed";

export interface PrepQuiz {
    durationMinutes: number;
    id: string;
    participation?: QuizParticipation;
    questionCount: number;
    recommended?: boolean;
    /** Score (0-100) si le quiz est en cours ou terminé. */
    scorePercent?: number;
    status: PrepQuizStatus;
    title: string;
    /** Libellé du type de quiz (ex. « Quiz de Connaissance », « QCM »). */
    type: string;
    url?: string;
}
