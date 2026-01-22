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

// Interface pour le résultat global
interface NotationGlobal {
    synthese?: Record<string, unknown>;
    methodo?: Record<string, unknown>;
    discours?: Record<string, unknown>;
    transcription?: Record<string, unknown>;
}

type MethodoEtape = {
    titre: string;
    score: number; // 0..100
};

function addGlobalScoreToSynthese(json: NotationGlobal) {
    const MAX_POINTS = { D: 20, A: 35, G: 25, O: 20 } as const;

    const methodo = json.methodo as unknown as { etapes?: MethodoEtape[] } | undefined;
    const etapes = methodo?.etapes ?? [];

    if (!Array.isArray(etapes) || etapes.length === 0) return json;

    const getPctByPrefix = (prefix: 1 | 2 | 3 | 4): number => {
        const e = etapes.find((x) => new RegExp(`^\\s*${prefix}\\s*[—-]`).test(x.titre));
        const v = e?.score;
        if (typeof v !== "number" || Number.isNaN(v)) return 0;
        return Math.max(0, Math.min(100, v));
    };

    const roundToHalf = (x: number) => Math.round(x * 2) / 2;

    const pointsD = roundToHalf((getPctByPrefix(1) / 100) * MAX_POINTS.D);
    const pointsA = roundToHalf((getPctByPrefix(2) / 100) * MAX_POINTS.A);
    const pointsG = roundToHalf((getPctByPrefix(3) / 100) * MAX_POINTS.G);
    const pointsO = roundToHalf((getPctByPrefix(4) / 100) * MAX_POINTS.O);

    const globalPoints = roundToHalf(pointsD + pointsA + pointsG + pointsO); // 0..100

    json.synthese = json.synthese ?? { onglet: "SyntheseGlobale" };
    // Champ demandé (sur 100)
    json.synthese.notation_globale = globalPoints;

    return json;
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
                        model: "gpt-4o",
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
        const notationGlobal: NotationGlobal = {};
        const errors: string[] = [];

        results.forEach(({ tab, result, error }) => {
            if (result) {
                notationGlobal[tab] = result;
            } else if (error) {
                errors.push(`${tab}: ${error}`);
            }
        });

        addGlobalScoreToSynthese(notationGlobal);

        console.log("📊 Notation global built:", Object.keys(notationGlobal));

        // 7. SAUVEGARDER EN DB
        if (Object.keys(notationGlobal).length > 0) {
            console.log("📊 Saving notation to session:", effectiveSessionId);

            const { error: updateError } = await supabase
                .from('sessions')
                .update({ notation_json: notationGlobal })
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
            tabs_processed: Object.keys(notationGlobal),
            errors: errors.length > 0 ? errors : undefined,
            notation: notationGlobal
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

        // Récupérer la dernière session complétée du scénario
        const { data: session, error } = await supabase
            .from('sessions')
            .select('id, scenario_id, notation_json, created_at, scenarios(title)')
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

        const scenario = session.scenarios as unknown as { title: string } | null;

        return setCorsHeaders(NextResponse.json({
            success: true,
            session_id: session.id,
            scenario_id: session.scenario_id,
            scenario_title: scenario?.title || null,
            created_at: session.created_at,
            notation: session.notation_json
        }));

    } catch (error) {
        console.error("❌ Erreur GET notation:", error);
        return setCorsHeaders(
            NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
        );
    }
}
