import type { PropsWithChildren } from "react";
import { FormHeader } from "@/lib/ui/molecules";
import { CenteredCardFrame } from "@/lib/ui/organisms";
import { uiTokens } from "@/lib/ui/tokens";

interface AuthCardFrameProps extends PropsWithChildren {
    description: string;
    title: string;
}

export function AuthCardFrame({ children, description, title }: AuthCardFrameProps) {
    return (
        <CenteredCardFrame
            surfaceClassName={uiTokens.auth.page}
            containerClassName={uiTokens.auth.container}
            cardClassName={uiTokens.auth.card}
        >
            <FormHeader
                eyebrow="MaiaCoach"
                title={title}
                description={description}
                className={uiTokens.auth.header}
                eyebrowClassName={uiTokens.auth.eyebrow}
                titleClassName={uiTokens.auth.title}
                descriptionClassName={uiTokens.auth.description}
            />
            {children}
        </CenteredCardFrame>
    );
}
