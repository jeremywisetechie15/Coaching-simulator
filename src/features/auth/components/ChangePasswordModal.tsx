"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { changeCurrentUserPassword } from "@/features/auth/client/change-current-user-password";
import {
    PASSWORD_CHANGE_MESSAGES,
    getPasswordChangeErrorMessage,
    validatePasswordChange,
} from "@/features/auth/domain/password-change";
import {
    AUTH_PATHS,
    buildAuthPath,
} from "@/features/auth/domain/password-recovery";
import { Box, Button, FormRoot, InlineIcon } from "@/lib/ui/atoms";
import {
    createFormSubmitError,
    notifyFormSubmitError,
    notifyFormSubmitSuccess,
} from "@/lib/ui/feedback/form-submit-feedback";
import { AlertMessage, PasswordField } from "@/lib/ui/molecules";
import { Modal } from "@/lib/ui/organisms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface ChangePasswordModalProps {
    onClose: () => void;
}

interface ProviderErrorLike {
    code?: string;
    status?: number;
}

export function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
    const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
    const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const forgotPasswordHref = buildAuthPath(AUTH_PATHS.forgotPassword, "/profile");

    const closeModal = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        const values = {
            confirmation,
            currentPassword,
            newPassword,
        };
        const validationError = validatePasswordChange(values);

        if (validationError) {
            setError(notifyFormSubmitError(new Error(validationError), validationError));
            return;
        }

        setIsSubmitting(true);

        try {
            await changeCurrentUserPassword(values);
            notifyFormSubmitSuccess(PASSWORD_CHANGE_MESSAGES.success);
            onClose();
        } catch (caughtError) {
            const providerError = caughtError as ProviderErrorLike | null;
            const message = getPasswordChangeErrorMessage(caughtError);
            const formError = createFormSubmitError(
                message,
                providerError?.status,
                providerError?.code,
            );

            setError(notifyFormSubmitError(formError, message));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            className={uiTokens.profile.passwordModal.panel}
            description="Confirmez votre mot de passe actuel, puis choisissez-en un nouveau."
            onClose={closeModal}
            title="Modifier le mot de passe"
        >
            <FormRoot
                className={uiTokens.profile.passwordModal.body}
                noValidate
                onSubmit={handleSubmit}
            >
                <PasswordField
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    id="profile-current-password"
                    isVisible={isCurrentPasswordVisible}
                    label="Mot de passe actuel"
                    name="current-password"
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    onToggleVisibility={() => setIsCurrentPasswordVisible((value) => !value)}
                    value={currentPassword}
                />
                <PasswordField
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    id="profile-new-password"
                    isVisible={isNewPasswordVisible}
                    label="Nouveau mot de passe"
                    name="new-password"
                    onChange={(event) => setNewPassword(event.target.value)}
                    onToggleVisibility={() => setIsNewPasswordVisible((value) => !value)}
                    value={newPassword}
                />
                <PasswordField
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    id="profile-confirm-password"
                    isVisible={isConfirmationVisible}
                    label="Confirmer le nouveau mot de passe"
                    name="confirm-password"
                    onChange={(event) => setConfirmation(event.target.value)}
                    onToggleVisibility={() => setIsConfirmationVisible((value) => !value)}
                    value={confirmation}
                />

                <Link
                    className={cn(
                        uiTokens.auth.link,
                        uiTokens.profile.passwordModal.forgotLink,
                    )}
                    href={forgotPasswordHref}
                >
                    Mot de passe oublié ?
                </Link>

                {error && <AlertMessage message={error} />}

                <Box className={uiTokens.profile.passwordModal.actions}>
                    <Button
                        className={uiTokens.action.secondaryButton}
                        disabled={isSubmitting}
                        onClick={closeModal}
                    >
                        Annuler
                    </Button>
                    <Button
                        className={cn(
                            uiTokens.profile.passwordModal.submitButton,
                            uiTokens.action.primaryButton,
                        )}
                        disabled={isSubmitting}
                        type="submit"
                    >
                        {isSubmitting ? (
                            <>
                                <InlineIcon
                                    icon={Loader2}
                                    className={uiTokens.profile.passwordModal.loaderIcon}
                                />
                                Modification...
                            </>
                        ) : (
                            "Modifier le mot de passe"
                        )}
                    </Button>
                </Box>
            </FormRoot>
        </Modal>
    );
}
