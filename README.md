# ChampaShop

Boutique fictive construite avec Nuxt 4, Pinia et Vitest.

Site déployé : _à compléter (URL Vercel/Netlify branchée sur `main`)_

## Démarrage

```bash
npm install
npm run dev
```

## Tests

```bash
npm test
```

## Scripts disponibles

| Script | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run preview` | Prévisualisation du build |
| `npm run lint` | ESLint (`@nuxt/eslint`) |
| `npm run typecheck` | Vérification des types (`nuxt typecheck`) |
| `npm test` | Tests Vitest |
| `npm run test:coverage` | Tests avec couverture (`@vitest/coverage-v8`) |

## Conventions Git

- Branches protégées : `main` (production) et `develop` (intégration). Pas de push direct ni de force-push.
- Une branche par fonctionnalité depuis `develop` : `feature/<nom>`, `fix/<nom>`, `chore/<nom>`.
- Commits au format Conventional Commits (`feat:`, `fix:`, `test:`, `chore:`, `docs:`).
- Toute modification passe par une Pull Request (template fourni) : 1 approbation minimum et CI verte
  (install, lint, typecheck, test, build) avant merge.
- Labels : `feature`, `bug`, `bug-prod`, `a11y`, `test`. Milestone : « Semaine 1 ».

## Répartition des rôles

| Membre | Rôle |
| --- | --- |
| Maxime | Catalogue produits (F1) et moteur de promotions (F4) |
| Yoan | Setup projet, CI/CD, outillage, missions de la semaine |

## Usage de l’IA

Chaque membre documente son usage dans `docs/ai-usage/<prenom>.md`.
