# Changelog

## [0.1.0] - 2026-10-01

Première version : socle du projet et fonctionnalités de la semaine 1.

### Ajouté
- Socle : Nuxt, Pinia, ESLint, Prettier, Vitest, workflow CI sur les pull requests, template de PR.
- F1 : catalogue `/produits` (pagination à 12, recherche avec debounce, filtres catégorie et prix, tri, URL comme source de vérité, états chargement / vide / erreur).
- F2 : fiche produit `/produits/[id]` (galerie, stock, SEO, vraie 404).
- F3 : panier avec plafond de stock et persistance par cookie, rattaché au compte, validation de commande.
- F4 : moteur de promotions `computeCart` (remise beauté, code `TROYES10`, plafond de 25 %, livraison), couverture ≥ 90 %.
- F5 : authentification DummyJSON (cookies, middleware `auth`, rafraîchissement single-flight, déconnexion).
- Journaux d'usage de l'IA dans `docs/ai-usage/`.

### Modifié
- Borne du filtre de prix fixée à 0 – 3000+.

### Corrigé
- Page catalogue déplacée en `produits/index.vue` pour que la fiche produit s'affiche.
- Validation de la forme d'un panier lu dans le cookie.
