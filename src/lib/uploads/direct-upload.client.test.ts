import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    CONTENT_UPLOAD_ERROR_MESSAGES,
    CONTENT_UPLOAD_PURPOSES,
    getContentUploadSizeErrorMessage,
} from "./content-upload";
import { uploadFileToSignedUrl } from "./direct-upload.client";
import type { DirectUploadIntent, PendingDirectUpload } from "./direct-upload";

class FakeXMLHttpRequest {
    static instances: FakeXMLHttpRequest[] = [];

    body: Document | XMLHttpRequestBodyInit | null = null;
    headers = new Map<string, string>();
    method = "";
    onabort: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onload: (() => void) | null = null;
    responseText = "";
    status = 0;
    upload = {
        onprogress: null as ((event: Pick<ProgressEvent, "lengthComputable" | "loaded" | "total">) => void) | null,
    };
    url = "";

    constructor() {
        FakeXMLHttpRequest.instances.push(this);
    }

    open(method: string, url: string) {
        this.method = method;
        this.url = url;
    }

    send(body: Document | XMLHttpRequestBodyInit | null) {
        this.body = body;
    }

    setRequestHeader(name: string, value: string) {
        this.headers.set(name.toLowerCase(), value);
    }
}

const upload: PendingDirectUpload = {
    clientFileId: "file-1",
    file: new File(["video"], "video.mp4", { type: "video/mp4" }),
    purpose: CONTENT_UPLOAD_PURPOSES.contentAsset,
};

const intent: DirectUploadIntent = {
    bucket: "notation_pdf",
    path: "_staging/user/content_asset/upload/video.mp4",
    purpose: CONTENT_UPLOAD_PURPOSES.contentAsset,
    signedUrl: "https://project.supabase.co/storage/v1/object/upload/sign/notation_pdf/video.mp4?token=signed",
};

describe("signed direct upload transport", () => {
    beforeEach(() => {
        FakeXMLHttpRequest.instances = [];
        vi.stubGlobal("XMLHttpRequest", FakeXMLHttpRequest);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("uploads the file directly to the signed URL and reports progress", async () => {
        const progress: number[] = [];
        const result = uploadFileToSignedUrl(upload, intent, (_clientFileId, percentage) => {
            progress.push(percentage);
        });
        const request = FakeXMLHttpRequest.instances[0];

        request.upload.onprogress?.({ lengthComputable: true, loaded: 3, total: 6 });
        request.status = 200;
        request.onload?.();

        await expect(result).resolves.toBeUndefined();
        expect(request.method).toBe("PUT");
        expect(request.url).toBe(intent.signedUrl);
        expect(request.body).toBe(upload.file);
        expect(request.headers.get("content-type")).toBe("video/mp4");
        expect(request.headers.get("x-upsert")).toBe("false");
        expect(progress).toEqual([50, 100]);
    });

    it("prevents browser caching for private persona CV uploads", async () => {
        const cvUpload: PendingDirectUpload = {
            clientFileId: "cv-1",
            file: new File(["%PDF-1.7"], "cv.pdf", { type: "application/pdf" }),
            purpose: CONTENT_UPLOAD_PURPOSES.personaCv,
        };
        const cvIntent: DirectUploadIntent = {
            bucket: "personas-cvs",
            path: "_staging/user/persona_cv/upload/cv.pdf",
            purpose: CONTENT_UPLOAD_PURPOSES.personaCv,
            signedUrl: "https://project.supabase.co/storage/v1/object/upload/sign/personas-cvs/cv.pdf?token=signed",
        };
        const result = uploadFileToSignedUrl(cvUpload, cvIntent);
        const request = FakeXMLHttpRequest.instances[0];

        request.status = 200;
        request.onload?.();

        await expect(result).resolves.toBeUndefined();
        expect(request.headers.get("cache-control")).toBe("no-store, max-age=0");
    });

    it("returns a clear error when Storage rejects an expired or unauthorized URL", async () => {
        const result = uploadFileToSignedUrl(upload, intent);
        const request = FakeXMLHttpRequest.instances[0];

        request.status = 403;
        request.responseText = JSON.stringify({ message: "Unauthorized" });
        request.onload?.();

        await expect(result).rejects.toThrow(CONTENT_UPLOAD_ERROR_MESSAGES.forbidden);
    });

    it("returns a clear error when the Storage file-size limit is exceeded", async () => {
        const result = uploadFileToSignedUrl(upload, intent);
        const request = FakeXMLHttpRequest.instances[0];

        request.status = 413;
        request.responseText = JSON.stringify({ code: "EntityTooLarge" });
        request.onload?.();

        await expect(result).rejects.toThrow(
            getContentUploadSizeErrorMessage(upload.file, upload.purpose),
        );
    });

    it.each([
        {
            expected: CONTENT_UPLOAD_ERROR_MESSAGES.invalidType,
            payload: { code: "InvalidMimeType" },
            status: 400,
        },
        {
            expected: CONTENT_UPLOAD_ERROR_MESSAGES.storageNotConfigured,
            payload: { code: "NoSuchBucket" },
            status: 404,
        },
        {
            expected: CONTENT_UPLOAD_ERROR_MESSAGES.storageFull,
            payload: { code: "StorageQuotaExceeded" },
            status: 402,
        },
        {
            expected: CONTENT_UPLOAD_ERROR_MESSAGES.unavailable,
            payload: { message: "Service unavailable" },
            status: 503,
        },
    ])("maps Storage $status failures to an actionable message", async ({ expected, payload, status }) => {
        const result = uploadFileToSignedUrl(upload, intent);
        const request = FakeXMLHttpRequest.instances[0];

        request.status = status;
        request.responseText = JSON.stringify(payload);
        request.onload?.();

        await expect(result).rejects.toThrow(expected);
    });
});
