import { ArrowLeft, Check, Pencil } from "lucide-react";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";

interface ProfilePageHeaderProps {
    isEditing: boolean;
    isSaving: boolean;
    onEdit: () => void;
    onSave: () => void;
}

export function ProfilePageHeader({ isEditing, isSaving, onEdit, onSave }: ProfilePageHeaderProps) {
    return (
        <Box className="mb-9 flex items-center justify-between gap-4">
            <Box className="flex items-center gap-7">
                <Button className="flex h-10 w-10 items-center justify-center rounded-full text-[#171B2A] transition hover:bg-white">
                    <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                </Button>
                <Text as="h1" className="text-[26px] font-extrabold tracking-[-0.02em] text-[#171B2A]">
                    Mon Profil
                </Text>
            </Box>

            <Button
                onClick={isEditing ? onSave : onEdit}
                disabled={isSaving}
                className="flex h-10 items-center gap-2 rounded-lg bg-[#5140F0] px-4 text-[14px] font-bold text-white shadow-[0_12px_24px_rgba(81,64,240,0.22)] transition hover:bg-[#4635E7]"
            >
                <InlineIcon icon={isEditing ? Check : Pencil} className="h-5 w-5" />
                {isSaving ? "Sauvegarde..." : isEditing ? "Valider" : "Modifier"}
            </Button>
        </Box>
    );
}
