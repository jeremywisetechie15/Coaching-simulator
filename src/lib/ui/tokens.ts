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
        backButton:
            "flex h-10 w-fit items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-[14px] font-semibold text-[#374151] transition hover:border-[#D5D7DE]",
        backLink:
            "inline-flex items-center gap-2 text-[14px] font-semibold text-[#4B5563] transition hover:text-[#111827]",
        addDashed:
            "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#D5D7DE] bg-white px-3 text-[13px] font-semibold text-[#6B7280] transition hover:border-[#5140F0] hover:bg-[#F4F3FE] hover:text-[#5140F0]",
        dangerIconButton:
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#9CA3AF] transition hover:bg-[#FEF2F2] hover:text-[#DC2626]",
        dangerButton:
            "flex h-11 items-center justify-center rounded-xl bg-[#DC2626] px-6 text-[14px] font-bold text-white transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-70",
        iconButton:
            "flex h-7 w-7 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#374151] transition hover:border-[#D5D7DE] hover:text-[#5140F0]",
        iconButtonGhost:
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#9CA3AF] transition hover:bg-white hover:text-[#111827]",
        listRemoveButton:
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#9CA3AF] transition hover:bg-[#F3F4F8] hover:text-[#111827]",
        menuItem:
            "flex h-9 w-full min-w-0 items-center gap-2 rounded-md px-3 text-[13px] font-semibold transition hover:bg-[#F6F7FB]",
        menuPanel: "rounded-lg border border-[#E5E7EB] bg-white shadow-[0_18px_40px_rgba(17,24,39,0.16)]",
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
    reviewAnswer: {
        card: "flex w-full items-start gap-3 rounded-[14px] border px-4 py-3.5 text-left transition",
        correct: "border-[#16A34A] bg-[#F0FDF4] shadow-[inset_0_0_0_1px_#16A34A]",
        explanationCard: "mt-5 rounded-[14px] border border-[#FDE68A] bg-[#FFFBEA] p-4",
        explanationHeader: "flex items-center gap-2 text-[13px] font-extrabold text-[#BB4D00]",
        explanationIcon: "h-4 w-4 shrink-0 text-[#BB4D00]",
        explanationText: "mt-1 text-[14px] font-medium leading-6 text-[#BB4D00]",
        idle: "border-[#E5E7EB] bg-white hover:border-[#D5D7DE]",
        indicator: "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2 transition",
        indicatorCorrect: "border-[#16A34A] bg-white",
        indicatorIdle: "border-[#9CA3AF]",
        indicatorIncorrect: "border-[#EF4444] bg-white",
        indicatorSelected: "border-[#5140F0]",
        incorrect: "border-[#DC2626] bg-[#FEF2F2] shadow-[inset_0_0_0_1px_#DC2626]",
        selected: "border-[#5140F0] bg-[#F4F3FE]",
    },
    routeStatus: {
        card: "w-full max-w-[560px] rounded-[20px] border border-[#E9E7FB] px-7 py-8 text-center shadow-[0_18px_50px_rgba(17,24,39,0.08)] md:px-10 md:py-10",
        iconBox: "mx-auto flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#F4F3FE] text-[#5140F0]",
    },
    select: {
        chevron: "h-4 w-4 shrink-0 transition-transform",
        menu: "absolute left-0 right-0 top-[44px] z-30 max-h-[240px] overflow-y-auto rounded-xl border border-[#E5E7EB] p-1.5 shadow-[0_18px_40px_rgba(17,24,39,0.16)]",
        option: "flex min-h-11 w-full min-w-0 items-start justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-[14px] font-medium transition hover:bg-[#F6F7FB]",
        optionActive: "text-[#5140F0]",
        optionIcon: "mt-0.5 h-4 w-4 shrink-0 text-[#6B7280]",
        optionIdle: "text-[#111827]",
        optionLabel: "block whitespace-normal break-words leading-5",
        optionLabelWrapper: "min-w-0 flex-1",
        trigger:
            "flex h-9 w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-3.5 text-[14px] transition",
        triggerDisabled: "cursor-not-allowed opacity-70",
        triggerEnabled: "hover:border-[#D5D7DE]",
        triggerIcon: "h-4 w-4 shrink-0 text-[#6B7280]",
        triggerLabel: "block truncate text-left",
        triggerLabelWrapper: "min-w-0 flex-1",
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
    /** Cartes sémantiques colorées d'une étape de méthode (objectifs, bonnes pratiques, erreurs…). */
    stepBlock: {
        card: "rounded-[14px] border p-5",
        dot: "mt-2 h-1.5 w-1.5 shrink-0 rounded-full",
        header: "flex items-center gap-2",
        icon: "h-4 w-4 shrink-0",
        item: "flex gap-2.5",
        list: "mt-3 space-y-2.5",
        text: "text-[14px] font-medium leading-6 text-[#4B5563]",
        title: "text-[15px] font-extrabold text-[#111827]",
        tone: {
            blue: { accent: "text-[#2563EB]", dot: "bg-[#2563EB]", surface: "border-[#C2D8FD] bg-[#EFF4FF]" },
            green: { accent: "text-[#16A34A]", dot: "bg-[#16A34A]", surface: "border-[#BBF7D0] bg-[#F0FDF4]" },
            indigo: { accent: "text-[#5140F0]", dot: "bg-[#5140F0]", surface: "border-[#C9C2FB] bg-[#F1F0FE]" },
            orange: { accent: "text-[#EA580C]", dot: "bg-[#EA580C]", surface: "border-[#FED7AA] bg-[#FFF7ED]" },
            violet: { accent: "text-[#8B2FD6]", dot: "bg-[#8B2FD6]", surface: "border-[#E6D9FB] bg-[#F8F5FE]" },
        },
    },
    /** Page de détail d'une scorecard : en-tête statistique, accordéon d'étape et tableau de critères. */
    scorecard: {
        criterionEvidence: "text-[13px] font-medium leading-5 text-[#4B5563]",
        criterionKey: "text-[14px] font-bold leading-5 text-[#111827]",
        criterionMeta: "text-[13px] font-medium leading-5 text-[#4B5563]",
        criteriaGrid:
            "grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.85fr)_44px_minmax(0,1.9fr)_minmax(0,1.7fr)]",
        metaChip:
            "inline-flex h-10 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3.5 text-[13px] font-semibold text-[#4B5563]",
        metaChipIcon: "h-4 w-4 shrink-0 text-[#9CA3AF]",
        ptsBadge:
            "inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-[#EEF0FE] px-2 text-[13px] font-extrabold text-[#5140F0]",
        statDivider: "text-[#D1D5DB]",
        statLabel: "font-medium text-[#6B7280]",
        statValue: "font-extrabold text-[#111827]",
        statsBox:
            "inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-xl border border-[#E5E7EB] bg-[#F7F8FB] px-4 py-3 text-[13px]",
        stepCard: "overflow-hidden rounded-[14px] border border-[#E5E7EB] shadow-none",
        stepChevron: "h-5 w-5 shrink-0 text-[#9CA3AF] transition-transform",
        stepHeader: "flex w-full items-center gap-4 px-5 py-4 text-left",
        stepIcon: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
        stepMeta: "shrink-0 text-[13px] font-semibold text-[#6B7280]",
        stepTitle: "min-w-0 flex-1 text-[16px] font-bold text-[#111827]",
        /** Teintes d'icône d'étape, attribuées par ordre (cyclées). */
        stepTones: [
            "bg-[#E7EDFD] text-[#3B6FD0]",
            "bg-[#F3E8FD] text-[#8B2FD6]",
            "bg-[#FFF1E8] text-[#EA580C]",
            "bg-[#E7F9ED] text-[#16A34A]",
        ],
        tableHeader:
            "grid items-center gap-4 border-t border-[#ECEEF3] px-5 pb-2 pt-3 text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#9CA3AF]",
        tableRow: "grid items-start gap-4 border-t border-[#F1F2F5] px-5 py-4",
        verbatimBox:
            "rounded-[10px] bg-[#F0FDF4] px-3 py-2.5 text-[13px] font-medium italic leading-5 text-[#15803D]",
    },
    /** Page de session roleplay : cadre de l'iframe runtime + panneau d'infos persona à droite. */
    session: {
        countBadge:
            "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#EEF0FE] px-1.5 text-[12px] font-bold text-[#5140F0]",
        documentsButton:
            "flex w-full items-center justify-between gap-2 text-[14px] font-bold text-[#374151] transition hover:text-[#5140F0]",
        factIcon: "h-4 w-4 shrink-0 text-[#9CA3AF]",
        factRow: "flex items-center gap-2.5 text-[14px] font-semibold text-[#374151]",
        frame: "h-[680px] w-full border-0",
        frameCard: "overflow-hidden rounded-[20px] border border-[#E9E7FB] shadow-[0_1px_2px_rgba(17,24,39,0.04)]",
        frameFallback:
            "flex h-[680px] flex-col items-center justify-center gap-3 bg-[#F8F9FC] p-6 text-center",
        panel: "rounded-[20px] border border-[#E9E7FB] bg-white p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)]",
        panelHeader: "flex items-center gap-2 border-b border-[#EDEEF3] pb-4",
        panelHeaderIcon: "h-5 w-5 shrink-0 text-[#5140F0]",
        panelHeaderTitle: "text-[15px] font-extrabold text-[#111827]",
        sectionIcon: "mt-0.5 h-4 w-4 shrink-0 text-[#5140F0]",
        sectionRow: "flex gap-2.5",
        sectionText: "text-[14px] font-medium leading-6 text-[#4B5563]",
    },
    /** Loader plein écran « Analyse en cours » : badge animé + checklist d'étapes (3 états). */
    analysisLoader: {
        badge: "relative flex h-24 w-24 items-center justify-center",
        badgeCore:
            "flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#5140F0] text-white shadow-[0_12px_30px_rgba(81,64,240,0.35)]",
        badgeRing: "absolute inset-0 animate-spin rounded-full border-4 border-[#EDE9FE] border-t-[#5140F0]",
        description: "mt-2 text-[14px] font-medium leading-6 text-[#6B7280]",
        iconActive: "h-5 w-5 shrink-0 text-[#5140F0]",
        iconDone: "h-5 w-5 shrink-0 text-[#16A34A]",
        iconPending: "h-5 w-5 shrink-0 text-[#D1D5DB]",
        list: "mt-6 space-y-2.5",
        row: "flex items-center gap-3 rounded-xl px-4 py-3 text-left text-[14px] font-semibold transition",
        rowActive: "border border-[#C9C2FB] bg-[#F4F3FE] text-[#5140F0]",
        rowDone: "bg-[#F7F8FB] text-[#374151]",
        rowPending: "bg-[#F7F8FB] text-[#9CA3AF]",
        title: "mt-5 text-[26px] font-extrabold text-[#111827]",
    },
    /** Page « Détail de ma progression » : score de maîtrise, dimensions, étapes et compétences. */
    progression: {
        /** Palette par niveau de score — pilote pastilles, barres et pastilles rondes. */
        level: {
            green: { pill: "bg-[#DCFCE7] text-[#16A34A]", fill: "#16A34A", dot: "bg-[#16A34A]" },
            yellow: { pill: "bg-[#FEF3C7] text-[#B45309]", fill: "#F59E0B", dot: "bg-[#F59E0B]" },
            orange: { pill: "bg-[#FFEDD5] text-[#C2410C]", fill: "#F97316", dot: "bg-[#F97316]" },
            red: { pill: "bg-[#FEE2E2] text-[#DC2626]", fill: "#EF4444", dot: "bg-[#EF4444]" },
        },
        /** Teintes d'icône des 3 dimensions (résumé + tableau détaillé). */
        dimensionTone: {
            savoir: "bg-[#E7EDFD] text-[#3B6FD0]",
            "savoir-faire": "bg-[#F3E8FD] text-[#8B2FD6]",
            "savoir-etre": "bg-[#E4EDFF] text-[#2563EB]",
        },
        /** Bandeau « Score de maîtrise ». */
        masteryCard:
            "flex flex-col gap-4 rounded-[16px] border border-[#E9E7FB] bg-gradient-to-r from-[#F8F9FE] via-[#F6F5FE] to-[#F4F3FE] p-5 md:flex-row md:items-center md:gap-5",
        masteryIcon: "flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-[#E7E5FB] text-[#5140F0]",
        masteryLabel: "text-[13px] font-medium text-[#9CA3AF]",
        masteryTitle: "text-[15px] font-bold text-[#111827]",
        /** Pastille de score colorée par niveau (grande, ex. en-têtes d'accordéon). */
        scorePill: "inline-flex items-center justify-center rounded-[10px] px-3 py-1.5 text-[14px] font-extrabold",
        /** Pastille discrète « Initial : xx% » (texte toujours sur une ligne). */
        ghostPill:
            "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1 text-[12px] font-semibold text-[#6B7280]",
        /** Pastille ambre « Après training : xx% » (texte toujours sur une ligne). */
        afterPill:
            "inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[12px] font-semibold text-[#B45309]",
        /** Badge d'évolution vert « ↗ +x% » (texte toujours sur une ligne). */
        delta: "inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[13px] font-bold text-[#16A34A]",
        /** Carte accordéon (étape, compétence, dimensions). */
        accordion: "overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white",
        accordionHeader: "flex w-full items-center gap-3 px-5 py-4 text-left",
        chevron: "h-5 w-5 shrink-0 text-[#9CA3AF] transition-transform",
        iconSquare: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
        /** Segmented control « Par étapes / Par compétences ». */
        tabs: "inline-flex items-center gap-1 rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] p-1",
        tabActive: "rounded-lg bg-white px-4 py-1.5 text-[13px] font-semibold text-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.1)]",
        tabIdle: "rounded-lg px-4 py-1.5 text-[13px] font-semibold text-[#6B7280] transition hover:text-[#374151]",
        /** Encart « Diagnostic principal IA ». */
        diagnosticBox: "rounded-[14px] border border-[#E7E5FB] bg-[#F5F4FE] p-5",
        diagnosticTitle: "text-[14px] font-bold text-[#5140F0]",
        diagnosticText: "mt-2 text-[14px] font-medium leading-6 text-[#4B5563]",
        /** En-têtes de tableaux (MODALITÉ / DIMENSION / COMPÉTENCE …). */
        tableHead: "text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#9CA3AF]",
        /** Étiquette d'axe du radar. */
        radarAxisLabel:
            "rounded-full border border-[#E9E7FB] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#5140F0]",
        footnote: "text-center text-[12px] font-medium leading-5 text-[#9CA3AF]",
    },
    /** Panneau latéral coulissant (slide-over) ancré à droite. */
    drawer: {
        body: "px-6 py-5",
        header:
            "sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#ECEEF3] bg-white px-6 py-5",
        overlay: "fixed inset-0 z-50 flex justify-end bg-[#111827]/45 backdrop-blur-[1px]",
        panel:
            "flex h-full w-full max-w-[440px] flex-col overflow-y-auto bg-white shadow-[-20px_0_50px_rgba(17,24,39,0.18)]",
        title: "text-[18px] font-extrabold text-[#111827]",
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
    tooltip: {
        bubble:
            "pointer-events-none absolute bottom-full left-0 z-50 mb-2 hidden max-w-[320px] rounded-lg border border-[#E5E7EB] bg-[#111827] px-2.5 py-1.5 text-left text-[12px] font-semibold leading-4 text-white shadow-[0_14px_30px_rgba(17,24,39,0.18)] group-hover/tooltip:block group-focus-within/tooltip:block",
        root: "group/tooltip relative inline-flex min-w-0",
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
        body: "text-[#4B5563]",
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
