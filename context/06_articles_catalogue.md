# API CoBilan — Articles & Catalogue

> **Base URL :** `http://localhost:8080`  
> **Authentification :** Session cookie ou `Authorization: token KEY:SECRET`

---

## ARTICLES (Item)

Les articles représentent les produits ou services vendus/achetés. Dans un contexte comptable (services), ils représentent les types de prestations.

### 1. Lister les articles

#### `GET /api/resource/Item`

```
GET /api/resource/Item?fields=["name","item_name","item_code","item_group","description","standard_rate","is_sales_item","is_purchase_item","disabled"]&limit_page_length=50
```

**Filtrer uniquement les services :**
```
GET /api/resource/Item?filters=[["is_stock_item","=",0]]&fields=["name","item_name","standard_rate"]
```

**Réponse :**
```json
{
    "data": [
        {
            "name": "PREST-COMPTA-001",
            "item_name": "Tenue de comptabilité mensuelle",
            "item_code": "PREST-COMPTA-001",
            "item_group": "Prestations comptables",
            "description": "Tenue de comptabilité générale et analytique",
            "standard_rate": 3000.00,
            "is_sales_item": 1,
            "is_purchase_item": 0,
            "disabled": 0
        }
    ]
}
```

---

### 2. Détail d'un article

#### `GET /api/resource/Item/{name}`

```
GET /api/resource/Item/PREST-COMPTA-001
```

---

### 3. Créer un article (service)

#### `POST /api/resource/Item`

**Body pour un service (prestation comptable) :**
```json
{
    "item_code": "PREST-COMPTA-001",
    "item_name": "Tenue de comptabilité mensuelle",
    "item_group": "Prestations comptables",
    "description": "Tenue de comptabilité générale et analytique mensuelle",
    "is_stock_item": 0,
    "is_sales_item": 1,
    "is_purchase_item": 0,
    "standard_rate": 3000.00,
    "valuation_rate": 0,
    "uom": "Nos",
    "income_account": "Prestations comptables - CB",
    "taxes": [
        {
            "item_tax_template": "TVA 20% - CB"
        }
    ]
}
```

**Body pour un produit physique :**
```json
{
    "item_code": "PROD-001",
    "item_name": "Fournitures de bureau",
    "item_group": "Produits",
    "is_stock_item": 1,
    "is_sales_item": 1,
    "is_purchase_item": 1,
    "standard_rate": 100.00,
    "uom": "Nos",
    "default_warehouse": "Stores - CB"
}
```

---

### 4. Modifier un article

#### `PUT /api/resource/Item/{name}`

```json
{
    "standard_rate": 3500.00,
    "description": "Description mise à jour"
}
```

---

### 5. Désactiver un article

#### `PUT /api/resource/Item/{name}`

```json
{
    "disabled": 1
}
```

---

## GROUPES D'ARTICLES (Item Group)

### 1. Lister les groupes

#### `GET /api/resource/Item Group`

```
GET /api/resource/Item Group?fields=["name","parent_item_group","is_group"]
```

---

### 2. Créer un groupe

#### `POST /api/resource/Item Group`

```json
{
    "item_group_name": "Prestations comptables",
    "parent_item_group": "All Item Groups",
    "is_group": 0
}
```

---

## LISTE DE PRIX (Price List)

### 1. Lister les listes de prix

#### `GET /api/resource/Price List`

```
GET /api/resource/Price List?fields=["name","currency","buying","selling","enabled"]
```

---

### 2. Obtenir le prix d'un article

#### `GET /api/resource/Item Price`

```
GET /api/resource/Item Price?filters=[["item_code","=","PREST-COMPTA-001"],["price_list","=","Standard Selling"]]&fields=["name","price_list_rate","currency","valid_from","valid_upto"]
```

---

### 3. Créer un prix pour un article

#### `POST /api/resource/Item Price`

```json
{
    "item_code": "PREST-COMPTA-001",
    "price_list": "Standard Selling",
    "price_list_rate": 3000.00,
    "currency": "MAD",
    "selling": 1,
    "buying": 0
}
```

---

## UNITÉS DE MESURE (Unit of Measure)

### Lister les unités

#### `GET /api/resource/UOM`

```
GET /api/resource/UOM?fields=["name","uom_name"]
```

**Unités courantes pour services :**

| Code | Description |
|------|-------------|
| `Nos` | Numéro (unité) |
| `Hour` | Heure |
| `Day` | Jour |
| `Month` | Mois |

---

## TAXES PAR ARTICLE (Item Tax Template)

### Lister les templates de taxes article

#### `GET /api/resource/Item Tax Template`

```
GET /api/resource/Item Tax Template?fields=["name","title"]
```

---

### Créer un template de taxe article

#### `POST /api/resource/Item Tax Template`

```json
{
    "title": "TVA 20% Maroc",
    "taxes": [
        {
            "tax_type": "TVA Collectée 20% - CB",
            "tax_rate": 20
        }
    ]
}
```

---

## STOCK (pour les entreprises ayant des produits physiques)

### 1. État du stock

#### `GET /api/method/erpnext.stock.utils.get_latest_stock_qty`

**Params :**
```
item_code=PROD-001&warehouse=Stores - CB
```

### 2. Entrée de stock

#### `POST /api/resource/Stock Entry`

```json
{
    "stock_entry_type": "Material Receipt",
    "posting_date": "2024-01-15",
    "items": [
        {
            "item_code": "PROD-001",
            "qty": 100,
            "basic_rate": 50.00,
            "t_warehouse": "Stores - CB"
        }
    ]
}
```

**Types d'entrées stock (`stock_entry_type`) :**

| Valeur | Description |
|--------|-------------|
| `Material Receipt` | Réception |
| `Material Issue` | Sortie |
| `Material Transfer` | Transfert |
| `Manufacture` | Production |

---

## Notes pour CoBilan

Pour un système de gestion comptable orienté services, l'essentiel est :
- Créer les **articles-services** correspondant aux prestations (audit, conseil, tenue comptable, paie...)
- Associer chaque article au bon **compte de produit** dans le plan comptable
- Configurer les **templates TVA** par taux (20%, 14%, 10%, exonéré)
- La gestion de stock est optionnelle et peut être désactivée si l'entreprise cliente ne vend pas de produits physiques
