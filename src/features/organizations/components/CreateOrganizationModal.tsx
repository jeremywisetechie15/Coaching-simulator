"use client";

import { type FormEvent } from "react";
import { X } from "lucide-react";
import { Box, Button, FormRoot, InlineIcon, Text } from "@/lib/ui/atoms";
import { AlertMessage } from "@/lib/ui/molecules";
import {
    type CreateOrganizationFieldErrors,
    type CreateOrganizationFormValues,
    organizationRegionOptions,
} from "@/features/organizations/domain/create-organization-form";
import { organizationStatusOptions } from "@/features/organizations/domain/organization-list";
import { OrganizationFormField } from "./OrganizationFormField";

interface CreateOrganizationModalProps {
    fieldErrors: CreateOrganizationFieldErrors;
    formError: string | null;
    isSubmitting: boolean;
    onClose: () => void;
    onSubmit: () => void;
    onValueChange: (field: keyof CreateOrganizationFormValues, value: string) => void;
    values: CreateOrganizationFormValues;
}

const regionOptions = [
    { label: "Sélectionnez une région", value: "" },
    ...organizationRegionOptions,
];

export function CreateOrganizationModal({
    fieldErrors,
    formError,
    isSubmitting,
    onClose,
    onSubmit,
    onValueChange,
    values,
}: CreateOrganizationModalProps) {
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSubmit();
    };

    return (
        <Box className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-8">
            <Box className="max-h-[calc(100vh-4rem)] w-full max-w-[520px] overflow-y-auto rounded-[22px] bg-white px-7 py-7 shadow-[0_24px_80px_rgba(17,24,39,0.28)]">
                <Box className="mb-6 flex items-start justify-between gap-6">
                    <Text as="h2" className="text-[22px] font-extrabold leading-tight text-[#111827]">
                        Créer une organisation
                    </Text>
                    <Button
                        aria-label="Fermer"
                        onClick={onClose}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#5C6473] transition hover:bg-[#F3F4F7] hover:text-[#111827]"
                    >
                        <InlineIcon icon={X} className="h-7 w-7" />
                    </Button>
                </Box>

                <FormRoot onSubmit={handleSubmit} className="space-y-4" noValidate>
                    {formError && <AlertMessage message={formError} />}
                    <OrganizationFormField
                        error={fieldErrors.name}
                        id="organization-name"
                        label="Nom de l'entreprise"
                        required
                        inputProps={{
                            autoFocus: true,
                            onChange: (event) => onValueChange("name", event.target.value),
                            placeholder: "Ex: Deepmark",
                            required: true,
                            value: values.name,
                        }}
                    />
                    <OrganizationFormField
                        error={fieldErrors.industry}
                        id="organization-industry"
                        label="Secteur d'activité"
                        inputProps={{
                            onChange: (event) => onValueChange("industry", event.target.value),
                            placeholder: "Ex: SaaS / Formation",
                            value: values.industry,
                        }}
                    />
                    <OrganizationFormField
                        error={fieldErrors.contactEmail}
                        id="organization-email"
                        label="Email de contact"
                        inputProps={{
                            onChange: (event) => onValueChange("contactEmail", event.target.value),
                            placeholder: "contact@entreprise.fr",
                            type: "email",
                            value: values.contactEmail,
                        }}
                    />
                    <OrganizationFormField
                        error={fieldErrors.phone}
                        id="organization-phone"
                        label="Téléphone"
                        inputProps={{
                            onChange: (event) => onValueChange("phone", event.target.value),
                            placeholder: "+33 1 23 45 67 89",
                            type: "tel",
                            value: values.phone,
                        }}
                    />
                    <OrganizationFormField
                        error={fieldErrors.status}
                        id="organization-status"
                        label="Statut"
                        type="select"
                        options={organizationStatusOptions}
                        selectProps={{
                            onChange: (event) => onValueChange("status", event.target.value),
                            value: values.status,
                        }}
                    />
                    <OrganizationFormField
                        error={fieldErrors.region}
                        id="organization-region"
                        label="Région géographique"
                        type="select"
                        options={regionOptions}
                        selectProps={{
                            onChange: (event) => onValueChange("region", event.target.value),
                            value: values.region,
                        }}
                    />

                    <Box className="grid gap-4 pt-3 sm:grid-cols-2">
                        <Button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex h-10 items-center justify-center rounded-lg border border-[#DADDE4] bg-white text-[14px] font-bold text-[#111827] transition hover:bg-[#F7F8FB]"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex h-10 items-center justify-center rounded-lg bg-[#5140F0] text-[14px] font-bold text-white shadow-[0_10px_20px_rgba(81,64,240,0.20)] transition hover:bg-[#4635E7]"
                        >
                            {isSubmitting ? "Ajout..." : "Ajouter"}
                        </Button>
                    </Box>
                </FormRoot>
            </Box>
        </Box>
    );
}
