# Configuration des Buckets Supabase Storage

## Buckets à créer

Dans votre projet Supabase, allez dans **Storage** et créez les buckets suivants:

### 1. car-images
- **Nom**: `car-images`
- **Public**: Oui
- **Description**: Images des voitures

**Politiques RLS**:
- `SELECT`: Public (tout le monde peut voir les images)
- `INSERT`: Authentifié (seuls les utilisateurs connectés peuvent uploader)
- `UPDATE`: Authentifié (seuls les propriétaires peuvent modifier)
- `DELETE`: Authentifié (seuls les propriétaires peuvent supprimer)

### 2. avatars
- **Nom**: `avatars`
- **Public**: Oui
- **Description**: Photos de profil des utilisateurs

**Politiques RLS**:
- `SELECT`: Public (tout le monde peut voir les avatars)
- `INSERT`: Authentifié (seuls les utilisateurs connectés peuvent uploader)
- `UPDATE`: Authentifié (seuls les propriétaires peuvent modifier)
- `DELETE`: Authentifié (seuls les propriétaires peuvent supprimer)

### 3. event-images
- **Nom**: `event-images`
- **Public**: Oui
- **Description**: Images des événements

**Politiques RLS**:
- `SELECT`: Public (tout le monde peut voir les images d'événements)
- `INSERT`: Authentifié (seuls les admins peuvent uploader)
- `UPDATE`: Authentifié (seuls les admins peuvent modifier)
- `DELETE`: Authentifié (seuls les admins peuvent supprimer)

### 4. chat-files
- **Nom**: `chat-files`
- **Public**: Non
- **Description**: Fichiers partagés dans les conversations

**Politiques RLS**:
- `SELECT`: Authentifié (seuls les participants de la conversation peuvent voir)
- `INSERT`: Authentifié (seuls les participants peuvent uploader)
- `UPDATE`: Authentifié (seuls les uploaders peuvent modifier)
- `DELETE`: Authentifié (seuls les uploaders peuvent supprimer)

## Instructions de création

1. Connectez-vous à votre projet Supabase
2. Allez dans **Storage** dans le menu de gauche
3. Cliquez sur **"New bucket"**
4. Entrez le nom du bucket
5. Cochez **"Public bucket"** si nécessaire (voir ci-dessus)
6. Cliquez sur **"Create bucket"**
7. Répétez pour chaque bucket

## Configuration des politiques RLS

Après avoir créé chaque bucket, configurez les politiques RLS:

1. Cliquez sur le bucket
2. Allez dans l'onglet **"Policies"**
3. Cliquez sur **"New Policy"**
4. Choisissez le template approprié ou créez une politique personnalisée
5. Configurez selon les règles ci-dessus

## Taille maximale des fichiers

Configurez une taille maximale recommandée:
- Images (car-images, avatars, event-images): 5 MB
- Fichiers (chat-files): 10 MB

Pour configurer:
1. Cliquez sur le bucket
2. Allez dans **Configuration**
3. Définissez **"File size limit"**
