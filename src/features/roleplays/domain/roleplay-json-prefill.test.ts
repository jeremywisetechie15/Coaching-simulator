import { describe, expect, it } from "vitest";
import { ACTIVITY_SECTORS, CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import {
    buildRoleplayJsonPrefillPrompt,
    parseRoleplayJsonPrefillText,
    type RoleplayJsonPrefillOptions,
} from "./roleplay-json-prefill";

const options: RoleplayJsonPrefillOptions = {
    coachOptions: [{ id: "coach-1", name: "Coach Maia" }],
    groupOptions: [{ id: "group-1", name: "Équipe Nord", organizationId: "org-1" }],
    methodOptions: [{ id: "method-1", name: "DAGO" }],
    organizationOptions: [{ id: "org-1", name: "Organisation A" }],
    personaOptions: [{
        avatarUrl: null,
        company: "ACME",
        id: "persona-1",
        name: "Camille",
        role: "Direction commerciale",
    }],
    quizOptions: [
        { id: "quiz-shared", kind: "contextual", methodId: null, questionCount: 3, title: "Complément" },
        { id: "quiz-method", kind: "contextual", methodId: "method-1", questionCount: 4, title: "Contexte DAGO" },
        { id: "quiz-other", kind: "contextual", methodId: "method-2", questionCount: 4, title: "Autre" },
        { id: "quiz-knowledge", kind: "method_knowledge", methodId: "method-1", questionCount: 5, title: "Validation DAGO" },
    ],
    scorecardOptions: [{ id: "scorecard-1", methodId: "method-1", name: "Scorecard DAGO" }],
    userOptions: [{
        groupIds: ["group-1"],
        id: "user-1",
        name: "Paul Laverdure",
        organizationIds: ["org-1"],
    }],
};

function payload(overrides: Record<string, unknown> = {}) {
    return JSON.stringify({
        data: {
            activitySectorCode: "TIC",
            aiInstructions: "Reste réaliste.",
            assignedUserId: null,
            category: "Prospection",
            coachId: "coach-1",
            context: "Premier appel.",
            difficulty: "Moyen",
            domain: "Commercial",
            estimatedDurationMinutes: 10,
            groupId: null,
            learnerRole: "Vous incarnez la commerciale.",
            methodId: "method-1",
            objective: "Obtenir un rendez-vous.",
            obstacles: "Manque de temps.",
            organizationId: null,
            personaId: "persona-1",
            previewDescription: "Un appel de prospection.",
            previewTitle: "Décrocher un rendez-vous",
            quizIds: ["quiz-method", "quiz-shared"],
            quizParticipation: "optional",
            resources: [{ externalUrl: "https://example.com/brief", label: "Brief" }],
            scope: CONTENT_VISIBILITY_SCOPE.public,
            scorecardId: "scorecard-1",
            validationThreshold: 80,
            ...overrides,
        },
        entityType: "roleplay",
        schemaVersion: 1,
    });
}

describe("roleplay JSON prefill", () => {
    it("applies a valid activity sector and live catalog relationships", () => {
        const result = parseRoleplayJsonPrefillText(payload(), options);

        expect(result.fieldErrors).toEqual({});
        expect(result.draft.activitySectorCode).toBe("TIC");
        expect(result.draft.quizIds).toEqual(["quiz-method", "quiz-shared"]);
        expect(result.draft.resources).toEqual([
            { externalUrl: "https://example.com/brief", label: "Brief" },
        ]);
    });

    it("keeps the optional activity sector nullable", () => {
        const result = parseRoleplayJsonPrefillText(payload({ activitySectorCode: null }), options);

        expect(result.draft.activitySectorCode).toBeNull();
        expect(result.fieldErrors.activitySectorCode).toBeUndefined();
    });

    it("flags an unknown sector and a quiz outside the selected method", () => {
        const result = parseRoleplayJsonPrefillText(payload({
            activitySectorCode: "UNKNOWN",
            quizIds: ["quiz-other", "quiz-knowledge"],
        }), options);

        expect(result.draft.activitySectorCode).toBeNull();
        expect(result.draft.quizIds).toEqual([]);
        expect(result.fieldErrors.activitySectorCode).toBeDefined();
        expect(result.fieldErrors["quizIds.0"]).toBeDefined();
        expect(result.fieldErrors["quizIds.1"]).toBeDefined();
    });

    it("flags every absent contract field", () => {
        const parsed = JSON.parse(payload()) as { data: Record<string, unknown> };
        delete parsed.data.activitySectorCode;

        const result = parseRoleplayJsonPrefillText(JSON.stringify(parsed), options);

        expect(result.fieldErrors.activitySectorCode).toBe("Ce champ est absent du fichier JSON.");
    });

    it("builds a prompt from the shared 28-sector catalog without duplicating labels", () => {
        const prompt = buildRoleplayJsonPrefillPrompt(options);

        expect(ACTIVITY_SECTORS).toHaveLength(28);
        expect(prompt).toContain('"entityType": "roleplay"');
        expect(prompt).toContain('"code":"TIC","label":"Informatique, numérique et télécommunications"');
        expect(prompt).toContain('"id":"scorecard-1","methodId":"method-1"');
    });
});
