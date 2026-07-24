import { describe, expect, it } from "vitest";
import {
    CONTENT_DOMAINS,
    getCategoriesForDomain,
    isContentCategoryForDomain,
    isContentDomain,
} from "./taxonomy";

describe("content taxonomy", () => {
    it("keeps every domain and its categories in the shared catalogue", () => {
        expect(CONTENT_DOMAINS).toContain("Communication");
        expect(getCategoriesForDomain("Communication")).toContain("Gestion des conflits");
        expect(CONTENT_DOMAINS).toContain("Relation client");
        expect(getCategoriesForDomain("Relation client")).toEqual(["Gestion des conflits", "Accueil client"]);
    });

    it("recognizes only domains from the shared catalogue", () => {
        expect(isContentDomain("Commercial")).toBe(true);
        expect(isContentDomain("Fonctions")).toBe(false);
        expect(isContentDomain("")).toBe(false);
    });

    it("validates categories against their selected domain", () => {
        expect(isContentCategoryForDomain("Relation client", "Accueil client")).toBe(true);
        expect(isContentCategoryForDomain("Relation client", "Gestion des conflits")).toBe(true);
        expect(isContentCategoryForDomain("Communication", "Gestion des conflits")).toBe(true);
        expect(isContentCategoryForDomain("Commercial", "Gestion des conflits")).toBe(false);
        expect(isContentCategoryForDomain(null, "Gestion des conflits")).toBe(false);
    });
});
