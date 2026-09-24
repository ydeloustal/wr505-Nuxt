# ChampaShop

Boutique fictive construite avec Nuxt 4, Pinia et Vitest. Le projet met en œuvre un catalogue produit, une logique de promotions front-only, et une expérience de navigation compatible SSR et partageable via l’URL.

## Démarrage

```bash
npm install
npm run dev
```

## Catalogue /produits

La page catalogue est disponible sur `/produits` et exploite les query params pour représenter l’état complet de la vue :

- `page`
- `q` (recherche)
- `category`
- `sortBy`
- `order`
- `minPrice`
- `maxPrice`

Le rechargement de page, le retour arrière et les liens partagés reproduisent exactement l’état affiché.

## Stratégie pour le filtrage prix min/max

DummyJSON ne propose pas de filtre `minPrice` / `maxPrice` côté API. Pour rester compatible avec les exigences de recherche, de pagination et de SSR, la solution retenue est la suivante :

1. On effectue un appel unique à l’API avec `limit=0`, en combinant uniquement les paramètres
   qu’elle sait traiter (recherche plein texte `q`). DummyJSON renvoie alors l’intégralité du
   catalogue (194 produits) plutôt qu’une page tronquée.
2. On applique le filtre catégorie, le filtre prix min/max et le tri (`sortBy`/`order`) côté
   client, sur ce jeu de données complet.
3. On découpe ensuite la liste filtrée/triée en pages de 12 produits, toujours côté client.

### Justification

- Les filtres prix ne sont pas exposés par DummyJSON : il n’y a pas d’alternative côté API.
- Récupérer le catalogue complet en un seul appel (`limit=0`) évite de multiplier les
  requêtes réseau à chaque changement de prix, de tri ou de page — un seul aller-retour par
  recherche/catégorie suffit.
- Filtrer sur un sous-ensemble arbitraire (ex. les 100 premiers produits) aurait faussé les
  résultats : certains produits auraient été invisibles quel que soit le filtre appliqué.
  Travailler sur le catalogue complet garantit des résultats et un nombre de pages corrects.
- Le volume reste modeste (194 produits, quelques dizaines de Ko de JSON), donc le coût
  mémoire/CPU du filtrage client est négligeable et n’impacte pas le rendu SSR ni la
  correspondance avec l’URL.
- La requête est ré-exécutée uniquement quand `q` ou `category` change (clé `useAsyncData`
  dédiée) ; Nuxt annule automatiquement une requête devenue obsolète (`dedupe: 'cancel'`),
  ce qui garantit qu’une réponse ancienne n’écrase jamais une réponse plus récente en cas de
  frappe rapide dans le champ de recherche.

## Moteur de promotions

Le fichier `utils/promotions.ts` expose une fonction pure `computeCart(...)` sans dépendance Vue ou Pinia. Tous les montants sont manipulés en centimes, et les règles de remise sont calculées localement.

Les codes pris en charge sont :

- `BEAUTY_3` : remise de 30 % sur le sous-total des produits de catégorie `beauty` si au moins 3 articles sont présents.
- `TROYES10` : remise de 10 % si le montant total du panier dépasse 45,00 €.

La logique est volontairement front-only car DummyJSON ne prend pas en charge les promotions côté API.

Le store Pinia (`stores/cart.ts`) convertit ses lignes de panier en `CartLine[]` avant d’appeler
`computeCart`, ce qui le garde découplé de la fonction pure. La page `/panier` consomme ce store :
ajout depuis le catalogue ou la fiche produit, modification des quantités, saisie d’un code promo
et affichage du résumé (sous-total, remises, livraison, total, messages d’erreur).

## Tests

```bash
npm test
```

## Scripts disponibles

```bash
npm run dev
npm run build
npm run preview
npm test
```
