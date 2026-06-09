"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Building2,
    ChevronDown,
    ChevronUp,
    Copy,
    FileText,
    GripVertical,
    Image as ImageIcon,
    Link as LinkIcon,
    Plus,
    Trash2,
    User,
    Users,
    X,
    type LucideIcon,
} from "lucide-react";
import { Box, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { cn } from "@/lib/ui/utils/cn";
import { methods } from "@/features/methods/data/methods";
import { demoOrganizations } from "@/features/organizations/domain/organization-list";
import {
    demoOrganizationGroups,
    demoOrganizationUsers,
} from "@/features/organizations/domain/organization-detail";
import {
    createEmptyCategory,
    createEmptyQuestion,
    getInitialCreateQuizForm,
    QUIZ_ASSIGNMENT_TYPES,
    QUIZ_PARTICIPATION_OPTIONS,
    QUIZ_QUESTION_TYPES,
    QUIZ_TYPES,
    QUIZ_VISIBILITY_OPTIONS,
    type CreateQuizFormValues,
    type QuizAnswerDraft,
    type QuizAssignmentType,
    type QuizCategoryDraft,
    type QuizParticipation,
    type QuizQuestionDraft,
    type QuizQuestionTypeValue,
    type QuizType,
    type QuizVisibility,
} from "@/features/evaluations/data/quiz-creation";

const ALL_ORGS_SENTINEL = "__all_orgs__";

const fieldLabelClass = "block text-[13px] font-semibold text-[#111827]";
const inputBaseClass =
    "w-full rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-3.5 text-[14px] font-medium text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#5140F0] focus:bg-white focus:ring-2 focus:ring-[#5140F0]/15";
const inputClass = `${inputBaseClass} h-11`;
const textareaClass = `${inputBaseClass} py-3 resize-none`;

export function CreateQuizPageContent() {
    const [form, setForm] = useState<CreateQuizFormValues>(getInitialCreateQuizForm);
    const [tagDraft, setTagDraft] = useState("");

    const totalQuestions = useMemo(
        () => form.categories.reduce((sum, c) => sum + c.questions.length, 0),
        [form.categories],
    );

    function patch<K extends keyof CreateQuizFormValues>(key: K, value: CreateQuizFormValues[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function commitTag() {
        const value = tagDraft.trim();
        if (!value || form.tags.includes(value)) {
            setTagDraft("");
            return;
        }
        patch("tags", [...form.tags, value]);
        setTagDraft("");
    }

    function removeTag(tag: string) {
        patch(
            "tags",
            form.tags.filter((t) => t !== tag),
        );
    }

    function updateCategory(id: string, updater: (cat: QuizCategoryDraft) => QuizCategoryDraft) {
        patch(
            "categories",
            form.categories.map((cat) => (cat.id === id ? updater(cat) : cat)),
        );
    }

    function addCategory() {
        patch("categories", [...form.categories, createEmptyCategory()]);
    }

    function removeCategory(id: string) {
        patch(
            "categories",
            form.categories.filter((c) => c.id !== id),
        );
    }

    function addQuestion(categoryId: string) {
        updateCategory(categoryId, (cat) => ({
            ...cat,
            collapsed: false,
            questions: [...cat.questions, createEmptyQuestion()],
        }));
    }

    function updateQuestion(
        categoryId: string,
        questionId: string,
        updater: (q: QuizQuestionDraft) => QuizQuestionDraft,
    ) {
        updateCategory(categoryId, (cat) => ({
            ...cat,
            questions: cat.questions.map((q) => (q.id === questionId ? updater(q) : q)),
        }));
    }

    function removeQuestion(categoryId: string, questionId: string) {
        updateCategory(categoryId, (cat) => ({
            ...cat,
            questions: cat.questions.filter((q) => q.id !== questionId),
        }));
    }

    function duplicateQuestion(categoryId: string, questionId: string) {
        updateCategory(categoryId, (cat) => {
            const index = cat.questions.findIndex((q) => q.id === questionId);
            if (index === -1) return cat;
            const source = cat.questions[index];
            const clone: QuizQuestionDraft = {
                ...source,
                id: `${source.id}-copy-${Date.now()}`,
                answers: source.answers.map((a, i) => ({ ...a, id: `${a.id}-copy-${i}-${Date.now()}` })),
            };
            const next = [...cat.questions];
            next.splice(index + 1, 0, clone);
            return { ...cat, questions: next };
        });
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        // À brancher côté serveur.
    }

    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[940px]">
                <Box className="mb-7 flex items-start gap-5">
                    <Link
                        href="/evaluations"
                        aria-label="Retour"
                        className="mt-2 flex h-9 w-9 items-center justify-center rounded-full text-[#111827] transition hover:bg-white"
                    >
                        <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                    </Link>
                    <Box>
                        <Text
                            as="h1"
                            className="text-[30px] font-extrabold leading-tight text-[#111827] md:text-[34px]"
                        >
                            Créer un quiz
                        </Text>
                        <Text className="mt-2 text-[15px] font-semibold text-[#596273]">
                            Remplissez les informations ci-dessous pour créer votre quiz
                        </Text>
                    </Box>
                </Box>

                <form onSubmit={handleSubmit}>
                    <CardSurface className="rounded-[18px] border border-[#E5E7EB] bg-white p-7 shadow-none">
                        <Text as="h2" className="text-[18px] font-extrabold text-[#111827]">
                            Informations générales
                        </Text>

                        <Box className="mt-5 flex flex-col gap-5">
                            <Field label="Titre du quiz" required htmlFor="quiz-title">
                                <input
                                    id="quiz-title"
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => patch("title", e.target.value)}
                                    placeholder="Ex: Quiz - DEEPMARK"
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Type de quiz" htmlFor="quiz-type">
                                <SelectField
                                    id="quiz-type"
                                    value={form.type}
                                    onChange={(value) => patch("type", value as QuizType)}
                                    options={QUIZ_TYPES.map((t) => ({ value: t, label: t }))}
                                />
                            </Field>

                            <Field label="Méthode associée (optionnel)" htmlFor="quiz-method">
                                <SelectField
                                    id="quiz-method"
                                    value={form.methodId}
                                    onChange={(value) => patch("methodId", value)}
                                    options={[
                                        { value: "", label: "Aucune" },
                                        ...methods.map((m) => ({ value: m.id, label: m.name })),
                                    ]}
                                />
                            </Field>

                            <Field label="Description" required htmlFor="quiz-description">
                                <textarea
                                    id="quiz-description"
                                    value={form.description}
                                    onChange={(e) => patch("description", e.target.value)}
                                    placeholder="Ex: 40 questions pour valider la bonne maîtrise du document de référence"
                                    rows={2}
                                    className={textareaClass}
                                />
                            </Field>

                            <Field label="Durée estimée (en minutes)" htmlFor="quiz-duration">
                                <input
                                    id="quiz-duration"
                                    type="number"
                                    min={1}
                                    value={form.durationMinutes}
                                    onChange={(e) =>
                                        patch("durationMinutes", Number(e.target.value) || 0)
                                    }
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Tags" htmlFor="quiz-tags">
                                {form.tags.length > 0 && (
                                    <Box className="mb-2 flex flex-wrap gap-2">
                                        {form.tags.map((tag) => (
                                            <Box
                                                key={tag}
                                                className="inline-flex h-7 items-center gap-1.5 rounded-md bg-[#F3F4F6] px-2.5 text-[12px] font-semibold text-[#4B5563]"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => removeTag(tag)}
                                                    aria-label={`Supprimer ${tag}`}
                                                    className="flex h-4 w-4 items-center justify-center rounded-full text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#111827]"
                                                >
                                                    <X className="h-3 w-3" strokeWidth={2.5} />
                                                </button>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                                <Box className="flex gap-2">
                                    <input
                                        id="quiz-tags"
                                        type="text"
                                        value={tagDraft}
                                        onChange={(e) => setTagDraft(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                commitTag();
                                            }
                                        }}
                                        placeholder="Ajouter un tag..."
                                        className={inputClass}
                                    />
                                    <button
                                        type="button"
                                        onClick={commitTag}
                                        aria-label="Ajouter le tag"
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#374151] transition hover:border-[#5140F0] hover:text-[#5140F0]"
                                    >
                                        <Plus className="h-4 w-4" strokeWidth={2.5} />
                                    </button>
                                </Box>
                            </Field>

                            <Box>
                                <Text className={fieldLabelClass}>Visibilité</Text>
                                <Box className="mt-2 flex flex-col gap-2.5">
                                    {QUIZ_VISIBILITY_OPTIONS.map((option) => {
                                        const active = form.visibility === option.value;
                                        return (
                                            <RadioCard
                                                key={option.value}
                                                active={active}
                                                title={option.title}
                                                description={option.description}
                                                onClick={() =>
                                                    patch("visibility", option.value as QuizVisibility)
                                                }
                                            />
                                        );
                                    })}
                                </Box>

                                {form.visibility === "private" && (
                                    <Box className="mt-4 rounded-xl border border-[#E5E7EB] bg-[#FAFAFB] p-4">
                                        <Box className="flex flex-col gap-4">
                                            <Field
                                                label="Type d'assignation"
                                                htmlFor="quiz-assignment-type"
                                            >
                                                <AssignmentTypeSelect
                                                    id="quiz-assignment-type"
                                                    value={form.assignmentType}
                                                    onChange={(value) => {
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            assignmentType: value,
                                                            assignmentTargetId: "",
                                                            assignmentParentOrgId: "",
                                                        }));
                                                    }}
                                                />
                                            </Field>

                                            {form.assignmentType === "organization" && (
                                                <Field
                                                    label="Sélectionner une organisation"
                                                    htmlFor="quiz-assignment-target"
                                                >
                                                    <SelectField
                                                        id="quiz-assignment-target"
                                                        value={form.assignmentTargetId}
                                                        onChange={(value) =>
                                                            patch("assignmentTargetId", value)
                                                        }
                                                        options={[
                                                            { value: "", label: "Choisir une organisation..." },
                                                            ...demoOrganizations.map((org) => ({
                                                                value: org.id,
                                                                label: org.name,
                                                            })),
                                                        ]}
                                                    />
                                                </Field>
                                            )}

                                            {form.assignmentType === "group" && (
                                                <>
                                                    <Field
                                                        label="Sélectionner une organisation"
                                                        htmlFor="quiz-assignment-org"
                                                    >
                                                        <SelectField
                                                            id="quiz-assignment-org"
                                                            value={form.assignmentParentOrgId}
                                                            onChange={(value) =>
                                                                setForm((prev) => ({
                                                                    ...prev,
                                                                    assignmentParentOrgId: value,
                                                                    assignmentTargetId:
                                                                        value === ALL_ORGS_SENTINEL
                                                                            ? ALL_ORGS_SENTINEL
                                                                            : "",
                                                                }))
                                                            }
                                                            options={[
                                                                { value: "", label: "Choisir une organisation..." },
                                                                {
                                                                    value: ALL_ORGS_SENTINEL,
                                                                    label: "Tous les groupes de toutes les organisations",
                                                                },
                                                                ...demoOrganizations.map((org) => ({
                                                                    value: org.id,
                                                                    label: org.name,
                                                                })),
                                                            ]}
                                                        />
                                                    </Field>
                                                    {form.assignmentParentOrgId &&
                                                        form.assignmentParentOrgId !== ALL_ORGS_SENTINEL && (
                                                            <Field
                                                                label="Sélectionner un groupe"
                                                                htmlFor="quiz-assignment-target"
                                                            >
                                                                <SelectField
                                                                    id="quiz-assignment-target"
                                                                    value={form.assignmentTargetId}
                                                                    onChange={(value) =>
                                                                        patch("assignmentTargetId", value)
                                                                    }
                                                                    options={[
                                                                        { value: "", label: "Choisir un groupe..." },
                                                                        ...demoOrganizationGroups.map((g) => ({
                                                                            value: g.id,
                                                                            label: g.name,
                                                                        })),
                                                                    ]}
                                                                />
                                                            </Field>
                                                        )}
                                                </>
                                            )}

                                            {form.assignmentType === "user" && (
                                                <Field
                                                    label="Sélectionner un utilisateur"
                                                    htmlFor="quiz-assignment-target"
                                                >
                                                    <SelectField
                                                        id="quiz-assignment-target"
                                                        value={form.assignmentTargetId}
                                                        onChange={(value) =>
                                                            patch("assignmentTargetId", value)
                                                        }
                                                        options={[
                                                            { value: "", label: "Choisir un utilisateur..." },
                                                            ...demoOrganizationUsers.map((u) => ({
                                                                value: u.id,
                                                                label: u.name,
                                                            })),
                                                        ]}
                                                    />
                                                </Field>
                                            )}

                                            <Box>
                                                <Text className={fieldLabelClass}>
                                                    Type de participation
                                                </Text>
                                                <Box className="mt-2 flex flex-col gap-2.5">
                                                    {QUIZ_PARTICIPATION_OPTIONS.map((option) => {
                                                        const active =
                                                            form.participation === option.value;
                                                        return (
                                                            <RadioCard
                                                                key={option.value}
                                                                active={active}
                                                                title={option.title}
                                                                description={option.description}
                                                                onClick={() =>
                                                                    patch(
                                                                        "participation",
                                                                        option.value as QuizParticipation,
                                                                    )
                                                                }
                                                            />
                                                        );
                                                    })}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </Box>

                        <Box className="my-7 border-t border-[#E5E7EB]" />

                        <Box className="flex items-start justify-between gap-4">
                            <Box>
                                <Text as="h2" className="text-[18px] font-extrabold text-[#111827]">
                                    Catégories et Questions
                                </Text>
                                <Text className="mt-1 text-[13px] font-medium text-[#6B7280]">
                                    Total : {totalQuestions} question(s) répartie(s) en{" "}
                                    {form.categories.length} catégorie(s)
                                </Text>
                            </Box>
                            <button
                                type="button"
                                onClick={addCategory}
                                className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] font-bold text-[#111827] transition hover:border-[#5140F0] hover:text-[#5140F0]"
                            >
                                <Plus className="h-4 w-4" strokeWidth={2.5} />
                                Ajouter une catégorie
                            </button>
                        </Box>

                        <Box className="mt-4 flex flex-col gap-4">
                            {form.categories.length === 0 ? (
                                <Box className="rounded-xl border border-dashed border-[#E5E7EB] py-10 text-center">
                                    <Text className="text-[14px] font-semibold text-[#6B7280]">
                                        Aucune catégorie créée
                                    </Text>
                                    <Text className="mt-1 text-[13px] font-medium text-[#9CA3AF]">
                                        Cliquez sur &quot;Ajouter une catégorie&quot; pour commencer
                                    </Text>
                                </Box>
                            ) : (
                                form.categories.map((category) => (
                                    <CategoryCard
                                        key={category.id}
                                        category={category}
                                        onRename={(name) =>
                                            updateCategory(category.id, (c) => ({ ...c, name }))
                                        }
                                        onToggleCollapse={() =>
                                            updateCategory(category.id, (c) => ({
                                                ...c,
                                                collapsed: !c.collapsed,
                                            }))
                                        }
                                        onRemove={() => removeCategory(category.id)}
                                        onAddQuestion={() => addQuestion(category.id)}
                                        onUpdateQuestion={(qid, updater) =>
                                            updateQuestion(category.id, qid, updater)
                                        }
                                        onRemoveQuestion={(qid) => removeQuestion(category.id, qid)}
                                        onDuplicateQuestion={(qid) =>
                                            duplicateQuestion(category.id, qid)
                                        }
                                    />
                                ))
                            )}
                        </Box>
                    </CardSurface>

                    <Box className="mt-6 flex justify-end gap-3">
                        <Link
                            href="/evaluations"
                            className="flex h-11 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white px-5 text-[14px] font-bold text-[#111827] transition hover:border-[#D5D7DE]"
                        >
                            Annuler
                        </Link>
                        <button
                            type="submit"
                            className="flex h-11 items-center justify-center rounded-lg bg-[#5140F0] px-5 text-[14px] font-bold text-white shadow-[0_10px_20px_rgba(81,64,240,0.18)] transition hover:bg-[#4635E7]"
                        >
                            Créer le quiz
                        </button>
                    </Box>
                </form>
            </Box>
        </Box>
    );
}

function RadioCard({
    active,
    title,
    description,
    onClick,
}: {
    active: boolean;
    title: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                "flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition",
                active ? "border-[#5140F0] bg-[#F4F3FE]" : "border-[#E5E7EB] bg-white hover:border-[#D5D7DE]",
            )}
        >
            <span
                className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition",
                    active ? "border-[#5140F0]" : "border-[#111827]",
                )}
            >
                {active && <span className="h-2 w-2 rounded-full bg-[#5140F0]" />}
            </span>
            <Box>
                <Text className="text-[14px] font-bold text-[#111827]">{title}</Text>
                <Text className="mt-0.5 text-[13px] font-medium text-[#6B7280]">{description}</Text>
            </Box>
        </button>
    );
}

const assignmentTypeIcons: Record<QuizAssignmentType, LucideIcon> = {
    organization: Building2,
    group: Users,
    user: User,
};

function AssignmentTypeSelect({
    id,
    value,
    onChange,
}: {
    id?: string;
    value: QuizAssignmentType | "";
    onChange: (value: QuizAssignmentType | "") => void;
}) {
    const selected = QUIZ_ASSIGNMENT_TYPES.find((option) => option.value === value);
    const Icon = selected ? assignmentTypeIcons[selected.value] : null;

    return (
        <Box className="relative">
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value as QuizAssignmentType | "")}
                className={cn(inputClass, "appearance-none pr-10", Icon ? "pl-10" : undefined)}
            >
                <option value="">Sélectionner un type</option>
                {QUIZ_ASSIGNMENT_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {Icon && (
                <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            )}
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
        </Box>
    );
}

interface FieldProps {
    label: string;
    htmlFor: string;
    required?: boolean;
    children: React.ReactNode;
}

function Field({ label, htmlFor, required, children }: FieldProps) {
    return (
        <Box>
            <label htmlFor={htmlFor} className={`${fieldLabelClass} mb-1.5`}>
                {label}
                {required && <span className="ml-0.5 text-[#EF4444]">*</span>}
            </label>
            {children}
        </Box>
    );
}

interface SelectFieldProps {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}

function SelectField({ id, value, onChange, options }: SelectFieldProps) {
    return (
        <Box className="relative">
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`${inputClass} appearance-none pr-10`}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
        </Box>
    );
}

interface CategoryCardProps {
    category: QuizCategoryDraft;
    onRename: (name: string) => void;
    onToggleCollapse: () => void;
    onRemove: () => void;
    onAddQuestion: () => void;
    onUpdateQuestion: (id: string, updater: (q: QuizQuestionDraft) => QuizQuestionDraft) => void;
    onRemoveQuestion: (id: string) => void;
    onDuplicateQuestion: (id: string) => void;
}

function CategoryCard({
    category,
    onRename,
    onToggleCollapse,
    onRemove,
    onAddQuestion,
    onUpdateQuestion,
    onRemoveQuestion,
    onDuplicateQuestion,
}: CategoryCardProps) {
    return (
        <Box className="rounded-xl border border-[#E5E7EB] bg-white p-3">
            <Box className="flex items-center gap-2">
                <button
                    type="button"
                    aria-label="Déplacer la catégorie"
                    className="flex h-9 w-7 cursor-grab items-center justify-center text-[#9CA3AF] hover:text-[#6B7280]"
                >
                    <GripVertical className="h-4 w-4" />
                </button>
                <input
                    type="text"
                    value={category.name}
                    onChange={(e) => onRename(e.target.value)}
                    placeholder="Nom de la catégorie..."
                    className={`${inputClass} h-10 flex-1`}
                />
                <Box className="inline-flex h-9 items-center rounded-md bg-[#F3F4F6] px-3 text-[12px] font-bold text-[#4B5563]">
                    {category.questions.length} question(s)
                </Box>
                <button
                    type="button"
                    onClick={onToggleCollapse}
                    aria-label={category.collapsed ? "Déplier" : "Replier"}
                    className="flex h-9 w-9 items-center justify-center rounded-md text-[#6B7280] transition hover:bg-[#F3F4F6] hover:text-[#111827]"
                >
                    {category.collapsed ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronUp className="h-4 w-4" />
                    )}
                </button>
                <button
                    type="button"
                    onClick={onRemove}
                    aria-label="Supprimer la catégorie"
                    className="flex h-9 w-9 items-center justify-center rounded-md text-[#EF4444] transition hover:bg-[#FEF2F2]"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </Box>

            {!category.collapsed && (
                <Box className="mt-3 flex flex-col gap-3">
                    {category.questions.map((question, index) => (
                        <QuestionCard
                            key={question.id}
                            question={question}
                            index={index}
                            onUpdate={(updater) => onUpdateQuestion(question.id, updater)}
                            onRemove={() => onRemoveQuestion(question.id)}
                            onDuplicate={() => onDuplicateQuestion(question.id)}
                        />
                    ))}
                    <button
                        type="button"
                        onClick={onAddQuestion}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#D1D5DB] bg-white text-[14px] font-bold text-[#374151] transition hover:border-[#5140F0] hover:text-[#5140F0]"
                    >
                        <Plus className="h-4 w-4" strokeWidth={2.5} />
                        Ajouter une question
                    </button>
                </Box>
            )}
        </Box>
    );
}

interface QuestionCardProps {
    question: QuizQuestionDraft;
    index: number;
    onUpdate: (updater: (q: QuizQuestionDraft) => QuizQuestionDraft) => void;
    onRemove: () => void;
    onDuplicate: () => void;
}

function QuestionCard({ question, index, onUpdate, onRemove, onDuplicate }: QuestionCardProps) {
    function setAnswerCorrect(answerId: string) {
        onUpdate((q) => ({
            ...q,
            answers: q.answers.map((a) =>
                q.type === "QCU"
                    ? { ...a, correct: a.id === answerId }
                    : a.id === answerId
                      ? { ...a, correct: !a.correct }
                      : a,
            ),
        }));
    }

    function setAnswerText(answerId: string, text: string) {
        onUpdate((q) => ({
            ...q,
            answers: q.answers.map((a) => (a.id === answerId ? { ...a, text } : a)),
        }));
    }

    return (
        <Box className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFB] p-4">
            <Box className="flex items-start gap-2">
                <textarea
                    value={question.prompt}
                    onChange={(e) => onUpdate((q) => ({ ...q, prompt: e.target.value }))}
                    placeholder={`Question ${index + 1}...`}
                    rows={2}
                    className={`${textareaClass} flex-1`}
                />
                <button
                    type="button"
                    onClick={onRemove}
                    aria-label="Supprimer la question"
                    className="flex h-9 w-9 items-center justify-center rounded-md text-[#EF4444] transition hover:bg-[#FEF2F2]"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </Box>

            <Box className="mt-3 flex items-center gap-2">
                <Box className="w-[220px]">
                    <SelectField
                        value={question.type}
                        onChange={(value) =>
                            onUpdate((q) => ({ ...q, type: value as QuizQuestionTypeValue }))
                        }
                        options={QUIZ_QUESTION_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                    />
                </Box>
                <button
                    type="button"
                    onClick={onDuplicate}
                    aria-label="Dupliquer la question"
                    className="flex h-9 w-9 items-center justify-center rounded-md text-[#6B7280] transition hover:bg-[#F3F4F6] hover:text-[#111827]"
                >
                    <Copy className="h-4 w-4" />
                </button>
            </Box>

            <Text className="mt-4 text-[12px] font-semibold text-[#6B7280]">
                Choix de réponse — cliquez sur le rond pour définir la bonne réponse
            </Text>

            <Box className="mt-2 flex flex-col gap-2">
                {question.answers.map((answer) => (
                    <AnswerRow
                        key={answer.id}
                        answer={answer}
                        onToggleCorrect={() => setAnswerCorrect(answer.id)}
                        onTextChange={(text) => setAnswerText(answer.id, text)}
                    />
                ))}
            </Box>

            <Box className="mt-4">
                <Text className={fieldLabelClass}>Explication de la bonne réponse</Text>
                <textarea
                    value={question.explanation}
                    onChange={(e) => onUpdate((q) => ({ ...q, explanation: e.target.value }))}
                    placeholder="Expliquez pourquoi cette réponse est correcte..."
                    rows={2}
                    className={`${textareaClass} mt-1.5`}
                />
            </Box>

            <Box className="mt-4">
                <Text className={fieldLabelClass}>Pièces jointes</Text>
                <Box className="mt-2 flex flex-wrap gap-2">
                    <AttachmentButton icon={LinkIcon} label="Lien" />
                    <AttachmentButton icon={ImageIcon} label="Image" />
                    <AttachmentButton icon={FileText} label="Document" />
                </Box>
            </Box>
        </Box>
    );
}

function AnswerRow({
    answer,
    onToggleCorrect,
    onTextChange,
}: {
    answer: QuizAnswerDraft;
    onToggleCorrect: () => void;
    onTextChange: (value: string) => void;
}) {
    return (
        <Box className="flex items-center gap-3">
            <button
                type="button"
                role="radio"
                aria-checked={answer.correct}
                onClick={onToggleCorrect}
                aria-label={answer.correct ? "Bonne réponse" : "Définir comme bonne réponse"}
                className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition",
                    answer.correct
                        ? "border-[#16A34A] bg-[#16A34A]"
                        : "border-[#111827] hover:border-[#5140F0]",
                )}
            >
                {answer.correct && <span className="h-2 w-2 rounded-full bg-white" />}
            </button>
            <input
                type="text"
                value={answer.text}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder="Réponse..."
                className={inputClass}
            />
        </Box>
    );
}

function AttachmentButton({
    icon,
    label,
}: {
    icon: LucideIcon;
    label: string;
}) {
    return (
        <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-3 text-[13px] font-semibold text-[#374151] transition hover:border-[#5140F0] hover:text-[#5140F0]"
        >
            <InlineIcon icon={icon} className="h-4 w-4" />
            {label}
        </button>
    );
}
