# Mise en ligne de Black House

Ce guide décrit, dans l'ordre, tout ce qu'il faut faire pour passer du code local à un site public.
Les commandes ont été testées (image Docker, sauvegarde, restauration) ; les étapes qui dépendent
de comptes extérieurs (Contabo, Cloudflare, Coolify) sont décrites mais n'ont pas pu être rejouées
de bout en bout : suivre la check-list finale pour tout vérifier.

```
Client ──► Cloudflare ──► VPS Contabo ──► Coolify (Traefik) ──► conteneur Next.js ──► Supabase (Francfort)
           DNS, HTTPS,                    déploie à chaque        site + back-office      base, comptes, photos
           cache, protection              git push
```

## 0. Ce qu'il faut avoir

- Un **nom de domaine** (ex. `blackhouse.sn`) dont on peut changer les serveurs DNS.
- Un **compte Cloudflare** (gratuit) et un **VPS Contabo** (Ubuntu 24.04, 4 Go de RAM suffisent).
- Le code dans un **dépôt Git privé** (GitHub ou GitLab) : Coolify le récupère à chaque mise à jour.
- Le projet **Supabase** déjà créé (région Francfort) et lié : `npx supabase link`.

## 1. Supabase en ligne

1. Envoyer le schéma : `npx supabase db push` (à refaire après chaque nouvelle migration, **avant** de
   déployer le code qui l'utilise). Il y a 5 migrations à ce jour, la dernière
   (`20261020100000_category_images.sql`) ajoute l'image des catégories : sans elle, `/admin/categories`
   et l'accueil échouent.
2. Tableau de bord > **Authentication** > *Sign In / Providers* : désactiver « Allow new users to
   sign up » (le réglage de `config.toml` ne vaut que pour le local).
3. Tableau de bord > **Authentication** > *URL Configuration* : *Site URL* = l'adresse publique du site.
4. **Studio > SQL Editor** : jouer [`supabase/production-setup.sql`](../supabase/production-setup.sql)
   (catégories, puis compte de Babacar en suivant les commentaires du fichier). Les fournisseurs et
   les catégories se gèrent ensuite depuis le back-office (`/admin/fournisseurs`, `/admin/categories`).
   Le seed de test (`seed.sql`) ne doit **jamais** être joué en ligne.
5. Noter, dans **Project Settings > API Keys**, l'URL du projet, la clé *Publishable* et la clé *Secret*.
6. Images : celles des catégories et des produits se déposent depuis le back-office
   (`/admin/categories/…` et la fiche d'un produit), plus besoin de passer par Studio. Le script
   `db:seed-images` est réservé au local.

## 2. Le serveur (VPS Contabo)

Se connecter en SSH (`ssh root@IP`), puis :

```bash
# Un utilisateur dédié, connexion par clé uniquement
adduser deploy && usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh && cp ~/.ssh/authorized_keys /home/deploy/.ssh/ && chown -R deploy:deploy /home/deploy/.ssh
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/; s/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart ssh

# Pare-feu : SSH, HTTP, HTTPS (et 8000 le temps de configurer Coolify)
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw allow 8000 && ufw enable

# Mises à jour de sécurité automatiques
apt update && apt install -y unattended-upgrades && dpkg-reconfigure -plow unattended-upgrades
```

Se reconnecter en `deploy` (vérifier **avant** de fermer la session root), puis installer Coolify :

```bash
curl -fsSL https://cdn.coollabsio.com/coolify/install.sh | sudo bash
```

Coolify s'ouvre sur `http://IP:8000` : créer le compte administrateur tout de suite. Dans ses réglages,
lui donner un domaine (ex. `coolify.blackhouse.sn`) pour passer en HTTPS, puis **fermer le port 8000**
(`ufw delete allow 8000`).

## 3. Déployer le site avec Coolify

1. **New Resource** > dépôt Git privé (GitHub App, ou *Deploy Key* ajoutée au dépôt) > branche `main`.
2. *Build Pack* : **Dockerfile** (celui à la racine). *Port* : `3000`. *Health check* : `/api/health`.
3. Variables d'environnement :

| Variable | Valeur | Cocher « Available at Buildtime » |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase | **oui** |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | clé *Publishable* | **oui** |
| `NEXT_PUBLIC_SHOP_WHATSAPP` | numéro de la boutique, 9 chiffres (ex. `771234567`) | **oui** |
| `NEXT_PUBLIC_SITE_URL` | `https://blackhouse.sn` (sans `/` final) | **oui** |
| `SUPABASE_SECRET_KEY` | clé *Secret* | **non** : exécution seulement, jamais au build |

   Les variables `NEXT_PUBLIC_*` sont inscrites dans le code **au moment du build** : si l'une change,
   il faut **reconstruire**, pas seulement redémarrer. Le build lit aussi le catalogue pour pré-rendre
   les pages : Supabase doit être joignable depuis le VPS (c'est le cas en ligne).
4. *Domains* : `https://blackhouse.sn` (Coolify demande le certificat HTTPS tout seul).
5. Activer le **déploiement automatique** à chaque push sur `main`, puis **Deploy**.

## 4. Cloudflare

1. Ajouter le domaine à Cloudflare et remplacer les *name servers* chez le registrar par les siens.
2. **DNS** : un enregistrement `A` `@` vers l'IP du VPS (et `www` en `CNAME` vers `@`).
   Pour le **tout premier** certificat, laisser le nuage **gris** (DNS seul) ; une fois le site servi
   en HTTPS par Coolify, le passer en **orange** (proxifié).
3. **SSL/TLS** > mode **Full (strict)**. Activer *Always Use HTTPS*.
4. **Caching** > *Cache Rules* : mettre en cache `/_next/image*` (Edge TTL 1 jour) pour accélérer les
   photos au Sénégal (Cloudflare a un centre de données à Dakar). Les fichiers `/_next/static/*` sont
   déjà mis en cache. Les pages dynamiques (`/admin`, `/suivi`, `/panier`…) ne le sont pas : ne rien ajouter.
5. **Security** > *WAF* > règle de limitation de débit sur `/admin/connexion` (ex. 5 requêtes / 10 s par
   IP) et *Bot Fight Mode* activé : c'est la seule protection contre les essais de mots de passe.

## 5. Sauvegardes de la base

Le script [`scripts/backup-db.sh`](../scripts/backup-db.sh) sauvegarde les **données** chaque nuit et garde
14 jours. Il sert aussi de « battement de cœur » : une requête quotidienne empêche le projet Supabase
gratuit de se mettre en pause pour inactivité (après 7 jours sans activité).

Sur le VPS :

```bash
# Client PostgreSQL 17 (même version que Supabase)
sudo apt install -y postgresql-common && sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh
sudo apt install -y postgresql-client-17

# Le script et son secret (chaîne « Session pooler » : Supabase > Connect)
sudo mkdir -p /opt/black-house/scripts /var/backups/black-house
sudo cp scripts/backup-db.sh /opt/black-house/scripts/ && sudo chmod +x /opt/black-house/scripts/backup-db.sh
echo 'DATABASE_URL=postgresql://postgres.XXXX:MOT_DE_PASSE@aws-0-eu-central-1.pooler.supabase.com:5432/postgres' \
  | sudo tee /etc/black-house-backup.env >/dev/null
sudo chmod 600 /etc/black-house-backup.env

# Chaque nuit à 3 h
( sudo crontab -l 2>/dev/null; echo '0 3 * * * set -a; . /etc/black-house-backup.env; set +a; /opt/black-house/scripts/backup-db.sh >> /var/log/black-house-backup.log 2>&1' ) | sudo crontab -
```

Lancer une fois à la main pour vérifier. Les disques Contabo ne sont pas sauvegardés : **copier le
dossier `/var/backups/black-house` ailleurs** (ex. `rclone` vers Google Drive, chaque semaine).

**Pas dans la sauvegarde :** les photos (Storage) et le compte de Babacar. Les photos restent sur son
téléphone ; le compte se recrée (étape 1).

### Restaurer une sauvegarde

1. Créer un projet Supabase neuf, puis `npx supabase link` vers lui et `npx supabase db push`.
2. Rejouer les données : `gunzip -c black-house-AAAA-MM-JJ-HHMM.sql.gz | psql "$DATABASE_URL"`
   (le prochain numéro de commande est conservé).
3. Recréer le compte de Babacar (`production-setup.sql`), remettre les photos si besoin, et mettre à
   jour `NEXT_PUBLIC_SUPABASE_URL` et les clés dans Coolify (puis reconstruire).

Cette procédure a été testée sur la base locale : toutes les lignes sont retrouvées.

## 6. Mettre à jour le site

- **Code seul** : `git push` sur `main` → Coolify reconstruit et remplace le conteneur sans coupure.
- **Avec une migration** : d'abord `npx supabase db push`, puis `git push`. Une migration doit rester
  compatible avec l'ancien code (ajouter avant de supprimer) le temps du déploiement.
- **Retour en arrière** : Coolify > *Deployments* > redéployer la version précédente. Une migration
  déjà appliquée ne se défait pas toute seule : en écrire une nouvelle.

## 7. Check-list après la première mise en ligne

- [ ] `https://blackhouse.sn/api/health` répond `{"status":"ok"}` ; `http://` redirige vers `https://`.
- [ ] Les 4 catégories s'affichent, la barre de navigation aussi (et leurs images, ajoutées depuis `/admin/categories`).
- [ ] Passer une **vraie commande de test** avec son propre numéro, jusqu'à la confirmation, puis la
      traiter dans `/admin` (vérification, frais, message WhatsApp reçu, page de suivi). L'annuler ensuite.
- [ ] Se connecter à `/admin` avec le compte de Babacar ; une inscription publique est refusée.
- [ ] Ajouter un produit avec photos **depuis un vrai téléphone** (Android et iPhone) : appareil photo, galerie, photo en HEIC (iPhone), orientation correcte.
- [ ] Back-office sur téléphone : le menu hamburger liste Commandes, Produits, Catégories, Fournisseurs ; la barre du haut reste fixe ; créer un fournisseur et une catégorie.
- [ ] Panier latéral : « Ajouter au panier » l'ouvre, on modifie les quantités, « Commander » mène à `/panier` ; la touche Échap le ferme (ordinateur).
- [ ] Les pages `/livraison`, `/echanges` et `/conditions` ont été **relues et validées par Babacar** (délais, frais, échanges) et les informations légales de la boutique sont renseignées dans les conditions.
- [ ] Le lien WhatsApp du bouton « Commander » ouvre la bonne conversation, avec le bon numéro.
- [ ] `https://blackhouse.sn/robots.txt` interdit `/admin`, `/suivi/`, `/merci/`, `/panier`.
- [ ] Tester le site en 4G, sur un téléphone d'entrée de gamme.
- [ ] La sauvegarde de la nuit a créé un fichier dans `/var/backups/black-house`.
- [ ] Surveillance gratuite (ex. UptimeRobot) sur `/api/health`, avec une alerte par e-mail.

## 8. Limites connues

- **Textes des pages d'information** : propositions à valider (délais, frais, échanges, mentions légales).
- **Panier latéral** : l'en-tête embarque le catalogue (nom, prix, statut, une image) pour l'afficher.
  Léger pour quelques dizaines de produits ; à charger à l'ouverture si le catalogue grossit beaucoup.
- **Supabase gratuit** : 500 Mo de base, 1 Go de photos, pas de restauration à un instant donné. Les
  photos réduites (~250 Ko) laissent de la marge pour plusieurs milliers de produits.
- **Pas de limitation de débit dans l'application** : elle repose sur Cloudflare (étape 4).
- **Pas de politique CSP** (Content-Security-Policy) : les autres en-têtes de sécurité sont en place.
- Les **images de test** (`db:seed-images`) ne doivent jamais être utilisées en ligne.
