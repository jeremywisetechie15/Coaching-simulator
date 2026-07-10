import type { RoleplayPdfTemplate } from "./roleplay-pdf";

function encodeRouteSegment(value: string) {
    return encodeURIComponent(value);
}

function pdfTemplateQuery(template?: RoleplayPdfTemplate) {
    return template ? `?template=${encodeURIComponent(template)}` : "";
}

export const ROLEPLAY_ROUTES = {
    api: {
        collection: "/api/roleplays",
        detail: (roleplayId: string) => `/api/roleplays/${encodeRouteSegment(roleplayId)}`,
        duplicate: (roleplayId: string) => `/api/roleplays/${encodeRouteSegment(roleplayId)}/duplicate`,
        resource: (roleplayId: string, resourceId: string) =>
            `/api/roleplays/${encodeRouteSegment(roleplayId)}/resources/${encodeRouteSegment(resourceId)}`,
        sessionPdfExport: (sessionId: string, template?: RoleplayPdfTemplate) =>
            `/api/roleplays/sessions/${encodeRouteSegment(sessionId)}/export-pdf${pdfTemplateQuery(template)}`,
    },
    app: {
        collection: "/roleplays",
        detail: (roleplayId: string) => `/roleplays/${encodeRouteSegment(roleplayId)}`,
        edit: (roleplayId: string) => `/roleplays/${encodeRouteSegment(roleplayId)}/edit`,
        history: "/roleplays/history",
        historyForRoleplay: (roleplayId: string) => `/roleplays/history?scenario_id=${encodeRouteSegment(roleplayId)}`,
        sessionHistoryPrint: (sessionId: string, template?: RoleplayPdfTemplate) =>
            `/roleplays/history/${encodeRouteSegment(sessionId)}/print${pdfTemplateQuery(template)}`,
        progress: (roleplayId: string) => `/roleplays/${encodeRouteSegment(roleplayId)}/progress`,
        sessionHistoryDetail: (sessionId: string) => `/roleplays/history/${encodeRouteSegment(sessionId)}`,
        steps: (roleplayId: string) => `/roleplays/${encodeRouteSegment(roleplayId)}/steps`,
        step: (roleplayId: string, stepIndex: number) =>
            `/roleplays/${encodeRouteSegment(roleplayId)}/steps/${stepIndex}`,
    },
} as const;
