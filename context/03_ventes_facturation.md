# API CoBilan — Facturation & Ventes

> **Base URL :** `http://localhost:8080`  
> **Authentification :** Session cookie ou `Authorization: token KEY:SECRET`

---

## FACTURES DE VENTE (Sales Invoice)

### 1. Lister les factures de vente

#### `GET /api/resource/Sales Invoice`

**Exemple avec filtres :**
```
GET /api/resource/Sales Invoice?fields=["name","customer","posting_date","due_date","grand_total","outstanding_amount","status"]&limit_page_length=20&order_by=posting_date desc
```

**Filtrer par statut :**
```
GET /api/resource/Sales Invoice?filters=[["status","=","Unpaid"]]&fields=["name","customer","grand_total","due_date"]
```

**Statuts possibles :**

| Statut | Description |
|--------|-------------|
| `Draft` | Brouillon |
| `Submitted` | Soumise |
| `Paid` | Payée |
| `Unpaid` | Impayée |
| `Partly Paid` | Partiellement payée |
| `Overdue` | En retard |
| `Cancelled` | Annulée |

**Réponse :**
```json
{
    "data": [
        {
            "name": "SINV-2024-00001",
            "customer": "CUST-0001",
            "posting_date": "2024-01-15",
            "due_date": "2024-02-15",
            "grand_total": 12000.00,
            "outstanding_amount": 12000.00,
            "status": "Unpaid"
        }
    ]
}
```

---

### 2. Détail d'une facture de vente

#### `GET /api/resource/Sales Invoice/{name}`

```
GET /api/resource/Sales Invoice/SINV-2024-00001
```

**Réponse complète :**
```json
{
    "data": {
        "name": "SINV-2024-00001",
        "customer": "CUST-0001",
        "customer_name": "Société Test Maroc",
        "posting_date": "2024-01-15",
        "due_date": "2024-02-15",
        "currency": "MAD",
        "conversion_rate": 1.0,
        "net_total": 10000.00,
        "total_taxes_and_charges": 2000.00,
        "grand_total": 12000.00,
        "rounded_total": 12000.00,
        "outstanding_amount": 12000.00,
        "status": "Unpaid",
        "payment_terms_template": "",
        "items": [
            {
                "item_code": "ITEM-001",
                "item_name": "Prestation comptable",
                "qty": 1,
                "rate": 10000.00,
                "amount": 10000.00,
                "tax_rate": 20.0
            }
        ],
        "taxes": [
            {
                "charge_type": "On Net Total",
                "account_head": "TVA Collectée 20% - CB",
                "rate": 20,
                "tax_amount": 2000.00
            }
        ]
    }
}
```

---

### 3. Créer une facture de vente

#### `POST /api/resource/Sales Invoice`

**Body minimum :**
```json
{
    "customer": "CUST-0001",
    "posting_date": "2024-01-15",
    "due_date": "2024-02-15",
    "currency": "MAD",
    "items": [
        {
            "item_code": "ITEM-001",
            "qty": 1,
            "rate": 10000.00
        }
    ]
}
```

**Body complet avec TVA :**
```json
{
    "customer": "CUST-0001",
    "posting_date": "2024-01-15",
    "due_date": "2024-02-15",
    "currency": "MAD",
    "selling_price_list": "Standard Selling",
    "items": [
        {
            "item_code": "ITEM-001",
            "item_name": "Prestation comptable mensuelle",
            "description": "Tenue de comptabilité - Janvier 2024",
            "qty": 1,
            "rate": 10000.00,
            "uom": "Nos"
        }
    ],
    "taxes": [
        {
            "charge_type": "On Net Total",
            "account_head": "TVA Collectée 20% - CB",
            "description": "TVA 20%",
            "rate": 20
        }
    ]
}
```

> La facture est créée en statut **Draft**. Il faut la soumettre séparément.

---

### 4. Soumettre une facture (Draft → Submitted)

#### `POST /api/resource/Sales Invoice/{name}/submit`

```
POST /api/resource/Sales Invoice/SINV-2024-00001/submit
```

**Body :** vide `{}`

---

### 5. Annuler une facture soumise

#### `POST /api/resource/Sales Invoice/{name}/cancel`

```
POST /api/resource/Sales Invoice/SINV-2024-00001/cancel
```

---

### 6. Modifier une facture (Draft uniquement)

#### `PUT /api/resource/Sales Invoice/{name}`

```json
{
    "due_date": "2024-03-15",
    "items": [
        {
            "item_code": "ITEM-001",
            "qty": 2,
            "rate": 5000.00
        }
    ]
}
```

---

### 7. Supprimer une facture (Draft uniquement)

#### `DELETE /api/resource/Sales Invoice/{name}`

---

## COMMANDES DE VENTE (Sales Order)

### 1. Lister les commandes

#### `GET /api/resource/Sales Order`

```
GET /api/resource/Sales Order?fields=["name","customer","transaction_date","delivery_date","grand_total","status"]&limit_page_length=20
```

**Statuts possibles :**

| Statut | Description |
|--------|-------------|
| `Draft` | Brouillon |
| `To Deliver and Bill` | À livrer et facturer |
| `To Bill` | À facturer |
| `Completed` | Terminée |
| `Cancelled` | Annulée |

---

### 2. Créer une commande de vente

#### `POST /api/resource/Sales Order`

```json
{
    "customer": "CUST-0001",
    "transaction_date": "2024-01-15",
    "delivery_date": "2024-01-30",
    "currency": "MAD",
    "items": [
        {
            "item_code": "ITEM-001",
            "qty": 1,
            "rate": 10000.00,
            "delivery_date": "2024-01-30"
        }
    ]
}
```

---

### 3. Créer une facture depuis une commande

#### `POST /api/method/erpnext.selling.doctype.sales_order.sales_order.make_sales_invoice`

**Body :**
```json
{
    "source_name": "SAL-ORD-2024-00001"
}
```

---

## DEVIS (Quotation)

### 1. Lister les devis

#### `GET /api/resource/Quotation`

```
GET /api/resource/Quotation?fields=["name","party_name","transaction_date","valid_till","grand_total","status"]
```

---

### 2. Créer un devis

#### `POST /api/resource/Quotation`

```json
{
    "quotation_to": "Customer",
    "party_name": "CUST-0001",
    "transaction_date": "2024-01-15",
    "valid_till": "2024-02-15",
    "currency": "MAD",
    "items": [
        {
            "item_code": "ITEM-001",
            "qty": 1,
            "rate": 10000.00
        }
    ]
}
```

---

### 3. Convertir un devis en commande

#### `POST /api/method/erpnext.selling.doctype.quotation.quotation.make_sales_order`

```json
{
    "source_name": "SAL-QTN-2024-00001"
}
```

---

## PAIEMENTS REÇUS (Payment Entry — côté vente)

### 1. Créer un paiement pour une facture

#### `POST /api/resource/Payment Entry`

```json
{
    "payment_type": "Receive",
    "party_type": "Customer",
    "party": "CUST-0001",
    "paid_amount": 12000.00,
    "received_amount": 12000.00,
    "paid_from": "Débiteurs - CB",
    "paid_to": "Banque - CB",
    "paid_from_account_currency": "MAD",
    "paid_to_account_currency": "MAD",
    "reference_no": "VIR-001",
    "reference_date": "2024-01-20",
    "references": [
        {
            "reference_doctype": "Sales Invoice",
            "reference_name": "SINV-2024-00001",
            "allocated_amount": 12000.00
        }
    ]
}
```

---

## LISTE DE PRIX (Price List)

### Obtenir le prix d'un article

#### `GET /api/method/erpnext.stock.get_item_details.get_price_list_rate_for`

**Params :**
```
item_code=ITEM-001&price_list=Standard Selling&currency=MAD
```
