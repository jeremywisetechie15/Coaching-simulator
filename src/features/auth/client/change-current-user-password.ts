import { createClient } from "@/lib/supabase/client";
import type { PasswordChangeValues } from "@/features/auth/domain/password-change";

interface PasswordChangeProviderError {
    code?: string;
    message?: string;
    status?: number;
}

export interface PasswordChangeAuthClient {
    getUser: () => Promise<{
        data: { user: { email?: string | null } | null };
        error: PasswordChangeProviderError | null;
    }>;
    signInWithPassword: (credentials: {
        email: string;
        password: string;
    }) => Promise<{ error: PasswordChangeProviderError | null }>;
    updateUser: (attributes: {
        password: string;
    }) => Promise<{ error: PasswordChangeProviderError | null }>;
}

export class PasswordChangeSessionError extends Error {
    readonly code = "session_not_found";
    readonly status = 401;

    constructor() {
        super("Authenticated user email is unavailable.");
        this.name = "PasswordChangeSessionError";
    }
}

export async function changeCurrentUserPassword(
    values: PasswordChangeValues,
    authClient?: PasswordChangeAuthClient,
) {
    const auth = authClient ?? createClient().auth;
    const { data, error: userError } = await auth.getUser();

    if (userError) {
        throw userError;
    }

    const email = data.user?.email;

    if (!email) {
        throw new PasswordChangeSessionError();
    }

    const { error: reauthenticationError } = await auth.signInWithPassword({
        email,
        password: values.currentPassword,
    });

    if (reauthenticationError) {
        throw reauthenticationError;
    }

    const { error: updateError } = await auth.updateUser({
        password: values.newPassword,
    });

    if (updateError) {
        throw updateError;
    }
}
