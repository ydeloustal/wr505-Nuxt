# Usage de l'IA — Maxime

| Date | Outil | Ce que j'ai demandé | Ce que j'ai gardé / modifié / rejeté, et pourquoi |
| --- | --- | --- | --- |
| 01/10 | Claude Code | Rendre la borne haute du filtre de prix fixe (0 à 3000+) au lieu de la calculer dynamiquement depuis le catalogue courant | Remplacé `getPriceCeiling(products, fallback)` par une constante `PRICE_CEILING`, et supprimé ses tests devenus obsolètes. Ajouté des libellés « 0 € / 3000+ € » au-dessus du champ de prix pour que la borne « et plus » soit visible, pas seulement déduite du comportement du curseur. Vérifié en `curl` que `min="0" max="3000"` est bien rendu côté serveur et que `?maxPrice=20` filtre toujours correctement (194 → 77 résultats). |
