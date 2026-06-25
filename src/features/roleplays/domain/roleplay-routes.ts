function encodeRouteSegment(value: string) {
    return encodeURIComponent(value);
}

export const ROLEPLAY_ROUTES = {
    api: {
        collection: "/api/roleplays",
        detail: (roleplayId: string) => `/api/roleplays/${encodeRouteSegment(roleplayId)}`,
        resource: (roleplayId: string, resourceId: string) =>
            `/api/roleplays/${encodeRouteSegment(roleplayId)}/resources/${encodeRouteSegment(resourceId)}`,
    },
    app: {
        collection: "/roleplays",
        detail: (roleplayId: string) => `/roleplays/${encodeRouteSegment(roleplayId)}`,
        steps: (roleplayId: string) => `/roleplays/${encodeRouteSegment(roleplayId)}/steps`,
        step: (roleplayId: string, stepIndex: number) =>
            `/roleplays/${encodeRouteSegment(roleplayId)}/steps/${stepIndex}`,
    },
} as const;
