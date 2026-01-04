# 🔧 Guide de correction de la synchronisation offline

## 🎯 Problème résolu

**Problème initial:** Les patients créés en mode offline n'étaient pas synchronisés vers la base de données lorsque la connexion était rétablie.

**Cause racine:** Le hook `useOnlineStatus` utilisait `navigator.onLine` qui est peu fiable. Il détecte seulement si l'interface réseau est connectée, **pas** si Internet fonctionne réellement (problème de DNS, firewall, etc.).

## ✅ Corrections apportées

### 1. **Vérification RÉELLE de la connectivité Internet** (`useOnlineStatus.ts`)

- ✨ Ajout d'une fonction `checkRealConnectivity()` qui ping le endpoint `/health` du backend
- ✨ Timeout de 5 secondes pour éviter les blocages
- ✨ Réessai automatique après 10 secondes si la première tentative échoue
- ✨ Logs détaillés pour suivre l'état de la connexion

**Avant:**
```typescript
// Simplement basé sur navigator.onLine (peu fiable)
setIsOnline(navigator.onLine);
```

**Après:**
```typescript
// Vérification réelle en contactant le backend
const hasRealConnection = await checkRealConnectivity();
if (hasRealConnection) {
  console.log('[OnlineStatus] ✅ Real Internet connection confirmed');
  setIsOnline(true);
} else {
  console.warn('[OnlineStatus] ⚠️ Network interface connected but no Internet access');
  setIsOnline(false);
}
```

### 2. **Logs améliorés dans le service de sync** (`syncService.ts`)

- 📊 Logs détaillés des patients envoyés au serveur
- 📊 Affichage des IDs des patients en attente
- 📊 Logs des succès, erreurs et conflits de synchronisation

### 3. **Outils de diagnostic** (`syncService.ts`)

**Nouvelle méthode:** `getDiagnosticInfo()`
- Retourne l'état complet de la synchronisation
- Nombre d'opérations en attente par type (patients, consultations, vaccinations)
- Détails de chaque opération (tentatives, erreurs, dates)

**Nouvelle méthode:** `logDiagnostic()`
- Affiche un rapport formaté dans la console
- Accessible via `syncDiagnostic()` dans la console du navigateur (en mode dev)

### 4. **Meilleure gestion des erreurs** (`useAutoSync.ts`)

- 🎨 Messages d'erreur plus clairs selon le type d'erreur
- 🎨 Distinction entre erreur réseau, timeout, et autres erreurs
- 🎨 Suggestions d'actions pour l'utilisateur

## 🧪 Comment tester la synchronisation

### Test 1: Création offline et sync automatique

1. **Ouvrir les DevTools** (F12) et aller dans l'onglet **Console**
2. **Passer en mode offline:**
   - Onglet "Network" → Cocher "Offline"
   - OU désactiver votre WiFi/Ethernet
3. **Créer un patient** depuis l'interface
   - L'interface doit afficher "Patient créé avec succès"
   - Le patient apparaît dans la liste locale
4. **Vérifier la queue de synchronisation:**
   ```javascript
   syncDiagnostic()
   ```
   - Vous devriez voir `Patients: { create: 1 }` dans la console
5. **Rétablir la connexion:**
   - Décocher "Offline" dans DevTools
   - OU réactiver votre WiFi
6. **Observer la console:**
   ```
   [OnlineStatus] Network interface connected, verifying real connectivity...
   [OnlineStatus] ✅ Real Internet connection confirmed
   [useAutoSync] Syncing 1 items...
   [SyncService] Starting full sync (multi-entity)...
   [SyncService] Found 1 patients to push
   [SyncService] Push patients response: {total: 1, success: 1, ...}
   ```
7. **Vérifier le résultat:**
   - Toast de succès: "✅ 1 élément synchronisé"
   - Le patient a maintenant un vrai UUID (pas `temp-...`)
   - Vérifier dans la BDD backend que le patient existe

### Test 2: Diagnostic de la queue de sync

**Dans la console du navigateur (mode dev uniquement):**

```javascript
// Afficher l'état complet de la synchronisation
syncDiagnostic()
```

**Exemple de sortie:**
```
📊 SYNC DIAGNOSTIC INFO
  🔑 Device ID: device-1234567890-abc123
  📅 Last Sync: 2026-01-04T10:30:45.123Z
  🔄 Sync In Progress: false
  📦 Pending Operations: 2
  ❌ Last Error: None
  📋 Queue Details
    👤 Patients: {create: 1, update: 0, delete: 0}
    📝 Consultations: {create: 1, update: 0, delete: 0}
    💉 Vaccinations: {create: 0, update: 0, delete: 0}
  🗂️ Queue Items
    [Table avec détails de chaque opération]
```

### Test 3: Vérifier les logs détaillés

**Pendant la synchronisation, observer la console:**

```
[SyncService] Sending patients to server:
{
  "count": 1,
  "deviceId": "device-...",
  "patients": [
    {
      "tempId": "temp-1736000000000-abc123",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "matricule": "TEMP-1736000000000"
    }
  ]
}

[SyncService] Push patients response: {total: 1, success: 1, conflicts: 0, errors: 0}
[SyncService] Success: [{tempId: "temp-...", serverId: "uuid-...", status: "created"}]
[SyncService] Patient synced: temp-1736000000000-abc123 → uuid-real-id-from-server
```

## 🐛 Dépannage

### Problème: La sync ne se déclenche pas

**Vérifications:**
1. Ouvrir la console et chercher:
   ```
   [OnlineStatus] ✅ Real Internet connection confirmed
   ```
   - Si vous voyez `⚠️ Network interface connected but no Internet access`, votre connexion ne fonctionne pas vraiment

2. Tester manuellement la connectivité:
   ```javascript
   fetch('https://infirmerie-api.onrender.com/health')
     .then(r => console.log('✅ Backend accessible', r.status))
     .catch(e => console.error('❌ Backend inaccessible', e))
   ```

3. Vérifier qu'il y a des opérations en attente:
   ```javascript
   syncDiagnostic()
   ```
   - Si `Pending Operations: 0`, il n'y a rien à synchroniser

### Problème: Erreurs de synchronisation

**Vérifications:**
1. Regarder le type d'erreur dans la console:
   - `ERR_NAME_NOT_RESOLVED`: DNS ne fonctionne pas
   - `ERR_NETWORK`: Pas de connexion réseau
   - `timeout`: Connexion trop lente
   - Autre: Erreur côté backend (validation, etc.)

2. Vérifier les détails de la queue:
   ```javascript
   syncDiagnostic()
   ```
   - Regarder la colonne `Error` dans la table des queue items

3. Vérifier le backend:
   - Ouvrir `https://infirmerie-api.onrender.com/health` dans le navigateur
   - Doit retourner `{"status": "ok"}`

### Problème: Patient créé mais reste avec tempId

**Causes possibles:**
1. La synchronisation a échoué (voir logs)
2. Le backend a retourné une erreur (voir `data.errors` dans les logs)
3. Conflit détecté (voir `data.conflicts` dans les logs)

**Solution:**
1. Vérifier les logs de sync:
   ```javascript
   syncDiagnostic()
   ```

2. Déclencher une sync manuelle (si l'auto-sync a échoué):
   - Depuis un composant qui utilise `useAutoSync`:
   ```javascript
   const { manualSync } = useAutoSync();
   await manualSync();
   ```

## 📊 Variables d'environnement

Assurez-vous que `.env` contient:
```bash
VITE_API_BASE_URL=https://infirmerie-api.onrender.com
```

Cette URL est utilisée pour vérifier la connectivité réelle.

## 🎯 Points clés à retenir

1. **Le mode offline fonctionne toujours** - Vous pouvez créer des patients sans Internet
2. **La sync est automatique** - Dès que la connexion est rétablie (vérifiée), la sync démarre
3. **La sync vérifie maintenant la VRAIE connectivité** - Plus de faux positifs
4. **Outils de diagnostic disponibles** - `syncDiagnostic()` dans la console
5. **Meilleurs messages d'erreur** - Pour savoir exactement ce qui ne va pas

## 🚀 Déploiement

1. **Build le frontend:**
   ```bash
   npm run build
   ```

2. **Tester en local avant déploiement:**
   ```bash
   npm run preview
   ```

3. **Déployer sur votre serveur**

4. **Vérifier les logs de production** (si accessible)
   - Les logs `[OnlineStatus]` et `[SyncService]` sont toujours actifs
   - `syncDiagnostic()` est disponible uniquement en dev

## 📝 Checklist de test final

- [ ] Patient créé offline apparaît dans la liste locale
- [ ] `syncDiagnostic()` montre 1 patient en attente
- [ ] Après reconnexion, console montre "✅ Real Internet connection confirmed"
- [ ] Toast "Synchronisation de 1 élément..."
- [ ] Toast "✅ 1 élément synchronisé"
- [ ] Patient a maintenant un UUID réel (vérifiable dans IndexedDB DevTools)
- [ ] Patient visible dans la BDD backend
- [ ] Email de bienvenue envoyé au patient (si configuré)
