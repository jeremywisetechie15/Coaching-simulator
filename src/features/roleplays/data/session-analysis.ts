import { ROLEPLAY_PROGRESS_PLAN_SECTION_TITLE } from "@/features/roleplays/domain/roleplay-notation";

/**
 * Sections produites par le coach IA pendant l'analyse d'une session terminée.
 * Source unique pour le loader « Analyse en cours » (et, à terme, la page de notation).
 */
export const ROLEPLAY_ANALYSIS_STEPS = [
    "Avis et ressenti du persona IA",
    "Appréciation globale par le coach IA",
    "Points positifs",
    "Axes d'amélioration",
    ROLEPLAY_PROGRESS_PLAN_SECTION_TITLE,
    "Analyse méthodologique",
    "Analyse discours",
    "Transcription",
] as const;

/**
 * Étapes du loader d'export PDF de l'évaluation.
 * Source unique réutilisée par le loader « Génération du PDF » (distinct de la notation).
 */
export const ROLEPLAY_PDF_EXPORT_STEPS = [
    "Préparation des données de la session",
    "Composition de la mise en page",
    "Rendu des scores et graphiques",
    "Génération du document PDF",
    "Finalisation du fichier",
] as const;
