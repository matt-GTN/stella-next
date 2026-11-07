# CI et images Docker

Chaque pull request construit les images de production (installation des dépendances et build frontend). Aucun secret applicatif ni accès VPS n’est requis. Il n’existe pas encore de suite de tests applicatifs automatisée dans cette CI.

Un push sur `main` ou un lancement manuel depuis `main` publie les images sur GHCR avec le SHA complet du commit et `latest`. Déployer le tag SHA ou le digest, puis conserver cette référence pour le rollback. Les PR ne publient pas d’image. Le déploiement du VPS reste une opération distincte.

Images :
- `ghcr.io/matt-gtn/stella-backend:<commit-sha>`
- `ghcr.io/matt-gtn/stella-frontend:<commit-sha>`

## Image backend CPU

Le VPS n’a pas de GPU et le RAG utilise déjà `device=cpu`. Le Dockerfile installe PyTorch **2.9.1+cpu** depuis l’index officiel et conserve Transformers **4.57.3**, les versions ML de la production. Les contraintes empêchent l’installation indirecte de CUDA. Toutes les dépendances fonctionnelles existantes sont conservées.

Chaque build exécute un smoke test hors ligne : absence de bibliothèques NVIDIA/Triton, calcul PyTorch, encodage SentenceTransformer, import SHAP, classification sklearn, écriture/requête Chroma et endpoint FastAPI `/health` avec une clé factice. Aucun appel LLM réel ni téléchargement de modèle n’est effectué. Le build PR impose aussi une taille backend inférieure à 3,5 GB (taille Docker non compressée).

L’image de production historique fait 8,54 GB, dont environ 4,3 GiB de bibliothèques NVIDIA et 594 MiB de Triton. La taille optimisée est mesurée dans le résumé GitHub Actions. La PR reste ouverte jusqu’à revue ; aucune application du VPS n’est remplacée par ces tests.
