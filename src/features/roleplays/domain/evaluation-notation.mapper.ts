import {
    demoEvaluationKeyMoments,
    evaluation as fallbackEvaluation,
    type DiscourseMetric,
    type Evaluation,
    type EvaluationCriterion,
    type EvaluationKeyMoment,
    type EvaluationKeyMomentImpactType,
    type EvaluationStep,
    type StepReformulation,
    type StepStatus,
    type StepTranscriptLine,
    type TranscriptMessage,
} from "@/features/roleplays/data/evaluation";
import { limitRoleplaySynthesisItems } from "./roleplay-notation";
import {
    ROLEPLAY_CONSOLIDATION_THRESHOLD_PERCENT,
    ROLEPLAY_MASTERY_THRESHOLD_PERCENT,
} from "./roleplay-score";

type JsonRecord = Record<string, unknown>;

export interface NotationTranscriptMessage {
    content: string | null;
    role: string | null;
    timestamp: string | null;
}

const STEP_ICONS: EvaluationStep["icon"][] = ["phone", "message", "shield", "check"];
const IGNORED_METRIC_KEYS = new Set(["onglet", "status", "error", "message", "details"]);
const KEY_MOMENT_IMPACT_TYPES = new Set<EvaluationKeyMomentImpactType>([
    "moment_cle_negatif",
    "moment_cle_positif",
    "opportunite_manquee",
    "moment_sensible",
]);
const KEY_MOMENT_IMPACT_FALLBACK_LABELS: Record<EvaluationKeyMomentImpactType, string> = {
    moment_cle_negatif: "Impact négatif",
    moment_cle_positif: "Impact positif",
    moment_sensible: "Moment sensible",
    opportunite_manquee: "Opportunité manquée",
};

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): JsonRecord | null {
    return isRecord(value) ? value : null;
}

function asString(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function asNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
        const parsed = Number(value.replace("%", "").trim());
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function clampScore(value: number | null | undefined) {
    if (typeof value !== "number" || !Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
}

function getValuePath(root: JsonRecord | null, path: string[]): unknown {
    let current: unknown = root;
    for (const key of path) {
        if (!isRecord(current)) return undefined;
        current = current[key];
    }

    return current;
}

function firstString(root: JsonRecord | null, paths: string[][]): string | null {
    for (const path of paths) {
        const value = getValuePath(root, path);
        const text = asString(value);
        if (text) return text;

        if (isRecord(value)) {
            const nestedText = asString(value.texte) ?? asString(value.text) ?? asString(value.description);
            if (nestedText) return nestedText;
        }
    }

    return null;
}

function normalizeListItem(value: unknown): string | null {
    const direct = asString(value);
    if (direct) return direct;

    if (!isRecord(value)) return null;
    return (
        asString(value.texte) ??
        asString(value.text) ??
        asString(value.label) ??
        asString(value.title) ??
        asString(value.titre) ??
        asString(value.description)
    );
}

function listFromValue(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.map(normalizeListItem).filter((item): item is string => Boolean(item));
    }

    const item = normalizeListItem(value);
    return item ? [item] : [];
}

function firstList(root: JsonRecord | null, paths: string[][], fallback: string[]) {
    for (const path of paths) {
        const list = listFromValue(getValuePath(root, path));
        if (list.length > 0) return list;
    }

    return fallback;
}

export function extractNotationScore(notationJson: unknown): number | null {
    const notation = asRecord(notationJson);
    if (!notation) return null;

    const scoreGlobal = asRecord(notation.score_global);
    const synthese = asRecord(notation.synthese);
    const candidates = [
        scoreGlobal?.valeur,
        scoreGlobal?.score_process,
        notation.note_globale,
        notation.score,
        notation.global_score,
        notation.note,
        synthese?.note_globale,
        synthese?.score,
    ];

    for (const candidate of candidates) {
        const score = asNumber(candidate);
        if (score !== null) return clampScore(score);
    }

    return null;
}

export function extractNotationPersonaFeedback(notationJson: unknown): string | null {
    const synthese = asRecord(asRecord(notationJson)?.synthese);

    return firstString(synthese, [
        ["avis_persona_IA"],
        ["avis_persona_ia"],
        ["avis_persona"],
        ["ressenti_persona"],
    ]);
}

function stepStatus(score: number): StepStatus {
    if (score >= ROLEPLAY_MASTERY_THRESHOLD_PERCENT) return "À maintenir";
    if (score >= ROLEPLAY_CONSOLIDATION_THRESHOLD_PERCENT) return "À consolider";
    return "À renforcer";
}

function proofFromValue(value: unknown): EvaluationCriterion["preuvesObservees"][number] | null {
    const direct = asString(value);
    if (direct) {
        return { quote: direct, speaker: "Apprenant", time: "" };
    }

    if (!isRecord(value)) return null;

    const quote =
        asString(value.quote) ??
        asString(value.verbatim) ??
        asString(value.text) ??
        asString(value.texte) ??
        asString(value.content);

    if (!quote) return null;

    return {
        quote,
        speaker: asString(value.speaker) ?? asString(value.role) ?? "Apprenant",
        time: asString(value.time) ?? asString(value.timecode) ?? asString(value.timestamp) ?? "",
    };
}

function proofsFromValue(value: unknown): EvaluationCriterion["preuvesObservees"] {
    if (!Array.isArray(value)) return [];
    return value.map(proofFromValue).filter((proof): proof is EvaluationCriterion["preuvesObservees"][number] =>
        Boolean(proof),
    );
}

function joinList(value: unknown) {
    return listFromValue(value).join("\n");
}

function criterionDisplayName(criterion: JsonRecord, index: number) {
    return (
        firstString(criterion, [
            ["critere"],
            ["criterion"],
            ["libelle"],
            ["titre"],
            ["title"],
            ["nom"],
            ["name"],
        ]) ?? `Critère ${index + 1}`
    );
}

function criterionRef(criterion: JsonRecord) {
    return firstString(criterion, [["code"], ["ref"], ["reference"], ["criterion_ref"], ["critere_ref"]]);
}

function normalizeCriterionRef(value: string) {
    return value.trim().toLowerCase();
}

function detailedCriteriaFromStep(step: JsonRecord): JsonRecord[] {
    const directCriteria =
        getValuePath(step, ["grille_calcul", "criteres"]) ??
        getValuePath(step, ["criteres"]) ??
        getValuePath(step, ["criteria"]);

    return Array.isArray(directCriteria) ? directCriteria.filter(isRecord) : [];
}

function resolveCriterionNames(step: JsonRecord, values: string[]) {
    if (values.length === 0) return values;

    const namesByRef = new Map<string, string>();
    detailedCriteriaFromStep(step).forEach((criterion, index) => {
        const ref = criterionRef(criterion);
        if (!ref) return;
        namesByRef.set(normalizeCriterionRef(ref), criterionDisplayName(criterion, index));
    });

    return values.map((value) => namesByRef.get(normalizeCriterionRef(value)) ?? value);
}

function criteriaFromStep(step: JsonRecord): EvaluationCriterion[] {
    const directCriteria = detailedCriteriaFromStep(step);

    if (directCriteria.length > 0) {
        const criteria = directCriteria
            .map((criterion, index): EvaluationCriterion | null => {
                const name = criterionDisplayName(criterion, index);
                const score = asNumber(criterion.score_obtenu) ?? asNumber(criterion.score) ?? asNumber(criterion.note);
                const maxScore = asNumber(criterion.score_max) ?? asNumber(criterion.max_points);
                const scoreLabel =
                    score !== null && maxScore !== null
                        ? `${score}/${maxScore}`
                        : firstString(criterion, [["points"], ["score"], ["note"]]) ??
                          (score !== null ? `${clampScore(score)}/100` : "-");
                const advice = joinList(criterion.conseils_amelioration) ||
                    firstString(criterion, [["conseils"], ["conseil"], ["recommendation"], ["recommandation"]]) ||
                    "-";
                const verbatims = listFromValue(criterion.verbatim_preconise);

                return {
                    analyse:
                        firstString(criterion, [
                            ["analyse"],
                            ["analysis"],
                            ["justification_score"],
                            ["commentaire"],
                            ["commentaire_coach"],
                        ]) ??
                        "-",
                    competence:
                        firstString(criterion, [["competence"], ["compétence"], ["skill"], ["dimension"]]) ?? undefined,
                    conseils: advice,
                    critere: name,
                    points: scoreLabel,
                    preuvesAttendues:
                        firstString(criterion, [["preuves_attendues"], ["expected_evidence"], ["attendu"]]) ?? "-",
                    preuvesObservees: proofsFromValue(
                        getValuePath(criterion, ["preuves_observees"]) ?? getValuePath(criterion, ["observed_evidence"]),
                    ),
                    verbatim:
                        verbatims[0] ??
                        firstString(criterion, [["verbatim"], ["verbatim_preconise"], ["exemple_verbatim"]]) ??
                        "-",
                };
            })
            .filter((criterion): criterion is EvaluationCriterion => Boolean(criterion));

        if (criteria.length > 0) return criteria;
    }

    return [];
}

function criterionScorePercent(points: string): number | null {
    const value = points.trim();
    if (!value) return null;

    if (/valid/i.test(value)) return 100;
    if (/renforcer/i.test(value)) return 0;

    const ratio = value.match(/(-?\d+(?:[.,]\d+)?)\s*\/\s*(-?\d+(?:[.,]\d+)?)/);
    if (ratio) {
        const score = Number(ratio[1].replace(",", "."));
        const maxScore = Number(ratio[2].replace(",", "."));
        if (Number.isFinite(score) && Number.isFinite(maxScore) && maxScore > 0) {
            return clampScore((score / maxScore) * 100);
        }
    }

    const numeric = Number(value.replace("%", "").replace(",", ".").trim());
    return Number.isFinite(numeric) ? clampScore(numeric) : null;
}

function derivedCriterionSummaries(criteria: EvaluationCriterion[]) {
    const summaries = {
        ameliorer: [] as string[],
        reussis: [] as string[],
    };

    for (const criterion of criteria) {
        if (criterion.critere === "Analyse de l'étape") continue;

        const score = criterionScorePercent(criterion.points);
        if (score === null) continue;

        if (score >= 70) {
            summaries.reussis.push(criterion.critere);
        } else {
            summaries.ameliorer.push(criterion.critere);
        }
    }

    return summaries;
}

function speakerFromValue(value: unknown): StepTranscriptLine["speaker"] {
    const speaker = asString(value)
        ?.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    if (speaker === "user" || speaker === "you" || speaker === "apprenant" || speaker === "utilisateur") {
        return "you";
    }

    return "persona";
}

function timecodeStart(value: string | null) {
    return value?.split("-")[0]?.trim() || null;
}

function timecodeEnd(value: string | null) {
    return value?.split("-").slice(1).join("-").trim() || null;
}

function mapStepTranscript(step: JsonRecord): EvaluationStep["stepTranscript"] {
    const rawTranscript = getValuePath(step, ["transcript_etape"]) ?? getValuePath(step, ["step_transcript"]);
    if (!Array.isArray(rawTranscript)) return undefined;

    const lines = rawTranscript
        .map((line): StepTranscriptLine | null => {
            if (!isRecord(line)) {
                const text = asString(line);
                return text ? { speaker: "you", text } : null;
            }

            const text = firstString(line, [["texte"], ["text"], ["content"], ["message"]]);
            if (!text) return null;

            return {
                speaker: speakerFromValue(line.speaker ?? line.role),
                text,
            };
        })
        .filter((line): line is StepTranscriptLine => Boolean(line));

    if (lines.length === 0) return undefined;

    const timecodes = rawTranscript
        .map((line) => (isRecord(line) ? asString(line.timecode) ?? asString(line.time) : null))
        .filter((timecode): timecode is string => Boolean(timecode));

    return {
        end: asString(step.timecode_end) ?? timecodeEnd(timecodes[timecodes.length - 1] ?? null) ?? "",
        lines,
        start: asString(step.timecode_start) ?? timecodeStart(timecodes[0] ?? null) ?? "",
    };
}

function mapStepReformulations(step: JsonRecord): StepReformulation[] | undefined {
    const rawSuggestions =
        getValuePath(step, ["suggestions_reformulation"]) ??
        getValuePath(step, ["reformulations"]) ??
        getValuePath(step, ["suggestions"]);

    if (!Array.isArray(rawSuggestions)) return undefined;

    const suggestions = rawSuggestions
        .map((suggestion): StepReformulation | null => {
            if (!isRecord(suggestion)) return null;

            const original = firstString(suggestion, [["phrase_originale"], ["original"], ["source"]]);
            const improved = firstString(suggestion, [["phrase_suggestion"], ["suggestion"], ["reformulation"]]);
            const reason = firstString(suggestion, [["justification"], ["pourquoi"], ["why"]]);

            if (!original || !improved) return null;

            return {
                original,
                pourquoi: reason ?? "-",
                suggestion: improved,
            };
        })
        .filter((suggestion): suggestion is StepReformulation => Boolean(suggestion));

    return suggestions.length > 0 ? suggestions : undefined;
}

function mapMethodologySteps(notation: JsonRecord | null): EvaluationStep[] {
    const methodo = asRecord(notation?.methodo);
    const rawSteps = getValuePath(methodo, ["etapes"]);

    if (!Array.isArray(rawSteps)) return [];

    const steps = rawSteps
        .map((rawStep, index): EvaluationStep | null => {
            if (!isRecord(rawStep)) return null;

            const score = clampScore(asNumber(rawStep.score));
            const maxScore = asNumber(rawStep.score_max);
            const title =
                firstString(rawStep, [["titre"], ["title"], ["etape"], ["name"]]) ??
                fallbackEvaluation.steps[index]?.title ??
                `Étape ${index + 1}`;
            const number = Math.max(1, Math.round(asNumber(rawStep.numero) ?? index + 1));
            const criteresReussis = resolveCriterionNames(rawStep, listFromValue(rawStep.criteres_reussis));
            const criteresAAmeliorer = resolveCriterionNames(rawStep, listFromValue(rawStep.criteres_a_ameliorer));
            const criteria = criteriaFromStep(rawStep);
            const derivedCriteria = derivedCriterionSummaries(criteria);

            return {
                commentaireCoach:
                    firstString(rawStep, [["commentaire_coach"], ["commentaire"], ["coach_comment"]]) ?? undefined,
                criteria,
                criteresAAmeliorer:
                    criteresAAmeliorer.length > 0
                        ? criteresAAmeliorer
                        : derivedCriteria.ameliorer.length > 0
                          ? derivedCriteria.ameliorer
                          : undefined,
                criteresReussis:
                    criteresReussis.length > 0
                        ? criteresReussis
                        : derivedCriteria.reussis.length > 0
                          ? derivedCriteria.reussis
                          : undefined,
                icon: STEP_ICONS[index % STEP_ICONS.length],
                number,
                reformulations: mapStepReformulations(rawStep),
                score,
                stepTranscript: mapStepTranscript(rawStep),
                status: stepStatus(score),
                title,
                total: maxScore ? `${score}/${maxScore}` : `${score}%`,
            };
        })
        .filter((step): step is EvaluationStep => Boolean(step));

    return steps;
}

function labelFromKey(key: string) {
    return key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function metricValue(value: unknown): string | null {
    const directString = asString(value);
    if (directString) return directString;

    const directNumber = asNumber(value);
    if (directNumber !== null) return `${directNumber}${directNumber <= 100 ? "%" : ""}`;

    if (!isRecord(value)) return null;

    const score = asNumber(value.score) ?? asNumber(value.valeur) ?? asNumber(value.value);
    if (score !== null) return `${clampScore(score)}%`;

    return asString(value.texte) ?? asString(value.text);
}

function mapDiscourseMetrics(notation: JsonRecord | null): DiscourseMetric[] {
    const discours = asRecord(notation?.discours);
    if (!discours) return fallbackEvaluation.discourse;

    const indicators = getValuePath(discours, ["indicateurs"]) ?? getValuePath(discours, ["metrics"]);
    if (Array.isArray(indicators)) {
        const metrics = indicators
            .map((indicator): DiscourseMetric | null => {
                if (!isRecord(indicator)) return null;
                const title = firstString(indicator, [["titre"], ["title"], ["label"], ["nom"], ["name"]]);
                const value = metricValue(indicator.valeur ?? indicator.value ?? indicator.score);
                if (!title || !value) return null;
                return {
                    title,
                    value,
                    subtitle: firstString(indicator, [["commentaire"], ["subtitle"], ["description"]]) ?? undefined,
                };
            })
            .filter((metric): metric is DiscourseMetric => Boolean(metric));

        if (metrics.length > 0) return metrics;
    }

    const metrics = Object.entries(discours)
        .filter(([key]) => !IGNORED_METRIC_KEYS.has(key))
        .map(([key, value]): DiscourseMetric | null => {
            const metric = metricValue(value);
            if (!metric) return null;
            const record = asRecord(value);
            return {
                title: record ? firstString(record, [["titre"], ["title"], ["label"]]) ?? labelFromKey(key) : labelFromKey(key),
                value: metric,
                subtitle: record ? firstString(record, [["commentaire"], ["subtitle"], ["description"]]) ?? undefined : undefined,
            };
        })
        .filter((metric): metric is DiscourseMetric => Boolean(metric))
        .slice(0, 6);

    return metrics.length > 0 ? metrics : fallbackEvaluation.discourse;
}

function formatTime(value: string | null) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).format(date);
}

function mapTranscript(messages: NotationTranscriptMessage[]): TranscriptMessage[] {
    const transcript = messages
        .filter((message) => asString(message.content))
        .map((message) => ({
            speaker: message.role === "assistant" ? ("persona" as const) : ("you" as const),
            text: message.content?.trim() ?? "",
            time: formatTime(message.timestamp),
        }));

    return transcript.length > 0 ? transcript : fallbackEvaluation.transcript;
}

function percentFromWeight(value: unknown): number | null {
    const weight = asNumber(value);
    if (weight === null) return null;
    return weight <= 1 ? Math.round(weight * 10000) / 100 : Math.round(weight * 100) / 100;
}

function mapScoreDetails(notation: JsonRecord | null, steps: EvaluationStep[]): Evaluation["scoreDetails"] {
    const scoreGlobal = asRecord(notation?.score_global);
    const detailCalcul = getValuePath(scoreGlobal, ["detail_calcul"]);
    if (!Array.isArray(detailCalcul)) return undefined;

    type ScoreDetailRow = NonNullable<Evaluation["scoreDetails"]>["rows"][number];

    const rows = detailCalcul
        .map((row, index): ScoreDetailRow | null => {
            if (!isRecord(row)) return null;

            const step = steps[index];
            const poids = percentFromWeight(row.poids);
            const score = asNumber(row.score_etape) ?? asNumber(row.score) ?? step?.score;
            const contribution = asNumber(row.contribution) ?? asNumber(row.contribution_score_global);

            if (poids === null || score === null || contribution === null) return null;

            return {
                contribution,
                poids,
                score: clampScore(score),
                stepNumber: step?.number ?? index + 1,
                title: firstString(row, [["etape"], ["title"], ["titre"]]) ?? step?.title ?? `Étape ${index + 1}`,
            };
        })
        .filter((row): row is ScoreDetailRow => Boolean(row));

    if (rows.length === 0) return undefined;

    return {
        rows,
        total: clampScore(asNumber(scoreGlobal?.valeur) ?? asNumber(scoreGlobal?.score_process) ?? rows.reduce(
            (sum, row) => sum + row.contribution,
            0,
        )),
    };
}

function planRecordsFromValue(value: unknown): JsonRecord[] {
    if (Array.isArray(value)) {
        return value.filter(isRecord);
    }

    const record = asRecord(value);
    return record ? [record] : [];
}

function planStepNumber(plan: JsonRecord) {
    return Math.max(
        1,
        Math.round(
            asNumber(plan.numero) ??
                asNumber(plan.etape_numero) ??
                asNumber(plan.step_number) ??
                asNumber(plan.etape) ??
                1,
        ),
    );
}

function fallbackPlanStep(steps: EvaluationStep[]): Evaluation["planEtape"] {
    const weakestStep = [...steps].sort((a, b) => a.score - b.score)[0];
    if (!weakestStep) return fallbackEvaluation.planEtape;

    return {
        number: weakestStep.number,
        text:
            weakestStep.criteria.find((criterion) => criterion.conseils && criterion.conseils !== "-")?.conseils ??
            fallbackEvaluation.planEtape.text,
        title: weakestStep.title,
    };
}

function mapPlanStepRecord(plan: JsonRecord, steps: EvaluationStep[]): Evaluation["planEtape"] {
    const number = planStepNumber(plan);

    return {
        number,
        text:
            firstString(plan, [["texte"], ["text"], ["description"], ["action"], ["recommandation"]]) ??
            fallbackEvaluation.planEtape.text,
        title:
            firstString(plan, [["etape_titre"], ["titre"], ["title"], ["etape"], ["name"]]) ??
            steps.find((step) => step.number === number)?.title ??
            fallbackEvaluation.planEtape.title,
    };
}

function mapPlanSteps(synthese: JsonRecord | null, steps: EvaluationStep[]): NonNullable<Evaluation["planEtapes"]> {
    const planRecords = [
        ...planRecordsFromValue(getValuePath(synthese, ["plan_de_progres"])),
        ...planRecordsFromValue(getValuePath(synthese, ["plan_progres"])),
        ...planRecordsFromValue(getValuePath(synthese, ["plan_action"])),
    ];

    if (planRecords.length > 0) {
        const scoreByStepNumber = new Map(steps.map((step) => [step.number, step.score]));
        return limitRoleplaySynthesisItems(
            planRecords
                .map((plan) => mapPlanStepRecord(plan, steps))
                .sort((first, second) => {
                    const firstScore = scoreByStepNumber.get(first.number);
                    const secondScore = scoreByStepNumber.get(second.number);

                    if (firstScore === undefined && secondScore === undefined) return first.number - second.number;
                    if (firstScore === undefined) return 1;
                    if (secondScore === undefined) return -1;
                    return firstScore - secondScore || first.number - second.number;
                }),
        );
    }

    return [fallbackPlanStep(steps)];
}

function normalizeKeyMomentImpactType(value: unknown): EvaluationKeyMomentImpactType {
    const impactType = asString(value) as EvaluationKeyMomentImpactType | null;

    return impactType && KEY_MOMENT_IMPACT_TYPES.has(impactType)
        ? impactType
        : "moment_sensible";
}

function formatKeyMomentTimecode(value: string | null) {
    if (!value) return "";

    const normalized = value.trim().replace(/^\[|\]$/g, "");
    const parts = normalized.split(":");

    return parts.length === 3 ? `${parts[1]}:${parts[2]}` : normalized;
}

function mapKeyMomentTranscript(value: unknown): EvaluationKeyMoment["transcript"] {
    if (!Array.isArray(value)) return [];

    return value.flatMap((item) => {
        if (!isRecord(item)) return [];

        const text = firstString(item, [["verbatim"], ["texte"], ["text"]]);
        if (!text) return [];

        return [{
            speaker: firstString(item, [["speaker"], ["role"], ["locuteur"]]) ?? "Apprenant",
            text,
            time: formatKeyMomentTimecode(firstString(item, [["timecode"], ["time"], ["timestamp"]])),
        }];
    });
}

function mapKeyMoments(synthese: JsonRecord | null): EvaluationKeyMoment[] {
    const value = getValuePath(synthese, ["moments_cles"]);
    if (!Array.isArray(value)) return demoEvaluationKeyMoments;

    const moments = value.flatMap((item, index): EvaluationKeyMoment[] => {
        if (!isRecord(item)) return [];

        const impactType = normalizeKeyMomentImpactType(item.type_impact);
        const transcript = mapKeyMomentTranscript(item.extrait_transcript);
        const stepNumber = asNumber(item.etape_numero);
        const stepTitle = asString(item.etape_titre);
        const title = asString(item.titre) ?? asString(item.description) ?? `Moment clé ${index + 1}`;

        return [{
            clientPerception: asString(item.perception_client) ?? "-",
            competencies: listFromValue(item.competences_associees),
            description: asString(item.description) ?? title,
            id: `notation-key-moment-${index + 1}`,
            impact: asString(item.impact_label) ?? KEY_MOMENT_IMPACT_FALLBACK_LABELS[impactType],
            impactOnObjective: asString(item.impact_sur_objectif) ?? "-",
            impactType,
            number: index + 1,
            reason: asString(item.pourquoi_moment_cle) ?? "-",
            recommendedResponse: asString(item.reponse_alternative_recommandee) ?? "-",
            role: asString(item.role) ?? "",
            stepLabel:
                stepNumber !== null
                    ? `Étape ${Math.max(1, Math.round(stepNumber))}${stepTitle ? ` : ${stepTitle}` : ""}`
                    : stepTitle ?? "Étape non renseignée",
            time: formatKeyMomentTimecode(asString(item.timecode_debut)) || transcript[0]?.time || "",
            title,
            transcript,
        }];
    });

    return limitRoleplaySynthesisItems(moments.length > 0 ? moments : demoEvaluationKeyMoments);
}

export function mapNotationToEvaluation(
    notationJson: unknown,
    messages: NotationTranscriptMessage[] = [],
): Evaluation {
    const notation = asRecord(notationJson);
    if (!notation) {
        return {
            ...fallbackEvaluation,
            steps: [],
            transcript: mapTranscript(messages),
        };
    }

    const synthese = asRecord(notation.synthese);
    const scoreGlobal = asRecord(notation.score_global);
    const steps = mapMethodologySteps(notation);
    const planEtapes = mapPlanSteps(synthese, steps);

    return {
        axesAmelioration: limitRoleplaySynthesisItems(
            firstList(
                synthese,
                [
                    ["axes_amelioration"],
                    ["axes_d_amelioration"],
                    ["points_a_ameliorer"],
                    ["ameliorations"],
                ],
                fallbackEvaluation.axesAmelioration,
            ),
        ),
        coachAppreciation:
            firstString(synthese, [["appreciation_globale"], ["coach_appreciation"], ["synthese"], ["resume"]]) ??
            firstString(scoreGlobal, [["interpretation"]]) ??
            fallbackEvaluation.coachAppreciation,
        discourse: mapDiscourseMetrics(notation),
        momentsCles: mapKeyMoments(synthese),
        personaAvis: extractNotationPersonaFeedback(notation) ?? fallbackEvaluation.personaAvis,
        planEtape: planEtapes[0] ?? fallbackEvaluation.planEtape,
        planEtapes,
        pointsPositifs: limitRoleplaySynthesisItems(
            firstList(
                synthese,
                [["points_positifs"], ["reussites_observees"], ["forces"], ["points_forts"]],
                fallbackEvaluation.pointsPositifs,
            ),
        ),
        prioriteStrategique:
            firstString(synthese, [["priorite_strategique"], ["priorite"], ["recommandation_prioritaire"]]) ??
            fallbackEvaluation.prioriteStrategique,
        scoreDetails: mapScoreDetails(notation, steps),
        steps,
        transcript: mapTranscript(messages),
    };
}
