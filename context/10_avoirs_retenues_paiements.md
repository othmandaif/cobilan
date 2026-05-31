# API CoBilan — Notes de Crédit, Avoirs & Retenues

> **Base URL :** `http://localhost:8080`  
> **Authentification :** Session cookie ou `Authorization: token KEY:SECRET`

---

## NOTES DE CRÉDIT VENTE (Sales Invoice — Return / Avoir client)

Une note de crédit est une facture de vente en négatif — elle annule partiellement ou totalement une facture existante.

### 1. Créer un avoir client (à partir d'une facture)

#### `POST /api/method/erpnext.accounts.doctype.sales_invoice.sales_invoice.make_return_doc`

```json
{
    "source_name": "SINV-2024-00001"
}
```

Retourne un document pré-rempli en négatif à soumettre ensuite.

---

### 2. Créer manuellement une note de crédit

#### `POST /api/resource/Sales Invoice`

```json
{
    "customer": "CUST-0001",
    "posting_date": "2024-01-20",
    "is_return": 1,
    "return_against": "SINV-2024-00001",
    "currency": "MAD",
    "items": [
        {
            "item_code": "PREST-COMPTA-001",
            "qty": -1,
            "rate": 3000.00
        }
    ]
}
```

> `is_return: 1` et `qty` en négatif sont les deux marqueurs essentiels.

---

### 3. Lister les avoirs clients

#### `GET /api/resource/Sales Invoice`

```
GET /api/resource/Sales Invoice?filters=[["is_return","=",1],["docstatus","=",1]]&fields=["name","customer","posting_date","grand_total","return_against"]
```

---

## NOTES DE DÉBIT VENTE (Debit Note — majoration client)

### Créer une note de débit

#### `POST /api/method/erpnext.accounts.doctype.sales_invoice.sales_invoice.make_debit_note`

```json
{
    "source_name": "SINV-2024-00001"
}
```

---

## NOTES DE CRÉDIT ACHAT (Purchase Invoice — Return / Avoir fournisseur)

### 1. Créer un avoir fournisseur

#### `POST /api/method/erpnext.accounts.doctype.purchase_invoice.purchase_invoice.make_return_doc`

```json
{
    "source_name": "PINV-2024-00001"
}
```

---

### 2. Créer manuellement

#### `POST /api/resource/Purchase Invoice`

```json
{
    "supplier": "SUPP-0001",
    "posting_date": "2024-01-20",
    "is_return": 1,
    "return_against": "PINV-2024-00001",
    "currency": "MAD",
    "items": [
        {
            "item_code": "ITEM-002",
            "qty": -5,
            "rate": 500.00
        }
    ]
}
```

---

## RETENUE À LA SOURCE — Maroc (Tax Withholding)

La retenue à la source (RAS) est obligatoire au Maroc pour certaines prestations (honoraires, loyers, etc.).

### 1. Lister les catégories de retenue

#### `GET /api/resource/Tax Withholding Category`

```
GET /api/resource/Tax Withholding Category?fields=["name","category_name","rate","account_head"]
```

---

### 2. Créer une catégorie de retenue à la source

#### `POST /api/resource/Tax Withholding Category`

**Exemple — RAS honoraires 10% (Maroc) :**
```json
{
    "name": "RAS Honoraires 10% - Maroc",
    "category_name": "Retenue honoraires 10%",
    "rates": [
        {
            "from_date": "2024-01-01",
            "to_date": "2024-12-31",
            "tax_withholding_rate": 10,
            "single_threshold": 0,
            "cumulative_threshold": 0
        }
    ],
    "accounts": [
        {
            "company": "CoBilan demo",
            "account": "RAS à verser - CB"
        }
    ]
}
```

**Taux courants au Maroc :**

| Type | Taux |
|------|------|
| Honoraires professionnels | 10% |
| Loyers | 10% |
| Droits d'auteur | 10% |
| Marchés de travaux | 3% |
| Dividendes (résidents) | 15% |
| Dividendes (non-résidents) | 10% |

---

### 3. Appliquer la retenue sur une facture d'achat

Dans le body de `Purchase Invoice`, ajouter :

```json
{
    "supplier": "SUPP-0001",
    "apply_tds": 1,
    "tax_withholding_category": "RAS Honoraires 10% - Maroc",
    "items": [...]
}
```

---

### 4. Rapport des retenues à la source

#### `POST /api/method/frappe.desk.query_report.run`

```json
{
    "report_name": "TDS Payable Monthly",
    "filters": {
        "company": "CoBilan demo",
        "from_date": "2024-01-01",
        "to_date": "2024-01-31"
    }
}
```

---

## CONDITIONS DE PAIEMENT (Payment Terms)

### 1. Lister les conditions de paiement

#### `GET /api/resource/Payment Terms Template`

```
GET /api/resource/Payment Terms Template?fields=["name","payment_terms_name"]
```

---

### 2. Créer un modèle de conditions de paiement

#### `POST /api/resource/Payment Terms Template`

**Exemple — 30 jours fin de mois :**
```json
{
    "template_name": "30 jours fin de mois",
    "terms": [
        {
            "payment_term": "30 jours FM",
            "due_date_based_on": "Day(s) after the end of the invoice month",
            "credit_days": 30,
            "invoice_portion": 100,
            "mode_of_payment": "Wire Transfer"
        }
    ]
}
```

---

### 3. Échéancier de paiement d'une facture

#### `GET /api/resource/Payment Schedule`

```
GET /api/resource/Payment Schedule?filters=[["parent","=","SINV-2024-00001"]]&fields=["payment_term","due_date","payment_amount","outstanding"]
```

---

## REMISES & ESCOMPTES

### Appliquer une remise sur une facture

Dans le body `Sales Invoice` :

```json
{
    "customer": "CUST-0001",
    "additional_discount_percentage": 5,
    "items": [...]
}
```

Ou en montant fixe :

```json
{
    "discount_amount": 500.00,
    "apply_discount_on": "Grand Total"
}
```

---

## LETTRAGE DE PAIEMENT (Payment Reconciliation)

### 1. Obtenir les entrées non lettrées

#### `POST /api/method/erpnext.accounts.doctype.payment_reconciliation.payment_reconciliation.get_unreconciled_entries`

```json
{
    "company": "CoBilan demo",
    "party_type": "Customer",
    "party": "CUST-0001",
    "receivable_payable_account": "Clients - CB"
}
```

---

### 2. Effectuer le lettrage

#### `POST /api/method/erpnext.accounts.doctype.payment_reconciliation.payment_reconciliation.reconcile`

```json
{
    "company": "CoBilan demo",
    "party_type": "Customer",
    "party": "CUST-0001",
    "receivable_payable_account": "Clients - CB",
    "invoices": [
        {
            "invoice_type": "Sales Invoice",
            "invoice_number": "SINV-2024-00001",
            "invoice_date": "2024-01-15",
            "amount": 12000.00,
            "outstanding_amount": 12000.00
        }
    ],
    "payments": [
        {
            "reference_name": "PAY-2024-00001",
            "reference_row": null,
            "amount": 12000.00
        }
    ]
}
```
