# Modifications Frontend - Ajout de la Glycémie

## 📋 Résumé

Le backend a ajouté le champ `glycemie` aux constantes vitales et implémenté la création automatique d'enregistrements dans le module **Suivi Constantes** lorsque toutes les constantes obligatoires sont présentes lors d'une consultation.

## ✅ Modifications Apportées au Frontend

### 1. Types TypeScript (`src/types/consultation.ts`)

#### Interface `ConstantesVitales`
- ✅ Ajout du champ `glycemie?: number` (optionnel)
- ✅ Commentaire précisant les limites: `// g/L (0.3-5.0)`

#### Schéma de validation Zod
- ✅ Ajout de la validation pour `glycemie`:
  ```typescript
  glycemie: z
    .number({ invalid_type_error: 'La glycémie doit être un nombre' })
    .min(0.3, 'Glycémie minimale: 0.3 g/L')
    .max(5.0, 'Glycémie maximale: 5.0 g/L')
    .optional()
  ```

#### Fonction de formatage
- ✅ Mise à jour de `formaterConstantesVitales()` pour inclure l'affichage de la glycémie

### 2. Formulaire de Consultation (`src/components/consultations/ConsultationForm.tsx`)

- ✅ Ajout du champ de saisie pour la glycémie
- ✅ Positionnement après "Saturation O₂" et avant "Poids"
- ✅ Configuration du champ:
  - Type: `number`
  - Step: `0.01` (pour permettre 2 décimales)
  - Placeholder: `0.95`
  - Description: `0.3-5.0 g/L`

### 3. Page de Détails (`src/pages/consultations/ConsultationDetailPage.tsx`)

- ✅ Ajout de l'affichage de la glycémie dans la grille des constantes vitales
- ✅ Format d'affichage: `{valeur} g/L`

## 🔄 Synchronisation avec le Backend

### Constantes Obligatoires pour Suivi Constantes

Selon les modifications backend, voici les constantes **obligatoires** pour créer automatiquement un enregistrement dans le module "Suivi Constantes" :

1. ✅ Tension Systolique
2. ✅ Tension Diastolique
3. ✅ Fréquence Cardiaque
4. ✅ **Glycémie** (NOUVEAU)
5. ✅ Poids
6. ✅ Taille

### Constantes Optionnelles

Ces constantes peuvent être saisies mais ne sont pas requises pour la synchronisation :

- Température
- Fréquence Respiratoire
- Saturation en Oxygène

## 🎯 Fonctionnement

### Cas 1 : Consultation avec toutes les constantes obligatoires

**Saisie:**
```json
{
  "constantesVitales": {
    "tensionSystolique": 120,
    "tensionDiastolique": 80,
    "frequenceCardiaque": 72,
    "glycemie": 0.95,
    "poids": 70,
    "taille": 175,
    "temperature": 37.2
  }
}
```

**Résultat:**
- ✅ Consultation créée
- ✅ **Enregistrement automatique dans "Suivi Constantes"**

### Cas 2 : Consultation sans glycémie

**Saisie:**
```json
{
  "constantesVitales": {
    "tensionSystolique": 120,
    "tensionDiastolique": 80,
    "frequenceCardiaque": 72,
    "poids": 70,
    "taille": 175
  }
}
```

**Résultat:**
- ✅ Consultation créée
- ❌ **Aucun enregistrement dans "Suivi Constantes"** (constantes incomplètes)

## 📊 Avantages

1. **Suivi centralisé**: Toutes les constantes vitales des consultations sont automatiquement dans "Suivi Constantes"
2. **Pas de duplication**: L'infirmier saisit une seule fois les constantes
3. **Cohérence**: Données automatiquement synchronisées entre les modules
4. **Graphiques**: Les constantes apparaissent dans les graphiques d'évolution
5. **Performance**: Tout se fait dans la même transaction

## 🔍 Points d'Attention

- Le champ glycémie est **optionnel** au niveau du formulaire
- Mais pour bénéficier de la création automatique dans "Suivi Constantes", il **doit être renseigné** avec les autres constantes obligatoires
- La validation empêche la saisie de valeurs hors de la plage médicale (0.3 - 5.0 g/L)

## 📝 Notes pour les Infirmiers

Lors de la création d'une consultation, pour que les constantes soient automatiquement enregistrées dans le module "Suivi Constantes", assurez-vous de renseigner :
- Tension artérielle (systolique et diastolique)
- Fréquence cardiaque
- **Glycémie** (nouveau champ)
- Poids
- Taille

Les autres constantes (température, saturation, etc.) restent optionnelles.
