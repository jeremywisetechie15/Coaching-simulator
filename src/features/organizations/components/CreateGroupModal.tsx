"use client";

import { type FormEvent } from "react";
import { X } from "lucide-react";
import {
    Box,
    Button,
    CardSurface,
    FieldLabel,
    FormRoot,
    InlineIcon,
    Text,
    TextArea,
    TextInput,
} from "@/lib/ui/atoms";

interface CreateGroupModalProps {
    description: string;
    formError?: string | null;
    groupName: string;
    isSubmitting?: boolean;
    onClose: () => void;
    onDescriptionChange: (value: string) => void;
    onGroupNameChange: (value: string) => void;
    onSubmit: () => void;
}

export function CreateGroupModal({
    description,
    formError = null,
    groupName,
    isSubmitting = false,
    onClose,
    onDescriptionChange,
    onGroupNameChange,
    onSubmit,
}: CreateGroupModalProps) {
    const canSubmit = groupName.trim().length > 0 && !isSubmitting;

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (canSubmit) {
            onSubmit();
        }
    };

    return (
        <Box className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/55 px-4 py-5 backdrop-blur-[1px]">
            <CardSurface className="w-full max-w-[460px] rounded-[14px] px-5 py-5 shadow-[0_22px_60px_rgba(17,24,39,0.26)] md:px-6 md:py-6">
                <Box className="mb-5 flex items-start justify-between gap-4">
                    <Text as="h2" className="text-[20px] font-extrabold leading-tight text-[#111827]">
                        Créer un groupe
                    </Text>
                    <Button
                        aria-label="Fermer"
                        onClick={onClose}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[#F3F4F7] hover:text-[#111827]"
                    >
                        <InlineIcon icon={X} className="h-5 w-5" />
                    </Button>
                </Box>

                <FormRoot onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <Box className="space-y-2">
                        <FieldLabel
                            htmlFor="group-name"
                            className="text-[14px] font-bold leading-5 text-[#111827]"
                        >
                            Nom du groupe{" "}
                            <Text as="span" className="text-[#FF4E68]">
                                *
                            </Text>
                        </FieldLabel>
                        <TextInput
                            id="group-name"
                            autoFocus
                            hasLeadingIcon={false}
                            onChange={(event) => onGroupNameChange(event.target.value)}
                            placeholder="Ex: Marketing"
                            value={groupName}
                            className="!h-9 rounded-lg border border-[#DADDE4] bg-[#F8F9FB] px-4 text-[14px] font-semibold text-[#111827] shadow-none placeholder:text-[#747789] focus:bg-white"
                        />
                    </Box>

                    <Box className="space-y-2">
                        <FieldLabel
                            htmlFor="group-description"
                            className="text-[14px] font-bold leading-5 text-[#111827]"
                        >
                            Description
                        </FieldLabel>
                        <TextArea
                            id="group-description"
                            onChange={(event) => onDescriptionChange(event.target.value)}
                            placeholder="Décrivez le groupe et son rôle dans l'organisation..."
                            rows={3}
                            value={description}
                            className="min-h-[88px] rounded-lg border border-[#DADDE4] bg-[#F8F9FB] px-4 py-3 text-[14px] font-semibold text-[#111827] shadow-none placeholder:text-[#747789] focus:bg-white"
                        />
                    </Box>

                    <Box className="grid gap-3 pt-1 sm:grid-cols-2">
                        <Button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex h-9 items-center justify-center rounded-lg border border-[#DADDE4] bg-white text-[13px] font-bold text-[#111827] transition hover:bg-[#F7F8FB]"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={!canSubmit}
                            className="flex h-9 items-center justify-center rounded-lg bg-[#5140F0] text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(81,64,240,0.16)] transition hover:bg-[#4635E7] disabled:cursor-not-allowed disabled:bg-[#E3E5EA] disabled:text-white disabled:shadow-none"
                        >
                            {isSubmitting ? "Ajout..." : "Ajouter"}
                        </Button>
                    </Box>

                    {formError && (
                        <Box
                            aria-live="polite"
                            className="rounded-lg border border-[#F3C7C7] bg-[#FFF4F4] px-4 py-3 text-[13px] font-semibold text-[#A43A3A]"
                        >
                            {formError}
                        </Box>
                    )}
                </FormRoot>
            </CardSurface>
        </Box>
    );
}
