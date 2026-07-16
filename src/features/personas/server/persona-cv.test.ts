import { beforeEach, describe, expect, it, vi } from "vitest";
import { PERSONA_CV_UPLOAD_BUCKET } from "@/lib/uploads/content-upload";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    materializeDirectUpload: vi.fn(),
    requireAdmin: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@/lib/uploads/direct-upload.server", () => ({
    materializeDirectUpload: mocks.materializeDirectUpload,
}));

import {
    getPersonaCvAccess,
    isOwnedPersonaCvPath,
    preparePersonaCvUpdate,
} from "./persona-cv";

const ownedStoragePath = "personas/persona-1/cv/cv-sophie.pdf";

function createCvRow(storagePath = ownedStoragePath) {
    return {
        created_at: "2026-07-16T10:00:00.000Z",
        file_name: "CV Sophie.pdf",
        mime_type: "application/pdf",
        persona_id: "persona-1",
        size_bytes: 1024,
        storage_path: storagePath,
        updated_at: "2026-07-16T10:00:00.000Z",
        uploaded_by: "admin-1",
    };
}

function createAdminClientDouble(storagePath = ownedStoragePath) {
    const maybeSingle = vi.fn().mockResolvedValue({ data: createCvRow(storagePath), error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const createSignedUrl = vi.fn().mockResolvedValue({
        data: { signedUrl: "https://storage.example.com/cv.pdf?token=signed" },
        error: null,
    });
    const storageFrom = vi.fn().mockReturnValue({ createSignedUrl });

    return {
        client: { from, storage: { from: storageFrom } },
        createSignedUrl,
        eq,
        from,
        storageFrom,
    };
}

function createPersistenceDouble(existingCv = createCvRow()) {
    const removedPaths: string[] = [];
    const persistedRows: Array<Record<string, unknown>> = [];
    const maybeSingle = vi.fn().mockResolvedValue({ data: existingCv, error: null });
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const upsertSingle = vi.fn().mockImplementation(async () => ({
        data: {
            ...existingCv,
            ...persistedRows.at(-1),
            created_at: existingCv.created_at,
            updated_at: existingCv.updated_at,
        },
        error: null,
    }));
    const table = {
        delete: vi.fn().mockReturnValue({ eq: deleteEq }),
        select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ maybeSingle }),
        }),
        upsert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
            persistedRows.push(row);
            return {
                select: vi.fn().mockReturnValue({ single: upsertSingle }),
            };
        }),
    };
    const storageBucket = {
        download: vi.fn().mockResolvedValue({ data: new Blob(["%PDF-1.7\nCV"]), error: null }),
        info: vi.fn().mockResolvedValue({
            data: { contentType: "application/pdf", size: 1024 },
            error: null,
        }),
        remove: vi.fn().mockImplementation(async (paths: string[]) => {
            removedPaths.push(...paths);
            return { error: null };
        }),
    };
    const client = {
        from: vi.fn().mockReturnValue(table),
        storage: { from: vi.fn().mockReturnValue(storageBucket) },
    };

    return { client, deleteEq, persistedRows, removedPaths };
}

describe("persona CV path ownership", () => {
    it("recognizes only paths inside the selected persona CV folder", () => {
        expect(isOwnedPersonaCvPath(ownedStoragePath, "persona-1")).toBe(true);
        expect(isOwnedPersonaCvPath("personas/persona-10/cv/cv.pdf", "persona-1")).toBe(false);
        expect(isOwnedPersonaCvPath("personas/persona-2/cv/cv.pdf", "persona-1")).toBe(false);
        expect(isOwnedPersonaCvPath("/personas/persona-1/cv/cv.pdf", "persona-1")).toBe(false);
        expect(isOwnedPersonaCvPath("https://example.com/personas/persona-1/cv/cv.pdf", "persona-1")).toBe(false);
    });
});

describe("getPersonaCvAccess", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requireAdmin.mockResolvedValue({ userId: "admin-1" });
    });

    it("creates a short-lived download URL for an owned CV path", async () => {
        const admin = createAdminClientDouble();
        mocks.createAdminClient.mockReturnValue(admin.client);

        await expect(getPersonaCvAccess("persona-1")).resolves.toEqual({
            url: "https://storage.example.com/cv.pdf?token=signed",
        });

        expect(mocks.requireAdmin).toHaveBeenCalledOnce();
        expect(admin.from).toHaveBeenCalledWith("persona_cv_documents");
        expect(admin.eq).toHaveBeenCalledWith("persona_id", "persona-1");
        expect(admin.storageFrom).toHaveBeenCalledWith(PERSONA_CV_UPLOAD_BUCKET);
        expect(admin.createSignedUrl).toHaveBeenCalledWith(ownedStoragePath, 60, {
            download: "CV Sophie.pdf",
        });
    });

    it("checks admin authorization before creating the service-role client", async () => {
        mocks.requireAdmin.mockRejectedValueOnce(new Error("Accès refusé"));

        await expect(getPersonaCvAccess("persona-1")).rejects.toThrow("Accès refusé");
        expect(mocks.createAdminClient).not.toHaveBeenCalled();
    });

    it("rejects a foreign CV path before requesting a signed URL", async () => {
        const admin = createAdminClientDouble("personas/persona-2/cv/cv.pdf");
        mocks.createAdminClient.mockReturnValue(admin.client);

        await expect(getPersonaCvAccess("persona-1")).rejects.toMatchObject({
            code: "NOT_FOUND",
            status: 404,
        });
        expect(admin.storageFrom).not.toHaveBeenCalled();
        expect(admin.createSignedUrl).not.toHaveBeenCalled();
    });
});

describe("preparePersonaCvUpdate", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.materializeDirectUpload.mockResolvedValue({
            bucket: PERSONA_CV_UPLOAD_BUCKET,
            path: "unused-by-the-helper",
        });
    });

    it("restores the previous metadata and removes the new object when the persona update rolls back", async () => {
        const persistence = createPersistenceDouble();
        const prepared = await preparePersonaCvUpdate(
            persistence.client as never,
            "persona-1",
            "admin-1",
            {
                clientFileId: "cv-upload-1",
                fileName: "CV Sophie.pdf",
                kind: "upload",
                mimeType: "application/pdf",
                sizeBytes: 1024,
                storageBucket: PERSONA_CV_UPLOAD_BUCKET,
                storagePath: "_staging/admin-1/persona_cv/upload/cv.pdf",
            },
        );
        const destinationPath = mocks.materializeDirectUpload.mock.calls[0][0].destinationPath as string;

        expect(persistence.persistedRows[0]).toMatchObject({
            persona_id: "persona-1",
            storage_path: destinationPath,
        });
        expect(persistence.removedPaths).toEqual([]);

        await prepared.rollback();

        expect(persistence.persistedRows.at(-1)).toMatchObject({
            persona_id: "persona-1",
            storage_path: ownedStoragePath,
        });
        expect(persistence.removedPaths).toEqual([destinationPath]);
    });

    it("keeps the existing object until a CV removal is finalized", async () => {
        const persistence = createPersistenceDouble();
        const prepared = await preparePersonaCvUpdate(
            persistence.client as never,
            "persona-1",
            "admin-1",
            null,
        );

        expect(persistence.deleteEq).toHaveBeenCalledWith("persona_id", "persona-1");
        expect(persistence.removedPaths).toEqual([]);

        await prepared.finalize();

        expect(persistence.removedPaths).toEqual([ownedStoragePath]);
    });
});
