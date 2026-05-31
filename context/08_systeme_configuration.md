# API CoBilan — Système & Configuration

> **Base URL :** `http://localhost:8080`  
> **Authentification :** Session cookie ou `Authorization: token KEY:SECRET`

---

## SOCIÉTÉ (Company)

### 1. Détail de la société

#### `GET /api/resource/Company/{name}`

```
GET /api/resource/Company/CoBilan demo
```

**Réponse :**
```json
{
    "data": {
        "name": "CoBilan demo",
        "company_name": "CoBilan demo",
        "abbr": "CB",
        "country": "Morocco",
        "default_currency": "MAD",
        "default_bank_account": "Banque CIH - CB",
        "email": "admin@cobilan.ma",
        "phone": "+212522000000",
        "tax_id": "ICE_SOCIETE",
        "fiscal_year_start": "01-01"
    }
}
```

---

### 2. Modifier les paramètres de la société

#### `PUT /api/resource/Company/CoBilan demo`

```json
{
    "phone": "+212522000000",
    "email": "admin@cobilan.ma",
    "website": "www.cobilan.ma",
    "address": "123 Rue Hassan II, Casablanca"
}
```

---

## UTILISATEURS (User)

### 1. Lister les utilisateurs

#### `GET /api/resource/User`

```
GET /api/resource/User?filters=[["enabled","=",1],["user_type","=","System User"]]&fields=["name","full_name","email","role_profile_name","last_active"]
```

---

### 2. Détail d'un utilisateur

#### `GET /api/resource/User/{name}`

```
GET /api/resource/User/cobilan@gmail.com
```

---

### 3. Créer un utilisateur

#### `POST /api/resource/User`

```json
{
    "email": "comptable@cobilan.ma",
    "first_name": "Ahmed",
    "last_name": "Benali",
    "mobile_no": "+212600000000",
    "user_type": "System User",
    "send_welcome_email": 0,
    "roles": [
        {"role": "Accounts Manager"},
        {"role": "Sales Manager"}
    ]
}
```

---

### 4. Modifier un utilisateur

#### `PUT /api/resource/User/{email}`

```json
{
    "first_name": "Ahmed",
    "mobile_no": "+212611111111"
}
```

---

### 5. Désactiver un utilisateur

#### `PUT /api/resource/User/{email}`

```json
{
    "enabled": 0
}
```

---

## RÔLES (Role)

### Lister tous les rôles

#### `GET /api/resource/Role`

```
GET /api/resource/Role?fields=["name","desk_access"]&filters=[["desk_access","=",1]]
```

**Rôles clés pour CoBilan :**

| Rôle | Accès |
|------|-------|
| `System Manager` | Accès total |
| `Accounts Manager` | Comptabilité complète |
| `Accounts User` | Saisie comptable |
| `Sales Manager` | Gestion ventes complète |
| `Sales User` | Saisie ventes |
| `Purchase Manager` | Gestion achats complète |
| `Purchase User` | Saisie achats |

---

## PARAMÈTRES SYSTÈME

### 1. Paramètres ERPNext

#### `GET /api/resource/ERPNext Settings`

```
GET /api/resource/ERPNext Settings
```

---

### 2. Paramètres comptables

#### `GET /api/resource/Accounts Settings`

```
GET /api/resource/Accounts Settings
```

---

### 3. Paramètres de vente

#### `GET /api/resource/Selling Settings`

```
GET /api/resource/Selling Settings
```

---

### 4. Paramètres d'achat

#### `GET /api/resource/Buying Settings`

```
GET /api/resource/Buying Settings
```

---

## NOTIFICATIONS & EMAILS

### Lister les notifications système

#### `GET /api/resource/Notification`

```
GET /api/resource/Notification?fields=["name","subject","event","enabled"]
```

### Lire les notifications de l'utilisateur connecté

#### `GET /api/method/frappe.desk.notifications.get_notifications`

**Réponse :**
```json
{
    "message": {
        "open_count_doctype": {
            "Sales Invoice": 5,
            "Purchase Invoice": 2
        },
        "targets": {},
        "todo_count": 3,
        "notifications": []
    }
}
```

---

## NUMÉROTATION (Naming Series)

### Lister les séries de numérotation

#### `GET /api/resource/DocType Naming Rule`

```
GET /api/resource/DocType Naming Rule?fields=["name","document_type","rule"]
```

### Modifier une série de numérotation

#### `POST /api/method/frappe.model.naming.revert_series_if_last`

Pour personnaliser le format : `SINV-2024-.####` → `FAC-VENTE-2024-.####`

```
POST /api/method/frappe.client.update_naming_series
Body: {"series": "FAC-VENTE-.YYYY.-.####", "doctype": "Sales Invoice"}
```

---

## FICHIERS & PIÈCES JOINTES

### 1. Uploader un fichier

#### `POST /api/method/upload_file`

**Body (multipart/form-data) :**
```
file: [fichier binaire]
doctype: Sales Invoice
docname: SINV-2024-00001
is_private: 1
```

---

### 2. Lister les fichiers d'un document

#### `GET /api/resource/File`

```
GET /api/resource/File?filters=[["attached_to_doctype","=","Sales Invoice"],["attached_to_name","=","SINV-2024-00001"]]&fields=["name","file_name","file_url","file_size","creation"]
```

---

### 3. Télécharger un fichier

```
GET /api/method/frappe.utils.file_manager.download_file?file_url=/private/files/facture.pdf
```

---

## MÉTHODES UTILITAIRES GÉNÉRALES

### 1. Compter les documents

#### `GET /api/method/frappe.client.get_count`

**Params :**
```
doctype=Sales Invoice&filters=[["status","=","Unpaid"]]
```

**Réponse :**
```json
{"message": 12}
```

---

### 2. Obtenir une valeur spécifique

#### `GET /api/method/frappe.client.get_value`

**Params :**
```
doctype=Customer&filters={"name":"CUST-0001"}&fieldname=["customer_name","email_id","mobile_no"]
```

---

### 3. Recherche globale

#### `GET /api/method/frappe.desk.search.search_link`

**Params :**
```
doctype=Customer&txt=Test&query=erpnext.controllers.queries.customer_query&page_length=10
```

---

### 4. Obtenir les métadonnées d'un DocType

#### `GET /api/resource/DocType/{name}`

```
GET /api/resource/DocType/Sales Invoice
```

Retourne la définition complète du formulaire (champs, validations, workflows).

---

## TABLEAU DE BORD (Dashboard)

### Données du tableau de bord par défaut

#### `GET /api/method/frappe.desk.desktop.get_desktop_page_data`

**Body :**
```json
{
    "page": "home"
}
```

---

## LOGS & AUDIT

### Journal des activités

#### `GET /api/resource/Activity Log`

```
GET /api/resource/Activity Log?filters=[["user","=","cobilan@gmail.com"]]&fields=["name","user","operation","subject","creation"]&limit_page_length=50&order_by=creation desc
```

### Journal des erreurs

#### `GET /api/resource/Error Log`

```
GET /api/resource/Error Log?fields=["name","creation","title","error"]&limit_page_length=20&order_by=creation desc
```

---

## BANQUES & COMPTES BANCAIRES

### 1. Lister les banques

#### `GET /api/resource/Bank`

```
GET /api/resource/Bank?fields=["name","bank_name","swift_number"]
```

---

### 2. Lister les comptes bancaires

#### `GET /api/resource/Bank Account`

```
GET /api/resource/Bank Account?filters=[["company","=","CoBilan demo"]]&fields=["name","bank","account","iban","branch_code","is_default"]
```

---

### 3. Créer un compte bancaire

#### `POST /api/resource/Bank Account`

```json
{
    "account_name": "CIH Bank Principal",
    "bank": "CIH Bank",
    "account": "Banque CIH - CB",
    "iban": "MA64011519000001205000534921",
    "branch_code": "001",
    "company": "CoBilan demo",
    "is_default": 1
}
```
