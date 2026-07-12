import { describe, expect, it } from "vitest";
import { isOwnedPersonaAvatarPath } from "./persona-avatar";

describe("persona avatar ownership", () => {
    it("recognizes only storage paths owned by the persona", () => {
        expect(isOwnedPersonaAvatarPath("persona-1/avatar.webp", "persona-1")).toBe(true);
        expect(isOwnedPersonaAvatarPath("personas-avatars/persona-1/avatar.webp", "persona-1")).toBe(true);
        expect(isOwnedPersonaAvatarPath("persona-2/avatar.webp", "persona-1")).toBe(false);
        expect(isOwnedPersonaAvatarPath("/personas/avatar.webp", "persona-1")).toBe(false);
        expect(isOwnedPersonaAvatarPath("https://example.com/avatar.webp", "persona-1")).toBe(false);
    });
});
