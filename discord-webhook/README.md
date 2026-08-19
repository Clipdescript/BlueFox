# BlueFox Release Notifier

Ce dossier décrit le « bot » d’annonces de releases. Il ne s’agit pas d’un bot Discord connecté en permanence : GitHub Actions envoie une notification à Discord uniquement lorsqu’une release est publiée.

## Configuration

1. Dans Discord, crée un webhook dans le salon `#annonces`.
2. Si l’URL du webhook a été partagée, supprime-le et régénère-en un nouveau.
3. Dans GitHub, ouvre `Settings > Secrets and variables > Actions`.
4. Ajoute un secret nommé `DISCORD_RELEASE_WEBHOOK` contenant la nouvelle URL.
5. Publie une release GitHub : le workflow `.github/workflows/discord-release.yml` annoncera automatiquement la version.

L’URL du webhook ne doit jamais être écrite dans ce dossier, dans le code ou dans les logs.
