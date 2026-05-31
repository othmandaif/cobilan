# API CoBilan — Rapports & Analytics

> **Base URL :** `http://localhost:8080`  
> **Authentification :** Session cookie ou `Authorization: token KEY:SECRET`  
> **Méthode :** Tous les rapports utilisent `POST` sur `/api/method/frappe.desk.query_report.run`

---

## Structure générale d'un rapport

Tous les rapports ERPNext s'appellent avec la même structure :

```
POST /api/method/frappe.desk.query_report.run
```

**Body générique :**
```json
{
    "report_name": "NOM DU RAPPORT",
    "filters": {
        "company": "CoBilan demo",
        "from_date": "2024-01-01",
        "to_date": "2024-12-31"
    }
}
```

**Réponse générique :**
```json
{
    "message": {
        "columns": [...],
        "result": [...],
        "chart": {...}
    }
}
```

---

## RAPPORTS COMPTABLES

### 1. Grand Livre (General Ledger)

```json
{
    "report_name": "General Ledger",
    "filters": {
        "company": "CoBilan demo",
        "from_date": "2024-01-01",
        "to_date": "2024-12-31",
        "account": "",
        "party_type": "",
        "party": "",
        "group_by": "Group by Voucher",
        "include_default_book_entries": 1
    }
}
```

**Colonnes retournées :** Date, Pièce, Type, Compte, Débit, Crédit, Solde, Tiers

---

### 2. Balance des comptes (Trial Balance)

```json
{
    "report_name": "Trial Balance",
    "filters": {
        "company": "CoBilan demo",
        "fiscal_year": "2024",
        "show_zero_values": 0,
        "show_unclosed_year_gl_entry": 0
    }
}
```

---

### 3. Bilan (Balance Sheet)

```json
{
    "report_name": "Balance Sheet",
    "filters": {
        "company": "CoBilan demo",
        "fiscal_year": "2024",
        "periodicity": "Yearly",
        "accumulated_values": 1
    }
}
```

**Options `periodicity` :** `Monthly` | `Quarterly` | `Half-Yearly` | `Yearly`

---

### 4. Compte de résultat (Profit and Loss Statement)

```json
{
    "report_name": "Profit and Loss Statement",
    "filters": {
        "company": "CoBilan demo",
        "fiscal_year": "2024",
        "periodicity": "Monthly",
        "accumulated_values": 0
    }
}
```

---

### 5. Flux de trésorerie (Cash Flow)

```json
{
    "report_name": "Cash Flow",
    "filters": {
        "company": "CoBilan demo",
        "fiscal_year": "2024",
        "periodicity": "Monthly"
    }
}
```

---

### 6. Relevé de compte (Account Statement)

```json
{
    "report_name": "General Ledger",
    "filters": {
        "company": "CoBilan demo",
        "account": "Clients - CB",
        "from_date": "2024-01-01",
        "to_date": "2024-12-31",
        "group_by": "Group by Party"
    }
}
```

---

## RAPPORTS CLIENTS & VENTES

### 7. Balance âgée clients (Accounts Receivable)

```json
{
    "report_name": "Accounts Receivable",
    "filters": {
        "company": "CoBilan demo",
        "report_date": "2024-01-31",
        "ageing_based_on": "Due Date",
        "range1": 30,
        "range2": 60,
        "range3": 90,
        "range4": 120
    }
}
```

**Colonnes :** Client, Facture, Date, Échéance, Total, 0-30j, 31-60j, 61-90j, +90j

---

### 8. Résumé balance clients (Accounts Receivable Summary)

```json
{
    "report_name": "Accounts Receivable Summary",
    "filters": {
        "company": "CoBilan demo",
        "report_date": "2024-01-31",
        "ageing_based_on": "Due Date"
    }
}
```

---

### 9. Analyse des ventes par article

```json
{
    "report_name": "Item-wise Sales Register",
    "filters": {
        "from_date": "2024-01-01",
        "to_date": "2024-12-31",
        "company": "CoBilan demo"
    }
}
```

---

### 10. Registre des ventes

```json
{
    "report_name": "Sales Register",
    "filters": {
        "from_date": "2024-01-01",
        "to_date": "2024-12-31",
        "company": "CoBilan demo"
    }
}
```

---

### 11. Analyse client (Customer-wise Sales)

```json
{
    "report_name": "Customer-wise Item Price",
    "filters": {
        "company": "CoBilan demo",
        "customer": "CUST-0001"
    }
}
```

---

## RAPPORTS FOURNISSEURS & ACHATS

### 12. Balance âgée fournisseurs (Accounts Payable)

```json
{
    "report_name": "Accounts Payable",
    "filters": {
        "company": "CoBilan demo",
        "report_date": "2024-01-31",
        "ageing_based_on": "Due Date",
        "range1": 30,
        "range2": 60,
        "range3": 90
    }
}
```

---

### 13. Résumé balance fournisseurs

```json
{
    "report_name": "Accounts Payable Summary",
    "filters": {
        "company": "CoBilan demo",
        "report_date": "2024-01-31"
    }
}
```

---

### 14. Registre des achats

```json
{
    "report_name": "Purchase Register",
    "filters": {
        "from_date": "2024-01-01",
        "to_date": "2024-12-31",
        "company": "CoBilan demo"
    }
}
```

---

## RAPPORTS TVA

### 15. Rapport de TVA (GSTIN Summary — à adapter pour le Maroc)

```json
{
    "report_name": "Sales Register",
    "filters": {
        "from_date": "2024-01-01",
        "to_date": "2024-12-31",
        "company": "CoBilan demo"
    }
}
```

> Pour un rapport TVA marocain structuré, il faudra créer un rapport personnalisé via `Report` dans ERPNext avec une requête SQL filtrée sur les comptes TVA.

---

## TABLEAUX DE BORD — KPIs en temps réel

### 16. Chiffre d'affaires du mois

```
GET /api/method/frappe.client.get_value?doctype=Sales Invoice&filters={"posting_date":["between",["2024-01-01","2024-01-31"]],"docstatus":1}&fieldname=grand_total
```

### 17. Factures impayées — total

```
GET /api/resource/Sales Invoice?filters=[["status","in",["Unpaid","Overdue"]],["docstatus","=",1]]&fields=["name","outstanding_amount","due_date"]
```

### 18. Dettes fournisseurs en cours

```
GET /api/resource/Purchase Invoice?filters=[["status","in",["Unpaid","Overdue"]],["docstatus","=",1]]&fields=["name","outstanding_amount","due_date"]
```

---

## ACCÈS DIRECT AUX RAPPORTS SAUVEGARDÉS

### Lister tous les rapports disponibles

#### `GET /api/resource/Report`

```
GET /api/resource/Report?filters=[["module","=","Accounts"]]&fields=["name","report_name","report_type","is_standard"]
```

---

## EXPORT DES DONNÉES

### Exporter en CSV via API

#### `GET /api/method/frappe.desk.reportview.export_query`

**Params :**
```
doctype=Sales Invoice&file_format_type=CSV&fields=["name","customer","grand_total","posting_date"]&filters=[["docstatus","=",1]]
```

---

## Notes d'implémentation pour le Dashboard React

Pour construire un tableau de bord temps réel dans CoBilan :

1. **Encaisser en attente** → `Sales Invoice` filtré sur `status = Unpaid`
2. **Décaisser en attente** → `Purchase Invoice` filtré sur `status = Unpaid`
3. **CA du mois** → Agréger `Sales Invoice` avec `SUM(grand_total)`
4. **Dépenses du mois** → Agréger `Purchase Invoice`
5. **Évolution mensuelle** → Rapport `Profit and Loss Statement` avec `periodicity = Monthly`

Utiliser `Promise.all()` en React pour lancer plusieurs appels en parallèle et alimenter le dashboard.
