import { describe, expect, it } from "vitest";
import {
    composeRoleplayPersonaSimulationInstructions,
    SCENARIO_GLOBAL_PROMPT_TITLE,
} from "./scenario-ai-context";

describe("scenario AI context", () => {
    it("uses the single global prompt title", () => {
        expect(SCENARIO_GLOBAL_PROMPT_TITLE).toBe("prompt.scenario.global");
    });

    it("preserves the existing persona prompt and prepends each scenario rule once", () => {
        const result = composeRoleplayPersonaSimulationInstructions(
            "INSTRUCTIONS SYSTÈME DU PERSONA:\nReste factuel.\n\nCONTEXTE DYNAMIQUE:\n{\"title\":\"Test\"}",
            {
                globalPrompt: "Règle globale unique.",
                scenarioInstructions: "Révèle l'objection seulement après une question ouverte.",
            },
        );

        expect(result).toContain("INSTRUCTIONS SYSTÈME DU PERSONA:");
        expect(result).toContain("CONTEXTE DYNAMIQUE:");
        expect(result.match(/Règle globale unique\./g)).toHaveLength(1);
        expect(result.match(/Révèle l'objection seulement après une question ouverte\./g)).toHaveLength(1);
        expect(result.indexOf("RÈGLES IA GLOBALES")).toBeLessThan(
            result.indexOf("INSTRUCTIONS IA SPÉCIFIQUES"),
        );
        expect(result.indexOf("INSTRUCTIONS IA SPÉCIFIQUES")).toBeLessThan(
            result.indexOf("INSTRUCTIONS SYSTÈME DU PERSONA"),
        );
    });

    it("omits the scenario-specific block when no instructions are configured", () => {
        const result = composeRoleplayPersonaSimulationInstructions("Prompt persona", {
            globalPrompt: "Règles globales",
            scenarioInstructions: "",
        });

        expect(result).not.toContain("INSTRUCTIONS IA SPÉCIFIQUES AU SCÉNARIO");
        expect(result).toContain("Prompt persona");
    });
});
