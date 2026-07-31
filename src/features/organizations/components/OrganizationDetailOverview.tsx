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
import { AlertMessage, PeopleCountTooltip } from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import type {
    CreateOrganizationFieldErrors,
    CreateOrganizationFormValues,
} from "@/features/organizations/domain/create-organization-form";
import {
    getOrganizationRegionLabel,
    organizationRegionOptions,
} from "@/features/organizations/domain/create-organization-form";
import type { OrganizationDetail } from "@/features/organizations/domain/organization-detail";
import {
    getOrganizationStatusLabel,
    organizationStatusOptions,
} from "@/features/organizations/domain/organization-list";

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
            <Text className={uiTokens.organizationDetail.overview.label}>{label}</Text>
            <Text className={uiTokens.organizationDetail.overview.value}>{value || "-"}</Text>
        </Box>
    );
}

function DetailPeopleCount({
    count,
    label,
    names,
}: {
    count: number;
    label: string;
    names: readonly string[];
}) {
    return (
        <Box>
            <Text className={uiTokens.organizationDetail.overview.label}>{label}</Text>
            <PeopleCountTooltip
                count={count}
                names={names}
                pluralLabel="utilisateurs"
                singularLabel="utilisateur"
                variant="detail"
            />
        </Box>
    );
}

function DetailStatus({ status }: { status: OrganizationDetail["status"] }) {
    const isActive = status === "active";

    return (
        <Box>
            <Text className={uiTokens.organizationDetail.overview.label}>Statut</Text>
            <Box
                className={cn(
                    uiTokens.organizationDetail.overview.status,
                    isActive
                        ? uiTokens.organizationDetail.overview.statusActive
                        : uiTokens.organizationDetail.overview.statusSuspended,
                )}
            >
                {getOrganizationStatusLabel(status)}
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
        <Box className={uiTokens.organizationDetail.overview.editField}>
            <FieldLabel
                required={required}
                htmlFor={id}
                className={uiTokens.organizationDetail.overview.editLabel}
            >
                {label}
            </FieldLabel>
            <TextInput
                id={id}
                aria-describedby={error ? errorId : undefined}
                aria-invalid={error ? true : undefined}
                hasLeadingIcon={false}
                onChange={(event) => onChange(event.target.value)}
                type={type}
                value={value}
                className={cn(
                    uiTokens.organizationDetail.overview.editControl,
                    error && uiTokens.organizationDetail.overview.editControlError,
                )}
            />
            {error && (
                <Text
                    id={errorId}
                    className={uiTokens.organizationDetail.overview.editError}
                >
                    {error}
                </Text>
            )}
        </Box>
    );
}

function withCurrentOption(options: Array<{ label: string; value: string }>, value: string) {
    if (!value || options.some((option) => option.value === value)) {
        return options;
    }

    return [{ label: value, value }, ...options];
}

function EditSelectField({
    error,
    id,
    label,
    onChange,
    options,
    value,
}: {
    error?: string;
    id: string;
    label: string;
    onChange: (value: string) => void;
    options: Array<{ label: string; value: string }>;
    value: string;
}) {
    const errorId = `${id}-error`;

    return (
        <Box className={uiTokens.organizationDetail.overview.editField}>
            <FieldLabel
                htmlFor={id}
                className={uiTokens.organizationDetail.overview.editLabel}
            >
                {label}
            </FieldLabel>
            <Box className={uiTokens.organizationDetail.overview.editSelectWrapper}>
                <SelectInput
                    id={id}
                    aria-describedby={error ? errorId : undefined}
                    aria-invalid={error ? true : undefined}
                    onChange={(event) => onChange(event.target.value)}
                    value={value}
                    className={cn(
                        uiTokens.organizationDetail.overview.editControl,
                        error && uiTokens.organizationDetail.overview.editControlError,
                    )}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </SelectInput>
                <InlineIcon
                    icon={ChevronDown}
                    className={uiTokens.organizationDetail.overview.selectIcon}
                />
            </Box>
            {error && (
                <Text
                    id={errorId}
                    className={uiTokens.organizationDetail.overview.editError}
                >
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
        <FormRoot
            onSubmit={handleSubmit}
            className={uiTokens.organizationDetail.overview.form}
            noValidate
        >
            {formError && <AlertMessage message={formError} />}

            <Text as="h2" className={uiTokens.organizationDetail.overview.sectionTitle}>
                Informations de base
            </Text>

            <Box className={uiTokens.organizationDetail.overview.baseLayout}>
                <Box className={uiTokens.organizationDetail.overview.icon}>
                    <InlineIcon
                        icon={Building2}
                        className={uiTokens.organizationDetail.overview.iconGlyph}
                    />
                </Box>

                <Box className={uiTokens.organizationDetail.overview.detailGrid}>
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
                        <EditSelectField
                            error={fieldErrors.status}
                            id="organization-status"
                            label="Statut"
                            onChange={(value) => onValueChange?.("status", value)}
                            options={organizationStatusOptions}
                            value={values.status}
                        />
                    ) : (
                        <DetailStatus status={organization.status} />
                    )}
                    <DetailValue label="Nombre de groupes" value={`${organization.groupCount} groupes`} />
                    <DetailPeopleCount
                        count={organization.userCount}
                        label="Nombre d'utilisateurs"
                        names={organization.userNames}
                    />
                </Box>
            </Box>

            <Box className={uiTokens.organizationDetail.overview.section}>
                <Text as="h2" className={uiTokens.organizationDetail.overview.sectionTitle}>
                    Informations de contact
                </Text>
                <Box className={uiTokens.organizationDetail.overview.sectionGrid}>
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

            <Box className={uiTokens.organizationDetail.overview.section}>
                <Text as="h2" className={uiTokens.organizationDetail.overview.sectionTitle}>
                    Informations géographiques
                </Text>
                <Box className={uiTokens.organizationDetail.overview.sectionGrid}>
                    {isEditing ? (
                        <EditSelectField
                            error={fieldErrors.region}
                            id="organization-region"
                            label="Région géographique"
                            onChange={(value) => onValueChange?.("region", value)}
                            options={withCurrentOption([...organizationRegionOptions], values.region)}
                            value={values.region}
                        />
                    ) : (
                        <DetailValue
                            label="Région géographique"
                            value={getOrganizationRegionLabel(organization.region)}
                        />
                    )}
                </Box>
            </Box>
        </FormRoot>
    );
}
