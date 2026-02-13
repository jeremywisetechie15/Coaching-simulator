import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// --- HEADERS CORS ---
function setCorsHeaders(response: NextResponse) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
}

export async function OPTIONS() {
    return setCorsHeaders(NextResponse.json({}, { status: 200 }));
}

// Les 4 tabs de notation
const NOTATION_TABS = ['synthese', 'methodo', 'discours', 'transcription'] as const;
type NotationTab = typeof NOTATION_TABS[number];

// Types pour le calcul de score global
type DagoCode = "D" | "A" | "G" | "O";

type MethodoEtape = {
    numero?: number;
    code?: DagoCode;
    titre: string;
    score: number; // 0..100
    score_max?: number; // 100
    poids?: number;
    contribution_score_global?: number;
    timecode_start?: string;
    timecode_end?: string;
    criteres_reussis?: string[];
    criteres_a_ameliorer?: string[];
    commentaire_coach?: string;
    messages_ids?: number[];
};

type NotationPayload = {
    score_global?: Record<string, unknown>;
    synthese?: Record<string, unknown>;
    methodo?: { etapes?: MethodoEtape[];[k: string]: unknown };
    discours?: Record<string, unknown>;
    transcription?: Record<string, unknown>;
};

const SCORE_WEIGHTS = {
    demarrer_passer_barrage: 0.20,
    accrocher: 0.30,
    gerer_objections: 0.25,
    obtenir_rendez_vous: 0.25,
} as const;

// --- Fonctions utilitaires pour le calcul de score ---
function clamp0_100(n: number) {
    if (typeof n !== "number" || Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(100, n));
}

function round2(n: number) {
    return Math.round(n * 100) / 100;
}

function roundToStep(n: number, step: 1 | 5 = 5) {
    return Math.round(n / step) * step;
}

function niveauPerformance(score: number) {
    if (score <= 40) return "faible";
    if (score <= 65) return "moyen";
    if (score <= 85) return "bon";
    return "excellent";
}

function buildInterpretation(detail: Array<{ code: DagoCode; score_etape: number; poids: number }>) {
    const poidsManquants = detail.filter(d => d.score_etape === 0).reduce((acc, d) => acc + d.poids, 0);
    const poidsManquantsPct = Math.round(poidsManquants * 100);

    const d = detail.find(x => x.code === "D")?.score_etape ?? 0;
    const a = detail.find(x => x.code === "A")?.score_etape ?? 0;
    const g = detail.find(x => x.code === "G")?.score_etape ?? 0;
    const o = detail.find(x => x.code === "O")?.score_etape ?? 0;

    const lacunes: string[] = [];
    if (a === 0) lacunes.push("la phase d'accroche (0%)");
    if (o === 0) lacunes.push("l'obtention du rendez-vous (0%)");
    const lacunesTxt = lacunes.length ? lacunes.join(" et ") : "certaines étapes clés";

    return `L'appel présente des lacunes importantes dans ${lacunesTxt}, qui pèsent lourdement sur le score global (${poidsManquantsPct}% du poids total). Malgré un démarrage (${d}%) et une gestion des objections (${g}%), l'absence d'accroche et/ou de closing structuré limite fortement l'efficacité commerciale.`;
}

function getScoreFromEtapes(etapes: MethodoEtape[], code: DagoCode): number {
    const byCode = etapes.find(e => e.code === code);
    if (byCode) return clamp0_100(byCode.score);

    const prefix = code === "D" ? 1 : code === "A" ? 2 : code === "G" ? 3 : 4;
    const byPrefix = etapes.find(e => new RegExp(`^\\s*${prefix}\\s*[—-]`).test(e.titre));
    return clamp0_100(byPrefix?.score ?? 0);
}

function injectScoreGlobal(notation: NotationPayload, roundStep: 1 | 5 = 5) {
    const etapes = notation.methodo?.etapes ?? [];
    if (!Array.isArray(etapes) || etapes.length === 0) return notation;

    const scoreD = getScoreFromEtapes(etapes, "D");
    const scoreA = getScoreFromEtapes(etapes, "A");
    const scoreG = getScoreFromEtapes(etapes, "G");
    const scoreO = getScoreFromEtapes(etapes, "O");

    const detail_calcul = [
        { etape: "Démarrer et passer le barrage", code: "D" as const, score_etape: scoreD, poids: SCORE_WEIGHTS.demarrer_passer_barrage, contribution: round2(scoreD * SCORE_WEIGHTS.demarrer_passer_barrage) },
        { etape: "Accrocher", code: "A" as const, score_etape: scoreA, poids: SCORE_WEIGHTS.accrocher, contribution: round2(scoreA * SCORE_WEIGHTS.accrocher) },
        { etape: "Gérer les objections", code: "G" as const, score_etape: scoreG, poids: SCORE_WEIGHTS.gerer_objections, contribution: round2(scoreG * SCORE_WEIGHTS.gerer_objections) },
        { etape: "Obtenir le rendez-vous", code: "O" as const, score_etape: scoreO, poids: SCORE_WEIGHTS.obtenir_rendez_vous, contribution: round2(scoreO * SCORE_WEIGHTS.obtenir_rendez_vous) }
    ];

    const rawGlobal = detail_calcul.reduce((acc, d) => acc + d.contribution, 0);
    const global = roundToStep(rawGlobal, roundStep);

    // Injecter poids + contribution sur chaque étape methodo
    for (const e of etapes) {
        const inferred: DagoCode | undefined =
            e.code ??
            (/^\s*1\s*[—-]/.test(e.titre) ? "D" :
                /^\s*2\s*[—-]/.test(e.titre) ? "A" :
                    /^\s*3\s*[—-]/.test(e.titre) ? "G" :
                        /^\s*4\s*[—-]/.test(e.titre) ? "O" : undefined);

        if (!inferred) continue;
        e.code = inferred;
        e.score = clamp0_100(e.score);
        e.score_max = 100;

        const poids =
            inferred === "D" ? SCORE_WEIGHTS.demarrer_passer_barrage :
                inferred === "A" ? SCORE_WEIGHTS.accrocher :
                    inferred === "G" ? SCORE_WEIGHTS.gerer_objections :
                        SCORE_WEIGHTS.obtenir_rendez_vous;

        e.poids = poids;
        e.contribution_score_global = round2(e.score * poids);
    }

    notation.score_global = {
        valeur: global,
        unite: "score_sur_100",
        methode_calcul: "moyenne_ponderee_etapes_methodologiques",
        "pondérations": { ...SCORE_WEIGHTS },
        detail_calcul,
        score_process: global,
        score_execution_discours: null,
        interpretation: buildInterpretation(detail_calcul.map(d => ({ code: d.code, score_etape: d.score_etape, poids: d.poids }))),
        niveau_performance: niveauPerformance(global),
        seuils: {
            faible: "0-40",
            moyen: "41-65",
            bon: "66-85",
            excellent: "86-100"
        },
        regles_exclusion: ["SyntheseGlobale", "AvisPersonaIA", "AnalyseDiscours", "Transcription"]
    };

    return notation;
}

// =============================================
// POST /api/notation
// Body: { session_id } ou { scenario_id }
// Génère les 4 notations et les sauvegarde
// =============================================
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { session_id, scenario_id } = body;

        if (!session_id && !scenario_id) {
            return setCorsHeaders(
                NextResponse.json({ error: "session_id ou scenario_id requis" }, { status: 400 })
            );
        }

        // Créer un client Supabase
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return setCorsHeaders(
                NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 })
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. RÉSOUDRE LA SESSION ET RÉCUPÉRER LE SCÉNARIO
        let effectiveSessionId = session_id;
        let scenarioTitle = "";
        let scenarioDescription = "";

        if (!effectiveSessionId && scenario_id) {
            // Cas: scenario_id fourni, on cherche la dernière session
            const { data: latestSession, error: sessionError } = await supabase
                .from('sessions')
                .select('id, scenarios(title, description)')
                .eq('scenario_id', scenario_id)
                .eq('status', 'completed')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (sessionError || !latestSession) {
                return setCorsHeaders(
                    NextResponse.json({ error: "Aucune session complétée trouvée pour ce scénario" }, { status: 404 })
                );
            }
            effectiveSessionId = latestSession.id;
            const scenario = latestSession.scenarios as unknown as { title: string; description: string | null } | null;
            scenarioTitle = scenario?.title || "";
            scenarioDescription = scenario?.description || "";
        } else {
            // Cas: session_id fourni, on récupère le scénario
            const { data: sessionData, error: sessionError } = await supabase
                .from('sessions')
                .select('scenarios(title, description)')
                .eq('id', effectiveSessionId)
                .single();

            if (!sessionError && sessionData) {
                const scenario = sessionData.scenarios as unknown as { title: string; description: string | null } | null;
                scenarioTitle = scenario?.title || "";
                scenarioDescription = scenario?.description || "";
            }
        }

        console.log("📊 Notation API - Processing session:", effectiveSessionId);
        console.log("📊 Scenario:", scenarioTitle);
        console.log("📊 Scenario description:", scenarioDescription);

        // 2. RÉCUPÉRER LE TRANSCRIPT DEPUIS LA TABLE MESSAGES
        const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('role, content, timestamp')
            .eq('session_id', effectiveSessionId)
            .order('timestamp', { ascending: true });

        if (messagesError || !messages || messages.length === 0) {
            return setCorsHeaders(
                NextResponse.json({ error: "Aucun message trouvé pour cette session" }, { status: 404 })
            );
        }

        const transcript = messages
            .map(m => {
                const time = new Date(m.timestamp).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
                return `[${time}] ${m.role === "user" ? "Utilisateur" : "Persona"}: ${m.content}`;
            })
            .join("\n");

        console.log("📊 Transcript built, length:", transcript.length, "characters");
        console.log("📊 Transcript:", transcript);

        // 3. TÉLÉCHARGER LE PDF (une seule fois)
        const pdfPath = "criteres_v1.pdf";

        console.log("📊 Fetching PDF from Supabase:", pdfPath);

        const { data: pdfData, error: pdfError } = await supabase
            .storage
            .from('notation_pdf')
            .download(pdfPath);

        if (pdfError || !pdfData) {
            console.error("❌ Erreur téléchargement PDF:", pdfError);
            return setCorsHeaders(
                NextResponse.json({
                    error: "PDF de notation non trouvé dans Supabase",
                    details: pdfError?.message
                }, { status: 404 })
            );
        }

        // Convertir le Blob en base64
        const arrayBuffer = await pdfData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Pdf = buffer.toString('base64');

        console.log("📊 PDF loaded, size:", buffer.length, "bytes");

        // 4. RÉCUPÉRER TOUS LES PROMPTS DE LA TABLE prompts
        const { data: prompts, error: promptsError } = await supabase
            .from('prompts')
            .select('title, prompt')
            .in('title', NOTATION_TABS.map(tab => `notation.${tab}`));

        if (promptsError || !prompts || prompts.length === 0) {
            return setCorsHeaders(
                NextResponse.json({ error: "Prompts de notation non trouvés dans la base" }, { status: 404 })
            );
        }

        // Créer un map title -> prompt
        const promptsMap = new Map<string, string>();
        prompts.forEach(p => {
            promptsMap.set(p.title, p.prompt);
        });

        console.log("📊 Loaded prompts:", Array.from(promptsMap.keys()));

        // 5. APPELER OPENAI POUR CHAQUE TAB (en parallèle)
        const callOpenAI = async (tab: NotationTab): Promise<{ tab: NotationTab; result: Record<string, unknown> | null; error?: string }> => {
            const promptText = promptsMap.get(`notation.${tab}`);

            if (!promptText) {
                console.error(`❌ Prompt non trouvé pour notation.${tab}`);
                return { tab, result: null, error: `Prompt non trouvé pour ${tab}` };
            }

            try {
                const response = await fetch("https://api.openai.com/v1/responses", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                    },
                    body: JSON.stringify({
                        model: "gpt-4.1",
                        instructions: promptText,
                        input: [
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "input_file",
                                        filename: "criteres_notation.pdf",
                                        file_data: `data:application/pdf;base64,${base64Pdf}`
                                    },
                                    {
                                        type: "input_text",
                                        text: `CONTEXTE DU SCÉNARIO:
- Titre: ${scenarioTitle}
- Description: ${scenarioDescription || "Non disponible"}

TRANSCRIPTION DE L'APPEL:
---
${transcript}
---

Analyse cet appel et réponds uniquement avec un JSON valide.`
                                    }
                                ]
                            }
                        ]
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error(`❌ Erreur OpenAI pour ${tab}:`, errorData);
                    return { tab, result: null, error: errorData.error?.message || "Erreur API OpenAI" };
                }

                const data = await response.json();

                // Parsing de la réponse
                let content = "";
                if (data.output && data.output[0]?.content) {
                    const contentItem = data.output[0].content.find((c: { type: string }) => c.type === "output_text");
                    content = contentItem?.text || "";
                } else if (data.choices) {
                    content = data.choices[0].message.content;
                }

                // Nettoyage du JSON
                const jsonStr = content.replace(/```json\s*|```\s*/g, '').trim();

                try {
                    const resultJson = JSON.parse(jsonStr);
                    console.log(`✅ ${tab} - Notation calculée`);
                    return { tab, result: resultJson };
                } catch (parseError) {
                    console.error(`❌ Erreur parsing JSON pour ${tab}:`, parseError);
                    return { tab, result: null, error: "Format de réponse invalide" };
                }

            } catch (error) {
                console.error(`❌ Erreur appel OpenAI pour ${tab}:`, error);
                return { tab, result: null, error: error instanceof Error ? error.message : "Erreur inconnue" };
            }
        };

        // Lancer les 4 appels en parallèle
        console.log("📊 Calling OpenAI for all 4 tabs in parallel...");
        const results = await Promise.all(NOTATION_TABS.map(tab => callOpenAI(tab)));

        // 6. CONSTRUIRE LE JSON GLOBAL
        const notation: NotationPayload = {};
        const errors: string[] = [];

        results.forEach(({ tab, result, error }) => {
            if (result) {
                notation[tab] = result;
            } else if (error) {
                errors.push(`${tab}: ${error}`);
            }
        });

        // ✅ Injecter score_global + contributions D/A/G/O (backend)
        injectScoreGlobal(notation, 5);

        console.log("📊 Notation global built:", Object.keys(notation));

        // 7. SAUVEGARDER EN DB
        if (Object.keys(notation).length > 0) {
            console.log("📊 Saving notation to session:", effectiveSessionId);

            const { error: updateError } = await supabase
                .from('sessions')
                .update({ notation_json: notation })
                .eq('id', effectiveSessionId);

            if (updateError) {
                console.error("❌ Erreur sauvegarde notation:", updateError);
                return setCorsHeaders(
                    NextResponse.json({ error: "Erreur sauvegarde en base", details: updateError.message }, { status: 500 })
                );
            }

            console.log("✅ Notation saved to session");
        }

        // 8. RÉPONSE
        return setCorsHeaders(NextResponse.json({
            success: true,
            session_id: effectiveSessionId,
            tabs_processed: Object.keys(notation),
            errors: errors.length > 0 ? errors : undefined,
            notation
        }));

    } catch (error) {
        console.error("❌ Erreur Serveur:", error);
        return setCorsHeaders(
            NextResponse.json({
                error: "Erreur interne du serveur",
                details: error instanceof Error ? error.message : "Unknown error"
            }, { status: 500 })
        );
    }
}

// =============================================
// GET /api/notation?scenario_id=XXX
// Retourne le notation_json de la dernière session du scénario
// =============================================
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const scenarioId = searchParams.get('scenario_id');

        if (!scenarioId) {
            return setCorsHeaders(
                NextResponse.json({ error: "scenario_id requis" }, { status: 400 })
            );
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return setCorsHeaders(
                NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 })
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Récupérer la dernière session complétée du scénario avec le persona
        const { data: session, error } = await supabase
            .from('sessions')
            .select(`
                id, 
                scenario_id, 
                notation_json, 
                created_at, 
                duration_seconds,
                scenarios(
                    title, 
                    description,
                    difficulty_level,
                    personas(name, role, company)
                )
            `)
            .eq('scenario_id', scenarioId)
            .eq('status', 'completed')
            .not('notation_json', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !session) {
            return setCorsHeaders(
                NextResponse.json({
                    error: "Aucune session avec notation trouvée pour ce scénario",
                    scenario_id: scenarioId
                }, { status: 404 })
            );
        }

        // Récupérer les messages pour calculer start_time et end_time
        const { data: messages } = await supabase
            .from('messages')
            .select('timestamp')
            .eq('session_id', session.id)
            .order('timestamp', { ascending: true });

        // Calcul des horaires de l'appel
        let startTime = "";
        let endTime = "";

        if (messages && messages.length > 0) {
            const firstMessage = new Date(messages[0].timestamp);
            const lastMessage = new Date(messages[messages.length - 1].timestamp);

            startTime = firstMessage.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            endTime = lastMessage.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }

        // Formatage de la durée
        const durationSeconds = session.duration_seconds || 0;
        const minutes = Math.floor(durationSeconds / 60);
        const seconds = durationSeconds % 60;
        const durationFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // Extraction des données du scénario et persona
        const scenario = session.scenarios as unknown as {
            title: string;
            description: string | null;
            difficulty_level: string | null;
            personas: { name: string; role: string | null; company: string | null } | null;
        } | null;

        const persona = scenario?.personas;

        return setCorsHeaders(NextResponse.json({
            success: true,
            session_id: session.id,
            scenario_id: session.scenario_id,
            scenario_title: scenario?.title || null,
            created_at: session.created_at,
            call_metadata: {
                start_time: startTime,
                end_time: endTime,
                duration_seconds: durationSeconds,
                duration_formatted: durationFormatted,
                persona_name: persona?.name || null,
                persona_role: persona?.role || null,
                persona_company: persona?.company || null,
                difficulty_level: scenario?.difficulty_level || null
            },
            notation: session.notation_json
        }));

    } catch (error) {
        console.error("❌ Erreur GET notation:", error);
        return setCorsHeaders(
            NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
        );
    }
}
