import { describe, expect, it, vi } from "vitest";
import {
    PasswordChangeSessionError,
    changeCurrentUserPassword,
    type PasswordChangeAuthClient,
} from "./change-current-user-password";

const values = {
    confirmation: "new-password",
    currentPassword: "current-password",
    newPassword: "new-password",
};

function createAuthClient(
    overrides: Partial<PasswordChangeAuthClient> = {},
): PasswordChangeAuthClient {
    return {
        getUser: vi.fn().mockResolvedValue({
            data: { user: { email: "paul@example.com" } },
            error: null,
        }),
        signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
        updateUser: vi.fn().mockResolvedValue({ error: null }),
        ...overrides,
    };
}

describe("changeCurrentUserPassword", () => {
    it("reauthenticates the current user before updating the password", async () => {
        const auth = createAuthClient();

        await changeCurrentUserPassword(values, auth);

        expect(auth.signInWithPassword).toHaveBeenCalledWith({
            email: "paul@example.com",
            password: values.currentPassword,
        });
        expect(auth.updateUser).toHaveBeenCalledWith({
            password: values.newPassword,
        });
    });

    it("does not update the password when reauthentication fails", async () => {
        const error = { code: "invalid_credentials", message: "Invalid login credentials" };
        const auth = createAuthClient({
            signInWithPassword: vi.fn().mockResolvedValue({ error }),
        });

        await expect(changeCurrentUserPassword(values, auth)).rejects.toBe(error);
        expect(auth.updateUser).not.toHaveBeenCalled();
    });

    it("rejects a missing authenticated email", async () => {
        const auth = createAuthClient({
            getUser: vi.fn().mockResolvedValue({
                data: { user: null },
                error: null,
            }),
        });

        await expect(changeCurrentUserPassword(values, auth)).rejects.toBeInstanceOf(
            PasswordChangeSessionError,
        );
        expect(auth.signInWithPassword).not.toHaveBeenCalled();
    });
});
