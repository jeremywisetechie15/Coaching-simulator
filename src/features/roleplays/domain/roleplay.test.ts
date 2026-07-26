import { describe, expect, it } from "vitest";
import { getRoleplayDisplayTitle } from "./roleplay";

describe("getRoleplayDisplayTitle", () => {
    it("uses the roleplay title when available", () => {
        expect(getRoleplayDisplayTitle({
            name: "Persona historique",
            title: "Gérer une réclamation client",
        })).toBe("Gérer une réclamation client");
    });

    it("falls back to the persona name for legacy roleplays", () => {
        expect(getRoleplayDisplayTitle({
            name: "Persona historique",
            title: " ",
        })).toBe("Persona historique");
    });
});
