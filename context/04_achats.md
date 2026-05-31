# API CoBilan — Achats

> **Base URL :** `http://localhost:8080`  
> **Authentification :** Session cookie ou `Authorization: token KEY:SECRET`

---

## FACTURES D'ACHAT (Purchase Invoice)

### 1. Lister les factures d'achat

#### `GET /api/resource/Purchase Invoice`

```
GET /api/resource/Purchase Invoice?fields=["name","supplier","posting_date","due_date","grand_total","outstanding_amount","status"]&limit_page_length=20&order_by=posting_date desc
```

**Filtrer par fournisseur :**
```
GET /api/resource/Purchase Invoice?filters=[["supplier","=","SUPP-0001"]]&fields=["name","posting_date","grand_total","status"]
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

---

### 2. Détail d'une facture d'achat

#### `GET /api/resource/Purchase Invoice/{name}`

```
GET /api/resource/Purchase Invoice/PINV-2024-00001
```

**Réponse :**
```json
{
    "data": {
        "name": "PINV-2024-00001",
        "supplier": "SUPP-0001",
        "supplier_name": "Fournisseur Maroc SARL",
        "bill_no": "FACT-FOURN-001",
        "bill_date": "2024-01-10",
        "posting_date": "2024-01-15",
        "due_date": "2024-02-15",
        "currency": "MAD",
        "net_total": 5000.00,
        "total_taxes_and_charges": 1000.00,
        "grand_total": 6000.00,
        "outstanding_amount": 6000.00,
        "status": "Unpaid",
        "items": [
            {
                "item_code": "ITEM-002",
                "item_name": "Fournitures de bureau",
                "qty": 10,
                "rate": 500.00,
                "amount": 5000.00
            }
        ],
        "taxes": [
            {
                "account_head": "TVA Récupérable 20% - CB",
                "rate": 20,
                "tax_amount": 1000.00
            }
        ]
    }
}
```

---

### 3. Créer une facture d'achat

#### `POST /api/resource/Purchase Invoice`

**Body minimum :**
```json
{
    "supplier": "SUPP-0001",
    "posting_date": "2024-01-15",
    "due_date": "2024-02-15",
    "bill_no": "FACT-FOURN-001",
    "bill_date": "2024-01-10",
    "currency": "MAD",
    "items": [
        {
            "item_code": "ITEM-002",
            "qty": 10,
            "rate": 500.00
        }
    ]
}
```

**Body complet avec TVA :**
```json
{
    "supplier": "SUPP-0001",
    "posting_date": "2024-01-15",
    "due_date": "2024-02-15",
    "bill_no": "FACT-FOURN-001",
    "bill_date": "2024-01-10",
    "currency": "MAD",
    "buying_price_list": "Standard Buying",
    "items": [
        {
            "item_code": "ITEM-002",
            "item_name": "Fournitures de bureau",
            "description": "Achat fournitures - Janvier 2024",
            "qty": 10,
            "rate": 500.00,
            "uom": "Nos"
        }
    ],
    "taxes": [
        {
            "charge_type": "On Net Total",
            "account_head": "TVA Récupérable 20% - CB",
            "description": "TVA 20%",
            "rate": 20
        }
    ]
}
```

---

### 4. Soumettre une facture d'achat

#### `POST /api/resource/Purchase Invoice/{name}/submit`

```
POST /api/resource/Purchase Invoice/PINV-2024-00001/submit
```

---

### 5. Annuler une facture d'achat

#### `POST /api/resource/Purchase Invoice/{name}/cancel`

---

## COMMANDES D'ACHAT (Purchase Order)

### 1. Lister les commandes d'achat

#### `GET /api/resource/Purchase Order`

```
GET /api/resource/Purchase Order?fields=["name","supplier","transaction_date","schedule_date","grand_total","status"]&limit_page_length=20
```

**Statuts possibles :**

| Statut | Description |
|--------|-------------|
| `Draft` | Brouillon |
| `To Receive and Bill` | À recevoir et facturer |
| `To Bill` | À facturer |
| `Completed` | Terminée |
| `Cancelled` | Annulée |

---

### 2. Créer une commande d'achat

#### `POST /api/resource/Purchase Order`

```json
{
    "supplier": "SUPP-0001",
    "transaction_date": "2024-01-15",
    "schedule_date": "2024-01-30",
    "currency": "MAD",
    "items": [
        {
            "item_code": "ITEM-002",
            "qty": 10,
            "rate": 500.00,
            "schedule_date": "2024-01-30"
        }
    ]
}
```

---

### 3. Créer une facture depuis une commande d'achat

#### `POST /api/method/erpnext.buying.doctype.purchase_order.purchase_order.make_purchase_invoice`

```json
{
    "source_name": "PUR-ORD-2024-00001"
}
```

---

## DEMANDES D'ACHAT (Purchase Request / Material Request)

### 1. Lister les demandes

#### `GET /api/resource/Material Request`

```
GET /api/resource/Material Request?filters=[["material_request_type","=","Purchase"]]&fields=["name","transaction_date","status","grand_total"]
```

---

### 2. Créer une demande d'achat

#### `POST /api/resource/Material Request`

```json
{
    "material_request_type": "Purchase",
    "transaction_date": "2024-01-15",
    "items": [
        {
            "item_code": "ITEM-002",
            "qty": 10,
            "uom": "Nos",
            "schedule_date": "2024-01-30"
        }
    ]
}
```

---

## PAIEMENTS EFFECTUÉS (Payment Entry — côté achat)

### Créer un paiement fournisseur

#### `POST /api/resource/Payment Entry`

```json
{
    "payment_type": "Pay",
    "party_type": "Supplier",
    "party": "SUPP-0001",
    "paid_amount": 6000.00,
    "received_amount": 6000.00,
    "paid_from": "Banque - CB",
    "paid_to": "Créditeurs - CB",
    "paid_from_account_currency": "MAD",
    "paid_to_account_currency": "MAD",
    "reference_no": "VIREMENT-001",
    "reference_date": "2024-01-20",
    "references": [
        {
            "reference_doctype": "Purchase Invoice",
            "reference_name": "PINV-2024-00001",
            "allocated_amount": 6000.00
        }
    ]
}
```

---

## REÇUS D'ACHAT (Purchase Receipt)

### 1. Créer un reçu d'achat (réception marchandise)

#### `POST /api/resource/Purchase Receipt`

```json
{
    "supplier": "SUPP-0001",
    "posting_date": "2024-01-20",
    "currency": "MAD",
    "items": [
        {
            "item_code": "ITEM-002",
            "qty": 10,
            "rate": 500.00,
            "warehouse": "Stores - CB"
        }
    ]
}
```

---

## Notes importantes

- Le champ `bill_no` correspond au numéro de facture du fournisseur — obligatoire pour la traçabilité.
- Le champ `bill_date` est la date de la facture fournisseur (peut différer de `posting_date` qui est la date d'enregistrement).
- Pour le Maroc, les comptes TVA récupérable doivent être correctement configurés dans le plan comptable.
