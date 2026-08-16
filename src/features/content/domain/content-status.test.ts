import { describe, expect, it } from "vitest";
import {
    CONTENT_STATUS,
    CONTENT_STATUS_FILTER,
    CONTENT_STATUS_FILTER_OPTIONS,
    isContentStatusFilter,
    matchesContentStatusFilter,
} from "./content-status";

describe("content status filters", () => {
    it("exposes every publication state in the expected order", () => {
        expect(CONTENT_STATUS_FILTER_OPTIONS).toEqual([
            { label: "Tous les statuts de publication", value: CONTENT_STATUS_FILTER.all },
            { label: "Brouillon", value: CONTENT_STATUS.draft },
            { label: "Publié", value: CONTENT_STATUS.published },
            { label: "Archivé", value: CONTENT_STATUS.archived },
        ]);
    });

    it("validates and matches publication filters", () => {
        expect(isContentStatusFilter("all")).toBe(true);
        expect(isContentStatusFilter("archived")).toBe(true);
        expect(isContentStatusFilter("validated")).toBe(false);
        expect(matchesContentStatusFilter(CONTENT_STATUS.draft, CONTENT_STATUS_FILTER.all)).toBe(true);
        expect(matchesContentStatusFilter(CONTENT_STATUS.draft, CONTENT_STATUS_FILTER.draft)).toBe(true);
        expect(matchesContentStatusFilter(CONTENT_STATUS.draft, CONTENT_STATUS_FILTER.published)).toBe(false);
    });
});
