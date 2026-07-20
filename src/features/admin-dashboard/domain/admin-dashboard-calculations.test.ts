import { describe, expect, it } from "vitest";
import { buildAdminDashboardViewData } from "./admin-dashboard-calculations";

const now = new Date("2026-07-20T12:00:00.000Z");

function content(
    id: string,
    title: string,
    overrides: Partial<Parameters<typeof buildAdminDashboardViewData>[0]["scenarios"][number]> = {},
) {
    return {
        createdAt: "2026-07-10T10:00:00.000Z",
        id,
        isActive: true,
        organizationId: "org-a",
        status: "published" as const,
        title,
        updatedAt: "2026-07-19T10:00:00.000Z",
        ...overrides,
    };
}

describe("admin dashboard calculations", () => {
    it("combines real platform data while excluding short sessions and suspended organizations", () => {
        const dashboard = buildAdminDashboardViewData({
            methods: [content("method-a", "Méthode A")],
            memberships: [
                { createdAt: "2026-07-18T10:00:00.000Z", organizationId: "org-a", status: "active", userId: "user-a" },
                { createdAt: "2026-06-01T10:00:00.000Z", organizationId: "org-a", status: "active", userId: "user-b" },
                { createdAt: "2026-07-18T10:00:00.000Z", organizationId: "org-b", status: "active", userId: "user-c" },
            ],
            now,
            organizationFilter: "all",
            organizations: [
                { createdAt: "2026-01-01T10:00:00.000Z", id: "org-a", name: "Organisation A", status: "active" },
                { createdAt: "2026-01-01T10:00:00.000Z", id: "org-b", name: "Organisation B", status: "suspended" },
            ],
            periodDays: 30,
            profiles: [
                { id: "user-a", name: "Alice", platformRole: "user" },
                { id: "user-b", name: "Bob", platformRole: "user" },
                { id: "user-c", name: "Charlie", platformRole: "user" },
                { id: "user-admin", name: "Admin", platformRole: "admin" },
            ],
            quizAttempts: [
                {
                    completedAt: "2026-07-19T10:10:00.000Z",
                    id: "attempt-a",
                    quizId: "quiz-a",
                    scorePercent: 60,
                    startedAt: "2026-07-19T10:00:00.000Z",
                    status: "completed",
                    userId: "user-a",
                },
            ],
            quizzes: [content("quiz-a", "Quiz A")],
            scenarios: [
                content("scenario-a", "Scénario A"),
                content("scenario-draft", "Brouillon", { status: "draft" }),
                content("scenario-public", "Scénario public", { organizationId: null }),
            ],
            sessions: [
                {
                    createdAt: "2026-07-19T10:00:00.000Z",
                    durationSeconds: 120,
                    id: "session-a",
                    organizationId: "org-a",
                    scenarioId: "scenario-a",
                    scorePercent: 80,
                    status: "completed",
                    userId: "user-a",
                },
                {
                    createdAt: "2026-07-19T11:00:00.000Z",
                    durationSeconds: 20,
                    id: "session-short",
                    organizationId: "org-a",
                    scenarioId: "scenario-a",
                    scorePercent: 99,
                    status: "completed",
                    userId: "user-b",
                },
                {
                    createdAt: "2026-07-19T12:00:00.000Z",
                    durationSeconds: 200,
                    id: "session-suspended",
                    organizationId: "org-b",
                    scenarioId: "scenario-a",
                    scorePercent: 90,
                    status: "completed",
                    userId: "user-c",
                },
                {
                    createdAt: "2026-07-19T13:00:00.000Z",
                    durationSeconds: 180,
                    id: "session-admin",
                    organizationId: "org-a",
                    scenarioId: "scenario-a",
                    scorePercent: 100,
                    status: "completed",
                    userId: "user-admin",
                },
            ],
            skills: [content("skill-a", "Compétence A", { createdAt: "2026-07-18T10:00:00.000Z" })],
        });

        expect(dashboard.metrics).toEqual(expect.arrayContaining([
            expect.objectContaining({ id: "active-users", value: "2" }),
            expect.objectContaining({ id: "active-organizations", value: "1" }),
            expect.objectContaining({ id: "published-roleplays", value: "2" }),
            expect.objectContaining({ id: "learning-time", value: "12min" }),
        ]));
        expect(dashboard.activity.series.find((series) => series.id === "roleplays")?.values.reduce((sum, value) => sum + value, 0)).toBe(1);
        expect(dashboard.activity.series.find((series) => series.id === "quizzes")?.values.reduce((sum, value) => sum + value, 0)).toBe(1);
        expect(dashboard.topRoleplays).toEqual([
            expect.objectContaining({ id: "scenario-a", learnerCount: 1, sessionCount: 1 }),
        ]);
        expect(dashboard.organizationPerformance[0]).toMatchObject({
            activeLearnerCount: 2,
            id: "org-a",
            quizScore: 60,
            roleplayScore: 80,
        });
        expect(dashboard.mockedSections.map((section) => section.id)).toEqual([
            "ai-credits",
        ]);
    });

    it("applies the organization filter to activity and organization-owned content", () => {
        const dashboard = buildAdminDashboardViewData({
            methods: [],
            memberships: [
                { createdAt: "2026-01-01T10:00:00.000Z", organizationId: "org-a", status: "active", userId: "user-a" },
                { createdAt: "2026-01-01T10:00:00.000Z", organizationId: "org-b", status: "active", userId: "user-b" },
            ],
            now,
            organizationFilter: "org-a",
            organizations: [
                { createdAt: "2026-01-01T10:00:00.000Z", id: "org-a", name: "Organisation A", status: "active" },
                { createdAt: "2026-01-01T10:00:00.000Z", id: "org-b", name: "Organisation B", status: "active" },
            ],
            periodDays: 7,
            profiles: [],
            quizAttempts: [],
            quizzes: [],
            scenarios: [
                content("scenario-a", "A"),
                content("scenario-b", "B", { organizationId: "org-b" }),
                content("scenario-public", "Public", { organizationId: null }),
            ],
            sessions: [],
            skills: [],
        });

        expect(dashboard.organizationPerformance.map((organization) => organization.id)).toEqual(["org-a"]);
        expect(dashboard.recentContent.map((item) => item.id)).toEqual(["scenario-a"]);
        expect(dashboard.metrics.find((metric) => metric.id === "published-roleplays")?.value).toBe("1");
    });
});
