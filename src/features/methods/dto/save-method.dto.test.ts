import { describe, expect, it } from "vitest";
import { CONTENT_STATUS } from "@/features/content/domain";
import { METHOD_SCOPE } from "@/features/methods/domain/method";
import { saveMethodDto } from "./save-method.dto";

const minimalMethodInput = {
    name: "Méthode DAGO",
    steps: [{ title: "Démarrer l'appel" }],
};

describe("saveMethodDto", () => {
    it("normalizes a valid method payload", () => {
        const result = saveMethodDto.parse({
            ...minimalMethodInput,
            challenges: ["  Eviter le barrage  ", ""],
            objectives: ["Obtenir un rendez-vous", "   "],
            readingTimeMinutes: 12,
            resources: [
                {
                    externalUrl: "https://example.com/guide.pdf",
                    resourceType: "document",
                },
                {
                    externalUrl: "https://example.com/checklist",
                    label: "Checklist",
                    resourceType: "link",
                },
                {
                    label: "Guide uploadé",
                    resourceType: "document",
                    storageBucket: "notation_pdf",
                    storagePath: "methods/11111111-1111-4111-8111-111111111100/resources/11111111-1111-4111-8111-111111111102/guide-dago.pdf",
                },
            ],
            status: CONTENT_STATUS.published,
            steps: [
                {
                    bestPractices: ["Sourire au téléphone", ""],
                    title: "Démarrer l'appel",
                },
            ],
        });

        expect(result.challenges).toEqual(["Eviter le barrage"]);
        expect(result.objectives).toEqual(["Obtenir un rendez-vous"]);
        expect(result.resources[0]).toMatchObject({
            externalUrl: "https://example.com/guide.pdf",
            label: "https://example.com/guide.pdf",
            resourceType: "document",
        });
        expect(result.resources[1]).toMatchObject({
            externalUrl: "https://example.com/checklist",
            label: "Checklist",
            resourceType: "link",
        });
        expect(result.resources[2]).toMatchObject({
            externalUrl: "",
            label: "Guide uploadé",
            resourceType: "document",
            storageBucket: "notation_pdf",
            storagePath: "methods/11111111-1111-4111-8111-111111111100/resources/11111111-1111-4111-8111-111111111102/guide-dago.pdf",
        });
        expect(result.scope).toBe(METHOD_SCOPE.public);
        expect(result.status).toBe(CONTENT_STATUS.published);
        expect(result.steps[0]).toMatchObject({
            icon: "phone",
            title: "Démarrer l'appel",
        });
    });

    it("requires an organization for organization-private methods", () => {
        const result = saveMethodDto.safeParse({
            ...minimalMethodInput,
            scope: METHOD_SCOPE.organization,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        message: "Une méthode privée doit être liée à une organisation.",
                        path: ["organizationId"],
                    }),
                ]),
            );
        }
    });

    it("accepts an optional quiz association on method writes", () => {
        const result = saveMethodDto.parse({
            ...minimalMethodInput,
            quizId: "00000000-0000-4000-8000-000000000001",
        });

        expect(result.quizId).toBe("00000000-0000-4000-8000-000000000001");
    });

    it("rejects invalid quiz association identifiers", () => {
        const result = saveMethodDto.safeParse({
            ...minimalMethodInput,
            quizId: "quiz-1",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        message: "Le quiz associé est invalide.",
                        path: ["quizId"],
                    }),
                ]),
            );
        }
    });

    it("requires a complete storage reference for uploaded resources", () => {
        const result = saveMethodDto.safeParse({
            ...minimalMethodInput,
            resources: [
                {
                    label: "Guide uploadé",
                    resourceType: "document",
                    storagePath: "methods/11111111-1111-4111-8111-111111111100/resources/11111111-1111-4111-8111-111111111102/guide-dago.pdf",
                },
            ],
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        message: "Le bucket du fichier uploadé est requis.",
                        path: ["resources", 0, "storageBucket"],
                    }),
                ]),
            );
        }
    });

    it("limits uploaded complementary resources to documents", () => {
        const result = saveMethodDto.safeParse({
            ...minimalMethodInput,
            resources: [
                {
                    label: "Vidéo uploadée",
                    resourceType: "video",
                    storageBucket: "notation_pdf",
                    storagePath: "methods/11111111-1111-4111-8111-111111111100/resources/11111111-1111-4111-8111-111111111102/video.mp4",
                },
            ],
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        message: "Les ressources complémentaires uploadées doivent être des documents.",
                        path: ["resources", 0, "resourceType"],
                    }),
                ]),
            );
        }
    });

    it("accepts a client file reference for submit-time method document uploads", () => {
        const result = saveMethodDto.parse({
            ...minimalMethodInput,
            resources: [
                {
                    clientFileId: "resource-1",
                    label: "Guide uploadé",
                    resourceType: "document",
                },
            ],
        });

        expect(result.resources[0]).toMatchObject({
            clientFileId: "resource-1",
            externalUrl: "",
            label: "Guide uploadé",
            resourceType: "document",
            storageBucket: "",
            storagePath: "",
        });
    });

    it("limits submit-time complementary uploads to documents", () => {
        const result = saveMethodDto.safeParse({
            ...minimalMethodInput,
            resources: [
                {
                    clientFileId: "resource-1",
                    label: "Vidéo uploadée",
                    resourceType: "video",
                },
            ],
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        message: "Les ressources complémentaires uploadées doivent être des documents.",
                        path: ["resources", 0, "resourceType"],
                    }),
                ]),
            );
        }
    });

    it("allows uploaded step learning resources with media types", () => {
        const result = saveMethodDto.parse({
            name: "Méthode DAGO",
            steps: [
                {
                    resources: [
                        {
                            label: "Vidéo étape 1",
                            resourceType: "video",
                            storageBucket: "notation_pdf",
                            storagePath: "methods/11111111-1111-4111-8111-111111111100/steps/11111111-1111-4111-8111-111111111101/resources/11111111-1111-4111-8111-111111111102/step-video.mp4",
                        },
                    ],
                    title: "Démarrer l'appel",
                },
            ],
        });

        expect(result.steps[0].resources[0]).toMatchObject({
            externalUrl: "",
            label: "Vidéo étape 1",
            resourceType: "video",
            storageBucket: "notation_pdf",
            storagePath: "methods/11111111-1111-4111-8111-111111111100/steps/11111111-1111-4111-8111-111111111101/resources/11111111-1111-4111-8111-111111111102/step-video.mp4",
        });
    });
});
