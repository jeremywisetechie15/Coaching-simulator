import { describe, expect, it } from "vitest";
import { getHttpErrorToastType } from "./toast";

describe("HTTP error toast type", () => {
    it.each([401, 403])("uses warning for authorization status %s", (status) => {
        expect(getHttpErrorToastType(status)).toBe("warning");
    });

    it.each([null, undefined, 400, 404, 409, 500])("uses error for status %s", (status) => {
        expect(getHttpErrorToastType(status)).toBe("error");
    });
});
