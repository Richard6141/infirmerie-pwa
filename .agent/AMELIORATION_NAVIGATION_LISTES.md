# Amélioration de la navigation dans les listes

## Modifications apportées

L'objectif était de permettre aux utilisateurs de cliquer directement sur une ligne d'un tableau pour accéder aux détails de l'enregistrement, simplifiant ainsi la navigation.

### Pages modifiées

1.  **Consultations** (`src/pages/consultations/ConsultationsPage.tsx`)
2.  **Patients** (`src/pages/patients/PatientsPage.tsx`)
3.  **Médicaments** (`src/pages/medicaments/MedicamentsPage.tsx`)
4.  **Rendez-vous** (`src/pages/rendez-vous/RendezVousPage.tsx`)
5.  **Repos Sanitaire** (`src/pages/repos-sanitaire/ReposSanitairePage.tsx`)

### Détails techniques

Sur chaque page, les modifications suivantes ont été appliquées :

1.  **Import de `useNavigate`** : Ajout du hook `useNavigate` de `react-router-dom`.
2.  **Gestionnaire `onClick` sur `<TableRow>`** : La prop `onClick` a été ajoutée à chaque ligne de tableau pour naviguer vers la route de détail correspondante (ex: `/patients/${id}`).
3.  **Style visuel** : Ajout des classes `cursor-pointer hover:bg-slate-50 transition-colors` aux lignes pour indiquer l'interactivité.
4.  **Protection des actions** : Tous les éléments interactifs existants dans les lignes (boutons, liens, menus déroulants) ont reçu `e.stopPropagation()` dans leur événement `onClick` pour éviter de déclencher la navigation parent lors d'une action spécifique (comme supprimer ou modifier).

### Pages non modifiées

*   **Vaccinations** : Cette page ne dispose pas actuellement d'une vue détaillée dédiée (seulement une liste et une modale de création). Les lignes restent donc non cliquables.

## Tests recommandés

1.  Ouvrir chaque page de liste.
2.  Survoler une ligne : le curseur doit changer et la couleur de fond doit s'éclaircir.
3.  Cliquer sur une zone "vide" de la ligne : redirection vers la page de détails.
4.  Cliquer sur le bouton "Modifier" ou "Supprimer" : l'action doit s'exécuter sans redirection vers la page de détails.
