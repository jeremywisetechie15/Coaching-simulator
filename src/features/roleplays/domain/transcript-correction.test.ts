import { describe, expect, it } from "vitest";
import type { RoleplayNotationTranscriptConversationItem } from "./roleplay-notation-transcript";
import {
    buildTranscriptHighlightSegments,
    createRoleplayTranscriptCorrectionLimiter,
    normalizeRoleplayTranscriptCorrection,
} from "./transcript-correction";

const transcript: RoleplayNotationTranscriptConversationItem[] = [
    {
        etape_methodo: 1,
        id: 1,
        is_ai_response: false,
        speaker: "Apprenant",
        timecode_absolute: "12:00:00",
        timecode_relative: "00:00:00",
        verbatim: "Avant de rentrer dans les possibilités, parlons de vos priorités.",
    },
    {
        etape_methodo: 1,
        id: 2,
        is_ai_response: true,
        speaker: "Persona",
        timecode_absolute: "12:00:05",
        timecode_relative: "00:00:05",
        verbatim: "Je veux surtout rattraper le retard.",
    },
];

const validCorrection = {
    message_ref: "M1",
    phrase_originale: "parlons de vos priorités",
    pourquoi: "Cette formulation cadre plus clairement l'échange.",
    verbatim_preconise: "Pour bien cadrer notre échange, quelles sont vos priorités ?",
};

describe("roleplay transcript correction", () => {
    it("keeps a useful correction for an incomplete criterion", () => {
        expect(normalizeRoleplayTranscriptCorrection({
            correction: validCorrection,
            pointsAwarded: 1,
            pointsMax: 2,
            transcript,
        })).toEqual(validCorrection);
    });

    it("drops every correction for a fully awarded criterion", () => {
        expect(normalizeRoleplayTranscriptCorrection({
            correction: validCorrection,
            pointsAwarded: 2,
            pointsMax: 2,
            transcript,
        })).toBeNull();
    });

    it.each([
        ["an unknown message", { ...validCorrection, message_ref: "M99" }],
        ["a persona message", { ...validCorrection, message_ref: "M2", phrase_originale: "rattraper le retard" }],
        ["an invented original phrase", { ...validCorrection, phrase_originale: "Phrase absente du transcript" }],
        ["an unchanged suggestion", { ...validCorrection, verbatim_preconise: "PARLONS DE VOS PRIORITÉS" }],
        ["an incomplete payload", { ...validCorrection, pourquoi: "" }],
    ])("drops a correction linked to %s", (_label, correction) => {
        expect(normalizeRoleplayTranscriptCorrection({
            correction,
            pointsAwarded: 0,
            pointsMax: 2,
            transcript,
        })).toBeNull();
    });

    it("merges overlapping highlights without duplicating transcript text", () => {
        const message = "Avant de rentrer dans les possibilités.";
        const segments = buildTranscriptHighlightSegments(message, [
            "rentrer dans les possibilités",
            "les possibilités",
        ]);

        expect(segments).toEqual([
            { highlighted: false, text: "Avant de " },
            { highlighted: true, text: "rentrer dans les possibilités" },
            { highlighted: false, text: "." },
        ]);
        expect(segments.map((segment) => segment.text).join("")).toBe(message);
    });

    it("preserves character indexes when a message contains leading spaces", () => {
        const message = "  Parlons de vos priorités.";

        expect(buildTranscriptHighlightSegments(message, ["parlons de vos priorités"])).toEqual([
            { highlighted: false, text: "  " },
            { highlighted: true, text: "Parlons de vos priorités" },
            { highlighted: false, text: "." },
        ]);
    });

    it("keeps at most two distinct recommended verbatims for the same learner message", () => {
        const limitCorrection = createRoleplayTranscriptCorrectionLimiter();
        const secondCorrection = {
            ...validCorrection,
            pourquoi: "Cette alternative rend la question plus directe.",
            verbatim_preconise: "Quelles sont vos deux priorités pour cet échange ?",
        };
        const overlappingExcerptCorrection = {
            ...validCorrection,
            phrase_originale: "Avant de rentrer dans les possibilités",
            verbatim_preconise: "Avant d'explorer les solutions, cadrons votre objectif.",
        };
        const otherMessageCorrection = {
            ...overlappingExcerptCorrection,
            message_ref: "M3",
        };

        expect(limitCorrection(validCorrection)).toEqual(validCorrection);
        expect(limitCorrection({
            ...validCorrection,
            verbatim_preconise: validCorrection.verbatim_preconise.toUpperCase(),
        })).toBeNull();
        expect(limitCorrection(secondCorrection)).toEqual(secondCorrection);
        expect(limitCorrection({
            ...validCorrection,
            verbatim_preconise: "Quel résultat souhaitez-vous obtenir en priorité ?",
        })).toBeNull();
        expect(limitCorrection(overlappingExcerptCorrection)).toBeNull();
        expect(limitCorrection(otherMessageCorrection)).toEqual(otherMessageCorrection);
    });
});
