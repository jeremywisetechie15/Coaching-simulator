import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuizDetail, QuizListItem } from "@/features/evaluations/domain/quiz";
import { NotFoundError } from "@/lib/server/errors";
import {
    mapQuizRowsToDetail,
    mapQuizRowToListItem,
    type QuizAttachmentRow,
    type QuizChoiceRow,
    type QuizQuestionRow,
    type QuizRow,
    type QuizStepCompetencyRow,
    type QuizStepRow,
} from "./quiz.mapper";
import {
    QUIZ_ATTACHMENT_SELECT,
    QUIZ_CHOICE_SELECT,
    QUIZ_QUESTION_SELECT,
    QUIZ_SELECT,
    QUIZ_STEP_COMPETENCY_SELECT,
    QUIZ_STEP_SELECT,
} from "./quiz.persistence";

async function withMethodNames(supabase: SupabaseClient, rows: QuizRow[]) {
    const methodIds = Array.from(
        new Set(rows.map((row) => row.method_id).filter((id): id is string => Boolean(id))),
    );

    if (methodIds.length === 0) {
        return rows;
    }

    const { data, error } = await supabase
        .from("methods")
        .select("id, name")
        .in("id", methodIds);

    if (error) {
        throw error;
    }

    const methodNameById = new Map(
        ((data ?? []) as Array<{ id: string; name?: string | null }>).map((method) => [
            method.id,
            method.name ?? null,
        ]),
    );

    return rows.map((row) => ({
        ...row,
        method_name: row.method_id ? methodNameById.get(row.method_id) ?? null : null,
    }));
}

export async function fetchQuizList(supabase: SupabaseClient): Promise<QuizListItem[]> {
    const { data: rows, error } = await supabase
        .from("quizzes")
        .select(QUIZ_SELECT)
        .neq("status", "archived")
        .order("updated_at", { ascending: false });

    if (error) {
        throw error;
    }

    const quizRows = await withMethodNames(supabase, (rows ?? []) as QuizRow[]);
    const quizIds = quizRows.map((row) => row.id);
    const stepIdToQuizId = new Map<string, string>();
    const questionCountByQuizId = new Map<string, number>();

    if (quizIds.length > 0) {
        const { data: stepRows, error: stepError } = await supabase
            .from("quiz_steps")
            .select("id, quiz_id")
            .in("quiz_id", quizIds);

        if (stepError) {
            throw stepError;
        }

        for (const step of (stepRows ?? []) as Array<{ id: string; quiz_id: string }>) {
            stepIdToQuizId.set(step.id, step.quiz_id);
        }
    }

    const stepIds = Array.from(stepIdToQuizId.keys());
    if (stepIds.length > 0) {
        const { data: questionRows, error: questionError } = await supabase
            .from("quiz_questions")
            .select("step_id")
            .in("step_id", stepIds);

        if (questionError) {
            throw questionError;
        }

        for (const question of (questionRows ?? []) as Array<{ step_id: string }>) {
            const quizId = stepIdToQuizId.get(question.step_id);
            if (!quizId) continue;
            questionCountByQuizId.set(quizId, (questionCountByQuizId.get(quizId) ?? 0) + 1);
        }
    }

    return quizRows.map((row) => mapQuizRowToListItem(row, questionCountByQuizId.get(row.id) ?? 0));
}

export async function fetchQuizDetail(
    supabase: SupabaseClient,
    quizId: string,
): Promise<QuizDetail> {
    const { data: row, error } = await supabase
        .from("quizzes")
        .select(QUIZ_SELECT)
        .eq("id", quizId)
        .maybeSingle<QuizRow>();

    if (error) {
        throw error;
    }

    if (!row) {
        throw new NotFoundError("Quiz introuvable.");
    }

    const [rowWithMethodName] = await withMethodNames(supabase, [row]);

    const { data: stepRows, error: stepsError } = await supabase
        .from("quiz_steps")
        .select(QUIZ_STEP_SELECT)
        .eq("quiz_id", quizId)
        .order("step_order", { ascending: true });

    if (stepsError) {
        throw stepsError;
    }

    const steps = (stepRows ?? []) as QuizStepRow[];
    const stepIds = steps.map((step) => step.id);

    if (stepIds.length === 0) {
        return mapQuizRowsToDetail(rowWithMethodName, [], [], [], [], []);
    }

    const [
        { data: competencyRows, error: competenciesError },
        { data: questionRows, error: questionsError },
    ] = await Promise.all([
        supabase
            .from("quiz_step_competencies")
            .select(QUIZ_STEP_COMPETENCY_SELECT)
            .in("step_id", stepIds),
        supabase
            .from("quiz_questions")
            .select(QUIZ_QUESTION_SELECT)
            .in("step_id", stepIds)
            .order("question_order", { ascending: true }),
    ]);

    if (competenciesError) {
        throw competenciesError;
    }

    if (questionsError) {
        throw questionsError;
    }

    const questions = (questionRows ?? []) as QuizQuestionRow[];
    const questionIds = questions.map((question) => question.id);

    if (questionIds.length === 0) {
        return mapQuizRowsToDetail(
            rowWithMethodName,
            steps,
            (competencyRows ?? []) as QuizStepCompetencyRow[],
            [],
            [],
            [],
        );
    }

    const [
        { data: choiceRows, error: choicesError },
        { data: attachmentRows, error: attachmentsError },
    ] = await Promise.all([
        supabase
            .from("quiz_question_choices")
            .select(QUIZ_CHOICE_SELECT)
            .in("question_id", questionIds)
            .order("choice_order", { ascending: true }),
        supabase
            .from("quiz_question_attachments")
            .select(QUIZ_ATTACHMENT_SELECT)
            .in("question_id", questionIds)
            .order("attachment_order", { ascending: true }),
    ]);

    if (choicesError) {
        throw choicesError;
    }

    if (attachmentsError) {
        throw attachmentsError;
    }

    return mapQuizRowsToDetail(
        rowWithMethodName,
        steps,
        (competencyRows ?? []) as QuizStepCompetencyRow[],
        questions,
        (choiceRows ?? []) as QuizChoiceRow[],
        (attachmentRows ?? []) as QuizAttachmentRow[],
    );
}
