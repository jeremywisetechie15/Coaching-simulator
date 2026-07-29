import { describe, expect, it } from "vitest";
import {
    CONTENT_STATUS,
    CONTENT_VISIBILITY_SCOPE,
    LEARNER_CONTENT_STATUS,
} from "@/features/content/domain";
import { EVALUATION_ROUTES } from "@/features/evaluations/domain";
import { ROLEPLAY_ROUTES, type RoleplayDetail } from "@/features/roleplays/domain";
import { mapDbRoleplayListToUi, mapDbRoleplayToUi, mergeRoleplayListWithMocks } from "./roleplay-ui-adapter";

function createRoleplayDetail({
    description = "Objectif",
    id = "scenario-1",
    learnerRole = "Vous incarnez le conseiller commercial.",
    name = "Rachid HAMRANI",
    previewDescription = "",
    previewTitle = "",
    quizzes = [],
    resources = [],
    title = name,
    validationThreshold = 80,
}: {
    description?: string;
    id?: string;
    learnerRole?: string;
    name?: string;
    previewDescription?: string;
    previewTitle?: string;
    quizzes?: RoleplayDetail["quizzes"];
    resources?: RoleplayDetail["resources"];
    title?: string;
    validationThreshold?: number;
} = {}): RoleplayDetail {
    return {
        assignedUserId: null,
        assignedUserName: null,
        attemptCount: 0,
        backgroundImagePath: null,
        bestScore: null,
        category: "Vente",
        coachAvatarUrl: null,
        coachId: null,
        coachName: null,
        coachingSteps: "",
        company: "CLEANTECH",
        configuredDifficulty: "Moyen",
        context: "Contexte",
        createdAt: null,
        description,
        previewDescription,
        previewTitle,
        difficulty: "Moyen",
        disc: "Stable",
        domain: "Commercial",
        estimatedDurationMinutes: null,
        groupId: null,
        groupName: null,
        id,
        isActive: true,
        learnerStatus: LEARNER_CONTENT_STATUS.todo,
        learnerRole,
        methodId: "method-1",
        methodName: "DAGO",
        methodStepCount: 4,
        name,
        objective: "Obtenir un rendez-vous",
        obstacles: "Pas le temps",
        organizationId: null,
        organizationName: null,
        personaAvatarUrl: null,
        personaFacts: {
            age: null,
            annualRevenue: "",
            employeeCount: null,
            industry: "",
        },
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
            learnerStatus: LEARNER_CONTENT_STATUS.todo,
            latestEligibleSessionId: null,
            scoreActuel: 0,
            simulations: 0,
        },
        status: CONTENT_STATUS.published,
        title,
        updatedAt: null,
        validationThreshold,
    };
}

describe("roleplay UI adapter", () => {
    it("exposes the learner role on the roleplay detail page model", () => {
        const roleplay = mapDbRoleplayToUi(createRoleplayDetail(), null);

        expect(roleplay.detail.learnerRole).toBe("Vous incarnez le conseiller commercial.");
    });

    it("exposes the scenario validation threshold to global score views", () => {
        const roleplay = mapDbRoleplayToUi(
            createRoleplayDetail({ validationThreshold: 90 }),
            null,
        );

        expect(roleplay.validationThreshold).toBe(90);
    });

    it("keeps a legacy missing learner role empty instead of using mock content", () => {
        const roleplay = mapDbRoleplayToUi(createRoleplayDetail({ learnerRole: "" }));

        expect(roleplay.detail.learnerRole).toBe("");
    });

    it("builds company badges from the persona data stored in DB", () => {
        const detail = createRoleplayDetail();
        detail.personaFacts = {
            age: 32,
            annualRevenue: "40 M€",
            employeeCount: 1800,
            industry: "Immobilier",
        };

        const roleplay = mapDbRoleplayToUi(detail);

        expect(roleplay.detail.infoChips).toEqual([
            { icon: "users", label: `${new Intl.NumberFormat("fr-FR").format(1800)} employés` },
            { icon: "money", label: "40 M€ CA" },
            { icon: "building", label: "Immobilier" },
            { icon: "calendar", label: "32 ans" },
        ]);
    });

    it("never falls back to historical mock badges when persona data is missing", () => {
        const roleplay = mapDbRoleplayToUi(createRoleplayDetail());

        expect(roleplay.detail.infoChips).toEqual([]);
    });

    it("only creates badges for persona fields that are populated", () => {
        const detail = createRoleplayDetail();
        detail.personaFacts.industry = "Conseil";

        const roleplay = mapDbRoleplayToUi(detail, null);

        expect(roleplay.detail.infoChips).toEqual([
            { icon: "building", label: "Conseil" },
        ]);
    });

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
                        hasInProgress: false,
                        id: "quiz-1",
                        learnerStatus: LEARNER_CONTENT_STATUS.validated,
                        participation: "mandatory",
                        questionCount: 12,
                        scorePercent: 86,
                        title: "Quiz méthode DAGO",
                        type: "knowledge",
                    },
                    {
                        durationMinutes: 15,
                        hasInProgress: true,
                        id: "quiz-2",
                        learnerStatus: LEARNER_CONTENT_STATUS.todo,
                        participation: "optional",
                        questionCount: 8,
                        scorePercent: null,
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
                scorePercent: 86,
                status: LEARNER_CONTENT_STATUS.validated,
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
                status: "in_progress",
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

    it("uses the learner list statistics instead of historical mock scores", () => {
        const { stats, ...roleplay } = createRoleplayDetail();
        void stats;
        const listRoleplay = {
            ...roleplay,
            attemptCount: 2,
            bestScore: 84,
        };

        const [mappedRoleplay] = mapDbRoleplayListToUi([listRoleplay]);

        expect(mappedRoleplay?.detail).toMatchObject({
            meilleurScore: 84,
            simulations: 2,
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
