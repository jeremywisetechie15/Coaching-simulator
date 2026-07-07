import { requireAdmin } from "@/features/auth/server";
import type { QuizDetail } from "@/features/evaluations/domain/quiz";
import type { SaveQuizDto } from "@/features/evaluations/dto/save-quiz.dto";
import { NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchQuizDetail } from "./quiz-query";
import { createQuizUpdate, QUIZ_SELECT } from "./quiz.persistence";
import { replaceQuizChildren } from "./save-quiz-children";
import type { QuizRow } from "./quiz.mapper";
import {
    cleanupUploadedQuizStorageObjects,
    type QuizUploadFilesByClientId,
    type UploadedQuizStorageObject,
} from "./quiz-upload-files";

export async function updateQuiz(
    quizId: string,
    input: SaveQuizDto,
    uploadFilesByClientId: QuizUploadFilesByClientId = new Map(),
): Promise<QuizDetail> {
    await requireAdmin();
    const adminSupabase = createAdminClient();
    const uploadedObjects: UploadedQuizStorageObject[] = [];

    const { data: existingQuiz, error: existingError } = await adminSupabase
        .from("quizzes")
        .select("id")
        .eq("id", quizId)
        .maybeSingle<{ id: string }>();

    if (existingError) {
        throw existingError;
    }

    if (!existingQuiz) {
        throw new NotFoundError("Quiz introuvable.");
    }

    const { error: quizError } = await adminSupabase
        .from("quizzes")
        .update(createQuizUpdate(input))
        .eq("id", quizId)
        .select(QUIZ_SELECT)
        .single<QuizRow>();

    if (quizError) {
        throw quizError;
    }

    try {
        await replaceQuizChildren(adminSupabase, quizId, input, uploadFilesByClientId, uploadedObjects);
    } catch (error) {
        if (uploadedObjects.length > 0) {
            await cleanupUploadedQuizStorageObjects(adminSupabase, uploadedObjects);
        }

        throw error;
    }

    return fetchQuizDetail(adminSupabase, quizId);
}
