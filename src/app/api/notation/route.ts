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
type OpenAITabResult = { tab: NotationTab; result: Record<string, unknown> | null; error?: string };

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const NOTATION_MODEL = "gpt-5.2";
const NOTATION_REASONING_EFFORT = "high";
const NOTATION_GENERATION_MODE = process.env.NOTATION_GENERATION_MODE === "parallel" ? "parallel" : "single";

// Types pour le calcul de score global
type MethodoCode = "A" | "C" | "D";
type MethodoStepKey = "accueillir" | "cadrer" | "decouvrir" | "confirmer";

type MethodoEtape = {
    numero?: number;
    code?: MethodoCode | string;
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

const METHOD_STEPS: Array<{
    key: MethodoStepKey;
    code: MethodoCode;
    etape: string;
    poids: number;
    numero: number;
    aliases: string[];
}> = [
        { key: "accueillir", code: "A", etape: "Accueillir", poids: 0.07, numero: 1, aliases: ["accueillir", "accueil"] },
        { key: "cadrer", code: "C", etape: "Cadrer", poids: 0.08, numero: 2, aliases: ["cadrer", "cadrage"] },
        { key: "decouvrir", code: "D", etape: "Découvrir", poids: 0.70, numero: 3, aliases: ["decouvrir", "decouverte"] },
        { key: "confirmer", code: "C", etape: "Confirmer", poids: 0.15, numero: 4, aliases: ["confirmer", "confirmation"] },
    ];

const SCORE_WEIGHTS = {
    accueillir: 0.07,
    cadrer: 0.08,
    decouvrir: 0.70,
    confirmer: 0.15,
} as const;

// Ancienne méthode DAGO conservée en référence si besoin de la réactiver :
// const DAGO_METHOD_STEPS = [
//     { key: "demarrer_passer_barrage", code: "D", etape: "Démarrer et passer le barrage", poids: 0.20 },
//     { key: "accrocher", code: "A", etape: "Accrocher", poids: 0.30 },
//     { key: "gerer_objections", code: "G", etape: "Gérer les objections", poids: 0.25 },
//     { key: "obtenir_rendez_vous", code: "O", etape: "Obtenir le rendez-vous", poids: 0.25 },
// ] as const;

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

function normalizeText(text: string) {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function titleHasStepPrefix(title: string, numero: number) {
    return new RegExp(`^\\s*${numero}\\s*[.)\\-—:]`).test(title);
}

function inferStepFromEtape(etape: MethodoEtape, index?: number) {
    const normalizedTitle = normalizeText(etape.titre || "");

    const byNumberOrTitle = METHOD_STEPS.find(step =>
        etape.numero === step.numero ||
        titleHasStepPrefix(etape.titre || "", step.numero) ||
        step.aliases.some(alias => normalizedTitle.includes(alias))
    );

    if (byNumberOrTitle) return byNumberOrTitle;

    if (typeof index === "number" && METHOD_STEPS[index]) {
        return METHOD_STEPS[index];
    }

    return METHOD_STEPS.find(step => step.code === etape.code && step.code !== "C");
}

function getScoreFromEtapes(etapes: MethodoEtape[], key: MethodoStepKey): number {
    const step = METHOD_STEPS.find(item => item.key === key);
    if (!step) return 0;

    const byStep = etapes.find((etape, index) => inferStepFromEtape(etape, index)?.key === key);
    return clamp0_100(byStep?.score ?? 0);
}

function buildInterpretation(
    detail: Array<{ etape: string; score_etape: number }>,
    global: number
) {
    const niveau = niveauPerformance(global);
    const strengths = detail.filter(d => d.score_etape >= 80);
    const weaknesses = detail.filter(d => d.score_etape < 66);

    const formatList = (items: Array<{ etape: string; score_etape: number }>) =>
        items.map(item => `${item.etape.toLowerCase()} (${item.score_etape}%)`).join(" et ");

    if (strengths.length > 0 && weaknesses.length > 0) {
        return `L'entretien présente une performance globalement ${niveau} grâce à ${formatList(strengths)}. En revanche, ${formatList(weaknesses)} fragilisent l'échange : la relation, le cadre, le diagnostic ou la validation finale ne sont pas suffisamment posés. La performance reste portée par les étapes les mieux maîtrisées, mais gagnerait en impact avec une conduite plus homogène sur l'ensemble de la méthode.`;
    }

    if (strengths.length > 0) {
        return `L'entretien présente une performance globalement ${niveau}, portée par ${formatList(strengths)}. Les étapes méthodologiques sont suffisamment structurées pour soutenir l'efficacité de l'échange, avec des marges de progression ciblées sur les points les moins notés.`;
    }

    if (weaknesses.length > 0) {
        return `L'entretien présente une performance globalement ${niveau}. Les fragilités se concentrent sur ${formatList(weaknesses)}, ce qui limite l'impact commercial de l'échange et appelle une structuration plus claire de la méthode.`;
    }

    return `L'entretien présente une performance globalement ${niveau}. Les quatre étapes de la méthode sont exécutées de manière équilibrée, sans rupture majeure dans la conduite de l'échange.`;
}

function extractOpenAIResponseText(data: unknown) {
    if (!data || typeof data !== "object") return "";

    const response = data as Record<string, unknown>;

    if (typeof response.output_text === "string") {
        return response.output_text;
    }

    if (Array.isArray(response.output)) {
        const texts: string[] = [];

        for (const outputItem of response.output) {
            if (!outputItem || typeof outputItem !== "object") continue;

            const content = (outputItem as Record<string, unknown>).content;
            if (!Array.isArray(content)) continue;

            for (const contentItem of content) {
                if (!contentItem || typeof contentItem !== "object") continue;

                const item = contentItem as Record<string, unknown>;
                if (item.type === "output_text" && typeof item.text === "string") {
                    texts.push(item.text);
                }
            }
        }

        if (texts.length > 0) {
            return texts.join("\n");
        }
    }

    if (Array.isArray(response.choices)) {
        const firstChoice = response.choices[0];

        if (firstChoice && typeof firstChoice === "object") {
            const message = (firstChoice as Record<string, unknown>).message;

            if (message && typeof message === "object") {
                const content = (message as Record<string, unknown>).content;
                if (typeof content === "string") return content;
            }
        }
    }

    return "";
}

function parseJsonObject(content: string) {
    const jsonStr = content.replace(/```json\s*|```\s*/g, '').trim();

    try {
        return JSON.parse(jsonStr) as Record<string, unknown>;
    } catch {
        const start = jsonStr.indexOf("{");
        const end = jsonStr.lastIndexOf("}");

        if (start >= 0 && end > start) {
            return JSON.parse(jsonStr.slice(start, end + 1)) as Record<string, unknown>;
        }

        throw new Error("Format de réponse invalide");
    }
}

function buildNotationInputText(scenarioTitle: string, scenarioDescription: string, transcript: string) {
    return `CONTEXTE DU SCÉNARIO:
- Titre: ${scenarioTitle}
- Description: ${scenarioDescription || "Non disponible"}

TRANSCRIPTION DE L'APPEL:
---
${transcript}
---

Analyse cet appel et réponds uniquement avec un JSON valide.`;
}

function buildCombinedNotationInstructions(promptsMap: Map<string, string>) {
    const sections = NOTATION_TABS.map(tab => {
        const prompt = promptsMap.get(`notation.${tab}`);
        if (!prompt) {
            throw new Error(`Prompt non trouvé pour notation.${tab}`);
        }

        return `## Section "${tab}"
Tu dois produire la clé JSON "${tab}" en appliquant strictement les consignes suivantes:

${prompt}`;
    }).join("\n\n---\n\n");

    return `Tu dois générer la notation complète d'un appel de simulation commerciale.

IMPORTANT:
- Réponds avec un seul JSON valide.
- Ne mets aucun texte hors du JSON.
- La structure racine doit contenir exactement les clés suivantes: "synthese", "methodo", "discours", "transcription".
- Chaque clé doit conserver la même structure que celle demandée par son prompt de section.
- Ne génère pas "score_global": il sera calculé côté backend.

${sections}

Structure racine obligatoire:
{
  "synthese": {},
  "methodo": {},
  "discours": {},
  "transcription": {}
}`;
}

function buildOpenAIRequestBody(instructions: string, base64Pdf: string, inputText: string) {
    return {
        model: NOTATION_MODEL,
        reasoning: { effort: NOTATION_REASONING_EFFORT },
        instructions,
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
                        text: inputText
                    }
                ]
            }
        ]
    };
}

function buildNotationFromCombinedResult(resultJson: Record<string, unknown>) {
    const notation: NotationPayload = {};
    const missingTabs: string[] = [];

    for (const tab of NOTATION_TABS) {
        const section = resultJson[tab];

        if (section && typeof section === "object" && !Array.isArray(section)) {
            notation[tab] = section as Record<string, unknown>;
        } else {
            missingTabs.push(tab);
        }
    }

    if (missingTabs.length > 0) {
        throw new Error(`Sections manquantes dans la notation complète: ${missingTabs.join(", ")}`);
    }

    return notation;
}

function injectScoreGlobal(notation: NotationPayload, roundStep: 1 | 5 = 5) {
    const etapes = notation.methodo?.etapes ?? [];
    if (!Array.isArray(etapes) || etapes.length === 0) return notation;

    const detail_calcul = METHOD_STEPS.map(step => {
        const score_etape = getScoreFromEtapes(etapes, step.key);

        return {
            code: step.code,
            etape: step.etape,
            poids: step.poids,
            score_etape,
            contribution: round2(score_etape * step.poids),
        };
    });

    const rawGlobal = detail_calcul.reduce((acc, d) => acc + d.contribution, 0);
    const global = roundToStep(rawGlobal, roundStep);

    // Injecter poids + contribution sur chaque étape methodo
    for (const [index, e] of etapes.entries()) {
        const inferred = inferStepFromEtape(e, index);

        if (!inferred) continue;
        e.code = inferred.code;
        e.score = clamp0_100(e.score);
        e.score_max = 100;
        e.poids = inferred.poids;
        e.contribution_score_global = round2(e.score * inferred.poids);
    }

    notation.score_global = {
        unite: "score_sur_100",
        seuils: {
            bon: "66-85",
            moyen: "41-65",
            faible: "0-40",
            excellent: "86-100"
        },
        valeur: global,
        detail_calcul,
        "pondérations": { ...SCORE_WEIGHTS },
        score_process: global,
        interpretation: buildInterpretation(detail_calcul, global),
        methode_calcul: "moyenne_ponderee_etapes_methodologiques",
        regles_exclusion: ["SyntheseGlobale", "AvisPersonaIA", "AnalyseDiscours", "Transcription"],
        niveau_performance: niveauPerformance(global),
        score_execution_discours: null
    };

    return notation;
}

// =============================================
// POST /api/notation
// Body: { session_id } ou { scenario_id } ou { persona_id }
// Génère les 4 notations et les sauvegarde
// =============================================
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { session_id, scenario_id, persona_id } = body;

        if (!session_id && !scenario_id && !persona_id) {
            return setCorsHeaders(
                NextResponse.json({ error: "session_id, scenario_id ou persona_id requis" }, { status: 400 })
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

        if (!effectiveSessionId && (scenario_id || persona_id)) {
            // Cas: scenario_id/persona_id fourni, on cherche la dernière session correspondante
            let latestSessionQuery = supabase
                .from('sessions')
                .select('id, scenarios!inner(title, description, persona_id)')
                .eq('status', 'completed')
                .order('created_at', { ascending: false })
                .limit(1);

            if (scenario_id) {
                latestSessionQuery = latestSessionQuery.eq('scenario_id', scenario_id);
            }

            if (persona_id) {
                latestSessionQuery = latestSessionQuery.eq('scenarios.persona_id', persona_id);
            }

            const { data: latestSession, error: sessionError } = await latestSessionQuery.single();

            if (sessionError || !latestSession) {
                return setCorsHeaders(
                    NextResponse.json({ error: "Aucune session complétée trouvée pour cette sélection" }, { status: 404 })
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

        const notationInputText = buildNotationInputText(scenarioTitle, scenarioDescription, transcript);

        // 5. APPELER OPENAI POUR UNE NOTATION COMPLETE, avec fallback historique en parallèle
        const callOpenAITab = async (tab: NotationTab): Promise<OpenAITabResult> => {
            const promptText = promptsMap.get(`notation.${tab}`);

            if (!promptText) {
                console.error(`❌ Prompt non trouvé pour notation.${tab}`);
                return { tab, result: null, error: `Prompt non trouvé pour ${tab}` };
            }

            try {
                const response = await fetch(OPENAI_RESPONSES_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                    },
                    body: JSON.stringify(buildOpenAIRequestBody(promptText, base64Pdf, notationInputText))
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error(`❌ Erreur OpenAI pour ${tab}:`, errorData);
                    return { tab, result: null, error: errorData.error?.message || "Erreur API OpenAI" };
                }

                const data = await response.json();

                // Parsing de la réponse
                const content = extractOpenAIResponseText(data);

                try {
                    const resultJson = parseJsonObject(content);
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

        const callOpenAIParallelNotation = async () => {
            console.log("📊 Calling OpenAI for all 4 tabs in parallel...");
            const results = await Promise.all(NOTATION_TABS.map(tab => callOpenAITab(tab)));
            const notation: NotationPayload = {};
            const errors: string[] = [];

            results.forEach(({ tab, result, error }) => {
                if (result) {
                    notation[tab] = result;
                } else if (error) {
                    errors.push(`${tab}: ${error}`);
                }
            });

            return { notation, errors };
        };

        const callOpenAICompleteNotation = async () => {
            console.log("📊 Calling OpenAI once for complete notation...");

            const response = await fetch(OPENAI_RESPONSES_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                body: JSON.stringify(buildOpenAIRequestBody(
                    buildCombinedNotationInstructions(promptsMap),
                    base64Pdf,
                    notationInputText
                ))
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || "Erreur API OpenAI");
            }

            const data = await response.json();
            const content = extractOpenAIResponseText(data);
            const resultJson = parseJsonObject(content);
            const notation = buildNotationFromCombinedResult(resultJson);

            console.log("✅ Notation complète calculée");
            return { notation, errors: [] as string[] };
        };

        // 6. CONSTRUIRE LE JSON GLOBAL
        let notation: NotationPayload;
        let errors: string[];

        if (NOTATION_GENERATION_MODE === "single") {
            try {
                ({ notation, errors } = await callOpenAICompleteNotation());
            } catch (error) {
                const message = error instanceof Error ? error.message : "Erreur inconnue";
                console.error("❌ Erreur notation complète, fallback parallel:", message);
                const fallback = await callOpenAIParallelNotation();
                notation = fallback.notation;
                errors = [`single: ${message}`, ...fallback.errors];
            }
        } else {
            ({ notation, errors } = await callOpenAIParallelNotation());
        }

        if (Object.keys(notation).length === 0) {
            return setCorsHeaders(
                NextResponse.json({
                    error: "Aucune notation générée",
                    details: errors.length > 0 ? errors : ["Aucune réponse JSON valide retournée par OpenAI"]
                }, { status: 502 })
            );
        }

        // ✅ Injecter score_global + contributions Accueillir/Cadrer/Découvrir/Confirmer (backend)
        injectScoreGlobal(notation, 1);

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
// GET /api/notation?scenario_id=XXX ou ?persona_id=XXX
// Retourne le notation_json de la dernière session du scénario/persona
// =============================================
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const scenarioId = searchParams.get('scenario_id');
        const personaId = searchParams.get('persona_id');

        if (!scenarioId && !personaId) {
            return setCorsHeaders(
                NextResponse.json({ error: "scenario_id ou persona_id requis" }, { status: 400 })
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

        // Récupérer la dernière session complétée de la sélection avec le persona
        let sessionQuery = supabase
            .from('sessions')
            .select(`
                id, 
                scenario_id, 
                notation_json, 
                created_at, 
                duration_seconds,
                scenarios!inner(
                    id,
                    title, 
                    description,
                    persona_id,
                    difficulty_level,
                    personas(name, role, company)
                )
            `)
            .eq('status', 'completed')
            .not('notation_json', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1);

        if (scenarioId) {
            sessionQuery = sessionQuery.eq('scenario_id', scenarioId);
        }

        if (personaId) {
            sessionQuery = sessionQuery.eq('scenarios.persona_id', personaId);
        }

        const { data: session, error } = await sessionQuery.single();

        if (error || !session) {
            return setCorsHeaders(
                NextResponse.json({
                    error: "Aucune session avec notation trouvée pour cette sélection",
                    scenario_id: scenarioId,
                    persona_id: personaId
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
            id: string;
            title: string;
            description: string | null;
            persona_id: string;
            difficulty_level: string | null;
            personas: { name: string; role: string | null; company: string | null } | null;
        } | null;

        const persona = scenario?.personas;

        return setCorsHeaders(NextResponse.json({
            success: true,
            session_id: session.id,
            scenario_id: session.scenario_id,
            persona_id: scenario?.persona_id || null,
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
