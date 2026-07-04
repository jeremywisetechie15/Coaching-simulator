/**
 * Templates disponibles pour l'export PDF d'une évaluation de simulation.
 * Source unique partagée par le bouton d'export, la route API et la page d'impression.
 *
 * - `report`     : rapport de synthèse (mise en page dédiée, inclut la progression).
 * - `evaluation` : miroir fidèle de la page « Évaluation de la simulation » (les 4 onglets).
 */
export const ROLEPLAY_PDF_TEMPLATES = {
    evaluation: "evaluation",
    report: "report",
} as const;

export type RoleplayPdfTemplate = (typeof ROLEPLAY_PDF_TEMPLATES)[keyof typeof ROLEPLAY_PDF_TEMPLATES];

/** Template appliqué par défaut lorsqu'aucun n'est précisé (comportement historique). */
export const DEFAULT_ROLEPLAY_PDF_TEMPLATE: RoleplayPdfTemplate = ROLEPLAY_PDF_TEMPLATES.report;

/** Libellés affichés dans le menu de choix de format. */
export const ROLEPLAY_PDF_TEMPLATE_LABELS: Record<RoleplayPdfTemplate, string> = {
    evaluation: "Format Détaillé",
    report: "Format Rapport",
};

/** Normalise une valeur brute (query string) vers un template valide. */
export function parseRoleplayPdfTemplate(value: string | null | undefined): RoleplayPdfTemplate {
    return value === ROLEPLAY_PDF_TEMPLATES.evaluation
        ? ROLEPLAY_PDF_TEMPLATES.evaluation
        : DEFAULT_ROLEPLAY_PDF_TEMPLATE;
}
