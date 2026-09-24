# ChampaShop

Boutique fictive construite avec Nuxt 4, Pinia et Vitest. Le projet met en œuvre un catalogue produit, une logique de promotions front-only, et une expérience de navigation compatible SSR et partageable via l’URL.

Site déployé : _à compléter (URL Vercel/Netlify branchée sur `main`)_

## Démarrage

```bash
npm install
npm run dev
```

## Catalogue /produits

La page catalogue (`/produits`) affiche 12 produits par page avec image, titre, prix, note et badge de remise (`discountPercentage`). Elle propose recherche plein texte, filtre par catégorie, filtre de prix, tri par titre, prix ou note, et gère les états de chargement (squelettes), d’absence de résultat et d’erreur réseau (bouton « Réessayer »).

### L’URL est la source de vérité

Tout l’état de la vue est dans les query params : `page`, `q`, `category`, `sortBy`, `order`, `minPrice`, `maxPrice`. Seules les valeurs différentes des valeurs par défaut sont écrites (`/produits` = page 1, tri titre A → Z).

- Rechargement, bouton retour et lien partagé reproduisent la même vue, rendue côté serveur (SSR).
- Les valeurs invalides (`page=abc`, `sortBy=foo`, prix négatif, min supérieur à max) retombent sur des valeurs sûres au lieu de casser la page.
- Une page hors bornes (`?page=999`) est ramenée à la dernière page valide.
- Chaque changement de filtre ajoute une entrée d’historique (bouton retour) et remet la page à 1 ; la frappe dans la recherche remplace l’entrée courante.

### Recherche : debounce et réponses obsolètes

- Le champ de recherche n’écrit dans l’URL qu’après 300 ms sans frappe (`useDebouncedSync`).
- Le chargement dépend de `q` uniquement (clé de `useAsyncData`). Quand `q` change, Nuxt annule la requête en cours (`signal`) : une réponse ancienne ne peut jamais écraser une réponse plus récente.

## Stratégie pour le filtrage prix min/max

DummyJSON ne propose pas de filtre `minPrice` / `maxPrice`, ni de tri combiné à une recherche paginée sur tous les critères. La stratégie retenue est de **charger le catalogue une seule fois puis de filtrer, trier et paginer côté client** :

1. Un appel unique `GET /products?limit=0&select=…` (ou `/products/search?q=…` avec la même forme) renvoie tout le catalogue correspondant à la recherche.
2. Le filtre catégorie, le filtre de prix, le tri et la découpe en pages de 12 sont des fonctions pures (`utils/catalog.ts`) appliquées sur ce jeu de données.

### Justification

- **Appels** : un seul appel par recherche. Changer de catégorie, de prix, de tri ou de page n’appelle plus l’API. Seul un changement de `q` relance une requête.
- **Performance** : le paramètre `select` limite la réponse aux 7 champs affichés dans la liste (id, titre, prix, note, remise, catégorie, miniature). Pour les 194 produits, la réponse passe d’environ 306 Ko à 43 Ko. Filtrer 194 éléments côté client est négligeable.
- **Pagination** : elle est calculée après filtre et tri, sur le catalogue complet. Le nombre de résultats et de pages est donc toujours exact ; paginer côté API (`limit`/`skip`) puis filtrer le prix côté client aurait masqué des produits et faussé le nombre de pages.
- **SSR** : la requête est faite côté serveur ; la page arrive rendue, avec la bonne pagination pour l’URL demandée.
- **Limite connue** : si le catalogue atteignait plusieurs milliers de produits, il faudrait un endpoint côté serveur (BFF) qui filtre et pagine. Ce n’est pas nécessaire pour 194 produits.

## Moteur de promotions

Le fichier `utils/promotions.ts` expose une fonction pure `computeCart(...)` sans dépendance Vue ou Pinia. Tous les montants sont manipulés en centimes, et les règles de remise sont calculées localement, dans cet ordre :

1. **Remise beauté automatique** : dès que le panier contient au moins 3 articles cumulés de catégorie `beauty`, chaque ligne beauty est remisée de 10 %, arrondie au centime ligne par ligne (arrondi commercial, demi vers le haut). Cette remise ne dépend d’aucun code promo.
2. **Code `TROYES10`** : remise fixe de 10,00 € si le sous-total après remise beauté dépasse strictement 50,00 €. Le code est insensible à la casse et aux espaces (`" TrOyEs10 "` fonctionne). S’il est refusé (sous-total insuffisant ou code inconnu), `messages` explique pourquoi.
3. **Plafond de 25 %** : le total des remises ne peut jamais dépasser 25 % du sous-total brut (arrondi au centime). En cas de dépassement, c’est le code promo qui est réduit en conséquence, jamais la remise beauté ; un message informe de la réduction.
4. **Livraison** : 4,90 €, offerte si le montant après remises atteint 80,00 €, sauf si le panier contient un produit de catégorie `furniture` (livraison alors toujours facturée).

La logique est volontairement front-only car DummyJSON ne prend pas en charge les promotions côté API.

Le store Pinia (`stores/cart.ts`) convertit ses lignes de panier en `CartLine[]` avant d’appeler
`computeCart`, ce qui le garde découplé de la fonction pure. La page `/panier` consomme ce store :
ajout depuis le catalogue ou la fiche produit, modification des quantités, saisie d’un code promo
et affichage du résumé (sous-total, remises, livraison, total, messages d’erreur).

## Tests

```bash
npm test
```

`tests/unit/promotions.spec.ts` couvre les 4 règles de `computeCart` (remise beauté, code
TROYES10, plafond à 25 %, livraison) ainsi que des cas limites (panier vide, quantités à 0,
code promo invalide ou composé uniquement d’espaces). La couverture est vérifiée avec :

```bash
npm run test:coverage
```

Un seuil de 90 % (lignes et branches) est imposé dans `vitest.config.ts` sur `utils/promotions.ts` :
la commande échoue si la couverture passe en dessous, ce qui permet à la CI de bloquer une
régression de tests sur le moteur de promotions.

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
