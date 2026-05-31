# API CoBilan — Comptabilité

> **Base URL :** `http://localhost:8080`  
> **Authentification :** Session cookie ou `Authorization: token KEY:SECRET`

---

## PLAN COMPTABLE (Chart of Accounts)

### 1. Lister tous les comptes

#### `GET /api/resource/Account`

```
GET /api/resource/Account?fields=["name","account_name","account_number","account_type","root_type","parent_account","is_group"]&filters=[["company","=","CoBilan demo"]]&limit_page_length=200
```

**Filtrer par type racine :**
```
GET /api/resource/Account?filters=[["root_type","=","Asset"],["company","=","CoBilan demo"]]
```

**Types racines (`root_type`) :**

| Valeur | Description |
|--------|-------------|
| `Asset` | Actif |
| `Liability` | Passif |
| `Equity` | Capitaux propres |
| `Income` | Produits |
| `Expense` | Charges |

**Types de comptes (`account_type`) :**

| Valeur | Description |
|--------|-------------|
| `Bank` | Compte bancaire |
| `Cash` | Caisse |
| `Receivable` | Clients (débiteurs) |
| `Payable` | Fournisseurs (créditeurs) |
| `Tax` | Taxe (TVA) |
| `Income Account` | Compte de produit |
| `Expense Account` | Compte de charge |
| `Fixed Asset` | Immobilisation |
| `Depreciation` | Amortissement |

---

### 2. Détail d'un compte

#### `GET /api/resource/Account/{name}`

```
GET /api/resource/Account/Clients - CB
```

---

### 3. Créer un compte

#### `POST /api/resource/Account`

```json
{
    "account_name": "Prestations comptables",
    "account_number": "7061",
    "account_type": "Income Account",
    "root_type": "Income",
    "parent_account": "Produits - CB",
    "company": "CoBilan demo",
    "currency": "MAD"
}
```

---

## ÉCRITURES COMPTABLES (Journal Entry)

### 1. Lister les écritures

#### `GET /api/resource/Journal Entry`

```
GET /api/resource/Journal Entry?fields=["name","posting_date","voucher_type","total_debit","total_credit","remark","docstatus"]&limit_page_length=20&order_by=posting_date desc
```

**Types d'écritures (`voucher_type`) :**

| Valeur | Description |
|--------|-------------|
| `Journal Entry` | Écriture comptable générale |
| `Opening Entry` | Écriture d'ouverture |
| `Bank Entry` | Écriture bancaire |
| `Cash Entry` | Écriture de caisse |
| `Credit Note` | Note de crédit |
| `Debit Note` | Note de débit |
| `Contra Entry` | Écriture de virement interne |
| `Depreciation Entry` | Écriture d'amortissement |

---

### 2. Détail d'une écriture

#### `GET /api/resource/Journal Entry/{name}`

```
GET /api/resource/Journal Entry/JV-2024-00001
```

**Réponse :**
```json
{
    "data": {
        "name": "JV-2024-00001",
        "posting_date": "2024-01-15",
        "voucher_type": "Journal Entry",
        "total_debit": 5000.00,
        "total_credit": 5000.00,
        "remark": "Virement interne",
        "accounts": [
            {
                "account": "Banque - CB",
                "debit_in_account_currency": 5000.00,
                "credit_in_account_currency": 0,
                "cost_center": "Main - CB"
            },
            {
                "account": "Caisse - CB",
                "debit_in_account_currency": 0,
                "credit_in_account_currency": 5000.00,
                "cost_center": "Main - CB"
            }
        ]
    }
}
```

---

### 3. Créer une écriture comptable

#### `POST /api/resource/Journal Entry`

```json
{
    "voucher_type": "Journal Entry",
    "posting_date": "2024-01-15",
    "company": "CoBilan demo",
    "remark": "Virement banque vers caisse",
    "accounts": [
        {
            "account": "Banque CIH - CB",
            "debit_in_account_currency": 5000.00,
            "credit_in_account_currency": 0,
            "cost_center": "Main - CB"
        },
        {
            "account": "Caisse - CB",
            "debit_in_account_currency": 0,
            "credit_in_account_currency": 5000.00,
            "cost_center": "Main - CB"
        }
    ]
}
```

> ⚠️ La somme des débits doit toujours être égale à la somme des crédits.

---

### 4. Soumettre une écriture

#### `POST /api/resource/Journal Entry/{name}/submit`

---

## GRAND LIVRE (General Ledger)

### Obtenir les écritures du grand livre

#### `GET /api/method/erpnext.accounts.report.general_ledger.general_ledger.execute`

**Body :**
```json
{
    "filters": {
        "company": "CoBilan demo",
        "from_date": "2024-01-01",
        "to_date": "2024-12-31",
        "account": "Clients - CB",
        "group_by": "Group by Voucher"
    }
}
```

---

## BALANCE DES COMPTES (Trial Balance)

#### `GET /api/method/erpnext.accounts.report.trial_balance.trial_balance.execute`

```json
{
    "filters": {
        "company": "CoBilan demo",
        "fiscal_year": "2024",
        "show_zero_values": 0
    }
}
```

---

## BILAN (Balance Sheet)

#### `GET /api/method/erpnext.accounts.report.balance_sheet.balance_sheet.execute`

```json
{
    "filters": {
        "company": "CoBilan demo",
        "fiscal_year": "2024",
        "periodicity": "Yearly"
    }
}
```

---

## COMPTE DE RÉSULTAT (Profit and Loss)

#### `GET /api/method/erpnext.accounts.report.profit_and_loss_statement.profit_and_loss_statement.execute`

```json
{
    "filters": {
        "company": "CoBilan demo",
        "fiscal_year": "2024",
        "periodicity": "Monthly"
    }
}
```

---

## PAIEMENTS (Payment Entry)

### 1. Lister les paiements

#### `GET /api/resource/Payment Entry`

```
GET /api/resource/Payment Entry?fields=["name","payment_type","party_type","party","paid_amount","posting_date","reference_no","docstatus"]&limit_page_length=20
```

---

### 2. Détail d'un paiement

#### `GET /api/resource/Payment Entry/{name}`

```
GET /api/resource/Payment Entry/PAY-2024-00001
```

---

### 3. Soumettre un paiement

#### `POST /api/resource/Payment Entry/{name}/submit`

---

## RÉCONCILIATION BANCAIRE (Bank Reconciliation)

### Obtenir les transactions non réconciliées

#### `GET /api/method/erpnext.accounts.doctype.bank_reconciliation_tool.bank_reconciliation_tool.get_unreconciled_payment_entries`

```json
{
    "bank_account": "Banque CIH - CB",
    "from_date": "2024-01-01",
    "to_date": "2024-01-31"
}
```

---

## CENTRES DE COÛT (Cost Center)

### Lister les centres de coût

#### `GET /api/resource/Cost Center`

```
GET /api/resource/Cost Center?filters=[["company","=","CoBilan demo"]]&fields=["name","cost_center_name","parent_cost_center","is_group"]
```

---

## EXERCICES FISCAUX (Fiscal Year)

### Lister les exercices

#### `GET /api/resource/Fiscal Year`

```
GET /api/resource/Fiscal Year?fields=["name","year_start_date","year_end_date"]
```

---

## PÉRIODES COMPTABLES (Accounting Period)

### Lister les périodes

#### `GET /api/resource/Accounting Period`

```
GET /api/resource/Accounting Period?filters=[["company","=","CoBilan demo"]]&fields=["name","start_date","end_date","closed"]
```

---

## TVA (Tax)

### Lister les templates de taxes

#### `GET /api/resource/Sales Taxes and Charges Template`

```
GET /api/resource/Sales Taxes and Charges Template?fields=["name","title","is_default"]
```

### Lister les taxes d'achat

#### `GET /api/resource/Purchase Taxes and Charges Template`

```
GET /api/resource/Purchase Taxes and Charges Template?fields=["name","title","is_default"]
```

---

## IMMOBILISATIONS (Asset)

### Lister les immobilisations

#### `GET /api/resource/Asset`

```
GET /api/resource/Asset?fields=["name","asset_name","asset_category","purchase_date","gross_purchase_amount","net_asset_value","status"]
```

---

## Notes pour la comptabilité marocaine

| Concept | Paramétrage ERPNext |
|---------|-------------------|
| Plan comptable CGNC | Configurer les comptes avec numéros 1xxxx à 7xxxx |
| TVA normale 20% | Compte `4455 - TVA Facturée` et `3455 - TVA Récupérable` |
| TVA réduite 14% | Compte séparé à créer |
| TVA réduite 10% | Compte séparé à créer |
| IS (Impôt sur les Sociétés) | Journal Entry manuel |
| Exercice fiscal | Janvier à Décembre |
