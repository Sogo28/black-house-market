#!/usr/bin/env bash
# Sauvegarde quotidienne des DONNÉES de la base Supabase (produits, commandes, alertes…).
# Le schéma n'en fait pas partie : il est dans supabase/migrations (Git). Pour restaurer, on
# crée un projet vide, on lui applique les migrations, puis on y rejoue cette sauvegarde
# (voir docs/deploiement.md, « Restaurer une sauvegarde »).
#
# À lancer chaque nuit par cron sur le VPS (voir docs/deploiement.md). Garde les 14 derniers
# jours. Comme ce script interroge la base tous les jours, il empêche aussi le projet Supabase
# gratuit de se mettre en pause pour inactivité.
#
# Variables :
#   DATABASE_URL  obligatoire — chaîne « Session pooler » du tableau de bord Supabase
#                 (Connect > Session pooler ; la connexion directe est en IPv6 seulement)
#   BACKUP_DIR    dossier des sauvegardes (défaut : /var/backups/black-house)
#   KEEP_DAYS     durée de conservation en jours (défaut : 14)
#
# Ce qui n'est PAS dans la sauvegarde : les photos (Storage) et le compte de Babacar (auth,
# donc aussi la table admins qui s'y rattache). Les photos restent sur son téléphone ; le compte
# se recrée en deux minutes (supabase/production-setup.sql).

set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL manquante : voir docs/deploiement.md}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/black-house}"
KEEP_DAYS="${KEEP_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
file="$BACKUP_DIR/black-house-$(date +%Y-%m-%d-%H%M).sql.gz"

# On écrit dans un fichier temporaire : une sauvegarde interrompue ne doit jamais ressembler à une bonne.
tmp="$file.partial"
trap 'rm -f "$tmp"' EXIT

pg_dump "$DATABASE_URL" --data-only --schema=public --exclude-table-data=public.admins --no-owner --no-privileges | gzip > "$tmp"

# Un dump vide ou tronqué pèse quelques dizaines d'octets : on refuse de le garder.
size=$(wc -c < "$tmp")
if [ "$size" -lt 2048 ]; then
  echo "Sauvegarde suspecte ($size octets), abandon." >&2
  exit 1
fi

mv "$tmp" "$file"
trap - EXIT
find "$BACKUP_DIR" -name 'black-house-*.sql.gz' -mtime +"$KEEP_DAYS" -delete

echo "Sauvegarde créée : $file ($size octets)"
