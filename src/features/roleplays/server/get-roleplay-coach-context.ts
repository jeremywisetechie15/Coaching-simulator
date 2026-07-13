import type { SupabaseClient } from "@supabase/supabase-js";
import { NotFoundError } from "@/lib/server/errors";
import { getPersonaAvatarPublicUrl } from "@/features/personas/domain/persona-list";
import {
    getRoleplayScorecardDefinition,
    type RoleplayScorecardDefinition,
} from "./get-roleplay-scorecard-definition";

const PERSONA_DYNAMIC_CONTEXT_PRIORITY = `

SOURCE DE VÉRITÉ DYNAMIQUE:
- Les instructions du persona définissent son identité, sa personnalité et son comportement général.
- Le bloc JSON "CONTEXTE DYNAMIQUE DE LA SIMULATION" définit le cas précis à jouer et prévaut sur tout exemple statique contradictoire.
- Incarne exclusivement le persona face à l'apprenant. Ne deviens jamais coach, formateur ou évaluateur.
- Respecte le contexte, l'objectif, les difficultés et les objections du scénario. N'invente aucune information métier absente des sources fournies.`;

interface ScenarioRow {
    background_image_path: string | null;
    category: string | null;
    context: string | null;
    description: string | null;
    difficulty_level: string | null;
    disc_profile: string | null;
    domain: string | null;
    id: string;
    method_id: string | null;
    objective: string | null;
    obstacles: string | null;
    persona_id: string | null;
    scorecard_id: string | null;
    title: string;
}

interface PersonaRow {
    age: number | null;
    annual_revenue: string | null;
    avatar_url: string | null;
    children_count: number | null;
    company: string | null;
    company_description: string | null;
    diploma: string | null;
    disc_profile: string | null;
    employee_count: number | null;
    industry: string | null;
    marital_status: string | null;
    name: string;
    nationality: string | null;
    net_income_before_tax: string | null;
    residence_country: string | null;
    role: string | null;
    system_instructions: string;
    voice_id: string | null;
}

interface MethodRow {
    challenges: string[] | null;
    code: string | null;
    description: string | null;
    id: string;
    name: string;
    objectives: string[] | null;
    version: string | null;
}

interface MethodStepRow {
    best_practices: string[] | null;
    code: string | null;
    id: string;
    objectives: string[] | null;
    pitfalls: string[] | null;
    posture: string[] | null;
    step_order: number;
    summary: string | null;
    takeaway: string | null;
    title: string;
    verbatims: string[] | null;
    weight: number | string | null;
}

export interface RoleplayCoachMethodStepContext {
    bestPractices: string[];
    code: string;
    id: string;
    objectives: string[];
    order: number;
    pitfalls: string[];
    posture: string[];
    summary: string;
    takeaway: string;
    title: string;
    verbatims: string[];
    weight: number | null;
}

export interface RoleplayRuntimeContext {
    method: {
        challenges: string[];
        code: string;
        description: string;
        id: string;
        name: string;
        objectives: string[];
        version: string;
    } | null;
    methodSteps: RoleplayCoachMethodStepContext[];
    persona: {
        age: number | null;
        annualRevenue: string;
        avatarUrl: string | null;
        childrenCount: number | null;
        company: string;
        companyDescription: string;
        diploma: string;
        discProfile: string;
        employeeCount: number | null;
        industry: string;
        maritalStatus: string;
        name: string;
        nationality: string;
        netIncomeBeforeTax: string;
        residenceCountry: string;
        role: string;
        systemInstructions: string;
        voiceId: string | null;
    } | null;
    scenario: {
        backgroundImagePath: string | null;
        category: string;
        context: string;
        description: string;
        difficulty: string;
        discProfile: string;
        domain: string;
        id: string;
        objective: string;
        obstacles: string;
        title: string;
    };
    scorecard: RoleplayScorecardDefinition | null;
    selectedStep: RoleplayCoachMethodStepContext | null;
}

export type RoleplayCoachContext = RoleplayRuntimeContext;

function text(value: string | null | undefined) {
    return value?.trim() ?? "";
}

function list(value: string[] | null | undefined) {
    return Array.isArray(value) ? value.map((item) => item.trim()).filter(Boolean) : [];
}

function mapMethodStep(row: MethodStepRow): RoleplayCoachMethodStepContext {
    const weight = Number(row.weight);

    return {
        bestPractices: list(row.best_practices),
        code: text(row.code),
        id: row.id,
        objectives: list(row.objectives),
        order: row.step_order,
        pitfalls: list(row.pitfalls),
        posture: list(row.posture),
        summary: text(row.summary),
        takeaway: text(row.takeaway),
        title: row.title,
        verbatims: list(row.verbatims),
        weight: Number.isFinite(weight) ? weight : null,
    };
}

async function getMethod(supabase: SupabaseClient, methodId: string | null) {
    if (!methodId) return null;

    const { data, error } = await supabase
        .from("methods")
        .select("id, code, name, version, description, objectives, challenges")
        .eq("id", methodId)
        .maybeSingle<MethodRow>();

    if (error) throw error;
    return data;
}

async function getMethodSteps(
    supabase: SupabaseClient,
    methodId: string | null,
    selectedStepOrder?: number,
) {
    if (!methodId) return [];

    let query = supabase
        .from("method_steps")
        .select("id, step_order, code, title, weight, summary, takeaway, objectives, best_practices, pitfalls, posture, verbatims")
        .eq("method_id", methodId);

    if (selectedStepOrder) {
        query = query.eq("step_order", selectedStepOrder);
    }

    const { data, error } = await query
        .order("step_order", { ascending: true })
        .returns<MethodStepRow[]>();

    if (error) throw error;
    return data ?? [];
}

async function getPersona(supabase: SupabaseClient, personaId: string | null) {
    if (!personaId) return null;

    const { data, error } = await supabase
        .from("personas")
        .select("name, role, company, age, industry, employee_count, annual_revenue, company_description, disc_profile, children_count, diploma, marital_status, nationality, net_income_before_tax, residence_country, system_instructions, voice_id, avatar_url")
        .eq("id", personaId)
        .maybeSingle<PersonaRow>();

    if (error) throw error;
    return data;
}

async function getScenario(supabase: SupabaseClient, scenarioId: string) {
    const { data, error } = await supabase
        .from("scenarios")
        .select("id, title, description, context, objective, obstacles, difficulty_level, domain, category, disc_profile, method_id, persona_id, scorecard_id, background_image_path")
        .eq("id", scenarioId)
        .maybeSingle<ScenarioRow>();

    if (error) throw error;
    if (!data) throw new NotFoundError("Roleplay introuvable.");
    return data;
}

function mapPersona(persona: PersonaRow | null): RoleplayRuntimeContext["persona"] {
    if (!persona) return null;

    return {
        age: persona.age,
        annualRevenue: text(persona.annual_revenue),
        avatarUrl: getPersonaAvatarPublicUrl(persona.avatar_url),
        childrenCount: persona.children_count,
        company: text(persona.company),
        companyDescription: text(persona.company_description),
        diploma: text(persona.diploma),
        discProfile: text(persona.disc_profile),
        employeeCount: persona.employee_count,
        industry: text(persona.industry),
        maritalStatus: text(persona.marital_status),
        name: persona.name,
        nationality: text(persona.nationality),
        netIncomeBeforeTax: text(persona.net_income_before_tax),
        residenceCountry: text(persona.residence_country),
        role: text(persona.role),
        systemInstructions: persona.system_instructions,
        voiceId: persona.voice_id,
    };
}

function mapScenario(scenario: ScenarioRow): RoleplayRuntimeContext["scenario"] {
    return {
        backgroundImagePath: scenario.background_image_path,
        category: text(scenario.category),
        context: text(scenario.context),
        description: text(scenario.description),
        difficulty: text(scenario.difficulty_level),
        discProfile: text(scenario.disc_profile),
        domain: text(scenario.domain),
        id: scenario.id,
        objective: text(scenario.objective),
        obstacles: text(scenario.obstacles),
        title: scenario.title,
    };
}

export async function getRoleplayPersonaContext(
    supabase: SupabaseClient,
    scenarioId: string,
): Promise<RoleplayRuntimeContext> {
    const scenario = await getScenario(supabase, scenarioId);
    const persona = await getPersona(supabase, scenario.persona_id);

    return {
        method: null,
        methodSteps: [],
        persona: mapPersona(persona),
        scenario: mapScenario(scenario),
        scorecard: null,
        selectedStep: null,
    };
}

export async function getRoleplayRuntimeContext(
    supabase: SupabaseClient,
    scenarioId: string,
    selectedStepOrder?: number,
): Promise<RoleplayRuntimeContext> {
    const scenario = await getScenario(supabase, scenarioId);

    const [method, methodStepRows, persona] = await Promise.all([
        getMethod(supabase, scenario.method_id),
        getMethodSteps(supabase, scenario.method_id, selectedStepOrder),
        getPersona(supabase, scenario.persona_id),
    ]);
    const methodSteps = methodStepRows.map(mapMethodStep);
    const selectedStep = selectedStepOrder
        ? methodSteps.find((methodStep) => methodStep.order === selectedStepOrder) ?? null
        : null;

    if (selectedStepOrder && !selectedStep) {
        throw new NotFoundError("Étape de méthode introuvable pour ce roleplay.");
    }

    const scorecard = await getRoleplayScorecardDefinition(
        supabase,
        scenario.scorecard_id,
        selectedStep?.id,
    );

    return {
        method: method ? {
            challenges: list(method.challenges),
            code: text(method.code),
            description: text(method.description),
            id: method.id,
            name: method.name,
            objectives: list(method.objectives),
            version: text(method.version),
        } : null,
        methodSteps,
        persona: mapPersona(persona),
        scenario: mapScenario(scenario),
        scorecard,
        selectedStep,
    };
}

export const getRoleplayCoachContext = getRoleplayRuntimeContext;

function serializePersonaBusinessContext(persona: NonNullable<RoleplayRuntimeContext["persona"]>) {
    return {
        age: persona.age,
        annualRevenue: persona.annualRevenue,
        childrenCount: persona.childrenCount,
        company: persona.company,
        companyDescription: persona.companyDescription,
        diploma: persona.diploma,
        discProfile: persona.discProfile,
        employeeCount: persona.employeeCount,
        industry: persona.industry,
        maritalStatus: persona.maritalStatus,
        name: persona.name,
        nationality: persona.nationality,
        netIncomeBeforeTax: persona.netIncomeBeforeTax,
        residenceCountry: persona.residenceCountry,
        role: persona.role,
    };
}

function serializeScenarioBusinessContext(scenario: RoleplayRuntimeContext["scenario"]) {
    return {
        category: scenario.category,
        context: scenario.context,
        description: scenario.description,
        difficulty: scenario.difficulty,
        discProfile: scenario.discProfile,
        domain: scenario.domain,
        objective: scenario.objective,
        obstacles: scenario.obstacles,
        title: scenario.title,
    };
}

function serializeScorecardBusinessContext(scorecard: RoleplayScorecardDefinition | null) {
    if (!scorecard) return null;

    return {
        category: scorecard.category,
        description: scorecard.description,
        domain: scorecard.domain,
        level: scorecard.level,
        name: scorecard.name,
        steps: scorecard.steps.map((step) => ({
            criteria: step.criteria.map((criterion) => ({
                aiInstruction: criterion.aiInstruction,
                criterionKey: criterion.criterionKey,
                dimension: criterion.dimension,
                dimensionItemLabel: criterion.dimensionItemLabel,
                expectedEvidence: criterion.expectedEvidence,
                maxPoints: criterion.maxPoints,
                order: criterion.order,
                skillName: criterion.skillName,
                verbatim: criterion.verbatim,
            })),
            order: step.order,
            title: step.title,
        })),
    };
}

export function serializeRoleplayPersonaSimulationContext(context: RoleplayRuntimeContext) {
    return JSON.stringify({
        persona: context.persona ? serializePersonaBusinessContext(context.persona) : null,
        scenario: serializeScenarioBusinessContext(context.scenario),
    });
}

export function buildRoleplayPersonaSimulationInstructions(context: RoleplayRuntimeContext) {
    if (!context.persona) {
        throw new NotFoundError("Persona introuvable pour ce roleplay.");
    }

    return `IMPORTANT: Dès que la conversation commence, incarne immédiatement le persona et ouvre l'échange de manière naturelle conformément au scénario. N'attends pas que l'utilisateur parle en premier.

INSTRUCTIONS SYSTÈME DU PERSONA:
---
${context.persona.systemInstructions}
---
${PERSONA_DYNAMIC_CONTEXT_PRIORITY}

CONTEXTE DYNAMIQUE DE LA SIMULATION:
${serializeRoleplayPersonaSimulationContext(context)}`;
}

export function serializeRoleplayCoachContext(context: RoleplayCoachContext) {
    const persona = context.persona ? serializePersonaBusinessContext(context.persona) : null;
    const scenario = serializeScenarioBusinessContext(context.scenario);
    const scorecard = serializeScorecardBusinessContext(context.scorecard);

    if (context.selectedStep) {
        return JSON.stringify({
            method: context.method,
            persona,
            scenario,
            scorecard,
            selectedStep: context.selectedStep,
        }, null, 2);
    }

    return JSON.stringify({
        method: context.method,
        methodSteps: context.methodSteps,
        persona,
        scenario,
        scorecard,
        selectedStep: context.selectedStep,
    }, null, 2);
}
