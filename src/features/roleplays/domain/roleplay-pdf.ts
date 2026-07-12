/**
 * Format disponible pour l'export PDF d'une évaluation de simulation.
 * Source unique partagée par le bouton d'export, la route API et la page d'impression.
 */
export const ROLEPLAY_PDF_TEMPLATES = {
    report: "report",
} as const;

export type RoleplayPdfTemplate = (typeof ROLEPLAY_PDF_TEMPLATES)[keyof typeof ROLEPLAY_PDF_TEMPLATES];

/** Format unique appliqué aussi aux anciennes URL qui demandaient le format détaillé. */
export const DEFAULT_ROLEPLAY_PDF_TEMPLATE: RoleplayPdfTemplate = ROLEPLAY_PDF_TEMPLATES.report;

/** Normalise une valeur brute (query string) vers un template valide. */
export function parseRoleplayPdfTemplate(value: string | null | undefined): RoleplayPdfTemplate {
    void value;
    return DEFAULT_ROLEPLAY_PDF_TEMPLATE;
}
