# Instructions pour ajouter le logo du Ministère

## Étape 1 : Télécharger le logo

Téléchargez le logo officiel du **Ministère du Développement et de la Coordination de l'action gouvernementale (MDC)** de la République du Bénin.

## Étape 2 : Préparer l'image

Le logo doit être au format :
- **Format** : PNG avec fond transparent
- **Dimensions recommandées** : 512x512px (ratio 1:1)
- **Poids** : < 100KB

## Étape 3 : Placer le fichier

Placez le fichier logo dans le dossier suivant :
```
public/logo-mdc.png
```

## Étape 4 : Mettre à jour le code

Dans le fichier `src/pages/Login.tsx`, remplacez les lignes 53-56 :

```tsx
{/* Logo placeholder */}
<div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#3B7DDD] to-[#2E6BC6] rounded-2xl mb-6 shadow-lg">
  <Shield className="w-12 h-12 text-white" />
</div>
```

Par :

```tsx
{/* Logo du ministère */}
<img
  src="/logo-mdc.png"
  alt="Logo MDC - République du Bénin"
  className="w-20 h-20 object-contain mb-6"
/>
```

## Alternative : Logo en ligne

Si vous avez le logo hébergé en ligne, vous pouvez utiliser directement l'URL :

```tsx
<img
  src="https://votre-url.com/logo-mdc.png"
  alt="Logo MDC - République du Bénin"
  className="w-20 h-20 object-contain mb-6"
/>
```

## Vérification

Une fois le logo ajouté, vérifiez que :
- ✓ Le logo s'affiche correctement au centre de la page
- ✓ Le logo est bien visible sur fond dégradé bleu clair
- ✓ La qualité de l'image est bonne
- ✓ Les proportions sont respectées
