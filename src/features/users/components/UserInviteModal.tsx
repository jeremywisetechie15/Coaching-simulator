"use client";

import { type FormEvent } from "react";
import { ChevronDown, X } from "lucide-react";
import {
    Box,
    Button,
    CardSurface,
    FieldLabel,
    FormRoot,
    InlineIcon,
    SelectInput,
    Text,
    TextInput,
} from "@/lib/ui/atoms";
import { AlertMessage } from "@/lib/ui/molecules";

export type UserInviteRole = "member" | "manager";

export interface UserInviteFormValues {
    email: string;
    firstName: string;
    groupId: string;
    lastName: string;
    organizationId: string;
    role: UserInviteRole;
}

export interface UserInviteOption {
    label: string;
    value: string;
}

export const initialUserInviteFormValues: UserInviteFormValues = {
    email: "",
    firstName: "",
    groupId: "",
    lastName: "",
    organizationId: "",
    role: "member",
};

interface UserInviteModalProps {
    formError?: string | null;
    formStatus?: string | null;
    groupOptions: UserInviteOption[];
    isSubmitting?: boolean;
    onClose: () => void;
    onSubmit: () => void;
    onValueChange: (field: keyof UserInviteFormValues, value: string) => void;
    organizationOptions: UserInviteOption[];
    organizationSelectDisabled?: boolean;
    values: UserInviteFormValues;
}

const roleOptions: UserInviteOption[] = [
    { label: "Learner", value: "member" },
    { label: "Manager", value: "manager" },
];

function RequiredMark() {
    return (
        <Text as="span" className="text-[#FF4E68]">
            *
        </Text>
    );
}

function UserTextField({
    autoFocus = false,
    id,
    label,
    onChange,
    required = false,
    type = "text",
    value,
}: {
    autoFocus?: boolean;
    id: string;
    label: string;
    onChange: (value: string) => void;
    required?: boolean;
    type?: "email" | "text";
    value: string;
}) {
    return (
        <Box className="space-y-2">
            <FieldLabel htmlFor={id} className="text-[14px] font-bold leading-5 text-[#111827]">
                {label} {required && <RequiredMark />}
            </FieldLabel>
            <TextInput
                id={id}
                autoFocus={autoFocus}
                hasLeadingIcon={false}
                onChange={(event) => onChange(event.target.value)}
                type={type}
                value={value}
                className="!h-9 rounded-lg border border-[#DADDE4] bg-[#F8F9FB] px-4 text-[14px] font-semibold text-[#111827] shadow-none placeholder:text-[#747789] focus:bg-white"
            />
        </Box>
    );
}

function UserSelectField({
    disabled = false,
    id,
    label,
    onChange,
    options,
    required = false,
    value,
}: {
    disabled?: boolean;
    id: string;
    label: string;
    onChange: (value: string) => void;
    options: UserInviteOption[];
    required?: boolean;
    value: string;
}) {
    return (
        <Box className="space-y-2">
            <FieldLabel htmlFor={id} className="text-[14px] font-bold leading-5 text-[#111827]">
                {label} {required && <RequiredMark />}
            </FieldLabel>
            <Box className="relative">
                <SelectInput
                    id={id}
                    disabled={disabled}
                    onChange={(event) => onChange(event.target.value)}
                    value={value}
                    className="!h-9 rounded-lg border border-[#DADDE4] bg-[#F8F9FB] px-4 text-[14px] font-semibold text-[#111827] shadow-none focus:bg-white disabled:text-[#8A8F99]"
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </SelectInput>
                <InlineIcon
                    icon={ChevronDown}
                    className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#B7BBC5]"
                />
            </Box>
        </Box>
    );
}

export function UserInviteModal({
    formError = null,
    formStatus = null,
    groupOptions,
    isSubmitting = false,
    onClose,
    onSubmit,
    onValueChange,
    organizationOptions,
    organizationSelectDisabled = false,
    values,
}: UserInviteModalProps) {
    const canSubmit =
        values.firstName.trim().length > 0 &&
        values.lastName.trim().length > 0 &&
        values.email.trim().length > 0 &&
        values.organizationId.trim().length > 0 &&
        values.role.trim().length > 0;

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (canSubmit) {
            onSubmit();
        }
    };

    return (
        <Box className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#111827]/55 px-4 py-5 backdrop-blur-[1px]">
            <CardSurface className="w-full max-w-[460px] rounded-[14px] px-5 py-5 shadow-[0_22px_60px_rgba(17,24,39,0.26)] md:px-6 md:py-6">
                <Box className="mb-5 flex items-start justify-between gap-4">
                    <Text as="h2" className="text-[20px] font-extrabold leading-tight text-[#111827]">
                        Ajouter un utilisateur
                    </Text>
                    <Button
                        aria-label="Fermer"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[#F3F4F7] hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <InlineIcon icon={X} className="h-5 w-5" />
                    </Button>
                </Box>

                <FormRoot onSubmit={handleSubmit} className="space-y-4" noValidate>
                    {formError && <AlertMessage message={formError} />}
                    {!formError && formStatus && (
                        <Box
                            aria-live="polite"
                            className="rounded-lg border border-[#B8C5FF] bg-[#F4F6FF] px-3 py-2 text-[13px] font-semibold text-[#4434D4]"
                        >
                            {formStatus}
                        </Box>
                    )}
                    <UserTextField
                        autoFocus
                        id="user-first-name"
                        label="Prénom"
                        onChange={(value) => onValueChange("firstName", value)}
                        required
                        value={values.firstName}
                    />
                    <UserTextField
                        id="user-last-name"
                        label="Nom"
                        onChange={(value) => onValueChange("lastName", value)}
                        required
                        value={values.lastName}
                    />
                    <UserTextField
                        id="user-email"
                        label="Email"
                        onChange={(value) => onValueChange("email", value)}
                        required
                        type="email"
                        value={values.email}
                    />
                    <UserSelectField
                        id="user-role"
                        label="Rôle dans l'organisation"
                        onChange={(value) => onValueChange("role", value)}
                        options={roleOptions}
                        required
                        value={values.role}
                    />
                    <UserSelectField
                        disabled={organizationSelectDisabled}
                        id="user-organization"
                        label="Organisation"
                        onChange={(value) => onValueChange("organizationId", value)}
                        options={[{ label: "Sélectionnez une organisation", value: "" }, ...organizationOptions]}
                        required
                        value={values.organizationId}
                    />
                    <UserSelectField
                        id="user-group"
                        label="Groupe"
                        onChange={(value) => onValueChange("groupId", value)}
                        options={[{ label: "Sélectionnez un groupe", value: "" }, ...groupOptions]}
                        value={values.groupId}
                    />

                    <Box className="grid gap-3 pt-1 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)]">
                        <Button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex h-9 items-center justify-center rounded-lg border border-[#DADDE4] bg-white text-[13px] font-bold text-[#111827] transition hover:bg-[#F7F8FB] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={!canSubmit || isSubmitting}
                            className="flex h-9 items-center justify-center rounded-lg bg-[#5140F0] text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(81,64,240,0.16)] transition hover:bg-[#4635E7] disabled:cursor-not-allowed disabled:bg-[#E3E5EA] disabled:text-white disabled:shadow-none"
                        >
                            {isSubmitting ? "Envoi..." : "Envoyer l'invitation"}
                        </Button>
                    </Box>
                </FormRoot>
            </CardSurface>
        </Box>
    );
}
