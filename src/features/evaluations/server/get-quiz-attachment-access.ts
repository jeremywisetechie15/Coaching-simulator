import { requireAuth } from "@/features/auth/server";
import { NotFoundError } from "@/lib/server/errors";
import { assertHttpUrl } from "@/lib/server/http-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

interface QuizAttachmentAccessRow {
    external_url: string | null;
    id: string;
    question_id: string;
    storage_bucket: string | null;
    storage_path: string | null;
}

interface QuizQuestionAccessRow {
    id: string;
    step_id: string;
}

interface QuizStepAccessRow {
    id: string;
    quiz_id: string;
}

export interface QuizAttachmentAccess {
    url: string;
}

export async function getQuizAttachmentAccess(
    quizId: string,
    attachmentId: string,
): Promise<QuizAttachmentAccess> {
    await requireAuth();

    const supabase = await createClient();
    const { data: attachment, error: attachmentError } = await supabase
        .from("quiz_question_attachments")
        .select("id, question_id, external_url, storage_bucket, storage_path")
        .eq("id", attachmentId)
        .maybeSingle<QuizAttachmentAccessRow>();

    if (attachmentError) throw attachmentError;

    if (!attachment) {
        throw new NotFoundError("Pièce jointe de quiz introuvable.");
    }

    const { data: question, error: questionError } = await supabase
        .from("quiz_questions")
        .select("id, step_id")
        .eq("id", attachment.question_id)
        .maybeSingle<QuizQuestionAccessRow>();

    if (questionError) throw questionError;

    if (!question) {
        throw new NotFoundError("Pièce jointe de quiz introuvable.");
    }

    const { data: step, error: stepError } = await supabase
        .from("quiz_steps")
        .select("id, quiz_id")
        .eq("id", question.step_id)
        .eq("quiz_id", quizId)
        .maybeSingle<QuizStepAccessRow>();

    if (stepError) throw stepError;

    if (!step) {
        throw new NotFoundError("Pièce jointe de quiz introuvable.");
    }

    if (attachment.external_url) {
        return { url: assertHttpUrl(attachment.external_url) };
    }

    if (!attachment.storage_bucket || !attachment.storage_path) {
        throw new NotFoundError("Pièce jointe de quiz introuvable.");
    }

    const adminSupabase = createAdminClient();
    const { data: signedUrl, error: signedUrlError } = await adminSupabase.storage
        .from(attachment.storage_bucket)
        .createSignedUrl(attachment.storage_path, 600);

    if (signedUrlError) throw signedUrlError;

    if (!signedUrl?.signedUrl) {
        throw new NotFoundError("Pièce jointe de quiz introuvable.");
    }

    return { url: assertHttpUrl(signedUrl.signedUrl) };
}
