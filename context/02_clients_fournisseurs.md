# API CoBilan — Clients & Fournisseurs

> **Base URL :** `http://localhost:8080`  
> **Authentification :** Session cookie ou `Authorization: token KEY:SECRET`

---

## CLIENTS (Customer)

### 1. Lister tous les clients

#### `GET /api/resource/Customer`

**Params optionnels (Query String) :**

| Param | Exemple | Description |
|-------|---------|-------------|
| `fields` | `["name","customer_name","customer_type"]` | Champs à retourner |
| `filters` | `[["customer_type","=","Company"]]` | Filtres |
| `limit_page_length` | `20` | Nombre de résultats |
| `limit_start` | `0` | Offset pour pagination |
| `order_by` | `creation desc` | Tri |

**Exemple complet :**
```
GET /api/resource/Customer?fields=["name","customer_name","customer_type","mobile_no","email_id","territory"]&limit_page_length=20&limit_start=0
```

**Réponse :**
```json
{
    "data": [
        {
            "name": "CUST-0001",
            "customer_name": "Société Test Maroc",
            "customer_type": "Company",
            "mobile_no": "+212600000000",
            "email_id": "contact@societe.ma",
            "territory": "Morocco"
        }
    ]
}
```

---

### 2. Détail d'un client

#### `GET /api/resource/Customer/{name}`

```
GET /api/resource/Customer/CUST-0001
```

**Réponse complète :**
```json
{
    "data": {
        "name": "CUST-0001",
        "customer_name": "Société Test Maroc",
        "customer_type": "Company",
        "customer_group": "Commercial",
        "territory": "Morocco",
        "mobile_no": "+212600000000",
        "email_id": "contact@societe.ma",
        "website": "www.societe.ma",
        "tax_id": "12345678",
        "default_currency": "MAD",
        "payment_terms": "",
        "credit_limit": 0,
        "outstanding_amount": 0,
        "creation": "2024-01-15 10:00:00",
        "modified": "2024-01-15 10:00:00"
    }
}
```

---

### 3. Créer un client

#### `POST /api/resource/Customer`

**Body :**
```json
{
    "customer_name": "Société Test Maroc",
    "customer_type": "Company",
    "customer_group": "Commercial",
    "territory": "Morocco",
    "mobile_no": "+212600000000",
    "email_id": "contact@societe.ma",
    "tax_id": "ICE_OU_IF_DU_CLIENT",
    "default_currency": "MAD"
}
```

**Valeurs possibles pour `customer_type` :**
- `Company` — Entreprise
- `Individual` — Particulier

**Réponse (201) :**
```json
{
    "data": {
        "name": "CUST-0002",
        "customer_name": "Société Test Maroc",
        ...
    }
}
```

---

### 4. Modifier un client

#### `PUT /api/resource/Customer/{name}`

```
PUT /api/resource/Customer/CUST-0001
```

**Body (uniquement les champs à modifier) :**
```json
{
    "mobile_no": "+212611111111",
    "email_id": "nouveau@societe.ma"
}
```

---

### 5. Supprimer un client

#### `DELETE /api/resource/Customer/{name}`

```
DELETE /api/resource/Customer/CUST-0001
```

> ⚠️ Impossible si des factures sont liées à ce client.

---

### 6. Adresses d'un client

#### `GET /api/resource/Address`

```
GET /api/resource/Address?filters=[["Dynamic Link","link_name","=","CUST-0001"]]&fields=["name","address_line1","city","country","phone"]
```

**Créer une adresse :**

#### `POST /api/resource/Address`

```json
{
    "address_title": "Siège Social",
    "address_type": "Billing",
    "address_line1": "123 Boulevard Mohammed V",
    "city": "Casablanca",
    "country": "Morocco",
    "phone": "+212522000000",
    "links": [
        {
            "link_doctype": "Customer",
            "link_name": "CUST-0001"
        }
    ]
}
```

---

### 7. Contacts d'un client

#### `GET /api/resource/Contact`

```
GET /api/resource/Contact?filters=[["Dynamic Link","link_name","=","CUST-0001"]]&fields=["name","first_name","last_name","email_id","mobile_no"]
```

**Créer un contact :**

#### `POST /api/resource/Contact`

```json
{
    "first_name": "Mohammed",
    "last_name": "Alami",
    "email_ids": [{"email_id": "m.alami@societe.ma", "is_primary": 1}],
    "phone_nos": [{"phone": "+212600000000", "is_primary_mobile_no": 1}],
    "links": [
        {
            "link_doctype": "Customer",
            "link_name": "CUST-0001"
        }
    ]
}
```

---

## FOURNISSEURS (Supplier)

### 1. Lister les fournisseurs

#### `GET /api/resource/Supplier`

```
GET /api/resource/Supplier?fields=["name","supplier_name","supplier_type","mobile_no","email_id","country"]&limit_page_length=20
```

---

### 2. Détail d'un fournisseur

#### `GET /api/resource/Supplier/{name}`

```
GET /api/resource/Supplier/SUPP-0001
```

---

### 3. Créer un fournisseur

#### `POST /api/resource/Supplier`

```json
{
    "supplier_name": "Fournisseur Maroc SARL",
    "supplier_type": "Company",
    "supplier_group": "Local",
    "country": "Morocco",
    "mobile_no": "+212600000000",
    "email_id": "contact@fournisseur.ma",
    "tax_id": "ICE_DU_FOURNISSEUR",
    "default_currency": "MAD"
}
```

**Valeurs possibles pour `supplier_type` :**
- `Company`
- `Individual`

---

### 4. Modifier un fournisseur

#### `PUT /api/resource/Supplier/{name}`

```json
{
    "mobile_no": "+212622222222"
}
```

---

### 5. Supprimer un fournisseur

#### `DELETE /api/resource/Supplier/{name}`

---

## GROUPES DE CLIENTS

### Lister les groupes

#### `GET /api/resource/Customer Group`

```
GET /api/resource/Customer Group?fields=["name","parent_customer_group"]
```

---

## TERRITOIRES

### Lister les territoires

#### `GET /api/resource/Territory`

```
GET /api/resource/Territory?fields=["name","parent_territory"]
```

---

## Champs utiles pour le Maroc

| Champ | Description |
|-------|-------------|
| `tax_id` | ICE (Identifiant Commun de l'Entreprise) ou IF |
| `territory` | Mettre `Morocco` |
| `default_currency` | `MAD` |
| `language` | `fr` |
