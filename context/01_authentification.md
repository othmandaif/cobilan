# API CoBilan — Authentification

> **Base URL :** `http://localhost:8080`  
> **Format :** Toutes les requêtes et réponses sont en JSON  
> **Header requis :** `Content-Type: application/json`

---

## Vue d'ensemble

ERPNext supporte deux méthodes d'authentification :

| Méthode | Usage recommandé |
|--------|-----------------|
| Session Cookie (login/password) | Frontend React (utilisateurs humains) |
| API Key + API Secret | Intégrations machine-to-machine |

---

## 1. Connexion par session

### `POST /api/method/login`

Authentifie un utilisateur et ouvre une session. Postman (et le navigateur) stockent automatiquement le cookie de session retourné.

**Body :**
```json
{
    "usr": "cobilan@gmail.com",
    "pwd": "MOT_DE_PASSE"
}
```

**Réponse succès (200) :**
```json
{
    "message": "Logged In",
    "home_page": "/app",
    "full_name": "CoBilan Admin"
}
```

**Réponse échec (401) :**
```json
{
    "message": "Incorrect password"
}
```

> Le cookie `sid` est retourné dans les headers — à conserver pour toutes les requêtes suivantes.

---

## 2. Déconnexion

### `GET /api/method/logout`

Invalide la session en cours.

**Réponse :**
```json
{
    "message": "Logged Out"
}
```

---

## 3. Authentification par API Key

Pour les appels depuis le frontend React en production, générer une API Key depuis le profil utilisateur ERPNext.

**Header à inclure dans chaque requête :**
```
Authorization: token API_KEY:API_SECRET
```

**Exemple :**
```
Authorization: token abc123def456:xyz789ghi012
```

---

## 4. Vérifier la session active

### `GET /api/method/frappe.auth.get_logged_user`

Retourne l'utilisateur actuellement connecté.

**Réponse :**
```json
{
    "message": "cobilan@gmail.com"
}
```

---

## 5. Infos de l'utilisateur connecté

### `GET /api/method/frappe.client.get_value`

**Params (Query String) :**
```
doctype=User&filters={"name":"cobilan@gmail.com"}&fieldname=["full_name","email","user_image","role_profile_name"]
```

**Réponse :**
```json
{
    "message": {
        "full_name": "CoBilan Admin",
        "email": "cobilan@gmail.com",
        "user_image": null,
        "role_profile_name": "System Manager"
    }
}
```

---

## 6. Liste des rôles de l'utilisateur connecté

### `GET /api/method/frappe.client.get_list`

**Params :**
```
doctype=Has Role&filters={"parent":"cobilan@gmail.com"}&fields=["role"]
```

---

## Notes importantes pour le frontend React

- En développement, utiliser la **connexion par session** avec `credentials: 'include'` dans chaque appel `fetch`.
- Stocker le statut de connexion dans un contexte React global (pas le cookie lui-même).
- En cas de réponse `403`, rediriger automatiquement vers la page de login.
- Le token CSRF (`X-Frappe-CSRF-Token`) est requis pour toutes les requêtes `POST`, `PUT`, `DELETE`.

### Récupérer le token CSRF

### `GET /api/method/frappe.auth.get_csrf_token`

**Réponse :**
```json
{
    "csrf_token": "abc123..."
}
```

Ajouter ce token dans le header de chaque requête de modification :
```
X-Frappe-CSRF-Token: abc123...
```
