import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import { fileToStorageUploadBody } from "./storage-upload-body";

describe("fileToStorageUploadBody", () => {
    it("converts server File bodies to Node buffers for Supabase Storage uploads", async () => {
        const file = new File(["Guide DAGO"], "guide-dago.pdf", { type: "application/pdf" });

        const body = await fileToStorageUploadBody(file);

        expect(Buffer.isBuffer(body)).toBe(true);
        expect(body.toString("utf8")).toBe("Guide DAGO");
    });
});
