import { describe, expect, it } from "vitest";
import { buildGlobalCoachEvaluationContext } from "./build-global-coach-evaluation-context";

describe("buildGlobalCoachEvaluationContext", () => {
    it("keeps one compact copy of the useful evaluation data", () => {
        const context = buildGlobalCoachEvaluationContext({
            score_global: {
                detail_calcul: [{ etape: "Découvrir", contribution: 74 }],
                score_process: 74,
                valeur: 74,
            },
            synthese: {
                appreciation_globale: {
                    description: "Description longue qui ne doit pas être dupliquée.",
                    texte: "Une session structurée.",
                },
                axes_amelioration: [{
                    description: "Détail secondaire de l'axe.",
                    texte: "Préciser l'accroche",
                }],
                avis_persona_IA: {
                    texte: "Avis persona non nécessaire au coach.",
                },
                moments_cles: [{
                    extrait_transcript: [{
                        speaker: "Apprenant",
                        timecode: "00:12",
                        verbatim: "Transcript déjà transmis séparément.",
                    }],
                    impact_sur_objectif: "Le besoin reste imprécis.",
                    pourquoi_moment_cle: "La question arrive trop tard.",
                    reponse_alternative_recommandee: "Quel est votre enjeu principal ?",
                    timecode_debut: "00:12",
                    titre: "Qualification tardive",
                    type_impact: "opportunite_manquee",
                }],
                plan_de_progres: [{
                    description: "Détail secondaire du plan.",
                    etape_titre: "Découvrir",
                    texte: "Préparer une accroche ciblée",
                }],
                points_positifs: [{
                    description: "Détail secondaire du point fort.",
                    texte: "Bonne écoute",
                }],
                priorite_strategique: {
                    description: "Détail secondaire de la priorité.",
                    texte: "Clarifier l'objectif dès l'ouverture.",
                },
            },
        });

        expect(context).toEqual({
            appreciationGlobale: "Une session structurée.",
            axesAmelioration: ["Préciser l'accroche"],
            momentsCles: [{
                impact: "Le besoin reste imprécis.",
                reason: "La question arrive trop tard.",
                recommendedResponse: "Quel est votre enjeu principal ?",
                timecode: "00:12",
                title: "Qualification tardive",
                type: "opportunite_manquee",
            }],
            planDeProgres: [{
                action: "Préparer une accroche ciblée",
                step: "Découvrir",
            }],
            pointsPositifs: ["Bonne écoute"],
            prioriteStrategique: "Clarifier l'objectif dès l'ouverture.",
            scoreGlobal: 74,
        });
        expect(JSON.stringify(context)).not.toContain("Transcript déjà transmis séparément.");
        expect(JSON.stringify(context)).not.toContain("Avis persona non nécessaire au coach.");
        expect(JSON.stringify(context)).not.toContain("detail_calcul");
        expect(JSON.stringify(context).match(/Une session structurée\./g)).toHaveLength(1);
    });

    it("normalizes legacy aliases without inventing fallback data", () => {
        expect(buildGlobalCoachEvaluationContext({
            score: 62,
            synthese: {
                axes_d_amelioration: ["Approfondir le besoin"],
                coach_appreciation: "Progression visible.",
                forces: ["Bonne posture"],
                plan_action: ["Préparer deux questions ouvertes"],
                recommandation_prioritaire: "Questionner avant d'argumenter",
            },
        })).toEqual({
            appreciationGlobale: "Progression visible.",
            axesAmelioration: ["Approfondir le besoin"],
            momentsCles: [],
            planDeProgres: [{ action: "Préparer deux questions ouvertes" }],
            pointsPositifs: ["Bonne posture"],
            prioriteStrategique: "Questionner avant d'argumenter",
            scoreGlobal: 62,
        });

        expect(buildGlobalCoachEvaluationContext(null)).toEqual({
            appreciationGlobale: null,
            axesAmelioration: [],
            momentsCles: [],
            planDeProgres: [],
            pointsPositifs: [],
            prioriteStrategique: null,
            scoreGlobal: null,
        });
    });
});
