import { z } from 'zod';

// ==================== ENUMS ====================

export const CLASSIFICATION_IMC = {
    MAIGREUR_SEVERE: 'Maigreur sévère',
    MAIGREUR_MODEREE: 'Maigreur modérée',
    MAIGREUR_LEGERE: 'Maigreur légère',
    NORMAL: 'Normal',
    SURPOIDS: 'Surpoids',
    OBESITE_MODEREE: 'Obésité modérée',
    OBESITE_SEVERE: 'Obésité sévère',
    OBESITE_MORBIDE: 'Obésité morbide',
} as const;

export const CLASSIFICATION_GLYCEMIE = {
    NORMAL: 'Normal',
    SUSPECT: 'Suspect',
    DANGEREUX: 'Dangereux',
} as const;

export const CLASSIFICATION_TENSION = {
    OPTIMALE: 'Optimale',
    NORMALE: 'Normale',
    NORMALE_HAUTE: 'Normale haute',
    HTA_GRADE_1: 'HTA Grade 1',
    HTA_GRADE_2: 'HTA Grade 2',
    HTA_GRADE_3: 'HTA Grade 3',
    HTA_SYSTOLIQUE_ISOLEE: 'HTA systolique isolée',
    HYPOTENSION: 'Hypotension',
} as const;

export type ClassificationIMC = typeof CLASSIFICATION_IMC[keyof typeof CLASSIFICATION_IMC];
export type ClassificationGlycemie = typeof CLASSIFICATION_GLYCEMIE[keyof typeof CLASSIFICATION_GLYCEMIE];
export type ClassificationTension = typeof CLASSIFICATION_TENSION[keyof typeof CLASSIFICATION_TENSION];

// ==================== INTERFACES ====================

export interface SuiviConstantes {
    id: string;
    patientId: string;
    infirmierId: string;
    datePrise: string; // ISO date string
    nomPatient?: string;
    matriculePatient?: string;
    nomInfirmier?: string;

    // Constantes vitales
    tensionSystolique?: number;
    tensionDiastolique?: number;
    frequenceCardiaque?: number;
    frequenceRespiratoire?: number;
    temperature?: number;
    saturationOxygene?: number;
    glycemie?: number;

    // Mesures anthropométriques
    poids?: number;
    taille?: number;

    // Calculs automatiques
    imc?: number;
    classificationIMC?: ClassificationIMC;
    classificationGlycemie?: ClassificationGlycemie;
    classificationTension?: ClassificationTension;

    // Autres
    observations?: string;

    // Métadonnées
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;

    // Relations (populated)
    patient?: {
        id: string;
        nom: string;
        prenom: string;
        matricule: string;
    };
    infirmier?: {
        id: string;
        nom: string;
        prenom: string;
    };
}

// ==================== VALIDATION SCHEMAS ====================

export const suiviConstantesCreateSchema = z.object({
    patientId: z.string().uuid('Patient invalide'),
    datePrise: z.string().min(1, 'Date de prise requise'),

    // Constantes vitales (toutes optionnelles)
    tensionSystolique: z
        .number({ invalid_type_error: 'Doit être un nombre' })
        .min(50, 'Tension systolique trop basse (min: 50)')
        .max(300, 'Tension systolique trop élevée (max: 300)')
        .optional(),
    tensionDiastolique: z
        .number({ invalid_type_error: 'Doit être un nombre' })
        .min(30, 'Tension diastolique trop basse (min: 30)')
        .max(200, 'Tension diastolique trop élevée (max: 200)')
        .optional(),
    frequenceCardiaque: z
        .number({ invalid_type_error: 'Doit être un nombre' })
        .min(30, 'Fréquence cardiaque trop basse (min: 30)')
        .max(250, 'Fréquence cardiaque trop élevée (max: 250)')
        .optional(),
    frequenceRespiratoire: z
        .number({ invalid_type_error: 'Doit être un nombre' })
        .min(5, 'Fréquence respiratoire trop basse (min: 5)')
        .max(60, 'Fréquence respiratoire trop élevée (max: 60)')
        .optional(),
    temperature: z
        .number({ invalid_type_error: 'Doit être un nombre' })
        .min(30, 'Température trop basse (min: 30°C)')
        .max(45, 'Température trop élevée (max: 45°C)')
        .optional(),
    saturationOxygene: z
        .number({ invalid_type_error: 'Doit être un nombre' })
        .min(50, 'Saturation trop basse (min: 50%)')
        .max(100, 'Saturation ne peut pas dépasser 100%')
        .optional(),
    glycemie: z
        .number({ invalid_type_error: 'Doit être un nombre' })
        .min(0.2, 'Glycémie trop basse (min: 0.2 g/L)')
        .max(10, 'Glycémie trop élevée (max: 10 g/L)')
        .optional(),

    // Mesures anthropométriques
    poids: z
        .number({ invalid_type_error: 'Doit être un nombre' })
        .min(1, 'Poids trop faible (min: 1 kg)')
        .max(500, 'Poids trop élevé (max: 500 kg)')
        .optional(),
    taille: z
        .number({ invalid_type_error: 'Doit être un nombre' })
        .min(30, 'Taille trop petite (min: 30 cm)')
        .max(300, 'Taille trop grande (max: 300 cm)')
        .optional(),

    observations: z.string().max(1000, 'Observations trop longues (max: 1000 caractères)').optional(),
}).refine(
    (data) => {
        // Vérifier qu'au moins une constante est renseignée
        return (
            data.tensionSystolique !== undefined ||
            data.tensionDiastolique !== undefined ||
            data.frequenceCardiaque !== undefined ||
            data.frequenceRespiratoire !== undefined ||
            data.temperature !== undefined ||
            data.saturationOxygene !== undefined ||
            data.glycemie !== undefined ||
            data.poids !== undefined ||
            data.taille !== undefined
        );
    },
    {
        message: 'Au moins une constante doit être renseignée',
        path: ['tensionSystolique'],
    }
).refine(
    (data) => {
        // Si tension systolique est renseignée, diastolique doit l'être aussi
        if (data.tensionSystolique !== undefined && data.tensionDiastolique === undefined) {
            return false;
        }
        if (data.tensionDiastolique !== undefined && data.tensionSystolique === undefined) {
            return false;
        }
        return true;
    },
    {
        message: 'Les deux valeurs de tension doivent être renseignées ensemble',
        path: ['tensionDiastolique'],
    }
).refine(
    (data) => {
        // Vérifier que tension diastolique < systolique
        if (data.tensionSystolique !== undefined && data.tensionDiastolique !== undefined) {
            return data.tensionDiastolique < data.tensionSystolique;
        }
        return true;
    },
    {
        message: 'La tension diastolique doit être inférieure à la tension systolique',
        path: ['tensionDiastolique'],
    }
);

export const suiviConstantesUpdateSchema = z.object({
    datePrise: z.string().optional(),
    tensionSystolique: z.number().min(50).max(300).optional(),
    tensionDiastolique: z.number().min(30).max(200).optional(),
    frequenceCardiaque: z.number().min(30).max(250).optional(),
    frequenceRespiratoire: z.number().min(5).max(60).optional(),
    temperature: z.number().min(30).max(45).optional(),
    saturationOxygene: z.number().min(50).max(100).optional(),
    glycemie: z.number().min(0.2).max(10).optional(),
    poids: z.number().min(1).max(500).optional(),
    taille: z.number().min(30).max(300).optional(),
    observations: z.string().max(1000).optional(),
}).refine(
    (data) => {
        // Vérifier que tension diastolique < systolique si les deux sont présentes
        if (data.tensionSystolique !== undefined && data.tensionDiastolique !== undefined) {
            return data.tensionDiastolique < data.tensionSystolique;
        }
        return true;
    },
    {
        message: 'La tension diastolique doit être inférieure à la tension systolique',
        path: ['tensionDiastolique'],
    }
);

// ==================== TYPES ====================

export type SuiviConstantesFormData = z.infer<typeof suiviConstantesCreateSchema>;
export type CreateSuiviConstantesDTO = z.infer<typeof suiviConstantesCreateSchema>;
export type UpdateSuiviConstantesDTO = z.infer<typeof suiviConstantesUpdateSchema>;

// ==================== FILTERS ====================

export interface SuiviConstantesFilters {
    patientId?: string;
    search?: string;
    dateDebut?: string;
    dateFin?: string;
    page?: number;
    limit?: number;
}

export interface SuiviConstantesResponse {
    data: SuiviConstantes[];
    page: number;
    total: number;
    totalPages: number;
}

// ==================== EVOLUTION DATA ====================

export interface EvolutionPoint {
    date: string;
    valeur: number;
    statut?: string;
}

export interface EvolutionStats {
    glycemieMoyenne?: number;
    tensionMoyenne?: {
        systolique: number;
        diastolique: number;
    };
    poidsMoyen?: number;
    imcMoyen?: number;
    nombrePrises?: number;
    [key: string]: any;
}

export interface EvolutionData {
    patientId: string;
    nomPatient: string;
    periode: {
        debut: string;
        fin: string;
    };
    glycemie: EvolutionPoint[];
    tensionSystolique: EvolutionPoint[];
    tensionDiastolique: EvolutionPoint[];
    poids: EvolutionPoint[];
    imc: EvolutionPoint[];
    frequenceCardiaque?: EvolutionPoint[];
    temperature?: EvolutionPoint[];
    saturationOxygene?: EvolutionPoint[];
    stats: EvolutionStats;
}

// ==================== HELPERS ====================

/**
 * Calcule l'IMC à partir du poids et de la taille
 */
export function calculerIMC(poids: number, taille: number): number {
    const tailleEnMetres = taille / 100;
    return Number((poids / (tailleEnMetres * tailleEnMetres)).toFixed(2));
}

/**
 * Classifie l'IMC selon les normes OMS
 */
export function classifierIMC(imc: number): ClassificationIMC {
    if (imc < 16) return CLASSIFICATION_IMC.MAIGREUR_SEVERE;
    if (imc < 17) return CLASSIFICATION_IMC.MAIGREUR_MODEREE;
    if (imc < 18.5) return CLASSIFICATION_IMC.MAIGREUR_LEGERE;
    if (imc < 25) return CLASSIFICATION_IMC.NORMAL;
    if (imc < 30) return CLASSIFICATION_IMC.SURPOIDS;
    if (imc < 35) return CLASSIFICATION_IMC.OBESITE_MODEREE;
    if (imc < 40) return CLASSIFICATION_IMC.OBESITE_SEVERE;
    return CLASSIFICATION_IMC.OBESITE_MORBIDE;
}

/**
 * Classifie la glycémie
 */
export function classifierGlycemie(glycemie: number): ClassificationGlycemie {
    if (glycemie < 0.7 || glycemie > 1.4) return CLASSIFICATION_GLYCEMIE.DANGEREUX;
    if (glycemie < 0.8 || glycemie > 1.2) return CLASSIFICATION_GLYCEMIE.SUSPECT;
    return CLASSIFICATION_GLYCEMIE.NORMAL;
}

/**
 * Classifie la tension artérielle selon les normes OMS/ESH
 */
export function classifierTension(
    systolique: number,
    diastolique: number
): ClassificationTension {
    if (systolique < 90 || diastolique < 60) return CLASSIFICATION_TENSION.HYPOTENSION;
    if (systolique < 120 && diastolique < 80) return CLASSIFICATION_TENSION.OPTIMALE;
    if (systolique < 130 && diastolique < 85) return CLASSIFICATION_TENSION.NORMALE;
    if (systolique < 140 && diastolique < 90) return CLASSIFICATION_TENSION.NORMALE_HAUTE;
    if (systolique >= 180 || diastolique >= 110) return CLASSIFICATION_TENSION.HTA_GRADE_3;
    if (systolique >= 160 || diastolique >= 100) return CLASSIFICATION_TENSION.HTA_GRADE_2;
    if (systolique >= 140 || diastolique >= 90) return CLASSIFICATION_TENSION.HTA_GRADE_1;
    if (systolique >= 140 && diastolique < 90) return CLASSIFICATION_TENSION.HTA_SYSTOLIQUE_ISOLEE;
    return CLASSIFICATION_TENSION.NORMALE;
}

/**
 * Retourne la couleur associée à une classification IMC
 */
export function getCouleurIMC(classification: ClassificationIMC): string {
    switch (classification) {
        case CLASSIFICATION_IMC.NORMAL:
            return 'text-green-600 bg-green-50 border-green-200';
        case CLASSIFICATION_IMC.SURPOIDS:
            return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        case CLASSIFICATION_IMC.MAIGREUR_LEGERE:
        case CLASSIFICATION_IMC.OBESITE_MODEREE:
            return 'text-orange-600 bg-orange-50 border-orange-200';
        case CLASSIFICATION_IMC.MAIGREUR_MODEREE:
        case CLASSIFICATION_IMC.MAIGREUR_SEVERE:
        case CLASSIFICATION_IMC.OBESITE_SEVERE:
        case CLASSIFICATION_IMC.OBESITE_MORBIDE:
            return 'text-red-600 bg-red-50 border-red-200';
        default:
            return 'text-gray-600 bg-gray-50 border-gray-200';
    }
}

/**
 * Retourne la couleur associée à une classification de glycémie
 */
export function getCouleurGlycemie(classification: ClassificationGlycemie): string {
    switch (classification) {
        case CLASSIFICATION_GLYCEMIE.NORMAL:
            return 'text-green-600 bg-green-50 border-green-200';
        case CLASSIFICATION_GLYCEMIE.SUSPECT:
            return 'text-orange-600 bg-orange-50 border-orange-200';
        case CLASSIFICATION_GLYCEMIE.DANGEREUX:
            return 'text-red-600 bg-red-50 border-red-200';
        default:
            return 'text-gray-600 bg-gray-50 border-gray-200';
    }
}

/**
 * Retourne la couleur associée à une classification de tension
 */
export function getCouleurTension(classification: ClassificationTension): string {
    switch (classification) {
        case CLASSIFICATION_TENSION.OPTIMALE:
        case CLASSIFICATION_TENSION.NORMALE:
            return 'text-green-600 bg-green-50 border-green-200';
        case CLASSIFICATION_TENSION.NORMALE_HAUTE:
            return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        case CLASSIFICATION_TENSION.HTA_GRADE_1:
        case CLASSIFICATION_TENSION.HTA_SYSTOLIQUE_ISOLEE:
            return 'text-orange-600 bg-orange-50 border-orange-200';
        case CLASSIFICATION_TENSION.HTA_GRADE_2:
        case CLASSIFICATION_TENSION.HTA_GRADE_3:
        case CLASSIFICATION_TENSION.HYPOTENSION:
            return 'text-red-600 bg-red-50 border-red-200';
        default:
            return 'text-gray-600 bg-gray-50 border-gray-200';
    }
}

/**
 * Formate une date pour l'affichage
 */
export function formatDatePrise(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
