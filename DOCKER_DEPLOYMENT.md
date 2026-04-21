# Docker Deployment Guide - Architecture Frontend/Backend Séparée avec PostgreSQL

Ce projet est configuré pour le déploiement avec Docker et Docker Compose sur un VPS Ubuntu avec nginx.

## Architecture

- **Frontend**: React/Expo buildé en fichiers statiques (serve avec `serve`)
- **Backend**: Node.js/Express API
- **PostgreSQL**: Base de données relationnelle (conteneur Docker)
- **Nginx**: Reverse proxy pour router les requêtes

## Prérequis sur le VPS

1. **Docker et Docker Compose installés**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

2. **Git installé**
```bash
sudo apt update
sudo apt install git -y
```

## Déploiement

### 1. Cloner le repository
```bash
git clone <votre-repo-url> SpeedNation
cd SpeedNation
```

### 2. Configurer PostgreSQL

1. Copiez `.env.example` en `.env`
2. Définissez un mot de passe sécurisé pour PostgreSQL :
   ```bash
   cp .env.example .env
   nano .env  # ou vim .env
   ```
3. Remplacez `your_secure_password_here` par un mot de passe fort :
   ```
   POSTGRES_PASSWORD=votre_mot_de_passe_ici
   ```

**Note**: La base de données PostgreSQL est automatiquement initialisée avec le script `database/init.sql` au premier démarrage.

### 3. Lancer l'application
```bash
docker compose up -d --build
```

L'application sera accessible sur `http://votre-ip-vps`

## Commandes utiles

- **Voir les logs**: `docker compose logs -f`
- **Logs d'un service spécifique**: `docker compose logs -f postgres` ou `docker compose logs -f backend`
- **Arrêter l'application**: `docker compose down`
- **Arrêter et supprimer les volumes (données)**: `docker compose down -v`
- **Redémarrer**: `docker compose restart`
- **Mettre à jour après un git pull**:
```bash
git pull
docker compose up -d --build
```

## Structure Docker

- **Dockerfile** (racine): Build du frontend React/Expo
- **backend/Dockerfile**: Build du backend Node.js/Express
- **docker-compose.yml**: Orchestration des 4 services (frontend, backend, postgres, nginx)
- **nginx-proxy.conf**: Configuration nginx reverse proxy
- **database/init.sql**: Script d'initialisation PostgreSQL
- **.dockerignore**: Fichiers exclus du build
- **backend/.dockerignore**: Fichiers exclus du build backend

## Services

- **postgres**: Base de données PostgreSQL 15 (port interne 5432)
- **frontend**: Port interne 80, sert les fichiers statiques
- **backend**: Port interne 3000, API REST
- **nginx**: Port 80 (exposé), reverse proxy

## Volumes Docker

- **postgres_data**: Volume persistant pour les données PostgreSQL

## Configuration

Le port par défaut est le **80**. Pour changer le port, modifiez `docker-compose.yml`:
```yaml
nginx:
  ports:
    - "8080:80"  # Change 8080 par le port désiré
```

## Variables d'environnement

Les variables sont définies dans `.env`:
- `POSTGRES_PASSWORD`: Mot de passe PostgreSQL (requis)

## Base de données

La base de données est automatiquement initialisée avec:
- Tables: users, profiles, cars, events, event_participants, car_favorites, conversations, conversation_participants, messages, conversation_hidden, follows
- Index pour optimiser les performances
- Extension UUID pour la génération d'IDs

**Accès direct à PostgreSQL** (si nécessaire):
```bash
docker compose exec postgres psql -U speednation_user -d speednation
```

## Sauvegarde des données

Pour sauvegarder la base de données:
```bash
docker compose exec postgres pg_dump -U speednation_user speednation > backup.sql
```

Pour restaurer:
```bash
cat backup.sql | docker compose exec -T postgres psql -U speednation_user -d speednation
```

## API Endpoints

Le backend expose les endpoints suivants via `/api/`:

- **Auth**: `/api/auth/*` (signup, signin, get user)
- **Cars**: `/api/cars/*` (CRUD, favorites)
- **Events**: `/api/events/*` (CRUD, join/leave)
- **Messaging**: `/api/messaging/*` (conversations, messages)
- **Profiles**: `/api/profiles/*` (CRUD, follow/unfollow)

## Health Check

Vérifiez que le backend fonctionne :
```bash
curl http://votre-ip-vps/health
```
Devrait retourner : `{"status":"ok","message":"SpeedNation API is running"}`
