import { describe, expect, it } from "vitest";
import { METHOD_SCOPE } from "@/features/methods/domain/method";
import { validateMethodFormPayload } from "./method-form-validation";

const validInput = {
    name: "Méthode DAGO",
    steps: [{ title: "Découvrir le besoin" }],
};

describe("validateMethodFormPayload", () => {
    it("explains when the method name is missing", () => {
        expect(validateMethodFormPayload({ ...validInput, name: "" })).toEqual({
            message: "Le nom de la méthode est requis.",
            success: false,
        });
    });

    it("deduplicates the reason when several step titles are missing", () => {
        expect(
            validateMethodFormPayload({
                ...validInput,
                steps: [{ title: "" }, { title: "" }],
            }),
        ).toEqual({
            message: "Le titre de chaque étape est requis.",
            success: false,
        });
    });

    it("explains that a private method needs an organization", () => {
        expect(
            validateMethodFormPayload({
                ...validInput,
                organizationId: null,
                scope: METHOD_SCOPE.organization,
            }),
        ).toEqual({
            message: "Une méthode privée doit être liée à une organisation.",
            success: false,
        });
    });

    it("returns the normalized payload when the form can be saved", () => {
        const result = validateMethodFormPayload(validInput);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.name).toBe("Méthode DAGO");
            expect(result.data.steps[0].title).toBe("Découvrir le besoin");
        }
    });
});
