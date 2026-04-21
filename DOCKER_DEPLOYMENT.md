# Docker Deployment Guide

Ce projet est configuré pour le déploiement avec Docker et Docker Compose sur un VPS Ubuntu avec nginx.

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

### 2. Configurer Supabase

Ce projet utilise Supabase comme base de données cloud. Vous avez deux options :

**Option A : Utiliser votre projet Supabase existant (recommandé)**
1. Copiez `.env.example` en `.env`
2. Remplacez les valeurs par vos credentials Supabase :
   ```bash
   cp .env.example .env
   nano .env  # ou vim .env
   ```
3. Ajoutez vos credentials :
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```

**Option B : Les credentials sont déjà dans le code**
- Les valeurs par défaut sont dans `config/supabase.js`
- L'application fonctionnera avec ces credentials
- Pour plus de sécurité, utilisez l'Option A avec des variables d'environnement

### 3. Lancer l'application
```bash
docker compose up -d --build
```

L'application sera accessible sur `http://votre-ip-vps`

## Commandes utiles

- **Voir les logs**: `docker compose logs -f`
- **Arrêter l'application**: `docker compose down`
- **Redémarrer**: `docker compose restart`
- **Mettre à jour après un git pull**:
```bash
git pull
docker compose up -d --build
```

## Configuration

Le port par défaut est le **80**. Pour changer le port, modifiez `docker-compose.yml`:
```yaml
ports:
  - "8080:80"  # Change 8080 par le port désiré
```

## Structure Docker

- **Dockerfile**: Multi-stage build (Node.js pour le build, nginx pour la production)
- **nginx.conf**: Configuration nginx avec gzip, cache et sécurité
- **docker-compose.yml**: Orchestration des services
- **.dockerignore**: Fichiers exclus du build Docker

## Variables d'environnement

Si vous avez besoin de variables d'environnement, créez un fichier `.env` à la racine du projet et ajoutez-les dans `docker-compose.yml`:
```yaml
environment:
  - VOTRE_VARIABLE=${VOTRE_VARIABLE}
```
