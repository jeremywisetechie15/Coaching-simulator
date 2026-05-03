export type UserStatus = "active" | "inactive" | "pending";
export type UserRole = "SuperAdmin" | "Learner";

export interface UserTraining {
    assignedAt: string;
    id: string;
    progress: number;
    status: "not_started" | "in_progress" | "completed";
    title: string;
}

export interface UserRoleplay {
    date: string;
    duration: string;
    id: string;
    persona: string;
    score: number;
    scenario: string;
    type: string;
}

export interface UserSkill {
    id: string;
    label: string;
    level: "Faible" | "À renforcer" | "En progression" | "Maîtrisée";
    score: number;
}

export interface UserActivity {
    date: string;
    id: string;
    label: string;
    type: string;
}

export interface UserListItem {
    city: string;
    email: string;
    group: string;
    id: string;
    initials: string;
    joinedAt: string;
    lastActiveAt: string;
    name: string;
    organization: string;
    phone: string;
    progress: number;
    role: UserRole;
    status: UserStatus;
    trainings: UserTraining[];
    roleplays: UserRoleplay[];
    skills: UserSkill[];
    activity: UserActivity[];
}

export const demoUsers: UserListItem[] = [
    {
        activity: [
            { date: "Aujourd'hui, 09:42", id: "act-1", label: "A terminé le roleplay Trainer IA", type: "Roleplay" },
            { date: "Hier, 16:10", id: "act-2", label: "A repris la formation Prise de rendez-vous", type: "Formation" },
            { date: "15 jan. 2025", id: "act-3", label: "A mis à jour son profil", type: "Compte" },
        ],
        city: "Paris",
        email: "paul.laverdure@deepmark.fr",
        group: "Direction commerciale",
        id: "paul-laverdure",
        initials: "PL",
        joinedAt: "15 janvier 2024",
        lastActiveAt: "10/03/2024 10:30",
        name: "Paul Laverdure",
        organization: "Deepmark",
        phone: "+33 6 18 42 91 04",
        progress: 68,
        role: "SuperAdmin",
        status: "active",
        trainings: [
            { assignedAt: "10 jan. 2025", id: "t1", progress: 68, status: "in_progress", title: "Prise de rendez-vous prospect qualifié" },
            { assignedAt: "5 jan. 2025", id: "t2", progress: 100, status: "completed", title: "Introduction à la vente consultative" },
            { assignedAt: "18 jan. 2025", id: "t3", progress: 24, status: "in_progress", title: "Gestion des objections" },
            { assignedAt: "22 jan. 2025", id: "t9", progress: 0, status: "not_started", title: "Qualification des besoins" },
            { assignedAt: "24 jan. 2025", id: "t10", progress: 42, status: "in_progress", title: "Argumentaire valeur" },
            { assignedAt: "28 jan. 2025", id: "t11", progress: 100, status: "completed", title: "Suivi post rendez-vous" },
        ],
        roleplays: [
            { date: "15 Jan 2025", duration: "45 min", id: "r1", persona: "Marc Dubois", scenario: "Présenter Trainer IA", score: 65, type: "Vente" },
            { date: "14 Jan 2025", duration: "38 min", id: "r2", persona: "Rachid HAMRANI", scenario: "Obtenir un RDV qualifié", score: 72, type: "Prise de rendez-vous" },
        ],
        skills: [
            { id: "s1", label: "Accroche commerciale", level: "En progression", score: 72 },
            { id: "s2", label: "Découverte des besoins", level: "Maîtrisée", score: 88 },
            { id: "s3", label: "Closing", level: "À renforcer", score: 54 },
        ],
    },
    {
        activity: [
            { date: "Hier, 11:20", id: "act-4", label: "Invitation acceptée", type: "Compte" },
            { date: "13 jan. 2025", id: "act-5", label: "Première formation assignée", type: "Formation" },
        ],
        city: "Lyon",
        email: "claire.moreau@deepmark.fr",
        group: "Sales",
        id: "claire-moreau",
        initials: "CM",
        joinedAt: "13 jan. 2025",
        lastActiveAt: "Hier",
        name: "Claire Moreau",
        organization: "Deepmark",
        phone: "+33 6 22 18 77 40",
        progress: 52,
        role: "Learner",
        status: "active",
        trainings: [
            { assignedAt: "13 jan. 2025", id: "t4", progress: 52, status: "in_progress", title: "Communication persuasive" },
            { assignedAt: "16 jan. 2025", id: "t5", progress: 0, status: "not_started", title: "Techniques de closing" },
        ],
        roleplays: [
            { date: "16 Jan 2025", duration: "32 min", id: "r3", persona: "Sophie Martin", scenario: "Traiter une objection prix", score: 58, type: "Objection" },
        ],
        skills: [
            { id: "s4", label: "Écoute active", level: "En progression", score: 66 },
            { id: "s5", label: "Argumentation valeur", level: "À renforcer", score: 49 },
        ],
    },
    {
        activity: [
            { date: "12 jan. 2025", id: "act-6", label: "Invitation envoyée", type: "Compte" },
        ],
        city: "Nantes",
        email: "thomas.bernard@deepmark.fr",
        group: "Marketing",
        id: "thomas-bernard",
        initials: "TB",
        joinedAt: "12 jan. 2025",
        lastActiveAt: "Jamais connecté",
        name: "Thomas Bernard",
        organization: "MaiaCoach",
        phone: "+33 7 45 31 29 18",
        progress: 0,
        role: "Learner",
        status: "pending",
        trainings: [
            { assignedAt: "12 jan. 2025", id: "t6", progress: 0, status: "not_started", title: "Introduction à Trainer IA" },
        ],
        roleplays: [],
        skills: [
            { id: "s6", label: "Découverte", level: "Faible", score: 20 },
        ],
    },
    {
        activity: [
            { date: "8 jan. 2025", id: "act-7", label: "Compte désactivé", type: "Compte" },
            { date: "5 jan. 2025", id: "act-8", label: "A terminé Techniques de closing", type: "Formation" },
        ],
        city: "Bordeaux",
        email: "amina.benali@deepmark.fr",
        group: "Sales",
        id: "amina-benali",
        initials: "AB",
        joinedAt: "2 jan. 2025",
        lastActiveAt: "8 jan. 2025",
        name: "Amina Benali",
        organization: "Deepmark",
        phone: "+33 6 63 18 44 90",
        progress: 81,
        role: "Learner",
        status: "inactive",
        trainings: [
            { assignedAt: "2 jan. 2025", id: "t7", progress: 100, status: "completed", title: "Techniques de closing" },
            { assignedAt: "7 jan. 2025", id: "t8", progress: 62, status: "in_progress", title: "Gestion des objections" },
        ],
        roleplays: [
            { date: "7 Jan 2025", duration: "41 min", id: "r4", persona: "Jean Petit", scenario: "Négociation de rendez-vous", score: 81, type: "Closing" },
        ],
        skills: [
            { id: "s7", label: "Closing", level: "Maîtrisée", score: 91 },
            { id: "s8", label: "Gestion objections", level: "En progression", score: 74 },
        ],
    },
];

export function getDemoUserById(userId: string) {
    return demoUsers.find((user) => user.id === userId) ?? null;
}
