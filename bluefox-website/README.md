# BlueFox Browser website

Le site est écrit en **React + TypeScript + Vite**. Il reste léger et rapide, mais sa structure est plus maintenable qu'une page HTML isolée.

## Développement

```bash
npm install
npm run dev
```

## Build Cloudflare Pages

```bash
npm run build
```

Le dossier à téléverser sur Cloudflare Pages est ensuite :

```text
dist/
```

Dans Cloudflare Pages, utilise **Direct Upload** et téléverse le contenu du dossier `dist`.

Le site interroge la dernière release publique de `Clipdescript/BlueFox`, détecte automatiquement le dernier installateur `.exe` et met à jour le bouton de téléchargement. Si GitHub est momentanément indisponible, il ouvre la page des releases.

## Aperçu lors d'un partage

`public/capture.png` est utilisé comme grande image d’aperçu par Discord, WhatsApp, Slack, Messenger et X/Twitter. `public/Logo.ico` reste le favicon du site. Les balises Open Graph utilisent actuellement `https://bluefoxbrowser.pages.dev/`. Si tu choisis un autre nom de projet ou un domaine personnalisé, remplace cette URL dans `index.html` avant le build.
