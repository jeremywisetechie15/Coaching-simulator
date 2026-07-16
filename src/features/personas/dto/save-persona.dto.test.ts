import { describe, expect, it } from "vitest";
import {
    MAX_PERSONA_CV_UPLOAD_SIZE_BYTES,
    PERSONA_CV_UPLOAD_MIME_TYPE,
} from "@/lib/uploads/content-upload";
import { savePersonaDto } from "./save-persona.dto";

const validPersona = {
    age: "42",
    annualRevenue: "5 M€",
    avatarUrl: "/personas/avatar.png",
    childrenCount: "2",
    company: "TechCorp",
    companyDescription: "Entreprise technologique B2B.",
    diploma: "Master commerce",
    discProfile: "Stable",
    employeeCount: "50",
    industry: "Technologie",
    maritalStatus: "Marié",
    name: "Sophie Martin",
    nationality: "Française",
    netIncomeBeforeTax: "3 200 € / mois",
    residenceCountry: "France",
    role: "Directrice commerciale",
    systemInstructions: "Répondre comme une persona exigeante.",
    voiceId: "alloy",
};

describe("savePersonaDto", () => {
    it("accepts professional, personal and DISC profile fields", () => {
        const parsed = savePersonaDto.parse(validPersona);

        expect(parsed).toMatchObject({
            age: "42",
            childrenCount: "2",
            companyDescription: "Entreprise technologique B2B.",
            discProfile: "Stable",
            employeeCount: "50",
            industry: "Technologie",
            netIncomeBeforeTax: "3 200 € / mois",
        });
    });

    it("rejects unknown industry and non-numeric count fields", () => {
        expect(() =>
            savePersonaDto.parse({
                ...validPersona,
                childrenCount: "deux",
                industry: "Secteur inconnu",
            }),
        ).toThrow();
    });

    it("rejects age values above the supported persona range", () => {
        expect(() =>
            savePersonaDto.parse({
                ...validPersona,
                age: "131",
            }),
        ).toThrow("L'âge doit être un nombre entier positif inférieur ou égal à 130.");
    });

    it("keeps net income optional for existing clients and personas", () => {
        const legacyPayload: Partial<typeof validPersona> = { ...validPersona };
        delete legacyPayload.netIncomeBeforeTax;
        const parsed = savePersonaDto.parse(legacyPayload);

        expect(parsed.netIncomeBeforeTax).toBe("");
    });

    it("parses the distinct CV commands for unchanged, removal, preservation and replacement", () => {
        expect(savePersonaDto.parse(validPersona).cv).toBeUndefined();
        expect(savePersonaDto.parse({ ...validPersona, cv: null }).cv).toBeNull();
        expect(savePersonaDto.parse({ ...validPersona, cv: { kind: "existing" } }).cv).toEqual({
            kind: "existing",
        });
        expect(
            savePersonaDto.parse({
                ...validPersona,
                cv: {
                    clientFileId: "cv-upload-1",
                    fileName: "CV Sophie.pdf",
                    kind: "upload",
                    mimeType: PERSONA_CV_UPLOAD_MIME_TYPE,
                    sizeBytes: MAX_PERSONA_CV_UPLOAD_SIZE_BYTES,
                },
            }).cv,
        ).toEqual({
            clientFileId: "cv-upload-1",
            fileName: "CV Sophie.pdf",
            kind: "upload",
            mimeType: PERSONA_CV_UPLOAD_MIME_TYPE,
            sizeBytes: MAX_PERSONA_CV_UPLOAD_SIZE_BYTES,
            storageBucket: "",
            storagePath: "",
        });
    });

    it("rejects forged or invalid CV upload commands", () => {
        const validUpload = {
            clientFileId: "cv-upload-1",
            fileName: "CV Sophie.pdf",
            kind: "upload" as const,
            mimeType: PERSONA_CV_UPLOAD_MIME_TYPE,
            sizeBytes: 1024,
            storageBucket: "personas-cvs",
            storagePath: "_staging/admin-1/persona_cv/upload/cv.pdf",
        };

        expect(
            savePersonaDto.safeParse({
                ...validPersona,
                cv: { ...validUpload, mimeType: "application/msword" },
            }).success,
        ).toBe(false);
        expect(
            savePersonaDto.safeParse({
                ...validPersona,
                cv: { ...validUpload, sizeBytes: MAX_PERSONA_CV_UPLOAD_SIZE_BYTES + 1 },
            }).success,
        ).toBe(false);
        expect(
            savePersonaDto.safeParse({
                ...validPersona,
                cv: { ...validUpload, sizeBytes: 0 },
            }).success,
        ).toBe(false);
        expect(
            savePersonaDto.safeParse({
                ...validPersona,
                cv: { kind: "existing", storagePath: validUpload.storagePath },
            }).success,
        ).toBe(false);
    });
});
