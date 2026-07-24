import { describe, expect, it } from "vitest";
import {
    buildAdminDashboardViewData,
    type AdminDashboardAiConversationRecord,
    type AdminDashboardContentRecord,
    type AdminDashboardQuizAttemptRecord,
    type AdminDashboardSessionRecord,
    type BuildAdminDashboardInput,
} from "./admin-dashboard-calculations";

const NOW = new Date("2026-07-20T12:00:00.000Z");

function content(
    id: string,
    title: string,
    overrides: Partial<AdminDashboardContentRecord> = {},
): AdminDashboardContentRecord {
    return {
        createdAt: "2026-07-10T10:00:00.000Z",
        id,
        isActive: true,
        organizationId: "org-a",
        status: "published",
        title,
        updatedAt: "2026-07-19T10:00:00.000Z",
        ...overrides,
    };
}

function session(
    id: string,
    overrides: Partial<AdminDashboardSessionRecord> = {},
): AdminDashboardSessionRecord {
    return {
        createdAt: "2026-07-19T10:00:00.000Z",
        durationSeconds: 120,
        endedAt: "2026-07-19T10:02:00.000Z",
        hasAiMessage: true,
        hasUserMessage: true,
        id,
        organizationId: "org-a",
        scenarioId: "scenario-a",
        scorePercent: 80,
        status: "completed",
        technicalError: false,
        userId: "user-a",
        ...overrides,
    };
}

function attempt(
    id: string,
    overrides: Partial<AdminDashboardQuizAttemptRecord> = {},
): AdminDashboardQuizAttemptRecord {
    return {
        activeDurationSeconds: 600,
        completedAt: "2026-07-19T10:10:00.000Z",
        id,
        organizationId: "org-a",
        quizId: "quiz-a",
        scorePercent: 60,
        startedAt: "2026-07-19T10:00:00.000Z",
        status: "completed",
        userId: "user-a",
        ...overrides,
    };
}

function conversation(
    id: string,
    overrides: Partial<AdminDashboardAiConversationRecord> = {},
): AdminDashboardAiConversationRecord {
    return {
        activeDurationSeconds: 90,
        aiMessageCount: 1,
        endedAt: "2026-07-19T10:20:00.000Z",
        id,
        interactionType: "ask_persona",
        organizationId: "org-a",
        status: "completed",
        technicalError: false,
        userId: "user-a",
        userMessageCount: 1,
        ...overrides,
    };
}

function buildInput(overrides: Partial<BuildAdminDashboardInput> = {}): BuildAdminDashboardInput {
    return {
        aiConversations: [],
        loginEvents: [],
        methods: [],
        memberships: [
            { createdAt: "2026-01-01T10:00:00.000Z", organizationId: "org-a", status: "active", userId: "user-a" },
        ],
        now: NOW,
        organizationFilter: "all",
        organizations: [
            { createdAt: "2026-01-01T10:00:00.000Z", id: "org-a", name: "Organisation A", status: "active" },
        ],
        periodDays: 30,
        profiles: [
            { id: "user-a", name: "Alice", platformRole: "user" },
        ],
        quizAttempts: [],
        quizzes: [],
        scenarios: [],
        sessions: [],
        ...overrides,
    };
}

function seriesTotal(
    dashboard: ReturnType<typeof buildAdminDashboardViewData>,
    id: "connections" | "quizzes" | "roleplays",
) {
    return dashboard.activity.series
        .find((series) => series.id === id)
        ?.values.reduce((sum, value) => sum + value, 0);
}

describe("admin dashboard calculations", () => {
    it("combines measured platform activity and excludes ineligible learners and sessions", () => {
        const dashboard = buildAdminDashboardViewData(buildInput({
            aiConversations: [
                conversation("ask-persona"),
                conversation("coach", { activeDurationSeconds: 60, interactionType: "coach" }),
                conversation("failed", { activeDurationSeconds: 999, technicalError: true }),
            ],
            loginEvents: [
                { id: "login-a", occurredAt: "2026-07-19T09:00:00.000Z", organizationId: "org-a", userId: "user-a" },
                { id: "login-admin", occurredAt: "2026-07-19T09:00:00.000Z", organizationId: "org-a", userId: "user-admin" },
            ],
            methods: [content("method-a", "Méthode A")],
            memberships: [
                { createdAt: "2026-07-18T10:00:00.000Z", organizationId: "org-a", status: "active", userId: "user-a" },
                { createdAt: "2026-06-01T10:00:00.000Z", organizationId: "org-a", status: "active", userId: "user-b" },
                { createdAt: "2026-07-18T10:00:00.000Z", organizationId: "org-b", status: "active", userId: "user-c" },
            ],
            organizations: [
                { createdAt: "2026-01-01T10:00:00.000Z", id: "org-a", name: "Organisation A", status: "active" },
                { createdAt: "2026-01-01T10:00:00.000Z", id: "org-b", name: "Organisation B", status: "suspended" },
            ],
            profiles: [
                { id: "user-a", name: "Alice", platformRole: "user" },
                { id: "user-b", name: "Bob", platformRole: "user" },
                { id: "user-c", name: "Charlie", platformRole: "user" },
                { id: "user-admin", name: "Admin", platformRole: "admin" },
            ],
            quizAttempts: [attempt("attempt-a")],
            quizzes: [content("quiz-a", "Quiz A")],
            scenarios: [
                content("scenario-a", "Scénario A"),
                content("scenario-draft", "Brouillon", { status: "draft" }),
                content("scenario-public", "Scénario public", { organizationId: null }),
            ],
            sessions: [
                session("session-a"),
                session("session-short", { durationSeconds: 20, userId: "user-b" }),
                session("session-suspended", { durationSeconds: 200, organizationId: "org-b", userId: "user-c" }),
                session("session-admin", { durationSeconds: 180, userId: "user-admin" }),
            ],
        }));

        expect(dashboard.metrics).toEqual(expect.arrayContaining([
            expect.objectContaining({ id: "active-users", value: "2" }),
            expect.objectContaining({ id: "active-organizations", value: "1" }),
            expect.objectContaining({ id: "published-roleplays", value: "2" }),
            expect.objectContaining({ id: "learning-time", value: "12min" }),
        ]));
        expect(dashboard.metrics[0]?.id).toBe("learning-time");
        expect(seriesTotal(dashboard, "connections")).toBe(1);
        expect(seriesTotal(dashboard, "roleplays")).toBe(1);
        expect(seriesTotal(dashboard, "quizzes")).toBe(1);
        expect(dashboard.topRoleplays).toEqual([
            expect.objectContaining({ id: "scenario-a", learnerCount: 1, sessionCount: 1 }),
        ]);
        expect(dashboard.organizationPerformance[0]).toMatchObject({
            activeLearnerCount: 2,
            id: "org-a",
            quizScore: 60,
            roleplayScore: 80,
        });
        expect(dashboard.aiUsage.organizations[0]).toMatchObject({
            askPersonaSeconds: 90,
            coachSeconds: 60,
            id: "org-a",
            simulationSeconds: 120,
            totalSeconds: 270,
        });
        expect(dashboard.aiUsage.overview).toEqual(expect.arrayContaining([
            expect.objectContaining({ detail: "44% du temps IA", id: "simulations" }),
            expect.objectContaining({ detail: "33% du temps IA", id: "ask-persona" }),
            expect.objectContaining({ detail: "22% du temps IA", id: "coach" }),
        ]));
    });

    it("requires thirty seconds, a two-way exchange and no technical error for a roleplay", () => {
        const dashboard = buildAdminDashboardViewData(buildInput({
            scenarios: [content("scenario-a", "Scénario A")],
            sessions: [
                session("eligible", { durationSeconds: 30 }),
                session("too-short", { durationSeconds: 29 }),
                session("technical-error", { technicalError: true }),
                session("no-user-message", { hasUserMessage: false }),
                session("no-ai-message", { hasAiMessage: false }),
            ],
        }));

        expect(seriesTotal(dashboard, "roleplays")).toBe(1);
        expect(dashboard.topRoleplays[0]).toMatchObject({ sessionCount: 1 });
    });

    it("keeps historical quiz duration unknown instead of inventing elapsed time", () => {
        const dashboard = buildAdminDashboardViewData(buildInput({
            quizAttempts: [attempt("legacy", { activeDurationSeconds: null })],
            quizzes: [content("quiz-a", "Quiz A")],
        }));
        const learningTime = dashboard.metrics.find((metric) => metric.id === "learning-time");

        expect(learningTime).toMatchObject({ value: "0min" });
        expect(learningTime?.detail).toBe("");
        expect(learningTime?.valueLines).toEqual(["0min roleplay", "0min quiz"]);
        expect(seriesTotal(dashboard, "quizzes")).toBe(1);
    });

    it("applies the organization filter while keeping public content visible", () => {
        const dashboard = buildAdminDashboardViewData(buildInput({
            memberships: [
                { createdAt: "2026-01-01T10:00:00.000Z", organizationId: "org-a", status: "active", userId: "user-a" },
                { createdAt: "2026-01-01T10:00:00.000Z", organizationId: "org-b", status: "active", userId: "user-b" },
            ],
            organizationFilter: "org-a",
            organizations: [
                { createdAt: "2026-01-01T10:00:00.000Z", id: "org-a", name: "Organisation A", status: "active" },
                { createdAt: "2026-01-01T10:00:00.000Z", id: "org-b", name: "Organisation B", status: "active" },
            ],
            profiles: [
                { id: "user-a", name: "Alice", platformRole: "user" },
                { id: "user-b", name: "Bob", platformRole: "user" },
            ],
            scenarios: [
                content("scenario-a", "A"),
                content("scenario-b", "B", { organizationId: "org-b" }),
                content("scenario-public", "Public", { organizationId: null }),
            ],
        }));

        expect(dashboard.organizationPerformance.map((organization) => organization.id)).toEqual(["org-a"]);
        expect(new Set(dashboard.recentContent.map((item) => item.id))).toEqual(
            new Set(["scenario-a", "scenario-public"]),
        );
        expect(dashboard.metrics.find((metric) => metric.id === "published-roleplays")?.value).toBe("2");
    });
});
