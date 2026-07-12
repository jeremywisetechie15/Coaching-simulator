import type { SupabaseClient } from "@supabase/supabase-js";
import { NotFoundError } from "@/lib/server/errors";

interface ScenarioRow {
    category: string | null;
    context: string | null;
    description: string | null;
    difficulty_level: string | null;
    domain: string | null;
    id: string;
    method_id: string | null;
    objective: string | null;
    obstacles: string | null;
    persona_id: string | null;
    title: string;
}

interface PersonaRow {
    age: number | null;
    annual_revenue: string | null;
    company: string | null;
    company_description: string | null;
    disc_profile: string | null;
    employee_count: number | null;
    industry: string | null;
    name: string;
    role: string | null;
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

export interface RoleplayCoachContext {
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
        company: string;
        companyDescription: string;
        discProfile: string;
        employeeCount: number | null;
        industry: string;
        name: string;
        role: string;
    } | null;
    scenario: {
        category: string;
        context: string;
        description: string;
        difficulty: string;
        domain: string;
        id: string;
        objective: string;
        obstacles: string;
        title: string;
    };
    selectedStep: RoleplayCoachMethodStepContext | null;
}

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
        .select("name, role, company, age, industry, employee_count, annual_revenue, company_description, disc_profile")
        .eq("id", personaId)
        .maybeSingle<PersonaRow>();

    if (error) throw error;
    return data;
}

export async function getRoleplayCoachContext(
    supabase: SupabaseClient,
    scenarioId: string,
    selectedStepOrder?: number,
): Promise<RoleplayCoachContext> {
    const { data: scenario, error: scenarioError } = await supabase
        .from("scenarios")
        .select("id, title, description, context, objective, obstacles, difficulty_level, domain, category, method_id, persona_id")
        .eq("id", scenarioId)
        .maybeSingle<ScenarioRow>();

    if (scenarioError) throw scenarioError;
    if (!scenario) throw new NotFoundError("Roleplay introuvable.");

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
        persona: persona ? {
            age: persona.age,
            annualRevenue: text(persona.annual_revenue),
            company: text(persona.company),
            companyDescription: text(persona.company_description),
            discProfile: text(persona.disc_profile),
            employeeCount: persona.employee_count,
            industry: text(persona.industry),
            name: persona.name,
            role: text(persona.role),
        } : null,
        scenario: {
            category: text(scenario.category),
            context: text(scenario.context),
            description: text(scenario.description),
            difficulty: text(scenario.difficulty_level),
            domain: text(scenario.domain),
            id: scenario.id,
            objective: text(scenario.objective),
            obstacles: text(scenario.obstacles),
            title: scenario.title,
        },
        selectedStep,
    };
}

export function serializeRoleplayCoachContext(context: RoleplayCoachContext) {
    if (context.selectedStep) {
        return JSON.stringify({
            method: context.method,
            persona: context.persona,
            scenario: context.scenario,
            selectedStep: context.selectedStep,
        }, null, 2);
    }

    return JSON.stringify(context, null, 2);
}
