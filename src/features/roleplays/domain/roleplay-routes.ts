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
        coachNotes: (roleplayId: string) =>
            `/api/roleplays/${encodeRouteSegment(roleplayId)}/coach-notes`,
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
        personaFeedback: (roleplayId: string, sessionId: string) =>
            `/iframe?scenario_id=${encodeRouteSegment(roleplayId)}&variant=coach&ref_session_id=${encodeRouteSegment(sessionId)}`,
        sessionDebrief: (roleplayId: string, sessionId: string) =>
            `/iframe?scenario_id=${encodeRouteSegment(roleplayId)}&mode=coach&coach_mode=notation&ref_session_id=${encodeRouteSegment(sessionId)}`,
        sessionHistoryPrint: (sessionId: string, template?: RoleplayPdfTemplate) =>
            `/roleplays/history/${encodeRouteSegment(sessionId)}/print${pdfTemplateQuery(template)}`,
        progress: (roleplayId: string) => `/roleplays/${encodeRouteSegment(roleplayId)}/progress`,
        sessionHistoryDetail: (sessionId: string) => `/roleplays/history/${encodeRouteSegment(sessionId)}`,
        steps: (roleplayId: string) => `/roleplays/${encodeRouteSegment(roleplayId)}/steps`,
        step: (roleplayId: string, stepIndex: number) =>
            `/roleplays/${encodeRouteSegment(roleplayId)}/steps/${stepIndex}`,
    },
} as const;
