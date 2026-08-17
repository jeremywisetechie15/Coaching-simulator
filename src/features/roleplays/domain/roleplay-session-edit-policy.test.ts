import { describe, expect, it } from "vitest";
import {
    hasRoleplayQuizAssignmentsChanged,
    hasRoleplaySessionLockedConfigurationChanged,
    type RoleplaySessionLockedConfiguration,
} from "./roleplay-session-edit-policy";

const configuration: RoleplaySessionLockedConfiguration = {
    activitySectorCode: null,
    assignedUserId: null,
    category: "Accueil et posture relationnelle",
    coachId: "coach-1",
    difficulty: "Moyen",
    disc: "Stable",
    domain: "Relation client et expérience client",
    groupId: null,
    methodId: "method-1",
    organizationId: null,
    personaId: "persona-1",
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
        ["activity sector", { activitySectorCode: "TIC" }],
        ["classification", { category: "Gestion des clients difficiles" }],
        ["audience", { scope: "organization", organizationId: "organization-1" }],
        ["resources", { resources: [] }],
    ])("detects a change to the locked %s", (_label, patch) => {
        expect(
            hasRoleplaySessionLockedConfigurationChanged(configuration, {
                ...configuration,
                ...patch,
            }),
        ).toBe(true);
    });

    it("detects complementary quiz and participation changes separately", () => {
        const current = [{ id: "quiz-1", participation: "mandatory" }];

        expect(hasRoleplayQuizAssignmentsChanged(current, current)).toBe(false);
        expect(hasRoleplayQuizAssignmentsChanged(current, [
            { id: "quiz-2", participation: "mandatory" },
        ])).toBe(true);
        expect(hasRoleplayQuizAssignmentsChanged(current, [
            { id: "quiz-1", participation: "optional" },
        ])).toBe(true);
    });
});
