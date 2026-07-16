function encodeRouteSegment(value: string) {
    return encodeURIComponent(value);
}

export const PERSONA_ROUTES = {
    api: {
        cv: (personaId: string) => `/api/personas/${encodeRouteSegment(personaId)}/cv`,
        detail: (personaId: string) => `/api/personas/${encodeRouteSegment(personaId)}`,
        duplicate: (personaId: string) => `/api/personas/${encodeRouteSegment(personaId)}/duplicate`,
    },
    app: {
        edit: (personaId: string) => `/personas/${encodeRouteSegment(personaId)}`,
    },
} as const;
