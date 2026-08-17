# BlueFox Add Ons

Catalogue statique de démonstration pour les extensions BlueFox.

Le site est construit avec **React + TypeScript + Vite**, comme le site public BlueFox Browser. Il contient pour l’instant un catalogue local de fausses extensions, une recherche, des filtres, un mode clair/sombre et une fenêtre de détails. Aucun système d’installation, de compte, de publication ou d’API n’est encore connecté.

## Développement

Depuis ce dossier :

```bash
npm install
npm run dev
```

## Build Cloudflare Pages

```bash
npm run build
```

Le build de production est généré dans :

```text
dist/
```

Pour Cloudflare Pages, utilise le dossier `dist` comme sortie de déploiement. Le projet est configuré avec `base: './'`, ce qui permet aussi de servir le build comme un site statique après un téléversement direct.

## Prochaine étape prévue

Le catalogue pourra ensuite remplacer ses données locales par une API Cloudflare Worker/D1 et les paquets d’extensions pourront être stockés dans R2. Cette version ne contient volontairement aucun backend.
