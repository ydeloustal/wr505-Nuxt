# Usage de l'IA — Yoan

| Date | Outil | Ce que j'ai demandé | Ce que j'ai gardé / modifié / rejeté, et pourquoi |
| --- | --- | --- | --- |
| 28/09 | Claude Code | Faire le point : qu'est-ce qui est déjà fait et qu'est-ce qu'il reste à faire sur le cahier des charges (demandé deux fois, dont une fois en précisant « ne dev pas ») | Lecture seule, aucun code écrit. Sert de base pour choisir la fonctionnalité suivante (F3). |
| 28/09 | Claude Code | Implémenter F3 (panier : plafond de stock et persistance par cookie), uniquement ce qui est demandé pour F3, en respectant le gitflow, sans pousser sans mon accord et sans mention de l'IA dans les commits | Contrainte posée dès le départ : pas de push automatique, périmètre limité à F3, historique git écrit comme si c'était moi. Livré sur `feature/f3-panier-stock-cookie` |
| 28/09 | Claude Code | Après mon merge sur `develop` : remettre le dépôt local à jour sur `develop` et supprimer la branche F3 | Nettoyage de la branche locale une fois la PR mergée, pour ne pas laisser de branche obsolète. |
| 01/10 | Claude Code | Comprendre pourquoi le template de pull request n'apparaît pas sur GitHub | Diagnostic sans modification de code : le template (`.github/pull_request_template.md`) n'est que sur `develop` et GitHub ne le lit que sur la branche par défaut. Reste à faire : PR `develop` → `main`, ou passer `develop` en branche par défaut. |
| 01/10 | Claude Code | Mettre le dépôt à jour après le merge des trois PR | Fast-forward de `develop` sur `origin/develop` (`57900e1`). Copie locale vide de `maxime.md` supprimée car elle bloquait le pull. |
