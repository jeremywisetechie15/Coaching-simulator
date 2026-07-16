import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/features/auth/server';
import { PUBLISHED_CONTENT_STATUS } from '@/features/content/domain';
import { SCORECARD_STEP_WEIGHT_TOTAL_PERCENT } from '@/features/scorecards/domain';
import {
    getRoleplaySessionEvaluationDecision,
    MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS,
    ROLEPLAY_NOTATION_FOLLOWUP_TABS,
    ROLEPLAY_NOTATION_SOURCE,
    ROLEPLAY_NOTATION_STATUS,
    ROLEPLAY_NOTATION_TABS,
    isForcedRoleplayNotationRegeneration,
    shouldReuseCompletedRoleplayNotation,
    ROLEPLAY_NOTATION_FEEDBACK_MESSAGES,
    type RoleplayNotationCriterionRef,
    type RoleplayNotationScoreResult,
    type RoleplayNotationSource,
    type RoleplayNotationTab,
} from '@/features/roleplays/domain';
import {
    SCORECARD_NOTATION_TABS,
    buildScorecardMethodoInput,
    buildScorecardSynthesisInput,
    buildRoleplayScorecardNotationContext,
    buildScoreGlobalFromScorecard,
    calculateLegacyMethodoStepScore,
    calculateScorecardNotationResult,
    loadScorecardNotationPrompts,
    normalizeScorecardNotationSynthesis,
    persistRoleplayScorecardNotationResults,
    validateScorecardMethodoResult,
    type RoleplayScorecardNotationContext,
} from '@/features/roleplays/server';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { AppError } from '@/lib/server/errors';

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

async function getAuthenticatedUserId() {
    try {
        const supabase = await createServerSupabaseClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        return user?.id ?? null;
    } catch {
        return null;
    }
}

type NotationTab = RoleplayNotationTab;

// Types pour le calcul de score global
type MethodoStepKey = string;

type MethodoEtape = {
    numero?: number;
    code?: string;
    titre: string;
    score: number; // 0..100
    score_max?: number; // 100
    points_obtenus?: number;
    points_max?: number;
    poids?: number;
    contribution_score_global?: number;
    timecode_start?: string;
    timecode_end?: string;
    criteres_reussis?: string[];
    criteres_a_ameliorer?: string[];
    criteres?: Array<Record<string, unknown>>;
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

type NotationMethodStep = {
    key: MethodoStepKey;
    code: string;
    etape: string;
    poids: number;
    numero: number;
    aliases: string[];
};

type NotationMethodFile = {
    bucket: string;
    path: string;
    label: string | null;
    fileType: string;
    sortOrder: number;
};

type NotationMethodConfig = {
    id: string | null;
    code: string;
    version: string;
    steps: NotationMethodStep[];
    files: NotationMethodFile[];
    promptIds: Partial<Record<NotationTab, string>>;
    source: "supabase" | "fallback";
};

type OpenAIFileInput = {
    type: "input_file";
    filename: string;
    file_data: string;
};

type OpenAIJsonSchemaFormat = {
    type: "json_schema";
    name: string;
    strict: boolean;
    schema: Record<string, unknown>;
};

const SCORECARD_METHODO_OUTPUT_SCHEMA: OpenAIJsonSchemaFormat = {
    type: "json_schema",
    name: "notation_scorecard_methodo",
    strict: true,
    schema: {
        type: "object",
        additionalProperties: false,
        required: ["onglet", "criteres"],
        properties: {
            onglet: {
                type: "string",
                enum: ["AnalyseMethodologique"],
            },
            criteres: {
                type: "array",
                items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["ref", "points_obtenus", "points_max", "preuve", "commentaire", "conseil"],
                    properties: {
                        ref: { type: "string" },
                        points_obtenus: { type: "number" },
                        points_max: { type: "number" },
                        preuve: { type: "string" },
                        commentaire: { type: "string" },
                        conseil: { type: "string" },
                    },
                },
            },
        },
    },
};

const DEFAULT_STEP_TITLES: Record<string, string> = {
    accueillir: "Accueillir",
    cadrer: "Cadrer",
    decouvrir: "Découvrir",
    confirmer: "Confirmer",
};

const DEFAULT_METHOD_STEPS: NotationMethodStep[] = [
        { key: "accueillir", code: "A", etape: "Accueillir", poids: 0.07, numero: 1, aliases: ["accueillir", "accueil"] },
        { key: "cadrer", code: "C", etape: "Cadrer", poids: 0.08, numero: 2, aliases: ["cadrer", "cadrage"] },
        { key: "decouvrir", code: "D", etape: "Découvrir", poids: 0.70, numero: 3, aliases: ["decouvrir", "decouverte"] },
        { key: "confirmer", code: "C", etape: "Confirmer", poids: 0.15, numero: 4, aliases: ["confirmer", "confirmation"] },
    ];

const DEFAULT_NOTATION_FILES: NotationMethodFile[] = [
    {
        bucket: "notation_pdf",
        path: "criteres_v1.pdf",
        label: "Criteres AC/DC v1",
        fileType: "pdf",
        sortOrder: 1,
    },
];

const DEFAULT_NOTATION_CONFIG: NotationMethodConfig = {
    id: null,
    code: "acdc",
    version: "v1",
    steps: DEFAULT_METHOD_STEPS,
    files: DEFAULT_NOTATION_FILES,
    promptIds: {},
    source: "fallback",
};

const SCORECARD_NOTATION_CONFIG: NotationMethodConfig = {
    id: null,
    code: "scorecard",
    version: "generic",
    steps: [],
    files: [],
    promptIds: {},
    source: "supabase",
};

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

function canonicalStepTitle(key: string, title: string) {
    return DEFAULT_STEP_TITLES[key] ?? title;
}

function buildPonderations(steps: NotationMethodStep[]) {
    return steps.reduce<Record<string, number>>((acc, step) => {
        acc[step.key] = step.poids;
        return acc;
    }, {});
}

function inferStepFromEtape(etape: MethodoEtape, steps: NotationMethodStep[], index?: number) {
    const normalizedTitle = normalizeText(etape.titre || "");

    const byNumberOrTitle = steps.find(step =>
        etape.numero === step.numero ||
        titleHasStepPrefix(etape.titre || "", step.numero) ||
        step.aliases.some(alias => normalizedTitle.includes(alias))
    );

    if (byNumberOrTitle) return byNumberOrTitle;

    if (typeof index === "number" && steps[index]) {
        return steps[index];
    }

    const sameCode = steps.filter(step => step.code === etape.code);
    return sameCode.length === 1 ? sameCode[0] : undefined;
}

function getScoreFromEtapes(etapes: MethodoEtape[], targetStep: NotationMethodStep, steps: NotationMethodStep[]): number {
    const byStep = etapes.find((etape, index) => inferStepFromEtape(etape, steps, index)?.key === targetStep.key);
    return calculateLegacyMethodoStepScore(byStep);
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

function injectScoreGlobal(notation: NotationPayload, steps: NotationMethodStep[], roundStep: 1 | 5 = 5) {
    const etapes = notation.methodo?.etapes ?? [];
    if (!Array.isArray(etapes) || etapes.length === 0 || steps.length === 0) return notation;

    const detail_calcul = steps.map(step => {
        const score_etape = getScoreFromEtapes(etapes, step, steps);

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
        const inferred = inferStepFromEtape(e, steps, index);

        if (!inferred) continue;
        e.code = inferred.code;
        e.score = calculateLegacyMethodoStepScore(e);
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
        "pondérations": buildPonderations(steps),
        score_process: global,
        interpretation: buildInterpretation(detail_calcul, global),
        methode_calcul: "moyenne_ponderee_etapes_methodologiques",
        regles_exclusion: ["SyntheseGlobale", "AvisPersonaIA", "AnalyseDiscours", "Transcription"],
        niveau_performance: niveauPerformance(global),
        score_execution_discours: null
    };

    return notation;
}

function isCompleteMethodoResult(result: Record<string, unknown> | null, expectedStepCount: number) {
    if (!result || !Array.isArray(result.etapes)) return false;
    return result.etapes.length >= expectedStepCount;
}

function buildMethodoError(error?: string): NotationPayload["methodo"] {
    return {
        onglet: "AnalyseMethodologique",
        etapes: [],
        status: "failed",
        error: true,
        message: "Une erreur est survenue, réessayez.",
        details: error || "Réponse methodo absente, invalide ou incomplète.",
    };
}

function buildTabError(tab: Exclude<NotationTab, "methodo">, error?: string): Record<string, unknown> {
    const ongletByTab: Record<Exclude<NotationTab, "methodo">, string> = {
        synthese: "SyntheseGlobale",
        transcription: "Transcription",
    };

    return {
        onglet: ongletByTab[tab],
        status: "failed",
        error: true,
        message: "Une erreur est survenue, réessayez.",
        details: error || `Réponse ${tab} absente, invalide ou incomplète.`,
    };
}

function normalizeMethodSteps(rows: Array<Record<string, unknown>>): NotationMethodStep[] {
    return rows
        .map((row, index) => {
            const key = String(row.step_key || `step_${index + 1}`);
            const title = String(row.title || key);
            const weight = Number(row.weight);
            const aliases = Array.isArray(row.aliases)
                ? row.aliases.map(alias => String(alias))
                : [];

            return {
                key,
                code: String(row.code || index + 1),
                etape: canonicalStepTitle(key, title),
                poids: Number.isFinite(weight) ? weight : 0,
                numero: Number(row.step_order) || index + 1,
                aliases: Array.from(new Set([key, title, ...aliases].map(alias => normalizeText(alias)))),
            };
        })
        .filter(step => step.key && step.poids >= 0);
}

function normalizeMethodFiles(rows: Array<Record<string, unknown>>): NotationMethodFile[] {
    return rows.map((row, index) => ({
        bucket: String(row.bucket || ""),
        path: String(row.path || ""),
        label: typeof row.label === "string" ? row.label : null,
        fileType: String(row.file_type || "pdf"),
        sortOrder: Number(row.sort_order) || index + 1,
    })).filter(file => file.bucket && file.path);
}

function promptIdsFromMethod(method: Record<string, unknown>): Partial<Record<NotationTab, string>> {
    const promptIds: Partial<Record<NotationTab, string>> = {};
    const mappings: Array<[NotationTab, string]> = [
        ["synthese", "prompt_synthese_id"],
        ["methodo", "prompt_methodo_id"],
        ["transcription", "prompt_transcription_id"],
    ];

    for (const [tab, column] of mappings) {
        if (typeof method[column] === "string" && method[column]) {
            promptIds[tab] = method[column] as string;
        }
    }

    return promptIds;
}

async function loadNotationMethodConfig(
    supabase: SupabaseClient,
    notationMethodId: string | null
): Promise<NotationMethodConfig> {
    let method: Record<string, unknown> | null = null;

    if (notationMethodId) {
        const { data, error } = await supabase
            .from("notation_methods")
            .select("id, code, version, is_active, prompt_synthese_id, prompt_methodo_id, prompt_transcription_id")
            .eq("id", notationMethodId)
            .eq("is_active", true)
            .eq("status", PUBLISHED_CONTENT_STATUS)
            .maybeSingle();

        if (error) {
            console.warn("⚠️ Erreur lecture méthode de notation liée au scénario:", error.message);
        } else {
            method = data as Record<string, unknown> | null;
        }
    }

    if (!method) {
        const { data, error } = await supabase
            .from("notation_methods")
            .select("id, code, version, is_active, prompt_synthese_id, prompt_methodo_id, prompt_transcription_id")
            .eq("is_default", true)
            .eq("is_active", true)
            .eq("status", PUBLISHED_CONTENT_STATUS)
            .maybeSingle();

        if (error) {
            console.warn("⚠️ Erreur lecture méthode de notation par défaut:", error.message);
            return DEFAULT_NOTATION_CONFIG;
        }

        method = data as Record<string, unknown> | null;
    }

    if (!method || typeof method.id !== "string") {
        console.warn("⚠️ Aucune méthode de notation Supabase trouvée, fallback AC/DC utilisé.");
        return DEFAULT_NOTATION_CONFIG;
    }

    const [{ data: stepsRows, error: stepsError }, { data: filesRows, error: filesError }] = await Promise.all([
        supabase
            .from("notation_method_steps")
            .select("step_order, step_key, code, title, weight, aliases")
            .eq("method_id", method.id)
            .order("step_order", { ascending: true }),
        supabase
            .from("notation_method_files")
            .select("bucket, path, label, file_type, sort_order, is_active")
            .eq("method_id", method.id)
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
    ]);

    if (stepsError) {
        console.warn("⚠️ Erreur lecture étapes méthode de notation:", stepsError.message);
        return DEFAULT_NOTATION_CONFIG;
    }

    const steps = normalizeMethodSteps((stepsRows ?? []) as Array<Record<string, unknown>>);

    if (steps.length === 0 || steps.every(step => step.poids === 0)) {
        console.warn("⚠️ Méthode de notation sans étapes valides, fallback AC/DC utilisé.");
        return DEFAULT_NOTATION_CONFIG;
    }

    if (filesError) {
        console.warn("⚠️ Erreur lecture fichiers méthode de notation:", filesError.message);
    }

    return {
        id: method.id,
        code: String(method.code || "method"),
        version: String(method.version || "v1"),
        steps,
        files: filesError ? [] : normalizeMethodFiles((filesRows ?? []) as Array<Record<string, unknown>>),
        promptIds: promptIdsFromMethod(method),
        source: "supabase",
    };
}

async function loadNotationPrompts(
    supabase: SupabaseClient,
    config: NotationMethodConfig
): Promise<Map<NotationTab, string>> {
    const promptsMap = new Map<NotationTab, string>();
    const idEntries = ROLEPLAY_NOTATION_TABS
        .map(tab => ({ tab, id: config.promptIds[tab] }))
        .filter((entry): entry is { tab: NotationTab; id: string } => Boolean(entry.id));

    if (idEntries.length > 0) {
        const { data, error } = await supabase
            .from("prompts")
            .select("id, prompt")
            .in("id", idEntries.map(entry => entry.id));

        if (error) {
            console.warn("⚠️ Erreur lecture prompts par méthode:", error.message);
        } else {
            const promptById = new Map(
                ((data ?? []) as Array<Record<string, unknown>>)
                    .filter(row => typeof row.id === "string" && typeof row.prompt === "string")
                    .map(row => [row.id as string, row.prompt as string])
            );

            for (const entry of idEntries) {
                const prompt = promptById.get(entry.id);
                if (prompt) promptsMap.set(entry.tab, prompt);
            }
        }
    }

    const missingTabs = ROLEPLAY_NOTATION_TABS.filter(tab => !promptsMap.has(tab));

    if (missingTabs.length > 0) {
        const { data, error } = await supabase
            .from("prompts")
            .select("title, prompt")
            .in("title", missingTabs.map(tab => `notation.${tab}`));

        if (error) {
            console.warn("⚠️ Erreur lecture prompts par défaut:", error.message);
            return promptsMap;
        }

        for (const row of (data ?? []) as Array<Record<string, unknown>>) {
            if (typeof row.title !== "string" || typeof row.prompt !== "string") continue;

            const tab = row.title.replace("notation.", "") as NotationTab;
            if (ROLEPLAY_NOTATION_TABS.includes(tab)) {
                promptsMap.set(tab, row.prompt);
            }
        }
    }

    return promptsMap;
}

function sanitizeSchemaName(name: string, fallback: string) {
    const sanitized = name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
    return sanitized || fallback;
}

async function loadNotationOutputSchemas(
    supabase: SupabaseClient,
    config: NotationMethodConfig,
    notationSource: RoleplayNotationSource = ROLEPLAY_NOTATION_SOURCE.legacyPdf,
    tabs: readonly NotationTab[] = ROLEPLAY_NOTATION_TABS,
): Promise<Map<NotationTab, OpenAIJsonSchemaFormat>> {
    const schemasMap = new Map<NotationTab, OpenAIJsonSchemaFormat>();
    const tabSet = new Set<NotationTab>(tabs);

    const { data, error } = await supabase
        .from("notation_output_schemas")
        .select("tab, name, schema_json, is_active")
        .eq("is_active", true)
        .eq("status", PUBLISHED_CONTENT_STATUS)
        .eq("notation_source", notationSource)
        .in("tab", [...tabs]);

    if (error) {
        console.warn("⚠️ Schémas JSON de notation indisponibles, fallback prompt-only:", error.message);
        return schemasMap;
    }

    for (const row of (data ?? []) as Array<Record<string, unknown>>) {
        const tab = row.tab;
        const schema = row.schema_json;

        if (!tabSet.has(tab as NotationTab) || !schema || typeof schema !== "object" || Array.isArray(schema)) {
            continue;
        }

        const safeTab = tab as NotationTab;
        if (schemasMap.has(safeTab)) {
            continue;
        }

        const fallbackName = `notation_${config.code}_${safeTab}`;
        const rawName = typeof row.name === "string" ? row.name : fallbackName;

        schemasMap.set(safeTab, {
            type: "json_schema",
            name: sanitizeSchemaName(rawName, fallbackName),
            strict: true,
            schema: schema as Record<string, unknown>,
        });
    }

    return schemasMap;
}

function filenameFromPath(path: string) {
    return path.split("/").filter(Boolean).pop() || "notation_file";
}

function mimeTypeForFile(file: NotationMethodFile) {
    const fileType = file.fileType.toLowerCase();
    if (fileType === "pdf" || file.path.toLowerCase().endsWith(".pdf")) return "application/pdf";
    return "application/octet-stream";
}

async function buildNotationFileInputs(
    supabase: SupabaseClient,
    files: NotationMethodFile[]
): Promise<OpenAIFileInput[]> {
    return Promise.all(files.map(async file => {
        console.log("📊 Fetching notation file from Supabase:", `${file.bucket}/${file.path}`);

        const { data, error } = await supabase
            .storage
            .from(file.bucket)
            .download(file.path);

        if (error || !data) {
            throw new Error(`Fichier de notation non trouvé: ${file.bucket}/${file.path}${error?.message ? ` (${error.message})` : ""}`);
        }

        const arrayBuffer = await data.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log("📊 Notation file loaded:", file.path, "size:", buffer.length, "bytes");

        return {
            type: "input_file",
            filename: filenameFromPath(file.path),
            file_data: `data:${mimeTypeForFile(file)};base64,${buffer.toString("base64")}`,
        };
    }));
}

async function updateSessionNotationStatus(
    supabase: SupabaseClient,
    sessionId: string,
    payload: Record<string, unknown>,
) {
    const { error } = await supabase
        .from("sessions")
        .update(payload)
        .eq("id", sessionId);

    if (error) {
        console.warn("⚠️ Impossible de mettre à jour le statut de notation:", error.message);
    }
}

function extractOpenAIOutputText(data: Record<string, unknown>) {
    if (typeof data.output_text === "string") {
        return data.output_text;
    }

    if (Array.isArray(data.output)) {
        return data.output
            .flatMap((outputItem: { content?: Array<{ type: string; text?: string }> }) => outputItem.content ?? [])
            .filter((contentItem: { type: string; text?: string }) => contentItem.type === "output_text" && typeof contentItem.text === "string")
            .map((contentItem: { text?: string }) => contentItem.text as string)
            .join("");
    }

    const choices = data.choices;
    if (Array.isArray(choices) && choices[0]?.message?.content) {
        return String(choices[0].message.content);
    }

    return "";
}

async function callOpenAIJson(
    tab: NotationTab,
    promptText: string,
    inputText: string,
    outputSchema?: OpenAIJsonSchemaFormat,
) {
    try {
        const requestBody: Record<string, unknown> = {
            model: "gpt-4.1",
            instructions: promptText,
            max_output_tokens: tab === "methodo" ? 24000 : 8000,
            input: [
                {
                    role: "user",
                    content: [
                        {
                            type: "input_text",
                            text: inputText,
                        },
                    ],
                },
            ],
        };

        if (outputSchema) {
            requestBody.text = {
                format: outputSchema,
            };
        }

        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`❌ Erreur OpenAI pour ${tab}:`, errorData);
            return { result: null, error: errorData.error?.message || "Erreur du service IA" };
        }

        const data = await response.json() as Record<string, unknown>;
        const content = extractOpenAIOutputText(data);
        const jsonStr = content.replace(/```json\s*|```\s*/g, "").trim();

        try {
            return { result: JSON.parse(jsonStr) as Record<string, unknown>, error: undefined };
        } catch (parseError) {
            console.error(`❌ Erreur parsing JSON scorecard pour ${tab}:`, parseError);
            console.error(`❌ Réponse brute ${tab}:`, content.slice(0, 2000));
            return { result: null, error: "Format de réponse invalide" };
        }
    } catch (error) {
        console.error(`❌ Erreur appel OpenAI scorecard pour ${tab}:`, error);
        return { result: null, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
}

function buildScorecardMethodoPayload(
    rawMethodo: Record<string, unknown> | null,
    scoreResult: RoleplayNotationScoreResult,
    criterionRefs: RoleplayNotationCriterionRef[],
): NotationPayload["methodo"] {
    const refsByRef = new Map(criterionRefs.map((criterionRef) => [criterionRef.ref, criterionRef]));
    const raw = rawMethodo && typeof rawMethodo === "object" ? rawMethodo : {};

    return {
        ...raw,
        onglet: raw.onglet ?? "AnalyseMethodologique",
        etapes: scoreResult.steps.map((step) => ({
            numero: step.stepOrder,
            titre: step.title,
            score: step.scorePercent,
            score_max: 100,
            points_obtenus: step.pointsAwarded,
            points_max: step.pointsMax,
            poids: round2(step.weightPercent / SCORECARD_STEP_WEIGHT_TOTAL_PERCENT),
            contribution_score_global: round2(
                step.scorePercent *
                    (step.weightPercent / SCORECARD_STEP_WEIGHT_TOTAL_PERCENT),
            ),
            commentaire_coach: step.coachComment,
            criteres: step.criteria.map((criterion) => {
                const criterionRef = refsByRef.get(criterion.ref);

                return {
                    ref: criterion.ref,
                    critere: criterionRef?.criterionKey ?? criterion.ref,
                    competence: criterionRef?.skillName,
                    dimension: criterionRef?.dimension,
                    item_dimension: criterionRef?.dimensionItemLabel,
                    points_obtenus: criterion.pointsAwarded,
                    points_max: criterion.pointsMax,
                    score: criterion.scorePercent,
                    preuve: criterion.evidence,
                    commentaire: criterion.coachComment,
                    conseil: criterion.advice,
                    preuves_attendues: criterionRef?.expectedEvidence,
                    verbatim: criterionRef?.verbatim,
                };
            }),
        })),
    };
}

async function runScorecardNotation(
    supabase: SupabaseClient,
    context: RoleplayScorecardNotationContext,
) {
    const promptsMap = await loadScorecardNotationPrompts(supabase);
    const missingPrompts = SCORECARD_NOTATION_TABS.filter((tab) => !promptsMap.has(tab));

    if (missingPrompts.length > 0) {
        throw new Error(`Prompts scorecard manquants: ${missingPrompts.map((tab) => `notation.scorecard.${tab}`).join(", ")}`);
    }

    const outputSchemasMap = await loadNotationOutputSchemas(
        supabase,
        SCORECARD_NOTATION_CONFIG,
        ROLEPLAY_NOTATION_SOURCE.scorecard,
        SCORECARD_NOTATION_TABS,
    );
    const scorecardMethodoOutputSchema = outputSchemasMap.get("methodo") ?? SCORECARD_METHODO_OUTPUT_SCHEMA;
    const scorecardSynthesisOutputSchema = outputSchemasMap.get("synthese");
    if (!scorecardSynthesisOutputSchema) {
        throw new Error("Schema JSON scorecard synthese manquant.");
    }

    const notation: NotationPayload = {};

    const methodoPrompt = promptsMap.get("methodo");
    if (!methodoPrompt) {
        throw new Error("Prompt scorecard methodo manquant.");
    }

    const methodoResult = await callOpenAIJson(
        "methodo",
        methodoPrompt,
        buildScorecardMethodoInput(context),
        scorecardMethodoOutputSchema,
    );

    if (!methodoResult.result) {
        throw new Error(methodoResult.error || "Réponse methodo scorecard absente.");
    }

    const methodoValidationErrors = validateScorecardMethodoResult(methodoResult.result, context.criterionRefs);
    if (methodoValidationErrors.length > 0) {
        throw new Error(`Réponse methodo scorecard invalide: ${methodoValidationErrors.join(" ")}`);
    }

    const scoreResult = calculateScorecardNotationResult(
        methodoResult.result,
        context.criterionRefs,
        context.stepRefs,
    );
    notation.methodo = buildScorecardMethodoPayload(methodoResult.result, scoreResult, context.criterionRefs);
    notation.score_global = buildScoreGlobalFromScorecard(scoreResult);

    const synthesisPrompt = promptsMap.get("synthese");
    if (!synthesisPrompt) {
        throw new Error("Prompt scorecard synthese manquant.");
    }

    const synthesisResult = await callOpenAIJson(
        "synthese",
        synthesisPrompt,
        buildScorecardSynthesisInput(context, notation),
        scorecardSynthesisOutputSchema,
    );
    if (!synthesisResult.result) {
        throw new Error(synthesisResult.error || "Réponse synthese scorecard absente.");
    }

    const normalizedSynthesis = normalizeScorecardNotationSynthesis(
        synthesisResult.result,
        context.stepRefs,
    );
    if (!normalizedSynthesis.result) {
        throw new Error(`Réponse synthese scorecard invalide: ${normalizedSynthesis.errors.join(" ")}`);
    }

    notation.synthese = normalizedSynthesis.result;
    notation.transcription = { ...context.transcription };

    return {
        errors: [] as string[],
        notation,
        scoreResult,
    };
}

// =============================================
// POST /api/notation
// Body: { session_id } ou { scenario_id } ou { persona_id }
// Génère les sorties actives de notation et les sauvegarde.
// =============================================
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { force_regenerate, session_id, scenario_id, persona_id } = body;
        const forceRegeneration = isForcedRoleplayNotationRegeneration(force_regenerate);

        if (forceRegeneration) {
            try {
                await requireAdmin();
            } catch (error) {
                if (error instanceof AppError) {
                    return setCorsHeaders(NextResponse.json(
                        { code: error.code, error: error.message },
                        { status: error.status },
                    ));
                }

                throw error;
            }
        }

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
        const authenticatedUserId = await getAuthenticatedUserId();

        // 1. RÉSOUDRE LA SESSION ET RÉCUPÉRER LE SCÉNARIO
        let effectiveSessionId = session_id;
        let effectiveScenarioId: string | null = scenario_id || null;
        let effectiveSessionDurationSeconds: number | null = null;
        let existingNotationJson: Record<string, unknown> | null = null;
        let existingNotationStatus: string | null = null;
        let notationMethodId: string | null = null;
        let scenarioTitle = "";
        let scenarioDescription = "";

        if (!effectiveSessionId && (scenario_id || persona_id)) {
            // Cas: scenario_id/persona_id fourni, on cherche la dernière session correspondante
            let latestSessionQuery = supabase
                .from('sessions')
                .select('id, scenario_id, duration_seconds, notation_json, notation_status, scenarios!inner(title, description, persona_id, notation_method_id)')
                .eq('status', 'completed')
                .order('created_at', { ascending: false })
                .limit(1);

            if (scenario_id) {
                latestSessionQuery = latestSessionQuery.eq('scenario_id', scenario_id);
            }

            if (persona_id) {
                latestSessionQuery = latestSessionQuery.eq('scenarios.persona_id', persona_id);
            }

            if (authenticatedUserId) {
                latestSessionQuery = latestSessionQuery.eq('user_id', authenticatedUserId);
            }

            const { data: latestSession, error: sessionError } = await latestSessionQuery.single();

            if (sessionError || !latestSession) {
                return setCorsHeaders(
                    NextResponse.json({ error: "Aucune session complétée trouvée pour cette sélection" }, { status: 404 })
                );
            }
            effectiveSessionId = latestSession.id;
            effectiveScenarioId = latestSession.scenario_id || scenario_id || null;
            effectiveSessionDurationSeconds = latestSession.duration_seconds;
            existingNotationJson = latestSession.notation_json as Record<string, unknown> | null;
            existingNotationStatus = latestSession.notation_status;
            const scenario = latestSession.scenarios as unknown as {
                title: string;
                description: string | null;
                notation_method_id?: string | null;
            } | null;
            scenarioTitle = scenario?.title || "";
            scenarioDescription = scenario?.description || "";
            notationMethodId = scenario?.notation_method_id || null;
        } else {
            // Cas: session_id fourni, on récupère le scénario
            const { data: sessionData, error: sessionError } = await supabase
                .from('sessions')
                .select('scenario_id, duration_seconds, notation_json, notation_status, scenarios(title, description, notation_method_id)')
                .eq('id', effectiveSessionId)
                .single();

            if (sessionError || !sessionData) {
                return setCorsHeaders(
                    NextResponse.json({ error: "Session introuvable pour la notation" }, { status: 404 })
                );
            }

            effectiveScenarioId = sessionData.scenario_id || scenario_id || null;
            effectiveSessionDurationSeconds = sessionData.duration_seconds;
            existingNotationJson = sessionData.notation_json as Record<string, unknown> | null;
            existingNotationStatus = sessionData.notation_status;
            const scenario = sessionData.scenarios as unknown as {
                title: string;
                description: string | null;
                notation_method_id?: string | null;
            } | null;
            scenarioTitle = scenario?.title || "";
            scenarioDescription = scenario?.description || "";
            notationMethodId = scenario?.notation_method_id || null;
        }

        console.log("📊 Notation API - Processing session:", effectiveSessionId);
        console.log("📊 Scenario id:", effectiveScenarioId);
        console.log("📊 Scenario:", scenarioTitle);
        console.log("📊 Scenario description:", scenarioDescription);

        if (!effectiveSessionId) {
            return setCorsHeaders(
                NextResponse.json({ error: "Session introuvable pour la notation" }, { status: 404 })
            );
        }

        if (shouldReuseCompletedRoleplayNotation({
            forceRegeneration,
            hasNotation: Boolean(existingNotationJson),
            notationStatus: existingNotationStatus,
        }) && existingNotationJson) {
            return setCorsHeaders(NextResponse.json({
                errors: undefined,
                notation: existingNotationJson,
                reused: true,
                session_id: effectiveSessionId,
                success: true,
                tabs_processed: Object.keys(existingNotationJson),
            }));
        }

        const evaluationDecision = getRoleplaySessionEvaluationDecision(effectiveSessionDurationSeconds);
        if (!evaluationDecision.eligible) {
            await updateSessionNotationStatus(supabase, effectiveSessionId, {
                notation_error: null,
                notation_status: ROLEPLAY_NOTATION_STATUS.skipped,
            });

            return setCorsHeaders(NextResponse.json({
                success: true,
                evaluation_eligible: false,
                minimum_duration_seconds: evaluationDecision.minimumDurationSeconds,
                session_id: effectiveSessionId,
                skip_reason: evaluationDecision.skipReason,
                skipped: true,
            }));
        }

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

        const scorecardContext = await buildRoleplayScorecardNotationContext(supabase, effectiveSessionId, messages);

        if (scorecardContext) {
            console.log("📊 Scorecard notation mode:", scorecardContext.scorecard.name);
            await updateSessionNotationStatus(supabase, effectiveSessionId, {
                notation_error: null,
                notation_source: ROLEPLAY_NOTATION_SOURCE.scorecard,
                notation_status: ROLEPLAY_NOTATION_STATUS.processing,
            });

            try {
                const { errors, notation, scoreResult } = await runScorecardNotation(supabase, scorecardContext);
                const generatedAt = new Date().toISOString();

                const { error: updateError } = await supabase
                    .from("sessions")
                    .update({
                        notation_error: errors.length > 0 ? errors.join("\n") : null,
                        notation_generated_at: generatedAt,
                        notation_json: notation,
                        notation_source: ROLEPLAY_NOTATION_SOURCE.scorecard,
                        notation_status: ROLEPLAY_NOTATION_STATUS.completed,
                    })
                    .eq("id", effectiveSessionId);

                if (updateError) {
                    throw updateError;
                }

                await persistRoleplayScorecardNotationResults(supabase, scorecardContext, scoreResult);

                return setCorsHeaders(NextResponse.json({
                    success: true,
                    session_id: effectiveSessionId,
                    tabs_processed: Object.keys(notation),
                    errors: errors.length > 0 ? errors : undefined,
                    notation,
                }));
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
                console.error("❌ Erreur notation scorecard:", error);
                await updateSessionNotationStatus(supabase, effectiveSessionId, {
                    notation_error: errorMessage,
                    notation_source: ROLEPLAY_NOTATION_SOURCE.scorecard,
                    notation_status: ROLEPLAY_NOTATION_STATUS.failed,
                });

                return setCorsHeaders(
                    NextResponse.json({
                        error: ROLEPLAY_NOTATION_FEEDBACK_MESSAGES.scorecardServerError,
                        details: errorMessage,
                    }, { status: 500 })
                );
            }
        }

        await updateSessionNotationStatus(supabase, effectiveSessionId, {
            notation_error: null,
            notation_source: ROLEPLAY_NOTATION_SOURCE.legacyPdf,
            notation_status: ROLEPLAY_NOTATION_STATUS.processing,
        });

        const notationConfig = await loadNotationMethodConfig(supabase, notationMethodId);

        console.log("📊 Notation method:", `${notationConfig.code}@${notationConfig.version}`, notationConfig.source);
        console.log("📊 Notation steps:", notationConfig.steps.map(step => `${step.numero}.${step.key}:${step.poids}`).join(", "));

        // 3. TÉLÉCHARGER LES FICHIERS DE LA MÉTHODE (une seule fois)
        let notationFileInputs: OpenAIFileInput[] = [];

        try {
            notationFileInputs = await buildNotationFileInputs(supabase, notationConfig.files);
        } catch (fileError) {
            console.error("❌ Erreur téléchargement fichier de notation:", fileError);
            await updateSessionNotationStatus(supabase, effectiveSessionId, {
                notation_error: fileError instanceof Error ? fileError.message : "Erreur fichier de notation",
                notation_source: ROLEPLAY_NOTATION_SOURCE.legacyPdf,
                notation_status: ROLEPLAY_NOTATION_STATUS.failed,
            });
            return setCorsHeaders(
                NextResponse.json({
                    error: "Fichier de notation non trouvé dans Supabase",
                    details: fileError instanceof Error ? fileError.message : "Erreur inconnue"
                }, { status: 404 })
            );
        }

        // 4. RÉCUPÉRER LES PROMPTS DE LA MÉTHODE, AVEC FALLBACK notation.*
        const promptsMap = await loadNotationPrompts(supabase, notationConfig);
        const missingPrompts = ROLEPLAY_NOTATION_TABS.filter(tab => !promptsMap.has(tab));

        if (missingPrompts.length > 0) {
            await updateSessionNotationStatus(supabase, effectiveSessionId, {
                notation_error: `Prompts manquants: ${missingPrompts.map(tab => `notation.${tab}`).join(", ")}`,
                notation_source: ROLEPLAY_NOTATION_SOURCE.legacyPdf,
                notation_status: ROLEPLAY_NOTATION_STATUS.failed,
            });
            return setCorsHeaders(
                NextResponse.json({
                    error: "Prompts de notation non trouvés dans la base",
                    missing_prompts: missingPrompts.map(tab => `notation.${tab}`)
                }, { status: 404 })
            );
        }

        console.log("📊 Loaded prompts:", ROLEPLAY_NOTATION_TABS.filter(tab => promptsMap.has(tab)));

        // 4b. RÉCUPÉRER LES SCHÉMAS JSON STRUCTURÉS DE LA MÉTHODE, SI DISPONIBLES
        const outputSchemasMap = await loadNotationOutputSchemas(supabase, notationConfig);
        console.log("📊 Loaded output schemas:", ROLEPLAY_NOTATION_TABS.filter(tab => outputSchemasMap.has(tab)));

        // 5. APPELER OPENAI POUR CHAQUE TAB (en parallèle)
        const callOpenAI = async (tab: NotationTab): Promise<{ tab: NotationTab; result: Record<string, unknown> | null; error?: string }> => {
            const promptText = promptsMap.get(tab);

            if (!promptText) {
                console.error(`❌ Prompt non trouvé pour notation.${tab}`);
                return { tab, result: null, error: `Prompt non trouvé pour ${tab}` };
            }

            try {
                const outputSchema = outputSchemasMap.get(tab);
                const requestBody: Record<string, unknown> = {
                    model: "gpt-4.1",
                    instructions: promptText,
                    max_output_tokens: tab === "methodo" ? 24000 : 8000,
                    input: [
                        {
                            role: "user",
                            content: [
                                ...notationFileInputs,
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
                };

                if (outputSchema) {
                    requestBody.text = {
                        format: outputSchema,
                    };
                }

                const response = await fetch("https://api.openai.com/v1/responses", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error(`❌ Erreur OpenAI pour ${tab}:`, errorData);
                    return { tab, result: null, error: errorData.error?.message || "Erreur du service IA" };
                }

                const data = await response.json();

                // Parsing de la réponse
                let content = "";
                if (typeof data.output_text === "string") {
                    content = data.output_text;
                } else if (Array.isArray(data.output)) {
                    const outputTexts = data.output
                        .flatMap((outputItem: { content?: Array<{ type: string; text?: string }> }) => outputItem.content ?? [])
                        .filter((contentItem: { type: string; text?: string }) => contentItem.type === "output_text" && typeof contentItem.text === "string")
                        .map((contentItem: { text?: string }) => contentItem.text as string);
                    content = outputTexts.join("");
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
                    console.error(`❌ Réponse brute ${tab}:`, content.slice(0, 2000));
                    return { tab, result: null, error: "Format de réponse invalide" };
                }

            } catch (error) {
                console.error(`❌ Erreur appel OpenAI pour ${tab}:`, error);
                return { tab, result: null, error: error instanceof Error ? error.message : "Erreur inconnue" };
            }
        };

        // Lancer les onglets plus légers en parallèle, puis methodo seul.
        console.log("📊 Calling OpenAI for synthese and transcription in parallel...");
        const parallelResults = await Promise.all(ROLEPLAY_NOTATION_FOLLOWUP_TABS.map(tab => callOpenAI(tab)));

        console.log("📊 Calling OpenAI for methodo alone...");
        const methodoResult = await callOpenAI("methodo");
        const resultsByTab = new Map<NotationTab, Awaited<ReturnType<typeof callOpenAI>>>(
            [...parallelResults, methodoResult].map(result => [result.tab, result])
        );

        // 6. CONSTRUIRE LE JSON GLOBAL
        const notation: NotationPayload = {};
        const errors: string[] = [];

        for (const tab of ROLEPLAY_NOTATION_TABS) {
            const tabResult = resultsByTab.get(tab);
            const error = tabResult?.error;

            if (tab === "methodo") {
                if (isCompleteMethodoResult(tabResult?.result ?? null, notationConfig.steps.length)) {
                    notation.methodo = tabResult?.result as NotationPayload["methodo"];
                } else {
                    const methodoError = error || "Réponse methodo absente, invalide ou incomplète.";
                    errors.push(`methodo: ${methodoError}`);
                    notation.methodo = buildMethodoError(methodoError);
                }

                continue;
            }

            if (tabResult?.result) {
                notation[tab] = tabResult.result;
            } else {
                const tabError = error || `Réponse ${tab} absente, invalide ou incomplète.`;
                errors.push(`${tab}: ${tabError}`);
                notation[tab] = buildTabError(tab, tabError);
            }
        }

        // Injecter score_global + contributions selon les étapes de la méthode active.
        if (isCompleteMethodoResult(notation.methodo ?? null, notationConfig.steps.length)) {
            injectScoreGlobal(notation, notationConfig.steps, 1);
        } else {
            console.warn("⚠️ score_global non calculé car methodo est absent ou incomplet.");
        }

        console.log("📊 Notation global built:", Object.keys(notation));

        // 7. SAUVEGARDER EN DB
        if (Object.keys(notation).length > 0) {
            console.log("📊 Saving notation to session:", effectiveSessionId);

            const { error: updateError } = await supabase
                .from('sessions')
                .update({
                    notation_error: errors.length > 0 ? errors.join("\n") : null,
                    notation_generated_at: new Date().toISOString(),
                    notation_json: notation,
                    notation_source: ROLEPLAY_NOTATION_SOURCE.legacyPdf,
                    notation_status: ROLEPLAY_NOTATION_STATUS.completed,
                })
                .eq('id', effectiveSessionId);

            if (updateError) {
                console.error("❌ Erreur sauvegarde notation:", updateError);
                await updateSessionNotationStatus(supabase, effectiveSessionId, {
                    notation_error: updateError.message,
                    notation_source: ROLEPLAY_NOTATION_SOURCE.legacyPdf,
                    notation_status: ROLEPLAY_NOTATION_STATUS.failed,
                });
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
            .gte('duration_seconds', MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS)
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
