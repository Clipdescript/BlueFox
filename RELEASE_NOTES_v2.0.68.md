# BlueFox Browser v2.0.68

Cette version allège la distribution de BlueFox sans retirer la reconnaissance vocale. Le moteur Whisper/ONNX est maintenant chargé depuis un CDN uniquement lors de la première utilisation de la fonction vocale, puis conservé dans le cache du navigateur.

## Chargement vocal optimisé

- Le fichier WASM d’ONNX Runtime n’est plus inclus dans `dist-react`.
- Le moteur vocal est téléchargé uniquement lorsque la transcription vocale est utilisée.
- Le fichier est ensuite réutilisé depuis le cache du navigateur.
- La reconnaissance vocale de BlueFox reste disponible sans modifier son fonctionnement.
- Les fichiers sont servis depuis une URL CDN versionnée afin de rester compatibles avec la version installée.

## Installation hors ligne conservée

- L’installeur Windows standard NSIS est conservé.
- BlueFox peut toujours être installé sans connexion Wi-Fi.
- Aucun installeur web n’est utilisé dans cette version.
- Le téléchargement du moteur vocal intervient uniquement au premier usage de la dictée vocale.

## Nettoyage technique

- Suppression de l’ancienne recherche YouTube intégrée qui n’était plus utilisée.
- Suppression de plusieurs dépendances inutilisées.
- Déplacement des bibliothèques utilisées uniquement lors de la compilation React/Vite vers `devDependencies`.
- Conservation des dépendances nécessaires au fonctionnement d’Electron et du système de mises à jour automatiques.

## Distribution et mises à jour

- Nouvelle build Windows préparée avec l’installeur NSIS classique.
- La configuration `electron-updater` reste active pour les mises à jour automatiques.
- Le système de release conserve la compatibilité avec les artefacts GitHub Releases et les fichiers de mise à jour générés par Electron Builder.
- Le CDN utilisé pour Whisper est versionné afin d’éviter qu’une mise à jour distante incompatible ne casse la reconnaissance vocale.

Merci d’utiliser BlueFox 💙

— L’équipe BlueFox

**Version :** `v2.0.68`  
**BlueFox Browser**
