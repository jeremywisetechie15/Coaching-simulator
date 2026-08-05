export const ACTIVITY_SECTORS = [
    { code: "AGR", label: "Agriculture, sylviculture et pêche" },
    { code: "EXT", label: "Industries extractives" },
    { code: "IND", label: "Industrie manufacturière" },
    { code: "ENE", label: "Énergie, eau et environnement" },
    { code: "BTP", label: "Construction, bâtiment et travaux publics" },
    { code: "COM", label: "Commerce et distribution" },
    { code: "AUT", label: "Automobile et mobilité" },
    { code: "TRL", label: "Transport, logistique et entreposage" },
    { code: "THR", label: "Tourisme, hôtellerie et restauration" },
    { code: "TIC", label: "Informatique, numérique et télécommunications" },
    { code: "MED", label: "Médias, communication et édition" },
    { code: "BFA", label: "Banque, finance et assurance" },
    { code: "IMM", label: "Immobilier" },
    { code: "CST", label: "Conseil et services aux entreprises" },
    { code: "JUR", label: "Activités juridiques, comptables et financières" },
    { code: "RDI", label: "Ingénierie, recherche et développement" },
    { code: "ADM", label: "Services administratifs et fonctions support" },
    { code: "EDU", label: "Enseignement et formation professionnelle" },
    { code: "SAN", label: "Santé, pharmacie et médico-social" },
    { code: "SAP", label: "Services à la personne" },
    { code: "PUA", label: "Administration et secteur public" },
    { code: "ESS", label: "Économie sociale et solidaire et associations" },
    { code: "CUL", label: "Culture, arts, spectacles et loisirs" },
    { code: "SPO", label: "Sport et bien-être" },
    { code: "DEF", label: "Défense, sécurité et aéronautique" },
    { code: "ENV", label: "Environnement, recyclage et économie circulaire" },
    { code: "SER", label: "Autres activités de services" },
    { code: "INT", label: "Organisations et activités internationales" },
] as const;

export type ActivitySectorCode = (typeof ACTIVITY_SECTORS)[number]["code"];

const activitySectorCodes = new Set<string>(ACTIVITY_SECTORS.map(({ code }) => code));

export function isActivitySectorCode(value: unknown): value is ActivitySectorCode {
    return typeof value === "string" && activitySectorCodes.has(value);
}
