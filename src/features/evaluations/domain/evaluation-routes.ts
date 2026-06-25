function encodeRouteSegment(value: string) {
    return encodeURIComponent(value);
}

export const EVALUATION_ROUTES = {
    api: {
        attachment: (quizId: string, attachmentId: string) =>
            `/api/quizzes/${encodeRouteSegment(quizId)}/attachments/${encodeRouteSegment(attachmentId)}`,
        collection: "/api/quizzes",
        detail: (quizId: string) => `/api/quizzes/${encodeRouteSegment(quizId)}`,
        duplicate: (quizId: string) => `/api/quizzes/${encodeRouteSegment(quizId)}/duplicate`,
    },
    app: {
        collection: "/evaluations",
        detail: (quizId: string) => `/evaluations/${encodeRouteSegment(quizId)}`,
        edit: (quizId: string) => `/evaluations/${encodeRouteSegment(quizId)}/edit`,
        new: "/evaluations/new",
        quiz: (quizId: string) => `/evaluations/${encodeRouteSegment(quizId)}/quiz`,
    },
} as const;
