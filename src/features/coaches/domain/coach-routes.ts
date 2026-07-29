function encodeRouteSegment(value: string) {
    return encodeURIComponent(value);
}

export const COACH_ROUTES = {
    api: {
        detail: (coachId: string) => `/api/coaches/${encodeRouteSegment(coachId)}`,
        duplicate: (coachId: string) => `/api/coaches/${encodeRouteSegment(coachId)}/duplicate`,
    },
    app: {
        collection: "/coaches",
        create: "/coaches/new",
        edit: (coachId: string) => `/coaches/${encodeRouteSegment(coachId)}`,
    },
} as const;
