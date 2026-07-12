import { describe, expect, it } from "vitest";
import {
    extractNotationPersonaFeedback,
    extractNotationScore,
    mapNotationToEvaluation,
} from "./evaluation-notation.mapper";

describe("evaluation notation mapper", () => {
    it("maps the persona feedback key produced by the active output schema", () => {
        const evaluation = mapNotationToEvaluation({
            synthese: {
                avis_persona_IA: {
                    texte: "Cet avis appartient à cette session.",
                },
            },
        });

        expect(extractNotationPersonaFeedback({
            synthese: { avis_persona_IA: { texte: "Cet avis appartient à cette session." } },
        })).toBe("Cet avis appartient à cette session.");
        expect(evaluation.personaAvis).toBe("Cet avis appartient à cette session.");
    });

    it("maps key moments produced by the active synthese output schema", () => {
        const evaluation = mapNotationToEvaluation({
            synthese: {
                moments_cles: [
                    {
                        competences_associees: ["Reformulation"],
                        description: "Le besoin est reformulé avec précision.",
                        etape_code: "D",
                        etape_numero: 2,
                        etape_titre: "Découvrir",
                        extrait_transcript: [
                            {
                                speaker: "Apprenant",
                                timecode: "13:01:42",
                                verbatim: "Si je reformule, votre priorité est la rapidité.",
                            },
                        ],
                        impact_label: "Besoin clarifié, confiance renforcée",
                        impact_sur_objectif: "Le besoin est validé.",
                        perception_client: "Je me sens compris.",
                        pourquoi_moment_cle: "La reformulation valide la compréhension.",
                        reponse_alternative_recommandee: "Demander une validation explicite.",
                        role: "Apprenant",
                        timecode_debut: "13:01:42",
                        timecode_fin: "13:01:48",
                        titre: "Reformulation précise du besoin",
                        type_impact: "moment_cle_positif",
                    },
                ],
            },
        });

        expect(evaluation.momentsCles).toEqual([
            {
                clientPerception: "Je me sens compris.",
                competencies: ["Reformulation"],
                description: "Le besoin est reformulé avec précision.",
                id: "notation-key-moment-1",
                impact: "Besoin clarifié, confiance renforcée",
                impactOnObjective: "Le besoin est validé.",
                impactType: "moment_cle_positif",
                number: 1,
                reason: "La reformulation valide la compréhension.",
                recommendedResponse: "Demander une validation explicite.",
                role: "Apprenant",
                stepLabel: "Étape 2 : Découvrir",
                time: "01:42",
                title: "Reformulation précise du besoin",
                transcript: [
                    {
                        speaker: "Apprenant",
                        text: "Si je reformule, votre priorité est la rapidité.",
                        time: "01:42",
                    },
                ],
            },
        ]);
    });

    it("maps notation_json into the evaluation view", () => {
        const notation = {
            score_global: {
                detail_calcul: [
                    {
                        contribution: 5.74,
                        etape: "Accueillir",
                        poids: 0.07,
                        score_etape: 82,
                    },
                ],
                interpretation: "Interprétation globale",
                valeur: 72,
            },
            synthese: {
                appreciation_globale: { texte: "Bonne structure générale." },
                avis_persona_ia: { texte: "Je me suis senti écouté." },
                axes_amelioration: ["Accroche à rendre plus directe"],
                points_positifs: ["Bonne reformulation"],
                priorite_strategique: "Travailler l'ouverture.",
            },
            methodo: {
                etapes: [
                    {
                        commentaire_coach: "Ouverture correcte.",
                        criteres_a_ameliorer: ["Cibler plus vite l'enjeu"],
                        criteres_reussis: ["Présentation claire"],
                        grille_calcul: {
                            criteres: [
                                {
                                    code: "A1",
                                    conseils_amelioration: ["Rendre le motif plus concret"],
                                    justification_score: "Le critère est partiellement observable.",
                                    libelle: "Connexion professionnelle",
                                    preuves_attendues: "Salutation et création du lien.",
                                    preuves_observees: [
                                        {
                                            speaker: "Apprenant",
                                            texte: "Bonjour",
                                            timecode: "00:01-00:02",
                                        },
                                    ],
                                    score_max: 2,
                                    score_obtenu: 1,
                                    verbatim_preconise: ["Bonjour, merci pour votre temps."],
                                },
                            ],
                        },
                        numero: 1,
                        score: 82,
                        score_max: 100,
                        suggestions_reformulation: [
                            {
                                justification: "Plus orienté bénéfice.",
                                phrase_originale: "Je vous appelle pour présenter nos services.",
                                phrase_suggestion: "Je vous appelle pour vous aider à réduire vos délais de paiement.",
                            },
                        ],
                        titre: "Accueillir",
                        transcript_etape: [
                            {
                                speaker: "Apprenant",
                                texte: "Bonjour",
                                timecode: "00:01-00:02",
                            },
                        ],
                    },
                ],
            },
            discours: {
                clarte: {
                    commentaire: "Expression claire.",
                    score: 75,
                },
            },
        };

        const evaluation = mapNotationToEvaluation(notation, [
            {
                content: "Bonjour",
                role: "user",
                timestamp: "2026-06-30T10:15:30",
            },
            {
                content: "Bonjour, je vous écoute.",
                role: "assistant",
                timestamp: "2026-06-30T10:15:35",
            },
        ]);

        expect(extractNotationScore(notation)).toBe(72);
        expect(evaluation.coachAppreciation).toBe("Bonne structure générale.");
        expect(evaluation.personaAvis).toBe("Je me suis senti écouté.");
        expect(evaluation.pointsPositifs).toEqual(["Bonne reformulation"]);
        expect(evaluation.axesAmelioration).toEqual(["Accroche à rendre plus directe"]);
        expect(evaluation.steps[0]).toMatchObject({
            commentaireCoach: "Ouverture correcte.",
            criteresAAmeliorer: ["Cibler plus vite l'enjeu"],
            criteresReussis: ["Présentation claire"],
            number: 1,
            score: 82,
            status: "À maintenir",
            title: "Accueillir",
        });
        expect(evaluation.steps[0].criteria).toEqual([
            {
                analyse: "Le critère est partiellement observable.",
                competence: undefined,
                conseils: "Rendre le motif plus concret",
                critere: "Connexion professionnelle",
                points: "1/2",
                preuvesAttendues: "Salutation et création du lien.",
                preuvesObservees: [{ quote: "Bonjour", speaker: "Apprenant", time: "00:01-00:02" }],
                verbatim: "Bonjour, merci pour votre temps.",
            },
        ]);
        expect(evaluation.steps[0].stepTranscript).toEqual({
            end: "00:02",
            lines: [{ speaker: "you", text: "Bonjour" }],
            start: "00:01",
        });
        expect(evaluation.steps[0].reformulations).toEqual([
            {
                original: "Je vous appelle pour présenter nos services.",
                pourquoi: "Plus orienté bénéfice.",
                suggestion: "Je vous appelle pour vous aider à réduire vos délais de paiement.",
            },
        ]);
        expect(evaluation.scoreDetails).toEqual({
            rows: [
                {
                    contribution: 5.74,
                    poids: 7,
                    score: 82,
                    stepNumber: 1,
                    title: "Accueillir",
                },
            ],
            total: 72,
        });
        expect(evaluation.discourse[0]).toMatchObject({
            subtitle: "Expression claire.",
            title: "Clarte",
            value: "75%",
        });
        expect(evaluation.transcript).toEqual([
            { speaker: "you", text: "Bonjour", time: "10:15:30" },
            { speaker: "persona", text: "Bonjour, je vous écoute.", time: "10:15:35" },
        ]);
    });

    it("derives successful and improvement criteria from scored detailed criteria", () => {
        const evaluation = mapNotationToEvaluation({
            methodo: {
                etapes: [
                    {
                        commentaire_coach: "L'ouverture est factuelle.",
                        grille_calcul: {
                            criteres: [
                                {
                                    libelle: "Accès au décideur",
                                    score_max: 10,
                                    score_obtenu: 8,
                                },
                                {
                                    libelle: "Accroche personnalisée",
                                    score_max: 10,
                                    score_obtenu: 4,
                                },
                            ],
                        },
                        numero: 1,
                        score: 60,
                        titre: "Démarrer l'appel",
                    },
                ],
            },
        });

        expect(evaluation.steps[0].criteresReussis).toEqual(["Accès au décideur"]);
        expect(evaluation.steps[0].criteresAAmeliorer).toEqual(["Accroche personnalisée"]);
    });

    it("resolves criterion codes in step summaries to their detailed labels", () => {
        const evaluation = mapNotationToEvaluation({
            methodo: {
                etapes: [
                    {
                        criteres_a_ameliorer: ["A1", "A2", "Point libre"],
                        criteres_reussis: ["A3"],
                        grille_calcul: {
                            criteres: [
                                {
                                    code: "A1",
                                    libelle: "Présentation claire",
                                    score_max: 5,
                                    score_obtenu: 0,
                                },
                                {
                                    code: "A2",
                                    libelle: "Validation de la disponibilité",
                                    score_max: 2,
                                    score_obtenu: 0,
                                },
                                {
                                    code: "A3",
                                    libelle: "Accroche contextualisée",
                                    score_max: 8,
                                    score_obtenu: 8,
                                },
                            ],
                        },
                        numero: 2,
                        score: 17,
                        titre: "Accrocher",
                    },
                ],
            },
        });

        expect(evaluation.steps[0].criteresAAmeliorer).toEqual([
            "Présentation claire",
            "Validation de la disponibilité",
            "Point libre",
        ]);
        expect(evaluation.steps[0].criteresReussis).toEqual(["Accroche contextualisée"]);
    });

    it("maps the progress plan array entry for the weakest step", () => {
        const evaluation = mapNotationToEvaluation({
            synthese: {
                plan_de_progres: [
                    {
                        etape_numero: 1,
                        etape_titre: "D - Démarrer l'appel",
                        texte: "Plan IA de l'étape 1.",
                    },
                    {
                        etape_numero: 2,
                        etape_titre: "A - Accrocher",
                        texte: "Personnalisez l'accroche.",
                    },
                    {
                        etape_numero: 4,
                        etape_titre: "O - Obtenir le rendez-vous",
                        texte: "Formulez des propositions de rendez-vous précises.",
                    },
                ],
            },
            methodo: {
                etapes: [
                    {
                        numero: 1,
                        score: 80,
                        titre: "D - Démarrer l'appel",
                    },
                    {
                        numero: 2,
                        score: 34,
                        titre: "A - Accrocher",
                    },
                    {
                        criteres: [
                            {
                                conseil: "Conseil fallback du critère.",
                                libelle: "Sécuriser le next step",
                                score_max: 10,
                                score_obtenu: 0,
                            },
                        ],
                        numero: 4,
                        score: 6.67,
                        titre: "O - Obtenir le rendez-vous",
                    },
                ],
            },
        });

        expect(evaluation.planEtape).toEqual({
            number: 4,
            text: "Formulez des propositions de rendez-vous précises.",
            title: "O - Obtenir le rendez-vous",
        });
        expect(evaluation.planEtapes).toEqual([
            {
                number: 4,
                text: "Formulez des propositions de rendez-vous précises.",
                title: "O - Obtenir le rendez-vous",
            },
            {
                number: 2,
                text: "Personnalisez l'accroche.",
                title: "A - Accrocher",
            },
            {
                number: 1,
                text: "Plan IA de l'étape 1.",
                title: "D - Démarrer l'appel",
            },
        ]);
    });

    it("keeps fallback content when notation_json is missing but maps session messages", () => {
        const evaluation = mapNotationToEvaluation(null, [
            {
                content: "Message sauvegardé",
                role: "user",
                timestamp: "invalid-date",
            },
        ]);

        expect(evaluation.coachAppreciation).toContain("L'appel démontre");
        expect(evaluation.transcript).toEqual([
            { speaker: "you", text: "Message sauvegardé", time: "invalid-date" },
        ]);
    });
});
