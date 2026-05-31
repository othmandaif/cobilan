# API CoBilan — Projets, Frais & Ressources Humaines

> **Base URL :** `http://localhost:8080`  
> **Authentification :** Session cookie ou `Authorization: token KEY:SECRET`

---

## PROJETS (Project)

Utile pour les entreprises qui facturent à la mission (cabinets de conseil, expertise comptable, audit).

### 1. Lister les projets

#### `GET /api/resource/Project`

```
GET /api/resource/Project?fields=["name","project_name","status","customer","percent_complete","expected_start_date","expected_end_date","estimated_costing","total_billed_amount"]&limit_page_length=20
```

**Statuts :**

| Statut | Description |
|--------|-------------|
| `Open` | En cours |
| `Completed` | Terminé |
| `Cancelled` | Annulé |

---

### 2. Détail d'un projet

#### `GET /api/resource/Project/{name}`

```
GET /api/resource/Project/PROJ-2024-00001
```

---

### 3. Créer un projet

#### `POST /api/resource/Project`

```json
{
    "project_name": "Audit annuel - Société ABC",
    "status": "Open",
    "customer": "CUST-0001",
    "expected_start_date": "2024-01-15",
    "expected_end_date": "2024-03-31",
    "estimated_costing": 50000.00,
    "project_type": "External",
    "is_active": "Yes",
    "tasks": [
        {
            "title": "Collecte des documents",
            "status": "Open",
            "exp_start_date": "2024-01-15",
            "exp_end_date": "2024-01-31"
        },
        {
            "title": "Analyse comptable",
            "status": "Open",
            "exp_start_date": "2024-02-01",
            "exp_end_date": "2024-02-28"
        }
    ]
}
```

---

### 4. Tâches d'un projet

#### `GET /api/resource/Task`

```
GET /api/resource/Task?filters=[["project","=","PROJ-2024-00001"]]&fields=["name","subject","status","assigned_to","exp_start_date","exp_end_date","progress"]
```

---

### 5. Créer une tâche

#### `POST /api/resource/Task`

```json
{
    "subject": "Revue des comptes fournisseurs",
    "project": "PROJ-2024-00001",
    "status": "Open",
    "assigned_to": "comptable@cobilan.ma",
    "exp_start_date": "2024-02-01",
    "exp_end_date": "2024-02-15",
    "description": "Revue et lettrage des comptes fournisseurs"
}
```

---

### 6. Facturer depuis un projet

#### `POST /api/method/erpnext.projects.doctype.project.project.make_project_invoice`

```json
{
    "source_name": "PROJ-2024-00001"
}
```

---

## FEUILLES DE TEMPS (Timesheet)

Suivi du temps passé par mission — utile pour facturation à l'heure.

### 1. Lister les feuilles de temps

#### `GET /api/resource/Timesheet`

```
GET /api/resource/Timesheet?fields=["name","employee","start_date","end_date","total_hours","total_billed_hours","status","parent_project"]&order_by=start_date desc
```

---

### 2. Créer une feuille de temps

#### `POST /api/resource/Timesheet`

```json
{
    "employee": "EMP-0001",
    "start_date": "2024-01-15",
    "time_logs": [
        {
            "activity_type": "Comptabilité",
            "from_time": "2024-01-15 09:00:00",
            "to_time": "2024-01-15 12:00:00",
            "hours": 3,
            "project": "PROJ-2024-00001",
            "billable": 1,
            "billing_rate": 500.00,
            "billing_amount": 1500.00
        },
        {
            "activity_type": "Audit",
            "from_time": "2024-01-15 14:00:00",
            "to_time": "2024-01-15 17:00:00",
            "hours": 3,
            "project": "PROJ-2024-00001",
            "billable": 1,
            "billing_rate": 500.00,
            "billing_amount": 1500.00
        }
    ]
}
```

---

### 3. Créer une facture depuis les feuilles de temps

#### `POST /api/method/erpnext.projects.doctype.timesheet.timesheet.make_sales_invoice`

```json
{
    "source_name": "TS-2024-00001",
    "item_code": "PREST-HEURE-001",
    "customer": "CUST-0001"
}
```

---

## NOTES DE FRAIS (Expense Claim)

### 1. Lister les notes de frais

#### `GET /api/resource/Expense Claim`

```
GET /api/resource/Expense Claim?fields=["name","employee","posting_date","total_claimed_amount","total_approved_amount","status","approval_status"]&order_by=posting_date desc
```

**Statuts `approval_status` :**

| Statut | Description |
|--------|-------------|
| `Draft` | Brouillon |
| `Approved` | Approuvée |
| `Rejected` | Rejetée |
| `Cancelled` | Annulée |

---

### 2. Créer une note de frais

#### `POST /api/resource/Expense Claim`

```json
{
    "employee": "EMP-0001",
    "posting_date": "2024-01-20",
    "company": "CoBilan demo",
    "expenses": [
        {
            "expense_date": "2024-01-18",
            "expense_type": "Travel",
            "description": "Déplacement client Rabat",
            "amount": 350.00,
            "sanctioned_amount": 350.00,
            "cost_center": "Main - CB"
        },
        {
            "expense_date": "2024-01-19",
            "expense_type": "Meals",
            "description": "Repas mission",
            "amount": 150.00,
            "sanctioned_amount": 150.00
        }
    ]
}
```

---

### 3. Types de frais

#### `GET /api/resource/Expense Claim Type`

```
GET /api/resource/Expense Claim Type?fields=["name","expense_type","default_account"]
```

---

## RESSOURCES HUMAINES & PAIE (HR)

### 1. Lister les employés

#### `GET /api/resource/Employee`

```
GET /api/resource/Employee?fields=["name","employee_name","designation","department","date_of_joining","status","cell_number","company_email"]&filters=[["status","=","Active"]]
```

---

### 2. Détail d'un employé

#### `GET /api/resource/Employee/{name}`

```
GET /api/resource/Employee/EMP-0001
```

---

### 3. Créer un employé

#### `POST /api/resource/Employee`

```json
{
    "first_name": "Ahmed",
    "last_name": "Benali",
    "designation": "Comptable",
    "department": "Comptabilité",
    "date_of_joining": "2024-01-01",
    "company": "CoBilan demo",
    "company_email": "a.benali@cobilan.ma",
    "cell_number": "+212600000000",
    "gender": "Male",
    "date_of_birth": "1990-05-15",
    "employment_type": "Full-time"
}
```

---

### 4. Bulletins de paie (Salary Slip)

#### `GET /api/resource/Salary Slip`

```
GET /api/resource/Salary Slip?fields=["name","employee","employee_name","posting_date","gross_pay","net_pay","status"]&order_by=posting_date desc
```

---

### 5. Créer un bulletin de paie

#### `POST /api/resource/Salary Slip`

```json
{
    "employee": "EMP-0001",
    "salary_structure": "Structure Salaire Standard",
    "posting_date": "2024-01-31",
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "company": "CoBilan demo"
}
```

---

### 6. Structures de salaire

#### `GET /api/resource/Salary Structure`

```
GET /api/resource/Salary Structure?fields=["name","salary_component","payroll_frequency","company"]
```

---

### 7. Lancer la paie (Payroll Entry)

#### `POST /api/resource/Payroll Entry`

```json
{
    "company": "CoBilan demo",
    "posting_date": "2024-01-31",
    "payroll_frequency": "Monthly",
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "payment_account": "Banque CIH - CB",
    "cost_center": "Main - CB"
}
```

---

### 8. Congés (Leave)

#### `GET /api/resource/Leave Application`

```
GET /api/resource/Leave Application?fields=["name","employee","leave_type","from_date","to_date","total_leave_days","status"]&filters=[["status","=","Approved"]]
```

---

## DÉPARTEMENTS

### Lister les départements

#### `GET /api/resource/Department`

```
GET /api/resource/Department?fields=["name","department_name","parent_department","company"]
```

---

### Créer un département

#### `POST /api/resource/Department`

```json
{
    "department_name": "Comptabilité",
    "parent_department": "All Departments",
    "company": "CoBilan demo"
}
```
