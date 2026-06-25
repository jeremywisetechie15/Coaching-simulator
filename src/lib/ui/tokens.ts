export const uiTokens = {
    badge: {
        stepNumber:
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5140F0] text-[13px] font-bold text-white",
        stepNumberMuted:
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-[13px] font-bold text-[#9CA3AF]",
    },
    progress: {
        /** Remplissage couleur primaire (défaut). */
        fill: "absolute inset-y-0 left-0 rounded-full bg-[#5140F0]",
        /** Remplissage sans couleur — la teinte est fournie en style inline (ex. par niveau). */
        fillBase: "absolute inset-y-0 left-0 rounded-full",
        track: "relative h-1.5 overflow-hidden rounded-full bg-[#E5E7EB]",
    },
    action: {
        addButton:
            "flex h-9 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] font-semibold text-[#374151] transition hover:border-[#D5D7DE]",
        addDashed:
            "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#D5D7DE] bg-white px-3 text-[13px] font-semibold text-[#6B7280] transition hover:border-[#5140F0] hover:bg-[#F4F3FE] hover:text-[#5140F0]",
        dangerIconButton:
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#9CA3AF] transition hover:bg-[#FEF2F2] hover:text-[#DC2626]",
        iconButton:
            "flex h-7 w-7 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#374151] transition hover:border-[#D5D7DE] hover:text-[#5140F0]",
        iconButtonGhost:
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#9CA3AF] transition hover:bg-white hover:text-[#111827]",
        listRemoveButton:
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#9CA3AF] transition hover:bg-[#F3F4F8] hover:text-[#111827]",
        primaryButton:
            "bg-[#5140F0] shadow-[0_10px_20px_rgba(81,64,240,0.18)] hover:bg-[#4635E7]",
        primaryButtonDisabled: "cursor-not-allowed bg-[#B9B2F8]",
        primaryFullButton:
            "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#5140F0] text-[15px] font-bold text-white shadow-[0_16px_30px_rgba(81,64,240,0.22)] transition hover:bg-[#4735EA] disabled:cursor-not-allowed disabled:opacity-70",
        secondaryButton:
            "flex h-11 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-6 text-[14px] font-semibold text-[#374151] transition hover:border-[#D5D7DE]",
        stepRemoveButton:
            "flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] transition hover:bg-[#F3F4F8] hover:text-[#111827]",
    },
    form: {
        control:
            "h-9 w-full rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-3.5 text-[14px] font-normal text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#5140F0] focus:bg-white focus:ring-4 focus:ring-[#5140F0]/10",
        controlWhite:
            "h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] font-normal text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#5140F0] focus:ring-4 focus:ring-[#5140F0]/10",
        controlReadonly:
            "h-9 w-full cursor-default rounded-lg border border-[#E9E7FB] bg-[#F4F3FE] px-3 text-[14px] font-medium text-[#374151] outline-none",
        label: "mb-2 block text-[14px] font-bold text-[#111827]",
        subLabel: "mb-1.5 block text-[13px] font-bold text-[#374151]",
        textArea:
            "w-full resize-none rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-3.5 py-3 text-[14px] font-normal text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#5140F0] focus:bg-white focus:ring-4 focus:ring-[#5140F0]/10",
        textAreaWhite:
            "min-h-[72px] w-full resize-none rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-[14px] font-normal text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#5140F0] focus:ring-4 focus:ring-[#5140F0]/10",
    },
    radio: {
        dot: "h-2.5 w-2.5 rounded-full bg-[#5140F0]",
        option: "flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition",
        optionIdle: "border-[#E5E7EB] bg-white hover:border-[#D5D7DE]",
        optionSelected: "border-[#5140F0] bg-[#F4F3FE]",
        ring: "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition",
        ringIdle: "border-[#9CA3AF]",
        ringSelected: "border-[#5140F0]",
    },
    select: {
        menu: "absolute left-0 right-0 top-[44px] z-30 max-h-[240px] overflow-y-auto rounded-xl border border-[#E5E7EB] p-1.5 shadow-[0_18px_40px_rgba(17,24,39,0.16)]",
        option: "flex h-11 w-full items-center justify-between gap-2 rounded-lg px-3 text-left text-[14px] font-medium transition hover:bg-[#F6F7FB]",
        optionActive: "text-[#5140F0]",
        optionIdle: "text-[#111827]",
        trigger:
            "flex h-9 w-full items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-3.5 text-[14px] transition",
        triggerDisabled: "cursor-not-allowed opacity-70",
        triggerEnabled: "hover:border-[#D5D7DE]",
        triggerPlaceholder: "text-[#9CA3AF]",
        triggerValue: "font-medium text-[#111827]",
    },
    searchableSelect: {
        chip: "inline-flex h-8 items-center gap-1.5 rounded-full border border-[#C9C2FB] bg-[#F4F3FE] pl-3 pr-1.5 text-[12px] font-bold text-[#5140F0]",
        chipRemoveButton:
            "flex h-5 w-5 items-center justify-center rounded-full text-[#5140F0] transition hover:bg-white",
        closeButton:
            "mt-2 flex h-9 w-full items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[13px] font-semibold text-[#374151] transition hover:border-[#D5D7DE]",
        option:
            "flex w-full flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-lg px-3 py-2 text-left transition hover:bg-[#F6F7FB]",
        panel: "rounded-xl border border-[#E5E7EB] bg-white p-2 shadow-[0_1px_2px_rgba(17,24,39,0.04)]",
    },
    modal: {
        closeButton:
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[#F3F4F7] hover:text-[#111827]",
        overlay:
            "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#111827]/55 px-4 py-8 backdrop-blur-[1px]",
        panel: "w-full max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_22px_60px_rgba(17,24,39,0.26)] md:p-7",
        title: "text-[20px] font-extrabold leading-tight",
    },
    /** Palettes de tons sémantiques (badges, pastilles d'icônes, textes de statut). */
    tone: {
        danger: { soft: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]", text: "text-[#DC2626]" },
        info: { soft: "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]", text: "text-[#2563EB]" },
        neutral: { soft: "border-[#E5E7EB] bg-[#F3F4F6] text-[#4B5563]", text: "text-[#4B5563]" },
        primary: { soft: "border-[#DDD6FE] bg-[#F5F3FF] text-[#6D28D9]", text: "text-[#6D28D9]" },
        success: { soft: "border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]", text: "text-[#16A34A]" },
        warning: { soft: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]", text: "text-[#B45309]" },
    },
    upload: {
        dropButton: "border border-dashed",
        dropButtonDisabled: "cursor-not-allowed border-[#D5D7DE] bg-[#F3F4F6] text-[#9CA3AF]",
        dropButtonEnabled: "border-[#C9C2FB] bg-white text-[#5140F0] hover:bg-[#F4F3FE]",
        fileRow: "rounded-lg border border-[#C9C2FB] bg-white px-3 py-2",
    },
    surface: {
        bullet: "h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9CED8]",
        divider: "my-8 h-px bg-[#ECEEF3]",
        emptyState: "rounded-[16px] border border-dashed border-[#E5E7EB] px-8 py-16 text-center",
        formCard:
            "rounded-[24px] border border-[#E9E7FB] p-7 shadow-[0_1px_2px_rgba(17,24,39,0.04)] md:p-9",
        dimensionCard: "rounded-[14px] border border-[#E5E7EB] bg-white p-5",
        learningCard: "space-y-3 rounded-[12px] border border-[#FED7AA] bg-[#FFF7ED] p-4",
        listToolbar: "rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-none",
        mutedPanel: "rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4",
        nestedCard: "rounded-[14px] border border-[#E5E7EB] bg-[#F7F8FB] p-4 shadow-none",
        pageBanner:
            "flex flex-col gap-4 rounded-2xl border border-[#E9E7FB] bg-gradient-to-r from-[#F5F3FF] to-[#FBF5FF] px-7 py-6 md:flex-row md:items-center md:justify-between",
        quickTakeCard: "space-y-3 rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] p-4",
        rowCard: "rounded-xl border border-[#E5E7EB] bg-white p-4",
        rowCardActive: "rounded-xl border border-[#C9C2FB] bg-[#F8F7FE] p-4",
        stepCard: "rounded-[16px] border border-[#E5E7EB] bg-[#FBFBFD] p-5 shadow-none",
    },
    text: {
        danger: "text-[#DC2626]",
        heading: "text-[#111827]",
        learning: "text-[#C2410C]",
        muted: "text-[#6B7280]",
        primary: "text-[#5140F0]",
        quickTake: "text-[#B7791F]",
        required: "text-[#EF4444]",
        success: "text-[#16A34A]",
        subtle: "text-[#374151]",
    },
} as const;
