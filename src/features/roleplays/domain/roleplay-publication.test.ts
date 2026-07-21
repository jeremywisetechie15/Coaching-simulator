import { describe, expect, it } from "vitest";
import { CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import { getRoleplayPublicationIssues } from "./roleplay-publication";

const completeRoleplay = {
    category: "Prospection",
    coachId: "coach-1",
    difficulty: "Moyen",
    domain: "Commercial",
    learnerRole: "Vous incarnez le commercial chargé de mener l'entretien.",
    methodId: "method-1",
    personaId: "persona-1",
    scope: CONTENT_VISIBILITY_SCOPE.public,
    scorecardId: "scorecard-1",
};

describe("getRoleplayPublicationIssues", () => {
    it("accepts a complete public roleplay", () => {
        expect(getRoleplayPublicationIssues(completeRoleplay)).toEqual([]);
    });

    it("lists every missing publication field", () => {
        expect(
            getRoleplayPublicationIssues({ scope: CONTENT_VISIBILITY_SCOPE.public })
                .map((issue) => issue.field),
        ).toEqual([
            "personaId",
            "coachId",
            "difficulty",
            "methodId",
            "scorecardId",
            "domain",
            "category",
            "learnerRole",
        ]);
    });

    it("requires organization and group targets only for a published group scope", () => {
        expect(
            getRoleplayPublicationIssues({
                ...completeRoleplay,
                scope: CONTENT_VISIBILITY_SCOPE.group,
            }).map((issue) => issue.field),
        ).toEqual(["organizationId", "groupId"]);
    });
});
