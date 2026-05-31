# CoBilan

ERP comptable marocain — Frontend React + ERPNext v16 headless.

## 1. Lancer ERPNext avec Docker

```bash
# Cloner le repo Frappe Bench (ou utiliser une instance existante)
git clone https://github.com/frappe/frappe_docker
cd frappe_docker

# Créer le dossier pour les projets
mkdir -p sites

# Lancer les services (PostgreSQL, Redis, etc.)
docker compose -f pwd.yml up -d

# Créer un site
docker compose -f pwd.yml run --rm backend bench new-site cobilan.localhost --mariadb-root-password admin --admin-password admin

# Installer ERPNext
docker compose -f pwd.yml run --rm backend bench --site cobilan.localhost install-app erpnext

# Récupérer l'adresse IP du conteneur backend
docker inspect $(docker ps -q -f name=backend) | grep IPAddress

# Le site est accessible sur http://cobilan.localhost:8000
# Ajouter dans le hosts : <IP> cobilan.localhost
```

**Alternative** — utilisateur avec instance ERPNext existante, fournir simplement l'URL de l'API.

## 2. Lancer le frontend

```bash
# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Build production
npm run build
```

L'application tourne sur `http://localhost:5173` (par défaut Vite).

Le proxy Vite redirige `/api` vers `http://localhost:8080` (configurable dans `vite.config.js`).

## 3. Configuration

Créer un fichier `.env.local` :

```env
VITE_API_URL=http://localhost:8080
```

L'API attend un header `Authorization: token <api_key>:<api_secret>` pour les mutations (POST/PUT/DELETE). Les sessions sont gérées par cookie.

## 4. Authentification

Se connecter avec les identifiants ERPNext via la page `/login`. L'utilisateur doit avoir les rôles appropriés (Comptable, Manager, etc.).

## Stack

- React 19 + Vite 8
- Tailwind CSS v4
- React Router v7
- Recharts (graphiques)
- Tesseract.js (OCR client-side)
- ERPNext v16 REST API
