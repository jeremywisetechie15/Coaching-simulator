import { describe, expect, it } from "vitest";
import {
    ALL_CONTENT_CATEGORIES,
    CONTENT_CATEGORIES_BY_DOMAIN,
    CONTENT_DOMAINS,
    CONTENT_TAXONOMY,
    getContentCategoryCode,
    getContentDomainByCode,
    getContentDomainCode,
    isContentCategoryForDomain,
} from "./taxonomy";

describe("content taxonomy", () => {
    it("exposes the eleven client domains from the structured catalog", () => {
        expect(CONTENT_TAXONOMY).toHaveLength(11);
        expect(CONTENT_DOMAINS).toEqual(CONTENT_TAXONOMY.map(({ label }) => label));
        expect(new Set(CONTENT_TAXONOMY.map(({ code }) => code)).size).toBe(11);
    });

    it("derives every domain category list from the same catalog", () => {
        for (const domain of CONTENT_TAXONOMY) {
            expect(CONTENT_CATEGORIES_BY_DOMAIN[domain.label]).toEqual(
                domain.categories.map(({ label }) => label),
            );
            expect(domain.categories.every(({ code }) => code.startsWith(`${domain.code}-C`))).toBe(true);
        }

        expect(ALL_CONTENT_CATEGORIES).toHaveLength(114);
    });

    it("keeps the four existing business categories in their new domains", () => {
        expect(getContentCategoryCode("Management, stratégie et transformation", "Entretien de Remobilisation")).toBe("D01-C11");
        expect(getContentCategoryCode("Management, stratégie et transformation", "Feedback")).toBe("D01-C12");
        expect(getContentCategoryCode("Commerce et développement commercial", "Prospection")).toBe("D02-C11");
        expect(getContentCategoryCode("Commerce et développement commercial", "Vente")).toBe("D02-C12");
    });

    it("resolves stable codes without accepting a category from another domain", () => {
        expect(getContentDomainByCode("D10")?.label).toBe("Numérique, data et technologies");
        expect(getContentDomainCode("Relation client et expérience client")).toBe("D04");
        expect(isContentCategoryForDomain("Commerce et développement commercial", "Prospection")).toBe(true);
        expect(isContentCategoryForDomain("Management, stratégie et transformation", "Prospection")).toBe(false);
    });
});
