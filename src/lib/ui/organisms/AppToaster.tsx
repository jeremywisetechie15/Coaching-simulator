"use client";

import { AlertCircle, CheckCircle2, Info, LoaderCircle, TriangleAlert, X } from "lucide-react";
import { Toaster } from "sonner";
import { InlineIcon } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";

export function AppToaster() {
    return (
        <Toaster
            closeButton
            containerAriaLabel="Notifications"
            duration={3500}
            expand={false}
            gap={10}
            icons={{
                close: <InlineIcon icon={X} className={uiTokens.toast.icon} />,
                error: <InlineIcon icon={AlertCircle} className={uiTokens.toast.icon} />,
                info: <InlineIcon icon={Info} className={uiTokens.toast.icon} />,
                loading: <InlineIcon icon={LoaderCircle} className={uiTokens.toast.loadingIcon} />,
                success: <InlineIcon icon={CheckCircle2} className={uiTokens.toast.icon} />,
                warning: <InlineIcon icon={TriangleAlert} className={uiTokens.toast.icon} />,
            }}
            mobileOffset={16}
            offset={24}
            position="bottom-right"
            theme="light"
            toastOptions={{
                classNames: {
                    actionButton: uiTokens.toast.actionButton,
                    cancelButton: uiTokens.toast.cancelButton,
                    closeButton: uiTokens.toast.closeButton,
                    description: uiTokens.toast.description,
                    error: uiTokens.toast.error,
                    info: uiTokens.toast.info,
                    loading: uiTokens.toast.loading,
                    success: uiTokens.toast.success,
                    title: uiTokens.toast.title,
                    toast: uiTokens.toast.root,
                    warning: uiTokens.toast.warning,
                },
            }}
            visibleToasts={4}
        />
    );
}
