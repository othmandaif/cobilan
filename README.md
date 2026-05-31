# CoBilan

ERP comptable marocain — Frontend React + ERPNext v16 headless.

## 1. Lancer ERPNext avec Docker (port 8080)

```bash
# Cloner le repo Frappe Bench
git clone https://github.com/frappe/frappe_docker
cd frappe_docker

# Créer le dossier pour les projets
mkdir -p sites

# Créer un docker-compose.override.yml pour exposer sur le port 8080
cat > docker-compose.override.yml <<EOF
version: "3.8"
services:
  frontend:
    ports:
      - "8080:8080"
  backend:
    ports:
      - "8080:8000"
EOF

# Lancer les services
docker compose -f pwd.yml -f docker-compose.override.yml up -d

# Créer un site
docker compose -f pwd.yml -f docker-compose.override.yml run --rm backend bench new-site localhost --mariadb-root-password admin --admin-password admin

# Installer ERPNext
docker compose -f pwd.yml -f docker-compose.override.yml run --rm backend bench --site localhost install-app erpnext

# ERPNext est accessible sur http://localhost:8080
```

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
