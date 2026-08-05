import { describe, expect, it } from "vitest";
import {
    hasRoleplaySessionLockedConfigurationChanged,
    type RoleplaySessionLockedConfiguration,
} from "./roleplay-session-edit-policy";

const configuration: RoleplaySessionLockedConfiguration = {
    assignedUserId: null,
    category: "Accueil client",
    coachId: "coach-1",
    difficulty: "Moyen",
    disc: "Stable",
    domain: "Relation client",
    groupId: null,
    methodId: "method-1",
    organizationId: null,
    personaId: "persona-1",
    quizzes: [{ id: "quiz-1", participation: "mandatory" }],
    resources: [{
        id: "resource-1",
        resourceType: "document",
        storageBucket: "resources",
        storagePath: "roleplays/resource.pdf",
    }],
    scope: "public",
    scorecardId: "scorecard-1",
};

describe("roleplay session edit policy", () => {
    it("accepts an unchanged locked configuration", () => {
        expect(hasRoleplaySessionLockedConfigurationChanged(configuration, configuration)).toBe(false);
    });

    it.each([
        ["persona", { personaId: "persona-2" }],
        ["coach", { coachId: "coach-2" }],
        ["method", { methodId: "method-2" }],
        ["scorecard", { scorecardId: "scorecard-2" }],
        ["classification", { category: "Gestion des conflits" }],
        ["audience", { scope: "organization", organizationId: "organization-1" }],
        ["quizzes", { quizzes: [{ id: "quiz-2", participation: "mandatory" }] }],
        ["resources", { resources: [] }],
    ])("detects a change to the locked %s", (_label, patch) => {
        expect(
            hasRoleplaySessionLockedConfigurationChanged(configuration, {
                ...configuration,
                ...patch,
            }),
        ).toBe(true);
    });
});
