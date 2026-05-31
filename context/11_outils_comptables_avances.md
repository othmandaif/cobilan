# API CoBilan — Outils Comptables Avancés

> **Base URL :** `http://localhost:8080`  
> **Authentification :** Session cookie ou `Authorization: token KEY:SECRET`

---

## CLÔTURE DE PÉRIODE (Period Closing Voucher)

### 1. Lister les clôtures de période

#### `GET /api/resource/Period Closing Voucher`

```
GET /api/resource/Period Closing Voucher?fields=["name","transaction_date","period_start_date","period_end_date","closing_account_head","company"]&order_by=transaction_date desc
```

---

### 2. Créer une clôture de période

#### `POST /api/resource/Period Closing Voucher`

```json
{
    "transaction_date": "2024-12-31",
    "period_start_date": "2024-01-01",
    "period_end_date": "2024-12-31",
    "company": "CoBilan demo",
    "closing_account_head": "Résultat de l'exercice - CB",
    "remarks": "Clôture exercice 2024"
}
```

> La clôture transfère le résultat net (Produits - Charges) vers le compte de résultat.

---

### 3. Vérifier les périodes fermées

#### `GET /api/resource/Accounting Period`

```
GET /api/resource/Accounting Period?filters=[["company","=","CoBilan demo"]]&fields=["name","start_date","end_date","closed"]
```

---

### 4. Fermer une période (bloquer les saisies)

#### `PUT /api/resource/Accounting Period/{name}`

```json
{
    "closed": 1
}
```

---

## AMORTISSEMENTS (Asset Depreciation)

### 1. Lister les immobilisations

#### `GET /api/resource/Asset`

```
GET /api/resource/Asset?fields=["name","asset_name","asset_category","purchase_date","gross_purchase_amount","accumulated_depreciation_amount","net_asset_value","status","location"]&filters=[["company","=","CoBilan demo"]]
```

**Statuts possibles :**

| Statut | Description |
|--------|-------------|
| `Draft` | Brouillon |
| `Submitted` | Active |
| `Partially Depreciated` | Partiellement amortie |
| `Fully Depreciated` | Totalement amortie |
| `Scrapped` | Mise au rebut |
| `Sold` | Cédée |

---

### 2. Créer une immobilisation

#### `POST /api/resource/Asset`

```json
{
    "asset_name": "Ordinateur portable",
    "asset_category": "Computers and Laptops",
    "company": "CoBilan demo",
    "purchase_date": "2024-01-15",
    "gross_purchase_amount": 15000.00,
    "location": "Bureau principal",
    "calculate_depreciation": 1,
    "finance_books": [
        {
            "depreciation_method": "Straight Line",
            "total_number_of_depreciations": 36,
            "frequency_of_depreciation": 1,
            "depreciation_start_date": "2024-02-01"
        }
    ]
}
```

**Méthodes d'amortissement :**

| Méthode | Description |
|---------|-------------|
| `Straight Line` | Linéaire |
| `Double Declining Balance` | Dégressif |
| `Written Down Value` | Valeur nette comptable |

---

### 3. Planification des amortissements d'une immobilisation

#### `GET /api/resource/Depreciation Schedule`

```
GET /api/resource/Depreciation Schedule?filters=[["parent","=","ACC-ASS-2024-00001"]]&fields=["schedule_date","depreciation_amount","accumulated_depreciation_amount","journal_entry"]
```

---

### 4. Comptabiliser les amortissements du mois

#### `POST /api/method/erpnext.assets.doctype.asset.depreciation.post_depreciation_entries`

```json
{
    "date": "2024-01-31"
}
```

> Lance automatiquement les écritures d'amortissement pour toutes les immobilisations dont la date d'échéance est atteinte.

---

### 5. Cession d'une immobilisation

#### `POST /api/method/erpnext.assets.doctype.asset.asset.make_sales_invoice`

```json
{
    "asset_name": "ACC-ASS-2024-00001",
    "customer": "CUST-0001",
    "finance_book": null
}
```

---

### 6. Catégories d'immobilisations

#### `GET /api/resource/Asset Category`

```
GET /api/resource/Asset Category?fields=["name","depreciation_method","total_number_of_depreciations","frequency_of_depreciation"]
```

---

## ABONNEMENTS (Subscription — Facturation récurrente)

Idéal pour les prestations comptables mensuelles ou annuelles.

### 1. Lister les abonnements

#### `GET /api/resource/Subscription`

```
GET /api/resource/Subscription?fields=["name","party","party_name","status","current_invoice_start","current_invoice_end","grand_total"]
```

**Statuts :**

| Statut | Description |
|--------|-------------|
| `Active` | En cours |
| `Cancelled` | Annulé |
| `Completed` | Terminé |
| `Past Due Date` | En retard |

---

### 2. Créer un abonnement

#### `POST /api/resource/Subscription`

```json
{
    "party_type": "Customer",
    "party": "CUST-0001",
    "start_date": "2024-01-01",
    "generate_invoice_at": "Beginning of the current subscription period",
    "days_until_due": 15,
    "currency": "MAD",
    "plans": [
        {
            "plan": "Forfait Comptabilité Mensuel",
            "qty": 1
        }
    ]
}
```

---

### 3. Créer un plan d'abonnement

#### `POST /api/resource/Subscription Plan`

```json
{
    "plan_name": "Forfait Comptabilité Mensuel",
    "item": "PREST-COMPTA-001",
    "price_determination": "Fixed Rate",
    "cost": 3000.00,
    "currency": "MAD",
    "billing_interval": "Month",
    "billing_interval_count": 1
}
```

**Options `billing_interval` :** `Day` | `Week` | `Month` | `Year`

---

### 4. Générer les factures des abonnements échus

#### `POST /api/method/erpnext.accounts.doctype.subscription.subscription.process_all`

```json
{}
```

---

## RELANCES CLIENTS (Dunning)

### 1. Lister les relances

#### `GET /api/resource/Dunning`

```
GET /api/resource/Dunning?fields=["name","customer","overdue_payments","dunning_level","dunning_amount","status"]&order_by=creation desc
```

---

### 2. Créer une relance

#### `POST /api/resource/Dunning`

```json
{
    "customer": "CUST-0001",
    "company": "CoBilan demo",
    "posting_date": "2024-02-15",
    "dunning_type": "Relance niveau 1",
    "overdue_payments": [
        {
            "sales_invoice": "SINV-2024-00001",
            "outstanding": 12000.00,
            "due_date": "2024-01-31"
        }
    ]
}
```

---

### 3. Créer un type de relance

#### `POST /api/resource/Dunning Type`

```json
{
    "dunning_type_name": "Relance niveau 1",
    "dunning_level": 1,
    "days_overdue": 15,
    "dunning_fee": 0,
    "interest_rate": 0,
    "body": "Nous vous rappelons que la facture {sales_invoice} d'un montant de {outstanding} MAD est arrivée à échéance le {due_date}."
}
```

---

## MULTI-DEVISES (Currency Exchange)

### 1. Lister les taux de change

#### `GET /api/resource/Currency Exchange`

```
GET /api/resource/Currency Exchange?filters=[["from_currency","=","EUR"],["to_currency","=","MAD"]]&fields=["name","date","exchange_rate"]&order_by=date desc&limit_page_length=1
```

---

### 2. Créer un taux de change

#### `POST /api/resource/Currency Exchange`

```json
{
    "from_currency": "EUR",
    "to_currency": "MAD",
    "date": "2024-01-15",
    "exchange_rate": 10.85
}
```

---

### 3. Obtenir le taux de change actuel

#### `GET /api/method/erpnext.setup.utils.get_exchange_rate`

**Params :**
```
from_currency=EUR&to_currency=MAD&transaction_date=2024-01-15
```

---

## BUDGETS (Budget Management)

### 1. Lister les budgets

#### `GET /api/resource/Budget`

```
GET /api/resource/Budget?filters=[["company","=","CoBilan demo"],["fiscal_year","=","2024"]]&fields=["name","cost_center","fiscal_year","action_if_annual_budget_exceeded"]
```

---

### 2. Créer un budget

#### `POST /api/resource/Budget`

```json
{
    "cost_center": "Main - CB",
    "fiscal_year": "2024",
    "company": "CoBilan demo",
    "action_if_annual_budget_exceeded": "Warn",
    "accounts": [
        {
            "account": "Charges de personnel - CB",
            "budget_amount": 120000.00
        },
        {
            "account": "Fournitures - CB",
            "budget_amount": 24000.00
        }
    ]
}
```

**Options `action_if_annual_budget_exceeded` :**
- `Warn` — Avertir seulement
- `Stop` — Bloquer la saisie
- `Ignore` — Ignorer

---

### 3. Rapport d'utilisation du budget

#### `POST /api/method/frappe.desk.query_report.run`

```json
{
    "report_name": "Budget Variance Report",
    "filters": {
        "company": "CoBilan demo",
        "from_fiscal_year": "2024",
        "to_fiscal_year": "2024",
        "period": "Monthly",
        "budget_against": "Cost Center"
    }
}
```

---

## DIMENSIONS COMPTABLES (Accounting Dimension)

Les dimensions permettent d'ajouter des axes d'analyse supplémentaires (projet, département, agence...) en plus du centre de coût.

### 1. Lister les dimensions

#### `GET /api/resource/Accounting Dimension`

```
GET /api/resource/Accounting Dimension?fields=["name","document_type","label","mandatory_for_bs","mandatory_for_pl"]
```

---

### 2. Créer une dimension

#### `POST /api/resource/Accounting Dimension`

```json
{
    "document_type": "Project",
    "label": "Projet",
    "mandatory_for_pl": 0,
    "mandatory_for_bs": 0
}
```
