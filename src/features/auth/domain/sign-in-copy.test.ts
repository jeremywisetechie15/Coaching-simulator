import { describe, expect, it } from "vitest";
import { SIGN_IN_COPY } from "./sign-in-copy";

describe("SIGN_IN_COPY", () => {
    it("centralise une interface de connexion entièrement en français", () => {
        expect(SIGN_IN_COPY).toEqual({
            description: "Connectez-vous pour poursuivre votre formation",
            emailPlaceholder: "vous@exemple.com",
            loadingLabel: "Connexion en cours...",
            metadataTitle: "Connexion | MaiaCoach",
            submitLabel: "Se connecter",
            title: "Bon retour parmi nous",
        });
    });
});
