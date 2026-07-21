import { describe, expect, it } from "vitest";
import { CONTENT_STATUS, CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import { saveRoleplayDto } from "@/features/roleplays/dto";
import {
    createRoleplayInsert,
    createRoleplayUpdate,
    createScenarioQuizRows,
    createScenarioResourceRows,
} from "./roleplay.persistence";
import { createEmptyRoleplayStats, mapRoleplayRowsToDetail } from "./roleplay.mapper";

const personaId = "11111111-1111-4111-8111-111111111111";
const coachId = "22222222-2222-4222-8222-222222222222";
const methodId = "33333333-3333-4333-8333-333333333333";
const organizationId = "44444444-4444-4444-8444-444444444444";
const groupId = "55555555-5555-4555-8555-555555555555";
const userId = "66666666-6666-4666-8666-666666666666";
const scorecardId = "77777777-7777-4777-8777-777777777777";
const quizId = "88888888-8888-4888-8888-888888888888";

describe("roleplay persistence helpers", () => {
    it("persists a minimal draft with only its title", () => {
        const input = saveRoleplayDto.parse({ title: "Brouillon minimal" });

        expect(createRoleplayInsert(input, userId, null)).toMatchObject({
            persona_id: null,
            status: CONTENT_STATUS.draft,
            title: "Brouillon minimal",
        });
    });

    it("maps a group-private roleplay to scenario fields and quiz links", () => {
        const input = saveRoleplayDto.parse({
            category: "Prise de rendez-vous",
            coachId,
            context: "Appel à froid.",
            description: "Décrocher un rendez-vous.",
            difficulty: "Moyen",
            domain: "Commercial",
            groupId,
            learnerRole: "Vous incarnez le conseiller commercial.",
            methodId,
            objective: "Obtenir un créneau.",
            obstacles: "Standard filtrant.",
            organizationId,
            personaId,
            previewDescription: "Résumé court sur la carte.",
            previewTitle: "Décrocher un premier rendez-vous",
            quizIds: [quizId],
            resources: [
                {
                    label: "Brief produit",
                    resourceType: "document",
                    storageBucket: "resource_scenarios",
                    storagePath: "scenarios/scenario-1/resources/resource-1/brief-produit.pdf",
                },
            ],
            scope: CONTENT_VISIBILITY_SCOPE.group,
            scorecardId,
            status: CONTENT_STATUS.published,
            title: "Rendez-vous prospect",
        });

        expect(createRoleplayInsert(input, userId, "99999999-9999-4999-8999-999999999999")).toMatchObject({
            assigned_user_id: null,
            background_image_path: null,
            coach_id: coachId,
            group_id: groupId,
            is_active: true,
            learner_role: "Vous incarnez le conseiller commercial.",
            method_id: methodId,
            notation_method_id: "99999999-9999-4999-8999-999999999999",
            organization_id: organizationId,
            persona_id: personaId,
            preview_description: "Résumé court sur la carte.",
            preview_title: "Décrocher un premier rendez-vous",
            scorecard_id: scorecardId,
            status: CONTENT_STATUS.published,
            title: "Rendez-vous prospect",
            visibility_scope: CONTENT_VISIBILITY_SCOPE.group,
        });

        expect(createScenarioQuizRows("scenario-1", input)).toEqual([
            {
                participation: "optional",
                quiz_id: quizId,
                scenario_id: "scenario-1",
                sort_order: 1,
            },
        ]);
        expect(createScenarioResourceRows("scenario-1", input)).toEqual([
            {
                bucket: "resource_scenarios",
                external_url: null,
                is_active: true,
                label: "Brief produit",
                path: "scenarios/scenario-1/resources/resource-1/brief-produit.pdf",
                resource_type: "document",
                scenario_id: "scenario-1",
                sort_order: 1,
            },
        ]);
    });

    it("persists and maps the optional roleplay background path", () => {
        const backgroundImagePath = "roleplays/scenario-1/background.webp";
        const input = saveRoleplayDto.parse({
            backgroundImagePath,
            coachId,
            methodId,
            personaId,
            title: "Roleplay avec décor",
        });

        expect(createRoleplayUpdate(input, null)).toMatchObject({
            background_image_path: backgroundImagePath,
        });

        const detail = mapRoleplayRowsToDetail(
            {
                background_image_path: backgroundImagePath,
                id: "scenario-1",
                persona_id: personaId,
                title: "Roleplay avec décor",
            },
            [],
            [],
            createEmptyRoleplayStats(),
        );

        expect(detail.backgroundImagePath).toBe(backgroundImagePath);
    });

    it("persists and maps the role presented to the learner", () => {
        const learnerRole = "Vous incarnez la responsable commerciale chargée de mener l'entretien.";
        const input = saveRoleplayDto.parse({
            coachId,
            learnerRole,
            methodId,
            personaId,
            title: "Roleplay avec rôle apprenant",
        });

        expect(createRoleplayUpdate(input, null)).toMatchObject({
            learner_role: learnerRole,
        });

        const detail = mapRoleplayRowsToDetail(
            {
                id: "scenario-learner-role",
                learner_role: learnerRole,
                persona_id: personaId,
                title: "Roleplay avec rôle apprenant",
            },
            [],
            [],
            createEmptyRoleplayStats(),
        );

        expect(detail.learnerRole).toBe(learnerRole);
    });

    it("clears organization and group when a roleplay becomes public", () => {
        const input = saveRoleplayDto.parse({
            coachId,
            groupId,
            methodId,
            organizationId,
            personaId,
            scope: CONTENT_VISIBILITY_SCOPE.public,
            title: "Roleplay public",
        });

        expect(createRoleplayUpdate(input, null)).toMatchObject({
            assigned_user_id: null,
            group_id: null,
            organization_id: null,
            visibility_scope: CONTENT_VISIBILITY_SCOPE.public,
        });
    });

    it("stores only the user target for user-private roleplays", () => {
        const input = saveRoleplayDto.parse({
            assignedUserId: userId,
            coachId,
            methodId,
            organizationId,
            personaId,
            scope: CONTENT_VISIBILITY_SCOPE.user,
            title: "Roleplay utilisateur",
        });

        expect(createRoleplayUpdate(input, null)).toMatchObject({
            assigned_user_id: userId,
            group_id: null,
            organization_id: null,
            visibility_scope: CONTENT_VISIBILITY_SCOPE.user,
        });
    });

    it("marks archived roleplays inactive", () => {
        const input = saveRoleplayDto.parse({
            coachId,
            methodId,
            personaId,
            status: CONTENT_STATUS.archived,
            title: "Roleplay archivé",
        });

        expect(createRoleplayUpdate(input, null)).toMatchObject({
            is_active: false,
            status: CONTENT_STATUS.archived,
        });
    });
});

describe("roleplay mapper", () => {
    it("keeps quiz metadata needed by the preparation modal", () => {
        const detail = mapRoleplayRowsToDetail(
            {
                id: "scenario-1",
                persona_id: personaId,
                preview_description: "Résumé court sur la carte.",
                preview_title: "Décrocher un premier rendez-vous",
                title: "Rendez-vous prospect",
            },
            [
                {
                    participation: "mandatory",
                    quiz_duration_minutes: 18,
                    quiz_id: quizId,
                    quiz_question_count: 9,
                    quiz_title: "Quiz méthode DAGO",
                    quiz_type: "self_assessment",
                    scenario_id: "scenario-1",
                    sort_order: 1,
                },
            ],
            [],
            createEmptyRoleplayStats(),
        );

        expect(detail.quizzes).toEqual([
            {
                durationMinutes: 18,
                id: quizId,
                participation: "mandatory",
                questionCount: 9,
                title: "Quiz méthode DAGO",
                type: "self_assessment",
            },
        ]);
        expect(detail.previewDescription).toBe("Résumé court sur la carte.");
        expect(detail.previewTitle).toBe("Décrocher un premier rendez-vous");
    });
});
