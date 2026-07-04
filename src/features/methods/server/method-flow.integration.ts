import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import { CONTENT_STATUS } from "@/features/content/domain";
import { getMethodScopeLabel, METHOD_SCOPE } from "@/features/methods/domain/method";
import { saveMethodDto } from "@/features/methods/dto/save-method.dto";
import { mapMethodRowsToDetail } from "./method.mapper";
import type { MethodResourceRow, MethodRow } from "./method.mapper";
import { syncMethodNotationFiles } from "./method-notation-files";
import { cleanupStaleMethodResourceFiles, getStaleStoredResourceReferences } from "./method-resource-cleanup";
import { materializeMethodResourceUploads, type UploadedStorageObject } from "./method-upload-files";
import { createResourceRows } from "./method.persistence";

describe("method write/read flow", () => {
    it("keeps method persistence independent from quiz association", () => {
        const input = saveMethodDto.parse({
            name: "Méthode DAGO",
            organizationId: "11111111-1111-4111-8111-111111111110",
            scope: METHOD_SCOPE.organization,
            status: CONTENT_STATUS.draft,
            steps: [
                {
                    title: "Démarrer l'appel",
                },
            ],
        });

        const detail = mapMethodRowsToDetail(
            {
                id: "11111111-1111-4111-8111-111111111100",
                name: input.name,
                organization_id: input.organizationId,
                organization_name: "Maia Coach Demo",
                scope: input.scope,
                status: input.status,
            },
            [
                {
                    id: "11111111-1111-4111-8111-111111111101",
                    method_id: "11111111-1111-4111-8111-111111111100",
                    step_order: 1,
                    title: input.steps[0].title,
                },
            ],
            [
                {
                    bucket: null,
                    external_url: "https://example.com/guide.pdf",
                    id: "11111111-1111-4111-8111-111111111102",
                    label: "Guide DAGO",
                    notation_file_id: "11111111-1111-4111-8111-111111111104",
                    path: null,
                    resource_type: "document",
                    sort_order: 1,
                    step_id: null,
                },
                {
                    bucket: null,
                    external_url: "https://example.com/checklist",
                    id: "11111111-1111-4111-8111-111111111103",
                    label: "Checklist",
                    path: null,
                    resource_type: "link",
                    sort_order: 2,
                    step_id: null,
                },
            ],
        );

        expect(detail.name).toBe("Méthode DAGO");
        expect(detail.resources).toHaveLength(2);
        expect(detail.resources.map((resource) => resource.label)).toEqual(["Guide DAGO", "Checklist"]);
        expect(detail.resources[0].notationFileId).toBe("11111111-1111-4111-8111-111111111104");
        expect(detail.stepCount).toBe(1);
        expect(detail.scope).toBe(METHOD_SCOPE.organization);
        expect(getMethodScopeLabel(detail)).toBe("Privé - Maia Coach Demo");
        expect(detail).not.toHaveProperty("quiz");
        expect(detail).not.toHaveProperty("quizId");
    });

    it("keeps uploaded resources with bucket and path even without external URL", () => {
        const input = saveMethodDto.parse({
            name: "Méthode DAGO",
            resources: [
                {
                    label: "Guide uploadé",
                    resourceType: "document",
                    storageBucket: "notation_pdf",
                    storagePath: "methods/11111111-1111-4111-8111-111111111100/resources/11111111-1111-4111-8111-111111111102/guide-dago.pdf",
                },
            ],
            steps: [
                {
                    title: "Démarrer l'appel",
                },
            ],
        });

        const rows = createResourceRows(
            "11111111-1111-4111-8111-111111111100",
            input,
            new Map([[1, "11111111-1111-4111-8111-111111111101"]]),
        );

        expect(rows).toEqual([
            expect.objectContaining({
                bucket: "notation_pdf",
                external_url: null,
                label: "Guide uploadé",
                path: "methods/11111111-1111-4111-8111-111111111100/resources/11111111-1111-4111-8111-111111111102/guide-dago.pdf",
                resource_type: "document",
                step_id: null,
            }),
        ]);
    });

    it("keeps uploaded step learning resources attached to their step", () => {
        const input = saveMethodDto.parse({
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

        const rows = createResourceRows(
            "11111111-1111-4111-8111-111111111100",
            input,
            new Map([[1, "11111111-1111-4111-8111-111111111101"]]),
        );

        expect(rows).toEqual([
            expect.objectContaining({
                bucket: "notation_pdf",
                external_url: null,
                label: "Vidéo étape 1",
                path: "methods/11111111-1111-4111-8111-111111111100/steps/11111111-1111-4111-8111-111111111101/resources/11111111-1111-4111-8111-111111111102/step-video.mp4",
                resource_type: "video",
                step_id: "11111111-1111-4111-8111-111111111101",
            }),
        ]);
    });

    it("creates notation file links for uploaded method documents", async () => {
        const method = {
            code: "dago",
            id: "11111111-1111-4111-8111-111111111100",
            name: "Méthode DAGO",
            notation_method_id: null,
            status: CONTENT_STATUS.draft,
            version: "v1",
        } satisfies MethodRow;
        const resources = [
            {
                bucket: "notation_pdf",
                id: "11111111-1111-4111-8111-111111111102",
                label: "Guide uploadé",
                path: "methods/11111111-1111-4111-8111-111111111100/resources/11111111-1111-4111-8111-111111111102/guide-dago.pdf",
                resource_type: "document",
                sort_order: 1,
                step_id: null,
            },
        ] satisfies MethodResourceRow[];
        const updates: Array<{ table: string; payload: unknown }> = [];
        const fakeSupabase = {
            from(table: string) {
                return {
                    upsert(payload: unknown) {
                        if (table === "notation_method_files") {
                            return {
                                select: () =>
                                    Promise.resolve({
                                        data: [
                                            {
                                                bucket: "notation_pdf",
                                                id: "11111111-1111-4111-8111-111111111109",
                                                path: "methods/11111111-1111-4111-8111-111111111100/resources/11111111-1111-4111-8111-111111111102/guide-dago.pdf",
                                            },
                                        ],
                                        error: null,
                                    }),
                            };
                        }

                        updates.push({ table, payload });
                        return Promise.resolve({ error: null });
                    },
                    update(payload: unknown) {
                        updates.push({ table, payload });
                        return {
                            eq: () => Promise.resolve({ error: null }),
                        };
                    },
                };
            },
        };

        const result = await syncMethodNotationFiles(fakeSupabase as never, method, resources);

        expect(result.method.notation_method_id).toBe(method.id);
        expect(result.resources[0].notation_file_id).toBe("11111111-1111-4111-8111-111111111109");
        expect(updates).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    table: "notation_methods",
                }),
                expect.objectContaining({
                    table: "methods",
                    payload: { notation_method_id: method.id },
                }),
                expect.objectContaining({
                    table: "method_resources",
                    payload: { notation_file_id: "11111111-1111-4111-8111-111111111109" },
                }),
            ]),
        );
    });

    it("uploads submit-time files into final method and step paths", async () => {
        const methodId = "11111111-1111-4111-8111-111111111100";
        const stepId = "11111111-1111-4111-8111-111111111101";
        const documentFile = new File(["Guide DAGO"], "Guide DAGO.pdf", { type: "application/pdf" });
        const videoFile = new File(["video"], "step video.mp4", { type: "video/mp4" });
        const uploads: Array<{
            bucket: string;
            contentType: string | undefined;
            path: string;
        }> = [];
        const fakeSupabase = {
            storage: {
                from(bucket: string) {
                    return {
                        upload(
                            path: string,
                            body: Buffer,
                            options: { contentType?: string },
                        ) {
                            expect(Buffer.isBuffer(body)).toBe(true);
                            uploads.push({ bucket, contentType: options.contentType, path });
                            return Promise.resolve({ error: null });
                        },
                    };
                },
            },
        };
        const input = saveMethodDto.parse({
            name: "Méthode DAGO",
            resources: [
                {
                    clientFileId: "resource-file",
                    label: "Guide uploadé",
                    resourceType: "document",
                },
            ],
            steps: [
                {
                    resources: [
                        {
                            clientFileId: "step-file",
                            label: "Vidéo étape 1",
                            resourceType: "video",
                        },
                    ],
                    title: "Démarrer l'appel",
                },
            ],
        });
        const uploadedObjects: UploadedStorageObject[] = [];

        const materializedInput = await materializeMethodResourceUploads(
            fakeSupabase as never,
            methodId,
            input,
            new Map([[1, stepId]]),
            new Map([
                ["resource-file", documentFile],
                ["step-file", videoFile],
            ]),
            uploadedObjects,
        );

        expect(materializedInput.resources[0]).toEqual(
            expect.objectContaining({
                clientFileId: "",
                resourceType: "document",
                storageBucket: "notation_pdf",
            }),
        );
        expect(materializedInput.resources[0].storagePath).toMatch(
            /^methods\/11111111-1111-4111-8111-111111111100\/resources\/.+\/guide-dago\.pdf$/,
        );
        expect(materializedInput.steps[0].resources[0]).toEqual(
            expect.objectContaining({
                clientFileId: "",
                resourceType: "video",
                storageBucket: "notation_pdf",
            }),
        );
        expect(materializedInput.steps[0].resources[0].storagePath).toMatch(
            /^methods\/11111111-1111-4111-8111-111111111100\/steps\/11111111-1111-4111-8111-111111111101\/resources\/.+\/step-video\.mp4$/,
        );
        expect(uploads).toEqual([
            expect.objectContaining({ bucket: "notation_pdf", contentType: "application/pdf" }),
            expect.objectContaining({ bucket: "notation_pdf", contentType: "video/mp4" }),
        ]);
        expect(uploadedObjects.map((object) => object.path)).toEqual(uploads.map((upload) => upload.path));
    });

    it("cleans stale storage files without treating step capsules as notation files", async () => {
        const previousResources = [
            {
                bucket: "notation_pdf",
                id: "11111111-1111-4111-8111-111111111102",
                label: "Ancien guide",
                notation_file_id: "11111111-1111-4111-8111-111111111202",
                path: "methods/method-1/resources/resource-1/ancien-guide.pdf",
                resource_type: "document",
                sort_order: 1,
                step_id: null,
            },
            {
                bucket: "notation_pdf",
                id: "11111111-1111-4111-8111-111111111103",
                label: "Ancienne capsule",
                notation_file_id: null,
                path: "methods/method-1/steps/step-1/resources/resource-2/ancienne-capsule.mp4",
                resource_type: "video",
                sort_order: 2,
                step_id: "11111111-1111-4111-8111-111111111101",
            },
        ] satisfies MethodResourceRow[];
        const currentResources = [
            {
                bucket: "notation_pdf",
                id: "11111111-1111-4111-8111-111111111104",
                label: "Nouveau guide",
                notation_file_id: "11111111-1111-4111-8111-111111111204",
                path: "methods/method-1/resources/resource-3/nouveau-guide.pdf",
                resource_type: "document",
                sort_order: 1,
                step_id: null,
            },
        ] satisfies MethodResourceRow[];
        const notationFiles = [
            {
                bucket: "notation_pdf",
                id: "11111111-1111-4111-8111-111111111202",
                path: "methods/method-1/resources/resource-1/ancien-guide.pdf",
            },
            {
                bucket: "notation_pdf",
                id: "11111111-1111-4111-8111-111111111204",
                path: "methods/method-1/resources/resource-3/nouveau-guide.pdf",
            },
        ];
        const removedStorageObjects: Array<{ bucket: string; paths: string[] }> = [];
        const deletedNotationFileIds: string[] = [];
        const selectRows = (table: string, filters: Record<string, string>) => {
            const rows = table === "method_resources" ? currentResources : notationFiles;
            return rows.filter((row) =>
                Object.entries(filters).every(([key, value]) => row[key as keyof typeof row] === value),
            );
        };
        const fakeSupabase = {
            from(table: string) {
                return {
                    delete() {
                        return {
                            eq(column: string, value: string) {
                                if (table === "notation_method_files" && column === "id") {
                                    deletedNotationFileIds.push(value);
                                    const index = notationFiles.findIndex((file) => file.id === value);
                                    if (index >= 0) {
                                        notationFiles.splice(index, 1);
                                    }
                                }

                                return Promise.resolve({ error: null });
                            },
                        };
                    },
                    select() {
                        const filters: Record<string, string> = {};

                        return {
                            eq(column: string, value: string) {
                                filters[column] = value;
                                return this;
                            },
                            limit() {
                                return Promise.resolve({
                                    data: selectRows(table, filters),
                                    error: null,
                                });
                            },
                        };
                    },
                };
            },
            storage: {
                from(bucket: string) {
                    return {
                        remove(paths: string[]) {
                            removedStorageObjects.push({ bucket, paths });
                            return Promise.resolve({ error: null });
                        },
                    };
                },
            },
        };

        expect(getStaleStoredResourceReferences(previousResources, currentResources)).toHaveLength(2);

        await cleanupStaleMethodResourceFiles(
            fakeSupabase as never,
            previousResources,
            currentResources,
        );

        expect(deletedNotationFileIds).toEqual(["11111111-1111-4111-8111-111111111202"]);
        expect(removedStorageObjects).toEqual([
            {
                bucket: "notation_pdf",
                paths: [
                    "methods/method-1/resources/resource-1/ancien-guide.pdf",
                    "methods/method-1/steps/step-1/resources/resource-2/ancienne-capsule.mp4",
                ],
            },
        ]);
    });
});
