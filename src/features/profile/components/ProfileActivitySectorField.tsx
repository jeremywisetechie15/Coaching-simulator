import { ChevronDown } from "lucide-react";
import { Box, FieldLabel, InlineIcon, SelectInput, Stack } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import {
    ACTIVITY_SECTORS,
    isActivitySectorCode,
    type ActivitySectorCode,
} from "@/features/profile/domain/activity-sector";

interface ProfileActivitySectorFieldProps {
    onChange: (value: ActivitySectorCode | null) => void;
    readOnly: boolean;
    value: ActivitySectorCode | null;
}

export function ProfileActivitySectorField({
    onChange,
    readOnly,
    value,
}: ProfileActivitySectorFieldProps) {
    const fieldStateClassName = readOnly
        ? uiTokens.profile.field.readonly
        : uiTokens.profile.field.editable;

    return (
        <Stack className="space-y-2">
            <FieldLabel htmlFor="activity-sector">Secteur d’activité</FieldLabel>
            <Box className="relative">
                <SelectInput
                    id="activity-sector"
                    disabled={readOnly}
                    value={value ?? ""}
                    onChange={(event) => {
                        const nextValue = event.target.value;
                        onChange(isActivitySectorCode(nextValue) ? nextValue : null);
                    }}
                    className={cn(uiTokens.profile.field.control, fieldStateClassName)}
                >
                    <option value="">Non renseigné</option>
                    {ACTIVITY_SECTORS.map(({ code, label }) => (
                        <option key={code} value={code}>
                            {label}
                        </option>
                    ))}
                </SelectInput>
                <InlineIcon
                    icon={ChevronDown}
                    className={uiTokens.profile.field.selectChevron}
                />
            </Box>
        </Stack>
    );
}
