import { KeyRound } from "lucide-react";
import { Box, Button, InlineIcon, Stack, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface ProfilePasswordControlProps {
    onChangePassword: () => void;
}

export function ProfilePasswordControl({
    onChangePassword,
}: ProfilePasswordControlProps) {
    return (
        <Stack className={uiTokens.profile.passwordModal.field}>
            <Text className={uiTokens.profile.security.label}>Mot de passe</Text>
            <Box className={uiTokens.profile.security.row}>
                <Box className={uiTokens.profile.security.summary}>
                    <Box className={uiTokens.profile.security.iconShell}>
                        <InlineIcon icon={KeyRound} className={uiTokens.profile.security.icon} />
                    </Box>
                    <Box>
                        <Text aria-hidden="true" className={uiTokens.profile.security.mask}>
                            ••••••••
                        </Text>
                        <Text className={uiTokens.profile.security.description}>
                            Modifiable de manière sécurisée
                        </Text>
                    </Box>
                </Box>
                <Button
                    aria-label="Modifier mon mot de passe"
                    className={cn(
                        uiTokens.action.accentSecondaryButton,
                        uiTokens.profile.security.action,
                    )}
                    onClick={onChangePassword}
                >
                    Modifier
                </Button>
            </Box>
        </Stack>
    );
}
