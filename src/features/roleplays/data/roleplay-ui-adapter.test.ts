import { describe, expect, it } from "vitest";
import { CONTENT_STATUS, CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import { EVALUATION_ROUTES } from "@/features/evaluations/domain";
import { ROLEPLAY_ROUTES, type RoleplayDetail } from "@/features/roleplays/domain";
import { mapDbRoleplayListToUi, mapDbRoleplayToUi, mergeRoleplayListWithMocks } from "./roleplay-ui-adapter";

function createRoleplayDetail({
    description = "Objectif",
    id = "scenario-1",
    name = "Rachid HAMRANI",
    previewDescription = "",
    previewTitle = "",
    quizzes = [],
    resources = [],
    title = name,
}: {
    description?: string;
    id?: string;
    name?: string;
    previewDescription?: string;
    previewTitle?: string;
    quizzes?: RoleplayDetail["quizzes"];
    resources?: RoleplayDetail["resources"];
    title?: string;
} = {}): RoleplayDetail {
    return {
        assignedUserId: null,
        assignedUserName: null,
        attemptCount: 0,
        backgroundImagePath: null,
        category: "Vente",
        coachAvatarUrl: null,
        coachId: null,
        coachName: null,
        coachingSteps: "",
        company: "CLEANTECH",
        context: "Contexte",
        createdAt: null,
        description,
        previewDescription,
        previewTitle,
        difficulty: "Moyen",
        disc: "Stable",
        domain: "Commercial",
        groupId: null,
        groupName: null,
        id,
        isActive: true,
        methodId: "method-1",
        methodName: "DAGO",
        methodStepCount: 4,
        name,
        objective: "Obtenir un rendez-vous",
        obstacles: "Pas le temps",
        organizationId: null,
        organizationName: null,
        personaAvatarUrl: null,
        personaId: "persona-1",
        quizCount: 0,
        quizIds: quizzes.map((quiz) => quiz.id),
        quizzes,
        resources,
        role: "Dirigeant",
        scenarioId: id,
        scope: CONTENT_VISIBILITY_SCOPE.public,
        scorecardId: null,
        scorecardName: null,
        stats: {
            bestScore: 0,
            bestScoreDate: "Aucune session",
            indexDelta: null,
            indexScore: null,
            indexSessions: [],
            indexSessionCount: 0,
            indexTrend: "unavailable",
            lastDate: "Aucune session",
            lastDuration: "0s",
            latestEligibleSessionId: null,
            scoreActuel: 0,
            simulations: 0,
        },
        status: CONTENT_STATUS.published,
        title,
        updatedAt: null,
    };
}

describe("roleplay UI adapter", () => {
    it("maps DB scenario resources to preparation documents with access routes", () => {
        const roleplay = mapDbRoleplayToUi(
            createRoleplayDetail({
                resources: [
                    {
                        externalUrl: null,
                        id: "resource-pdf",
                        label: "Fiche prospect complète",
                        resourceType: "document",
                        storageBucket: "resource_scenarios",
                        storagePath: "scenarios/scenario-1/fiche-prospect.pdf",
                    },
                    {
                        externalUrl: "https://example.com/article",
                        id: "resource-link",
                        label: "Article de préparation",
                        resourceType: "link",
                        storageBucket: null,
                        storagePath: null,
                    },
                    {
                        externalUrl: null,
                        id: "resource-video",
                        label: "Vidéo de préparation",
                        resourceType: "video",
                        storageBucket: "resource_scenarios",
                        storagePath: "scenarios/scenario-1/preparation.mp4",
                    },
                    {
                        externalUrl: "https://youtu.be/dQw4w9WgXcQ",
                        id: "resource-youtube",
                        label: "Tutoriel vidéo",
                        resourceType: "video",
                        storageBucket: null,
                        storagePath: null,
                    },
                ],
            }),
            null,
        );

        expect(roleplay.prepDocuments).toEqual([
            {
                id: "resource-pdf",
                kind: "pdf",
                meta: "fiche-prospect.pdf",
                title: "Fiche prospect complète",
                url: ROLEPLAY_ROUTES.api.resource("scenario-1", "resource-pdf"),
            },
            {
                id: "resource-link",
                kind: "article",
                meta: "URL",
                title: "Article de préparation",
                url: ROLEPLAY_ROUTES.api.resource("scenario-1", "resource-link"),
            },
            {
                id: "resource-video",
                kind: "video",
                meta: "preparation.mp4",
                title: "Vidéo de préparation",
                url: ROLEPLAY_ROUTES.api.resource("scenario-1", "resource-video"),
            },
            {
                id: "resource-youtube",
                kind: "video",
                meta: "URL",
                title: "Tutoriel vidéo",
                url: "https://youtu.be/dQw4w9WgXcQ",
            },
        ]);
    });

    it("maps DB scenario quizzes to preparation quizzes with existing quiz routes", () => {
        const roleplay = mapDbRoleplayToUi(
            createRoleplayDetail({
                quizzes: [
                    {
                        durationMinutes: 20,
                        id: "quiz-1",
                        participation: "mandatory",
                        questionCount: 12,
                        title: "Quiz méthode DAGO",
                        type: "knowledge",
                    },
                    {
                        durationMinutes: 15,
                        id: "quiz-2",
                        participation: "optional",
                        questionCount: 8,
                        title: "Auto-positionnement",
                        type: "self_assessment",
                    },
                ],
            }),
            null,
        );

        expect(roleplay.prepQuizzes).toEqual([
            {
                durationMinutes: 20,
                id: "quiz-1",
                participation: "mandatory",
                questionCount: 12,
                recommended: true,
                status: "not_started",
                title: "Quiz méthode DAGO",
                type: "Quiz de Connaissance",
                url: EVALUATION_ROUTES.app.quiz("quiz-1"),
            },
            {
                durationMinutes: 15,
                id: "quiz-2",
                participation: "optional",
                questionCount: 8,
                recommended: false,
                status: "not_started",
                title: "Auto-positionnement",
                type: "Quiz d'Auto-Positionnement",
                url: EVALUATION_ROUTES.app.quiz("quiz-2"),
            },
        ]);
    });

    it("includes DB roleplays that do not match an existing mock", () => {
        const roleplay = createRoleplayDetail({
            description: "Objectif personnalisé",
            id: "5beb42b6-3f59-411c-b826-7fb739d5174a",
            name: "Nouveau persona",
            previewDescription: "Résumé court sur la carte.",
            previewTitle: "Décrocher un premier rendez-vous",
            title: "Nouveau scénario",
        });

        const mergedRoleplays = mergeRoleplayListWithMocks([roleplay]);

        expect(mergedRoleplays[0]).toMatchObject({
            description: "Résumé court sur la carte.",
            id: "5beb42b6-3f59-411c-b826-7fb739d5174a",
            name: "Nouveau persona",
            scenarioId: "5beb42b6-3f59-411c-b826-7fb739d5174a",
            title: "Décrocher un premier rendez-vous",
        });
    });

    it("maps the list from DB without appending historical mocks", () => {
        const roleplay = createRoleplayDetail({
            description: "Objectif personnalisé",
            id: "5beb42b6-3f59-411c-b826-7fb739d5174a",
            name: "Nouveau persona",
            title: "Nouveau scénario",
        });

        const mappedRoleplays = mapDbRoleplayListToUi([roleplay]);

        expect(mappedRoleplays).toHaveLength(1);
        expect(mappedRoleplays[0]).toMatchObject({
            id: "5beb42b6-3f59-411c-b826-7fb739d5174a",
            name: "Nouveau persona",
        });
    });

    it("keeps empty DB stats instead of falling back to historical mock stats", () => {
        const roleplay = mapDbRoleplayToUi(createRoleplayDetail());

        expect(roleplay.detail).toMatchObject({
            bestScoreDate: "Aucune session",
            indexDelta: null,
            indexScore: null,
            indexSessions: [],
            indexSessionCount: 0,
            indexTrend: "unavailable",
            lastDate: "Aucune session",
            lastDuration: "0s",
            meilleurScore: 0,
            scoreActuel: 0,
            simulations: 0,
        });
    });

    it("exposes the latest eligible session route input from DB stats", () => {
        const detail = createRoleplayDetail();
        detail.stats.latestEligibleSessionId = "session-eligible";

        const roleplay = mapDbRoleplayToUi(detail, null);

        expect(roleplay.latestEvaluationSessionId).toBe("session-eligible");
    });

    it("maps the roleplay index from DB stats", () => {
        const detail = createRoleplayDetail();
        detail.stats.indexDelta = 12;
        detail.stats.indexScore = 74;
        detail.stats.indexSessions = [
            {
                completedAt: "2026-07-10T10:00:00.000Z",
                durationSeconds: 120,
                indexScore: 74,
                isTopScore: true,
                score: 74,
                sessionId: "session-1",
            },
        ];
        detail.stats.indexSessionCount = 6;
        detail.stats.indexTrend = "up";

        const roleplay = mapDbRoleplayToUi(detail, null);

        expect(roleplay.detail).toMatchObject({
            indexDelta: 12,
            indexScore: 74,
            indexSessions: [
                {
                    completedAt: "2026-07-10T10:00:00.000Z",
                    durationSeconds: 120,
                    indexScore: 74,
                    isTopScore: true,
                    score: 74,
                    sessionId: "session-1",
                },
            ],
            indexSessionCount: 6,
            indexTrend: "up",
        });
    });
});
