/**
 * Types + données de démonstration pour la préparation d'un roleplay.
 * Les roleplays DB remplissent ces modèles depuis scenario_resources.
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

export const demoPrepDocuments: PrepDocument[] = [
    { id: "fiche-prospect", kind: "pdf", meta: "1.2 MB", title: "Fiche prospect complète" },
    { id: "checklist-appel", kind: "pdf", meta: "850 KB", title: "Checklist de préparation d'appel" },
    { id: "article-besoins", kind: "article", title: "Article : Comprendre les besoins clients" },
    { id: "video-prospection", kind: "video", meta: "7:30", title: "Vidéo : Techniques de prospection" },
];

export const demoPrepQuizzes: PrepQuiz[] = [
    {
        durationMinutes: 30,
        id: "deepmark-fondamentaux",
        questionCount: 40,
        recommended: true,
        status: "not_started",
        title: "Quiz - DEEPMARK Fondamentaux",
        type: "Quiz de Connaissance",
    },
    {
        durationMinutes: 20,
        id: "deepmark-avance",
        questionCount: 25,
        scorePercent: 85,
        status: "completed",
        title: "Quiz - DEEPMARK Avancé",
        type: "QCM",
    },
    {
        durationMinutes: 15,
        id: "deepmark-auto",
        questionCount: 15,
        scorePercent: 60,
        status: "in_progress",
        title: "Auto-évaluation DEEPMARK",
        type: "Quiz d'Auto-Positionnement",
    },
];
