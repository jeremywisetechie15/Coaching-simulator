import { type FormEvent } from "react";
import { Building2, ChevronDown } from "lucide-react";
import {
    Box,
    FieldLabel,
    FormRoot,
    InlineIcon,
    SelectInput,
    Text,
    TextInput,
} from "@/lib/ui/atoms";
import { AlertMessage } from "@/lib/ui/molecules";
import type {
    CreateOrganizationFieldErrors,
    CreateOrganizationFormValues,
} from "@/features/organizations/domain/create-organization-form";
import type { OrganizationDetail } from "@/features/organizations/domain/organization-detail";

interface OrganizationDetailOverviewProps {
    fieldErrors?: CreateOrganizationFieldErrors;
    formError?: string | null;
    formValues?: CreateOrganizationFormValues;
    isEditing?: boolean;
    organization: OrganizationDetail;
    onSubmit?: () => void;
    onValueChange?: (field: keyof CreateOrganizationFormValues, value: string) => void;
}

function DetailValue({ label, value }: { label: string; value: string }) {
    return (
        <Box>
            <Text className="text-[15px] font-extrabold leading-5 text-[#171B2A]">{label}</Text>
            <Text className="mt-2 text-[15px] font-semibold leading-6 text-[#515A6D]">{value || "-"}</Text>
        </Box>
    );
}

function DetailStatus({ status }: { status: OrganizationDetail["status"] }) {
    const isActive = status === "active";

    return (
        <Box>
            <Text className="text-[15px] font-extrabold leading-5 text-[#171B2A]">Statut</Text>
            <Box
                className={`mt-2 inline-flex h-8 items-center rounded-lg px-3 text-[13px] font-bold ${
                    isActive ? "bg-[#DDF8E6] text-[#2A8A41]" : "bg-[#F2F3F6] text-[#4F5868]"
                }`}
            >
                {isActive ? "Activée" : "Suspendue"}
            </Box>
        </Box>
    );
}

function EditField({
    error,
    id,
    label,
    onChange,
    required = false,
    type = "text",
    value,
}: {
    error?: string;
    id: string;
    label: string;
    onChange: (value: string) => void;
    required?: boolean;
    type?: "email" | "tel" | "text";
    value: string;
}) {
    const errorId = `${id}-error`;

    return (
        <Box className="space-y-2">
            <FieldLabel htmlFor={id} className="text-[15px] font-extrabold leading-5 text-[#171B2A]">
                {label}
                {required && (
                    <Text as="span" className="text-[#FF4E68]">
                        *
                    </Text>
                )}
            </FieldLabel>
            <TextInput
                id={id}
                aria-describedby={error ? errorId : undefined}
                aria-invalid={error ? true : undefined}
                hasLeadingIcon={false}
                onChange={(event) => onChange(event.target.value)}
                type={type}
                value={value}
                className={`!h-12 rounded-lg border-[#D5D9E2] bg-white px-4 text-[15px] font-semibold shadow-none ${
                    error ? "border-[#FF4E68] ring-4 ring-[#FF4E68]/10" : ""
                }`}
            />
            {error && (
                <Text id={errorId} className="text-[12px] font-semibold leading-4 text-[#D92D3A]">
                    {error}
                </Text>
            )}
        </Box>
    );
}

function EditStatusField({
    error,
    onChange,
    value,
}: {
    error?: string;
    onChange: (value: string) => void;
    value: CreateOrganizationFormValues["status"];
}) {
    const errorId = "organization-status-error";

    return (
        <Box className="space-y-2">
            <FieldLabel htmlFor="organization-status" className="text-[15px] font-extrabold leading-5 text-[#171B2A]">
                Statut
            </FieldLabel>
            <Box className="relative">
                <SelectInput
                    id="organization-status"
                    aria-describedby={error ? errorId : undefined}
                    aria-invalid={error ? true : undefined}
                    onChange={(event) => onChange(event.target.value)}
                    value={value}
                    className={`!h-12 rounded-lg border-[#D5D9E2] bg-white px-4 text-[15px] font-semibold shadow-none ${
                        error ? "border-[#FF4E68] ring-4 ring-[#FF4E68]/10" : ""
                    }`}
                >
                    <option value="active">Activée</option>
                    <option value="suspended">Suspendue</option>
                </SelectInput>
                <InlineIcon
                    icon={ChevronDown}
                    className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9EA3AF]"
                />
            </Box>
            {error && (
                <Text id={errorId} className="text-[12px] font-semibold leading-4 text-[#D92D3A]">
                    {error}
                </Text>
            )}
        </Box>
    );
}

export function OrganizationDetailOverview({
    fieldErrors = {},
    formError = null,
    formValues,
    isEditing = false,
    organization,
    onSubmit,
    onValueChange,
}: OrganizationDetailOverviewProps) {
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSubmit?.();
    };

    const values: CreateOrganizationFormValues = formValues ?? {
        contactEmail: organization.contactEmail,
        industry: organization.industry,
        name: organization.name,
        phone: organization.phone,
        region: organization.region,
        status: organization.status,
    };

    return (
        <FormRoot onSubmit={handleSubmit} className="px-7 py-7" noValidate>
            {formError && <AlertMessage message={formError} />}

            <Text as="h2" className="text-[18px] font-extrabold text-[#171B2A]">
                Informations de base
            </Text>

            <Box className="mt-7 grid gap-8 lg:grid-cols-[120px_minmax(0,1fr)]">
                <Box className="flex h-[88px] w-[88px] items-center justify-center rounded-xl bg-[#E7EAFF] text-[#5140F0]">
                    <InlineIcon icon={Building2} className="h-10 w-10" />
                </Box>

                <Box className="grid gap-x-16 gap-y-9 md:grid-cols-2">
                    {isEditing ? (
                        <>
                            <EditField
                                error={fieldErrors.name}
                                id="organization-name"
                                label="Nom de l'entreprise"
                                onChange={(value) => onValueChange?.("name", value)}
                                required
                                value={values.name}
                            />
                            <EditField
                                error={fieldErrors.industry}
                                id="organization-industry"
                                label="Secteur"
                                onChange={(value) => onValueChange?.("industry", value)}
                                value={values.industry}
                            />
                        </>
                    ) : (
                        <>
                            <DetailValue label="Nom de l'entreprise" value={organization.name} />
                            <DetailValue label="Secteur" value={organization.industry} />
                        </>
                    )}
                    <DetailValue label="Date de création" value={organization.createdAt} />
                    {isEditing ? (
                        <EditStatusField
                            error={fieldErrors.status}
                            onChange={(value) => onValueChange?.("status", value)}
                            value={values.status}
                        />
                    ) : (
                        <DetailStatus status={organization.status} />
                    )}
                    <DetailValue label="Nombre de groupes" value={`${organization.groupCount} groupes`} />
                    <DetailValue label="Nombre d'utilisateurs" value={`${organization.userCount} utilisateurs`} />
                </Box>
            </Box>

            <Box className="mt-9 border-t border-[#E4E7EE] pt-7">
                <Text as="h2" className="text-[18px] font-extrabold text-[#171B2A]">
                    Informations de contact
                </Text>
                <Box className="mt-7 grid gap-8 md:grid-cols-2">
                    {isEditing ? (
                        <>
                            <EditField
                                error={fieldErrors.contactEmail}
                                id="organization-contact-email"
                                label="Email de contact"
                                onChange={(value) => onValueChange?.("contactEmail", value)}
                                type="email"
                                value={values.contactEmail}
                            />
                            <EditField
                                error={fieldErrors.phone}
                                id="organization-phone"
                                label="Téléphone"
                                onChange={(value) => onValueChange?.("phone", value)}
                                type="tel"
                                value={values.phone}
                            />
                        </>
                    ) : (
                        <>
                            <DetailValue label="Email de contact" value={organization.contactEmail} />
                            <DetailValue label="Téléphone" value={organization.phone} />
                        </>
                    )}
                </Box>
            </Box>

            <Box className="mt-9 border-t border-[#E4E7EE] pt-7">
                <Text as="h2" className="text-[18px] font-extrabold text-[#171B2A]">
                    Informations géographiques
                </Text>
                <Box className="mt-7 grid gap-8 md:grid-cols-2">
                    {isEditing ? (
                        <EditField
                            error={fieldErrors.region}
                            id="organization-region"
                            label="Région géographique"
                            onChange={(value) => onValueChange?.("region", value)}
                            value={values.region}
                        />
                    ) : (
                        <DetailValue label="Région géographique" value={organization.region} />
                    )}
                </Box>
            </Box>
        </FormRoot>
    );
}
