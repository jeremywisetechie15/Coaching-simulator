import { describe, expect, it, vi } from "vitest";
import { jsonError } from "./http";

describe("jsonError", () => {
    it("serializes database lifecycle conflicts as HTTP 409", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const response = jsonError({
            code: "P0001",
            message: "CONTENT_LIFECYCLE_CONFLICT: Ce contenu est utilisé.",
        });

        expect(response.status).toBe(409);
        await expect(response.json()).resolves.toEqual({
            code: "CONFLICT",
            error: "Ce contenu est utilisé.",
        });
        expect(consoleError).not.toHaveBeenCalled();
        consoleError.mockRestore();
    });
});
