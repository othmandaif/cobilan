# API CoBilan — Modes de Paiement, Banque & Ouverture

> **Base URL :** `http://localhost:8080`  
> **Authentification :** Session cookie ou `Authorization: token KEY:SECRET`

---

## MODES DE PAIEMENT (Mode of Payment)

Indispensable au Maroc où coexistent virement, chèque, espèces, effet de commerce.

### 1. Lister les modes de paiement

#### `GET /api/resource/Mode of Payment`

```
GET /api/resource/Mode of Payment?fields=["name","type","accounts"]
```

**Types :**

| Type | Description |
|------|-------------|
| `Cash` | Espèces |
| `Bank` | Virement bancaire |
| `General` | Chèque, effet, autre |

---

### 2. Créer un mode de paiement

#### `POST /api/resource/Mode of Payment`

**Exemple — Chèque (très courant au Maroc) :**
```json
{
    "mode_of_payment": "Chèque",
    "type": "General",
    "accounts": [
        {
            "company": "CoBilan demo",
            "default_account": "Chèques à encaisser - CB"
        }
    ]
}
```

**Exemple — Virement bancaire :**
```json
{
    "mode_of_payment": "Virement bancaire",
    "type": "Bank",
    "accounts": [
        {
            "company": "CoBilan demo",
            "default_account": "Banque CIH - CB"
        }
    ]
}
```

**Exemple — Effet de commerce (LCN) :**
```json
{
    "mode_of_payment": "Lettre de Crédit Normalisée",
    "type": "General",
    "accounts": [
        {
            "company": "CoBilan demo",
            "default_account": "Effets à recevoir - CB"
        }
    ]
}
```

---

### 3. Appliquer le mode de paiement sur un paiement

Dans `Payment Entry` :
```json
{
    "mode_of_payment": "Chèque",
    "reference_no": "CHQ-00123456",
    "reference_date": "2024-01-20",
    ...
}
```

---

## IMPORT DE RELEVÉS BANCAIRES (Bank Statement Import)

Permet d'importer les relevés de la banque pour faciliter la réconciliation.

### 1. Créer un import de relevé bancaire

#### `POST /api/resource/Bank Statement Import`

```json
{
    "bank_account": "Banque CIH - CB",
    "import_file": "/private/files/releve_janvier_2024.csv"
}
```

---

### 2. Lancer l'import

#### `POST /api/method/erpnext.accounts.doctype.bank_statement_import.bank_statement_import.upload_bank_statement`

```json
{
    "name": "BSI-2024-00001"
}
```

---

### 3. Transactions bancaires importées

#### `GET /api/resource/Bank Transaction`

```
GET /api/resource/Bank Transaction?filters=[["bank_account","=","Banque CIH - CB"],["status","=","Unreconciled"]]&fields=["name","date","deposit","withdrawal","description","status","bank_account"]&order_by=date desc
```

**Statuts :**

| Statut | Description |
|--------|-------------|
| `Unreconciled` | Non lettré |
| `Reconciled` | Lettré |
| `Settled` | Soldé |

---

### 4. Lettrer une transaction bancaire

#### `POST /api/method/erpnext.accounts.doctype.bank_reconciliation_tool.bank_reconciliation_tool.reconcile_vouchers`

```json
{
    "bank_transaction_name": "BT-2024-00001",
    "vouchers": [
        {
            "payment_doctype": "Payment Entry",
            "payment_name": "PAY-2024-00001",
            "amount": 12000.00
        }
    ]
}
```

---

### 5. Créer un paiement depuis une transaction bancaire

#### `POST /api/method/erpnext.accounts.doctype.bank_reconciliation_tool.bank_reconciliation_tool.create_payment_entries_and_reconcile`

```json
{
    "bank_transaction_name": "BT-2024-00001",
    "party_type": "Customer",
    "party": "CUST-0001",
    "posting_date": "2024-01-20",
    "mode_of_payment": "Virement bancaire"
}
```

---

## OUVERTURE DE SOLDES (Opening Entry)

Indispensable pour migrer une entreprise existante vers CoBilan — saisir les soldes de départ.

### 1. Outil de création de factures d'ouverture

#### `POST /api/method/erpnext.accounts.doctype.opening_invoice_creation_tool.opening_invoice_creation_tool.start_import`

```json
{
    "company": "CoBilan demo",
    "invoice_type": "Sales",
    "invoices": [
        {
            "customer": "CUST-0001",
            "outstanding_amount": 15000.00,
            "posting_date": "2024-01-01",
            "item_name": "Solde d'ouverture",
            "due_date": "2024-01-31"
        }
    ]
}
```

---

### 2. Écriture d'ouverture de bilan

#### `POST /api/resource/Journal Entry`

```json
{
    "voucher_type": "Opening Entry",
    "posting_date": "2024-01-01",
    "company": "CoBilan demo",
    "is_opening": "Yes",
    "remark": "Soldes d'ouverture au 01/01/2024",
    "accounts": [
        {
            "account": "Banque CIH - CB",
            "debit_in_account_currency": 150000.00,
            "credit_in_account_currency": 0,
            "is_opening": "Yes"
        },
        {
            "account": "Capital social - CB",
            "debit_in_account_currency": 0,
            "credit_in_account_currency": 150000.00,
            "is_opening": "Yes"
        }
    ]
}
```

> Ajouter `"is_opening": "Yes"` sur chaque ligne et sur le document pour que l'écriture soit marquée comme ouverture.

---

## RELEVÉS DE COMPTE CLIENTS (Process Statement of Accounts)

Permet d'envoyer automatiquement les relevés de compte à tous les clients.

### 1. Lister les relevés configurés

#### `GET /api/resource/Process Statement Of Accounts`

```
GET /api/resource/Process Statement Of Accounts?fields=["name","company","from_date","to_date","frequency","customers"]
```

---

### 2. Créer un envoi de relevés

#### `POST /api/resource/Process Statement Of Accounts`

```json
{
    "company": "CoBilan demo",
    "from_date": "2024-01-01",
    "to_date": "2024-01-31",
    "frequency": "Monthly",
    "based_on_payment_terms": 1,
    "customers": [
        {"customer": "CUST-0001"},
        {"customer": "CUST-0002"}
    ]
}
```

---

### 3. Envoyer les relevés par email

#### `POST /api/method/erpnext.accounts.doctype.process_statement_of_accounts.process_statement_of_accounts.send_emails`

```json
{
    "name": "PSOA-2024-00001"
}
```

---

## RÈGLES DE PRIX (Pricing Rule)

Automatise les remises selon le client, la quantité, la date, etc.

### 1. Lister les règles de prix

#### `GET /api/resource/Pricing Rule`

```
GET /api/resource/Pricing Rule?fields=["name","title","apply_on","price_or_product_discount","discount_percentage","min_qty","customer","valid_from","valid_upto","disable"]
```

---

### 2. Créer une règle de prix

#### `POST /api/resource/Pricing Rule`

**Exemple — Remise 10% pour un client fidèle :**
```json
{
    "title": "Remise client fidèle 10%",
    "apply_on": "Item Code",
    "items": [{"item_code": "PREST-COMPTA-001"}],
    "selling": 1,
    "buying": 0,
    "applicable_for": "Customer",
    "customer": "CUST-0001",
    "price_or_product_discount": "Price",
    "discount_percentage": 10,
    "valid_from": "2024-01-01",
    "valid_upto": "2024-12-31",
    "priority": 1,
    "disable": 0
}
```

**Exemple — Remise sur quantité :**
```json
{
    "title": "Remise volume 5%",
    "apply_on": "Item Group",
    "item_groups": [{"item_group": "Prestations comptables"}],
    "selling": 1,
    "min_qty": 5,
    "price_or_product_discount": "Price",
    "discount_percentage": 5
}
```

---

## CRM — PROSPECTION (Lead & Opportunity)

Utile si CoBilan gère aussi le cycle commercial avant facturation.

### PROSPECTS (Lead)

#### `GET /api/resource/Lead`

```
GET /api/resource/Lead?fields=["name","lead_name","company_name","email_id","mobile_no","status","source","lead_owner"]&order_by=creation desc
```

**Statuts :**

| Statut | Description |
|--------|-------------|
| `Open` | Nouveau |
| `Replied` | Contacté |
| `Opportunity` | Qualifié |
| `Quotation` | Devis envoyé |
| `Lost Quotation` | Devis perdu |
| `Interested` | Intéressé |
| `Converted` | Converti en client |
| `Do Not Contact` | Ne pas contacter |

#### `POST /api/resource/Lead`

```json
{
    "lead_name": "Mohammed Alami",
    "company_name": "Société XYZ SARL",
    "email_id": "m.alami@xyz.ma",
    "mobile_no": "+212600000000",
    "status": "Open",
    "source": "Cold Calling",
    "industry": "Accounting",
    "city": "Casablanca",
    "country": "Morocco",
    "notes": "Intéressé par la tenue comptable mensuelle"
}
```

---

### Convertir un prospect en client

#### `POST /api/method/erpnext.crm.doctype.lead.lead.make_customer`

```json
{
    "source_name": "CRM-LEAD-2024-00001"
}
```

---

### OPPORTUNITÉS (Opportunity)

#### `GET /api/resource/Opportunity`

```
GET /api/resource/Opportunity?fields=["name","party_name","opportunity_from","status","opportunity_amount","probability","expected_closing","source"]&order_by=creation desc
```

#### `POST /api/resource/Opportunity`

```json
{
    "opportunity_from": "Lead",
    "party_name": "CRM-LEAD-2024-00001",
    "opportunity_type": "Sales",
    "status": "Open",
    "opportunity_amount": 36000.00,
    "probability": 60,
    "expected_closing": "2024-02-28",
    "currency": "MAD"
}
```

---

### Créer un devis depuis une opportunité

#### `POST /api/method/erpnext.crm.doctype.opportunity.opportunity.make_quotation`

```json
{
    "source_name": "CRM-OPP-2024-00001"
}
```

---

## CONDITIONS GÉNÉRALES (Terms and Conditions)

Texte légal affiché en bas des factures et devis.

### 1. Lister les modèles de CGV

#### `GET /api/resource/Terms and Conditions`

```
GET /api/resource/Terms and Conditions?fields=["name","title","terms"]
```

---

### 2. Créer un modèle de CGV

#### `POST /api/resource/Terms and Conditions`

```json
{
    "title": "CGV Standard CoBilan",
    "terms": "Paiement à 30 jours. Tout retard de paiement entraîne des pénalités de 1,5% par mois. TVA en sus selon taux en vigueur."
}
```

---

### 3. Appliquer les CGV sur une facture

Dans `Sales Invoice` :
```json
{
    "tc_name": "CGV Standard CoBilan",
    ...
}
```
